import { doc, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured, auth } from '../config/firebase';
import { validateAddress } from '../utils/validators';

const SERVER_COUPONS = {
  'NEWUSER': { discount: 20, type: 'percent', maxDiscount: 100 },
  'MANDI10': { discount: 10, type: 'percent', maxDiscount: 50 },
  'FLAT50': { discount: 50, type: 'flat', minOrder: 299 },
  'REF50': { discount: 50, type: 'flat', minOrder: 199 },
};

// Fraud Prevention Limits
const MAX_COD_AMOUNT = 2500;
const MIN_ORDER_AMOUNT = 49;

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
 */
export function generateIdempotencyKey(customerId, storeId, items) {
  const itemSignature = items
    .map(i => `${i.id || i.productId}:${i.quantity}`)
    .sort()
    .join(';');
  const timeWindow = Math.floor(Date.now() / (5 * 60 * 1000));
  return `idem_${customerId}_${storeId}_${btoa(itemSignature).slice(0, 16)}_${timeWindow}`;
}

/**
 * Creates an order cleanly and reliably with Firestore and Razorpay support.
 */
export async function createSecureOrder({
  items,
  storeId,
  address,
  deliveryType = 'express',
  scheduledSlot = null,
  couponCode = null,
  paymentMethod = 'Cash on Delivery',
}) {
  if (!items || items.length === 0) {
    throw new Error('Your cart is empty.');
  }

  const addrValidation = validateAddress(address);
  if (!addrValidation.valid) {
    const firstErr = Object.values(addrValidation.errors)[0];
    throw new Error(firstErr || 'Invalid delivery address');
  }

  // 1. Verify User Authentication
  let customerId = 'guest';
  let customerName = 'Customer';
  let customerEmail = '';
  let customerPhone = '';

  if (isFirebaseConfigured) {
    const currentUser = auth?.currentUser;
    if (!currentUser) {
      throw new Error('Please log in to place your order.');
    }
    customerId = currentUser.uid;
    customerName = currentUser.displayName || 'Customer';
    customerEmail = currentUser.email || '';
    customerPhone = currentUser.phoneNumber || '';
  } else {
    try {
      const localUser = JSON.parse(localStorage.getItem('mandi_local_user') || 'null');
      if (localUser) {
        customerId = localUser.id || localUser.uid || 'local-guest';
        customerName = localUser.name || 'Customer';
        customerEmail = localUser.email || '';
        customerPhone = localUser.phone || '';
      }
    } catch {
      // ignore
    }
  }

  // 2. Calculate prices, discounts & charges
  let computedSubtotal = items.reduce((sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1), 0);
  if (computedSubtotal < MIN_ORDER_AMOUNT) {
    throw new Error(`Minimum order amount is ₹${MIN_ORDER_AMOUNT}.`);
  }

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

  const deliveryCharge = computedSubtotal > 199 ? 0 : 20;
  const computedTotal = Math.max(0, computedSubtotal - computedDiscount + deliveryCharge);
  const isCod = paymentMethod === 'Cash on Delivery';

  if (isCod && computedTotal > MAX_COD_AMOUNT) {
    throw new Error(`Cash on Delivery is limited to ₹${MAX_COD_AMOUNT}. For orders above ₹${MAX_COD_AMOUNT}, please choose UPI / Online Gateway.`);
  }

  const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const idempotencyKey = generateIdempotencyKey(customerId, storeId, items);
  const placedAt = new Date().toISOString();

  const newOrder = {
    id: orderId,
    idempotencyKey,
    customerId,
    customerName,
    customerEmail,
    customerPhone,
    storeId,
    storeName: 'Mahalaxmi Kirana',
    items: items.map(i => ({
      productId: i.productId || i.id,
      name: i.name,
      price: Number(i.price) || 0,
      quantity: i.quantity || 1,
      unit: i.unit || 'unit',
      image: i.image || '',
    })),
    subtotal: computedSubtotal,
    discount: computedDiscount,
    deliveryCharge,
    total: computedTotal,
    address: addrValidation.sanitized,
    paymentMethod: isCod ? 'Cash on Delivery' : 'UPI / Online Gateway',
    paymentStatus: isCod ? 'cod_pending' : 'pending',
    status: 'placed',
    statusHistory: [
      { status: 'placed', time: placedAt, note: isCod ? 'Order placed with Cash on Delivery' : 'Order placed, awaiting UPI/online payment' },
    ],
    deliveryType,
    scheduledSlot: deliveryType === 'scheduled' ? scheduledSlot : null,
    placedAt,
  };

  // 3. Save directly to Firestore if configured
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'orders', orderId), newOrder);
    } catch (dbErr) {
      console.warn('Firestore direct write notice:', dbErr.message);
    }
  }

  return newOrder;
}
