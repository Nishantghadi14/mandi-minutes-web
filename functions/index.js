const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');
const Razorpay = require('razorpay');

admin.initializeApp();
const db = admin.firestore();

// Active server-side promo coupon rules
const SERVER_COUPONS = {
  'NEWUSER': { discount: 20, type: 'percent', maxDiscount: 100 },
  'MANDI10': { discount: 10, type: 'percent', maxDiscount: 50 },
  'FLAT50': { discount: 50, type: 'flat', minOrder: 299 },
};

/**
 * Server-side order calculation and creation with Idempotency.
 * Reads genuine product prices from Firestore — zero client price trust.
 */
exports.createOrder = functions.https.onCall(async (data, context) => {
  // 1. Verify user authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be authenticated to place an order.'
    );
  }

  const customerId = context.auth.uid;
  const { items, storeId, address, deliveryType, couponCode, paymentMethod, idempotencyKey } = data;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Cart contains no items.');
  }

  if (!storeId) {
    throw new functions.https.HttpsError('invalid-argument', 'Store ID is required.');
  }

  if (!address || !address.line1 || !address.pincode) {
    throw new functions.https.HttpsError('invalid-argument', 'Valid delivery address is required.');
  }

  // 2. Check Idempotency: Prevent duplicate orders
  if (idempotencyKey) {
    const existingOrders = await db
      .collection('orders')
      .where('customerId', '==', customerId)
      .where('idempotencyKey', '==', idempotencyKey)
      .limit(1)
      .get();

    if (!existingOrders.empty) {
      const existing = existingOrders.docs[0].data();
      return { success: true, order: existing, isDuplicate: true };
    }
  }

  // 3. Fetch store details from Firestore
  const storeDoc = await db.collection('stores').doc(storeId).get();
  if (!storeDoc.exists || storeDoc.data().status !== 'approved') {
    throw new functions.https.HttpsError('not-found', 'Selected store is unavailable or not approved.');
  }
  const storeData = storeDoc.data();

  // 4. Fetch product documents from Firestore to compute exact prices
  let computedSubtotal = 0;
  const verifiedItems = [];

  for (const item of items) {
    const productDoc = await db.collection('products').doc(item.productId).get();
    if (!productDoc.exists) {
      throw new functions.https.HttpsError('not-found', `Product ${item.productId} was not found.`);
    }

    const prodData = productDoc.data();
    if (prodData.storeId !== storeId) {
      throw new functions.https.HttpsError('invalid-argument', `Product ${prodData.name} does not belong to the selected store.`);
    }

    const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
    const price = Number(prodData.price) || 0;
    computedSubtotal += price * quantity;

    verifiedItems.push({
      productId: productDoc.id,
      name: prodData.name,
      price: price,
      quantity: quantity,
      unit: prodData.unit || 'unit',
      image: prodData.image || '',
    });
  }

  // 5. Server-side discount computation
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

  // 6. Server-side delivery charge computation
  const deliveryCharge = computedSubtotal > 199 ? 0 : 20;
  const computedTotal = Math.max(0, computedSubtotal - computedDiscount + deliveryCharge);

  // 7. Generate order ID and timestamps
  const orderId = `ord-${Date.now()}`;
  const placedAt = new Date().toISOString();
  const isCod = paymentMethod === 'Cash on Delivery';

  let razorpayOrder = null;

  // 8. If online/UPI payment, generate server-side Razorpay order
  if (!isCod) {
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID || functions.config().razorpay?.key_id;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || functions.config().razorpay?.key_secret;

    if (razorpayKeyId && razorpayKeySecret) {
      try {
        const razorpay = new Razorpay({
          key_id: razorpayKeyId,
          key_secret: razorpayKeySecret,
        });

        razorpayOrder = await razorpay.orders.create({
          amount: computedTotal * 100, // in paise
          currency: 'INR',
          receipt: orderId,
          notes: {
            orderId: orderId,
            customerId: customerId,
            storeId: storeId,
          },
        });
      } catch (rzpErr) {
        console.error('Razorpay order creation failed:', rzpErr);
      }
    }
  }

  // 9. Construct secured order document
  const orderPayload = {
    id: orderId,
    idempotencyKey: idempotencyKey || `idem_${orderId}`,
    customerId,
    storeId,
    storeName: storeData.name || 'Local Store',
    items: verifiedItems,
    subtotal: computedSubtotal,
    discount: computedDiscount,
    deliveryCharge,
    total: computedTotal,
    address,
    paymentMethod: isCod ? 'Cash on Delivery' : 'UPI / Online Gateway',
    paymentStatus: isCod ? 'cod_pending' : 'pending',
    razorpayOrderId: razorpayOrder?.id || null,
    status: 'placed',
    statusHistory: [
      { status: 'placed', time: placedAt, note: 'Order placed and validated by Mandi Minutes backend' },
    ],
    deliveryType: deliveryType || 'express',
    placedAt,
  };

  // 10. Persist to Firestore
  await db.collection('orders').doc(orderId).set(orderPayload);

  return {
    success: true,
    order: orderPayload,
    razorpayOrder,
  };
});

