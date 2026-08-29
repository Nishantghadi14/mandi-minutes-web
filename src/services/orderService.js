import { httpsCallable } from 'firebase/functions';
import { functions, isFirebaseConfigured, auth } from '../config/firebase';
import { validateAddress } from '../utils/validators';

const SERVER_COUPONS = {
  'NEWUSER': { discount: 20, type: 'percent', maxDiscount: 100 },
  'MANDI10': { discount: 10, type: 'percent', maxDiscount: 50 },
  'FLAT50': { discount: 50, type: 'flat', minOrder: 299 },
  'REF50': { discount: 50, type: 'flat', minOrder: 199 },
};

// Fraud Prevention Limits for local fallback
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
 * Places an order securely via the server-side createOrder Cloud Function.
 * The Cloud Function recalculates product prices from Firestore, enforces fraud rate-limits,
 * and creates Razorpay orders server-side.
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

  // Normalize cart items to { productId, quantity }
  const normalizedItems = items.map(item => ({
    productId: item.productId || item.id,
    quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
  }));

  // ── 1. Production / Real Firebase Cloud Function Execution ─────────────────
  if (isFirebaseConfigured) {
    if (!functions) {
      throw new Error('Firebase Functions service is not initialized.');
    }
    const currentUser = auth?.currentUser;
    if (!currentUser) {
      throw new Error('Authentication required to place an order.');
    }

    const idempotencyKey = generateIdempotencyKey(currentUser.uid, storeId, items);
    const createOrderFn = httpsCallable(functions, 'createOrder');

    const result = await createOrderFn({
      items: normalizedItems,
      storeId,
      address: addrValidation.sanitized,
      deliveryType,
      scheduledSlot: deliveryType === 'scheduled' ? scheduledSlot : null,
      couponCode,
      paymentMethod,
      idempotencyKey,
    });

    const { order, razorpayOrder } = result.data || {};
    if (!order) {
      throw new Error('Order creation failed on server.');
    }

    return {
      ...order,
      razorpayOrder,
    };
  }

  // ── 2. Local Dev Fallback (When Firebase is not configured) ─────────────────
  const localUser = JSON.parse(localStorage.getItem('mandi_local_user') || 'null');
  const customerId = localUser?.id || auth?.currentUser?.uid || 'local-guest';
  const idempotencyKey = generateIdempotencyKey(customerId, storeId, items);

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
    throw new Error(`Cash on Delivery is limited to ₹${MAX_COD_AMOUNT}. For orders above ₹${MAX_COD_AMOUNT}, please pay via UPI / Online Gateway.`);
  }

  const orderId = `ord-${Date.now()}`;
  const placedAt = new Date().toISOString();

  const fallbackOrder = {
    id: orderId,
    idempotencyKey,
    customerId,
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
      { status: 'placed', time: placedAt, note: 'Order placed in local development mode' },
    ],
    deliveryType,
    scheduledSlot: deliveryType === 'scheduled' ? scheduledSlot : null,
    placedAt,
    razorpayOrder: null,
  };

  return fallbackOrder;
}
