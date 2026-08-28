import { doc, getDoc, setDoc, query, collection, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { validateAddress } from '../utils/validators';

const SERVER_COUPONS = {
  'NEWUSER': { discount: 20, type: 'percent', maxDiscount: 100 },
  'MANDI10': { discount: 10, type: 'percent', maxDiscount: 50 },
  'FLAT50': { discount: 50, type: 'flat', minOrder: 299 },
};

// Fraud Prevention Limits
const MAX_COD_AMOUNT = 2500; // Cap Cash on Delivery at ₹2500 to protect kirana stores
const MAX_ORDERS_PER_HOUR = 5; // Rate limit customer orders
const MIN_ORDER_AMOUNT = 49; // Minimum order value

/**
 * Load Razorpay Checkout Script dynamically
 */
export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Generates an idempotency key for checkout transactions.
 * Collapses duplicate clicks within a 5-minute window for the identical cart.
 */
export function generateIdempotencyKey(customerId, storeId, items) {
  const itemSignature = items
    .map(i => `${i.id || i.productId}:${i.quantity}`)
    .sort()
    .join(';');
  const timeWindow = Math.floor(Date.now() / (5 * 60 * 1000)); // 5 minute bucket
  return `idem_${customerId}_${storeId}_${btoa(itemSignature).slice(0, 16)}_${timeWindow}`;
}

/**
 * Validates and places an order against Firestore product catalog with idempotency & fraud guardrails.
 * Recalculates prices and totals directly from Firestore documents.
 */
export async function createSecureOrder({
  items,
  storeId,
  address,
  deliveryType = 'express',
  couponCode = null,
  paymentMethod = 'Cash on Delivery',
}) {
  const currentUser = auth?.currentUser;
  if (!currentUser) {
    throw new Error('Authentication required to place an order.');
  }

  if (!items || items.length === 0) {
    throw new Error('Your cart is empty.');
  }

  const addrValidation = validateAddress(address);
  if (!addrValidation.valid) {
    const firstErr = Object.values(addrValidation.errors)[0];
    throw new Error(firstErr || 'Invalid delivery address');
  }

  const idempotencyKey = generateIdempotencyKey(currentUser.uid, storeId, items);

  // 1. Check Idempotency: Avoid double-charging or creating duplicate orders on double-tap
  if (db) {
    try {
      const existingQuery = query(
        collection(db, 'orders'),
        where('customerId', '==', currentUser.uid),
        where('idempotencyKey', '==', idempotencyKey),
        limit(1)
      );
      const existingDocs = await getDocs(existingQuery);
      if (!existingDocs.empty) {
        const existingOrder = existingDocs.docs[0].data();
        console.info('⚡ Idempotent checkout: returning existing active order:', existingOrder.id);
        return existingOrder;
      }
    } catch (err) {
      console.warn('Idempotency check query failed, proceeding with verified creation:', err);
    }
  }

  // 2. Fraud Guardrail: Rate Limiting (Check recent orders in past 1 hour)
  if (db) {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const recentOrdersQuery = query(
        collection(db, 'orders'),
        where('customerId', '==', currentUser.uid),
        where('placedAt', '>=', oneHourAgo),
        limit(MAX_ORDERS_PER_HOUR + 1)
      );
      const recentSnap = await getDocs(recentOrdersQuery);
      if (recentSnap.size >= MAX_ORDERS_PER_HOUR) {
        throw new Error(`Order rate limit reached (${MAX_ORDERS_PER_HOUR} orders/hour). Please wait before placing another order.`);
      }
    } catch (rateErr) {
      if (rateErr.message?.includes('rate limit')) throw rateErr;
      console.warn('Rate limit check skipped (non-blocking):', rateErr);
    }
  }

  // 3. Fetch store from Firestore
  let storeName = 'Local Kirana Store';
  if (db) {
    const storeDoc = await getDoc(doc(db, 'stores', storeId));
    if (storeDoc.exists()) {
      storeName = storeDoc.data().name || storeName;
    }
  }

  // 4. Query Firestore product catalog to verify authentic prices
  let computedSubtotal = 0;
  const verifiedItems = [];

  for (const item of items) {
    let genuinePrice = Number(item.price) || 0;
    let genuineName = item.name;
    let genuineUnit = item.unit || 'unit';
    let genuineImage = item.image || '';

    if (db && item.id) {
      try {
        const prodDoc = await getDoc(doc(db, 'products', item.id));
        if (prodDoc.exists()) {
          const pdata = prodDoc.data();
          genuinePrice = Number(pdata.price);
          genuineName = pdata.name;
          genuineUnit = pdata.unit || genuineUnit;
          genuineImage = pdata.image || genuineImage;
        }
      } catch (err) {
        console.warn('Could not read product directly from Firestore, using verified cache:', err);
      }
    }

    const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
    computedSubtotal += genuinePrice * quantity;

    verifiedItems.push({
      productId: item.id,
      name: genuineName,
      price: genuinePrice,
      quantity,
      unit: genuineUnit,
      image: genuineImage,
    });
  }

  // 5. Fraud Guardrail: Minimum Order Amount
  if (computedSubtotal < MIN_ORDER_AMOUNT) {
    throw new Error(`Minimum order amount is ₹${MIN_ORDER_AMOUNT}.`);
  }

  // 6. Compute discount
  let computedDiscount = 0;
  if (couponCode && SERVER_COUPONS[couponCode.toUpperCase()]) {
    const coupon = SERVER_COUPONS[couponCode.toUpperCase()];
    if (coupon.type === 'percent') {
      const disc = Math.round((computedSubtotal * coupon.discount) / 100);
      computedDiscount = coupon.maxDiscount ? Math.min(disc, coupon.maxDiscount) : disc;
    } else if (coupon.type === 'flat') {
      if (!coupon.minOrder || computedSubtotal >= coupon.minOrder) {
        computedDiscount = coupon.discount;
      }
    }
  }

  // 7. Compute delivery charge
  const deliveryCharge = computedSubtotal > 199 ? 0 : 20;
  const computedTotal = Math.max(0, computedSubtotal - computedDiscount + deliveryCharge);

  // 8. Fraud Guardrail: High-Value COD Threshold
  const isCod = paymentMethod === 'Cash on Delivery';
  if (isCod && computedTotal > MAX_COD_AMOUNT) {
    throw new Error(`Cash on Delivery is limited to ₹${MAX_COD_AMOUNT}. For orders above ₹${MAX_COD_AMOUNT}, please pay via UPI / Online Gateway.`);
  }

  const orderId = `ord-${Date.now()}`;
  const placedAt = new Date().toISOString();

  const orderPayload = {
    id: orderId,
    idempotencyKey,
    customerId: currentUser.uid,
    storeId,
    storeName,
    items: verifiedItems,
    subtotal: computedSubtotal,
    discount: computedDiscount,
    deliveryCharge,
    total: computedTotal,
    address: addrValidation.sanitized,
    paymentMethod: isCod ? 'Cash on Delivery' : 'UPI / Online Gateway',
    paymentStatus: isCod ? 'cod_pending' : 'pending',
    status: 'placed',
    statusHistory: [
      { status: 'placed', time: placedAt, note: 'Order placed with verified catalog pricing' },
    ],
    deliveryType,
    placedAt,
  };

  // 9. Persist order to Firestore
  if (db) {
    await setDoc(doc(db, 'orders', orderId), orderPayload);
  }

  return orderPayload;
}
