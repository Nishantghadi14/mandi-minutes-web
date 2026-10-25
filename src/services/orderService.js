import { httpsCallable } from 'firebase/functions';
import { db, functions, isFirebaseConfigured, auth } from '../config/firebase';
import { validateAddress } from '../utils/validators';

const SERVER_COUPONS = {
  'NEWUSER': { discount: 20, type: 'percent', maxDiscount: 100 },
  'MANDI10': { discount: 10, type: 'percent', maxDiscount: 50 },
  'FLAT50': { discount: 50, type: 'flat', minOrder: 299 },
  'REF50': { discount: 50, type: 'flat', minOrder: 199 },
};

// Fraud Prevention Limits
const MAX_COD_AMOUNT = 2500;

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
export function generateIdempotencyKey(customerId, storeId, items = []) {
  try {
    const itemSignature = (items || [])
      .map(i => `${i.id || i.productId || 'item'}:${i.quantity || 1}`)
      .sort()
      .join(';');
    const timeWindow = Math.floor(Date.now() / (5 * 60 * 1000));
    const safeBase64 = typeof btoa === 'function'
      ? btoa(encodeURIComponent(itemSignature).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode('0x' + p1))).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)
      : Math.random().toString(36).substring(2, 10);
    return `idem_${customerId || 'guest'}_${storeId || 'store'}_${safeBase64}_${timeWindow}`;
  } catch {
    return `idem_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }
}

/**
 * Creates an order cleanly and reliably with Firestore and direct UPI / COD support.
 */
export async function createSecureOrder({
  items,
  storeId,
  storeName = 'Local Store',
  address,
  deliveryType = 'same-day',
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

  const isCod = paymentMethod === 'Cash on Delivery';
  const effectiveStoreId = storeId || (items && items[0]?.storeId) || 'store-mahalaxmi-1';

  // 1. Production Mode: Transactional Order Placement via Cloud Functions (if reachable)
  if (isFirebaseConfigured && functions && auth?.currentUser) {
    const customerId = auth.currentUser.uid;
    const idempotencyKey = generateIdempotencyKey(customerId, effectiveStoreId, items);

    try {
      const createOrderFn = httpsCallable(functions, 'createOrder');
      const result = await createOrderFn({
        items: items.map(i => ({
          productId: i.productId || i.id,
          quantity: i.quantity || 1,
        })),
        storeId: effectiveStoreId,
        address: addrValidation.sanitized,
        deliveryType,
        scheduledSlot,
        couponCode: couponCode || null,
        paymentMethod: isCod ? 'Cash on Delivery' : 'UPI / Online Gateway',
        idempotencyKey,
      });

      const backendOrder = result?.data?.order;
      if (backendOrder) {
        try {
          const existing = JSON.parse(localStorage.getItem('mandi_synced_orders') || '[]');
          localStorage.setItem('mandi_synced_orders', JSON.stringify([backendOrder, ...existing.filter(o => o.id !== backendOrder.id)].slice(0, 100)));
        } catch {}
        return backendOrder;
      }
    } catch (fnErr) {
      console.warn('Secure Cloud Function createOrder notice (falling back to direct client/Firestore order placement):', fnErr?.message);
    }
  }

  // 2. Resilient Client / Direct Firestore Order Creation Mode
  let customerId = 'guest';
  let customerName = 'Customer';
  let customerEmail = '';
  let customerPhone = '';

  if (auth?.currentUser) {
    customerId = auth.currentUser.uid;
    customerName = auth.currentUser.displayName || 'Customer';
    customerEmail = auth.currentUser.email || '';
    customerPhone = auth.currentUser.phoneNumber || '';
  }

  try {
    const localUser = JSON.parse(localStorage.getItem('mandi_local_user') || 'null');
    if (localUser) {
      customerId = customerId !== 'guest' ? customerId : (localUser.id || localUser.uid || 'local-guest');
      customerName = customerName !== 'Customer' ? customerName : (localUser.name || 'Customer');
      customerEmail = customerEmail || localUser.email || '';
      customerPhone = customerPhone || localUser.phone || '';
    }
  } catch {
    // ignore
  }

  const computedSubtotal = items.reduce((sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1), 0);
  if (computedSubtotal <= 0) {
    throw new Error('Your cart is empty.');
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

  if (isCod && computedTotal > MAX_COD_AMOUNT) {
    throw new Error(`Cash on Delivery is limited to ₹${MAX_COD_AMOUNT}. For orders above ₹${MAX_COD_AMOUNT}, please choose UPI / Online Gateway.`);
  }

  const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const idempotencyKey = generateIdempotencyKey(customerId, effectiveStoreId, items);
  const placedAt = new Date().toISOString();

  const newOrder = {
    id: orderId,
    idempotencyKey,
    customerId,
    customerName,
    customerEmail,
    customerPhone,
    storeId: effectiveStoreId,
    storeName,
    items: items.map(i => ({
      productId: i.productId || i.id,
      name: i.name || 'Grocery Item',
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
    scheduledSlot: scheduledSlot || null,
    deliveryOtp: Math.floor(1000 + Math.random() * 9000).toString(),
    placedAt,
  };

  // Direct Firestore persistence when database is reachable
  if (db && isFirebaseConfigured) {
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'orders', orderId), newOrder);
    } catch (dbErr) {
      console.warn('Direct Firestore backup notice:', dbErr?.message);
    }
  }

  try {
    const existing = JSON.parse(localStorage.getItem('mandi_synced_orders') || '[]');
    localStorage.setItem('mandi_synced_orders', JSON.stringify([newOrder, ...existing.filter(o => o.id !== orderId)].slice(0, 100)));
  } catch {}

  return newOrder;
}