/**
 * Razorpay Payment Webhook.
 * Verifies gateway cryptographic signature and marks order as paid in Firestore.
 */
exports.razorpayWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || functions.config().razorpay?.webhook_secret;
  const signature = req.headers['x-razorpay-signature'];

  if (!webhookSecret || !signature) {
    console.error('Webhook secret or signature header missing.');
    return res.status(400).send('Signature verification failed');
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (expectedSignature !== signature) {
    console.error('Invalid Razorpay webhook signature');
    return res.status(400).send('Invalid signature');
  }

  const event = req.body.event;
  const payload = req.body.payload;

  if (event === 'payment.captured' || event === 'order.paid') {
    const payment = payload.payment?.entity;
    const notes = payment?.notes || {};
    const orderId = notes.orderId || payment?.description?.replace('MandiMinutes-', '');

    if (orderId) {
      const orderRef = db.collection('orders').doc(orderId);
      const orderDoc = await orderRef.get();

      if (orderDoc.exists) {
        const paidAt = new Date().toISOString();
        await orderRef.update({
          paymentStatus: 'paid',
          paymentDetails: {
            gateway: 'razorpay',
            paymentId: payment.id,
            method: payment.method || 'upi',
            paidAt,
          },
          statusHistory: admin.firestore.FieldValue.arrayUnion({
            status: 'paid',
            time: paidAt,
            note: `Payment of ₹${payment.amount / 100} verified via Razorpay (${payment.id})`,
          }),
        });

        console.log(`✅ Order ${orderId} successfully verified & marked PAID.`);
      }
    }
  }

  return res.status(200).json({ received: true });
});

/**
 * FCM Push Trigger: Order Placed -> Notify Customer and Store Vendor
 */
exports.onOrderCreated = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const order = snap.data();
    const orderId = context.params.orderId;

    try {
      // 1. Notify Customer
      const userDoc = await db.collection('users').doc(order.customerId).get();
      const customerTokens = userDoc.data()?.fcmTokens || [];

      if (customerTokens.length > 0) {
        await admin.messaging().sendEachForMulticast({
          tokens: customerTokens,
          notification: {
            title: 'Order Confirmed! 🛒',
            body: `Your Mandi Minutes order #${orderId.slice(-6).toUpperCase()} of ₹${order.total} from ${order.storeName} is placed!`,
          },
          data: { orderId, url: `/order-status/${orderId}` },
        });
      }

      // 2. Notify Store Vendor
      const vendorQuery = await db.collection('users').where('storeId', '==', order.storeId).limit(1).get();
      if (!vendorQuery.empty) {
        const vendorTokens = vendorQuery.docs[0].data()?.fcmTokens || [];
        if (vendorTokens.length > 0) {
          await admin.messaging().sendEachForMulticast({
            tokens: vendorTokens,
            notification: {
              title: '🔔 New Customer Order Received!',
              body: `Order #${orderId.slice(-6).toUpperCase()} (${order.items.length} items • ₹${order.total}) requires packing.`,
            },
            data: { orderId, url: '/vendor' },
          });
        }
      }
    } catch (fcmErr) {
      console.warn('FCM order placed trigger error:', fcmErr);
    }
  });

/**
 * FCM Push Trigger: Order Status Changed -> Notify Customer
 */
exports.onOrderStatusChanged = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const orderId = context.params.orderId;

    if (before.status === after.status) return null;

    try {
      const userDoc = await db.collection('users').doc(after.customerId).get();
      const customerTokens = userDoc.data()?.fcmTokens || [];

      if (customerTokens.length === 0) return null;

      const statusMessages = {
        accepted: { title: 'Order Accepted! 👨‍🍳', body: `${after.storeName} has accepted your grocery order.` },
        preparing: { title: 'Packing Items... 📦', body: 'Your items are being packed fresh from the store.' },
        out_for_delivery: { title: 'Out for Delivery! 🚴‍♂️', body: 'Rider is on the way with your grocery order.' },
        delivered: { title: 'Delivered! 🎉', body: 'Your Mandi Minutes order has been delivered. Enjoy!' },
        cancelled: { title: 'Order Cancelled', body: 'Your order was cancelled.' },
      };

      const msg = statusMessages[after.status] || {
        title: 'Order Updated',
        body: `Order status is now ${after.status.replace(/_/g, ' ')}.`,
      };

      await admin.messaging().sendEachForMulticast({
        tokens: customerTokens,
        notification: {
          title: msg.title,
          body: msg.body,
        },
        data: { orderId, status: after.status, url: `/order-status/${orderId}` },
      });
    } catch (fcmErr) {
      console.warn('FCM status change trigger error:', fcmErr);
    }
  });
