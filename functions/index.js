const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { applyCoupon, calculateDeliveryCharge } = require('./pricing');

admin.initializeApp();
const db = admin.firestore();
const MIN_ORDER_AMOUNT = 49;
const MAX_COD_AMOUNT = 2500;
const clean = (value, max) => typeof value === 'string' ? value.trim().replace(/[<>]/g, '').slice(0, max) : '';
const qty = value => Number.isSafeInteger(Number(value)) && Number(value) > 0 && Number(value) <= 100 ? Number(value) : null;
function authUid(context) { if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Authentication is required.'); return context.auth.uid; }
async function userFor(uid) { const snap = await db.collection('users').doc(uid).get(); return snap.exists ? snap.data() : null; }

exports.createOrder = functions.https.onCall(async (data, context) => {
  const customerId = authUid(context);
  const { items, storeId, address, deliveryType, scheduledSlot, couponCode, paymentMethod, idempotencyKey } = data || {};
  if (!Array.isArray(items) || items.length < 1 || items.length > 50 || typeof storeId !== 'string' || !storeId || !address || !clean(address.line1, 150) || !/^\d{6}$/.test(String(address.pincode || '')) || !['Cash on Delivery', 'UPI / Online Gateway'].includes(paymentMethod) || typeof idempotencyKey !== 'string' || idempotencyKey.length < 12 || idempotencyKey.length > 200) throw new functions.https.HttpsError('invalid-argument', 'Invalid checkout request.');
  const gatewayKeyId = process.env.RAZORPAY_KEY_ID || functions.config().razorpay?.key_id;
  const gatewaySecret = process.env.RAZORPAY_KEY_SECRET || functions.config().razorpay?.key_secret;
  if (paymentMethod === 'UPI / Online Gateway' && (!gatewayKeyId || !gatewaySecret)) throw new functions.https.HttpsError('failed-precondition', 'Online payment is temporarily unavailable. Please choose Cash on Delivery.');
  const orderId = `ord_${crypto.createHash('sha256').update(`${customerId}:${idempotencyKey}`).digest('hex').slice(0, 28)}`;
  const orderRef = db.collection('orders').doc(orderId);
  const productRefs = new Map();
  for (const item of items) {
    if (!item || typeof item.productId !== 'string' || !qty(item.quantity)) throw new functions.https.HttpsError('invalid-argument', 'Each item needs a valid product and quantity.');
    productRefs.set(item.productId, db.collection('products').doc(item.productId));
  }
  let order;
  await db.runTransaction(async tx => {
    const existing = await tx.get(orderRef);
    if (existing.exists) { order = existing.data(); return; }
    const [storeSnap, ...productSnaps] = await Promise.all([tx.get(db.collection('stores').doc(storeId)), ...[...productRefs.values()].map(ref => tx.get(ref))]);
    if (!storeSnap.exists || storeSnap.data().status !== 'approved') throw new functions.https.HttpsError('failed-precondition', 'Selected store is unavailable.');
    const products = new Map(productSnaps.map(s => [s.id, s]));
    let subtotal = 0; const verifiedItems = [];
    for (const item of items) {
      const snap = products.get(item.productId); const quantity = qty(item.quantity); const p = snap?.data();
      if (!snap?.exists || p.storeId !== storeId || p.isAvailable === false || !Number.isFinite(Number(p.stock)) || Number(p.stock) < quantity || !Number.isFinite(Number(p.price)) || Number(p.price) < 0) throw new functions.https.HttpsError('failed-precondition', `${clean(p?.name, 80) || 'A product'} is unavailable in the requested quantity.`);
      const price = Number(p.price); subtotal += price * quantity;
      verifiedItems.push({ productId: snap.id, name: clean(p.name, 120), price, quantity, unit: clean(p.unit, 40) || 'unit', image: clean(p.image, 500) });
      tx.update(snap.ref, { stock: Number(p.stock) - quantity, updatedAt: new Date().toISOString() });
    }
    if (subtotal < MIN_ORDER_AMOUNT) throw new functions.https.HttpsError('invalid-argument', `Minimum order amount is ₹${MIN_ORDER_AMOUNT}.`);
    const discount = applyCoupon(subtotal, couponCode); const deliveryCharge = calculateDeliveryCharge(subtotal); const total = Math.max(0, subtotal - discount + deliveryCharge);
    if (paymentMethod === 'Cash on Delivery' && total > MAX_COD_AMOUNT) throw new functions.https.HttpsError('invalid-argument', `Cash on Delivery is capped at ₹${MAX_COD_AMOUNT}.`);
    const placedAt = new Date().toISOString();
    order = { id: orderId, idempotencyKey, customerId, storeId, storeName: clean(storeSnap.data().name, 120) || 'Local Store', items: verifiedItems, subtotal, discount, deliveryCharge, total, address: { label: clean(address.label, 40) || 'Address', line1: clean(address.line1, 150), city: clean(address.city, 80), pincode: String(address.pincode) }, paymentMethod, paymentStatus: paymentMethod === 'Cash on Delivery' ? 'cod_pending' : 'pending', status: 'placed', statusHistory: [{ status: 'placed', time: placedAt, note: 'Order placed and inventory reserved.' }], deliveryType: deliveryType === 'scheduled' ? 'scheduled' : 'express', scheduledSlot: deliveryType === 'scheduled' ? scheduledSlot : null, placedAt };
    tx.create(orderRef, order);
  });
  if (paymentMethod === 'Cash on Delivery' || order.razorpayOrderId) return { success: true, order, isDuplicate: Boolean(order.razorpayOrderId) };
  let razorpayOrder;
  try { razorpayOrder = await new Razorpay({ key_id: gatewayKeyId, key_secret: gatewaySecret }).orders.create({ amount: Math.round(order.total * 100), currency: 'INR', receipt: orderId, notes: { orderId, customerId, storeId } }); }
  catch (err) {
    console.error('Razorpay order creation failed:', err.message);
    // The transaction reserved stock before gateway creation; release it atomically on failure.
    await db.runTransaction(async tx => { const current = await tx.get(orderRef); if (!current.exists || current.data().razorpayOrderId) return; for (const item of current.data().items || []) { const productRef = db.collection('products').doc(item.productId); const product = await tx.get(productRef); if (product.exists) tx.update(productRef, { stock: Number(product.data().stock || 0) + Number(item.quantity || 0), updatedAt: new Date().toISOString() }); } tx.delete(orderRef); });
    throw new functions.https.HttpsError('unavailable', 'Online payment could not be started. No payment has been taken.');
  }
  await orderRef.update({ razorpayOrderId: razorpayOrder.id });
  return { success: true, order: { ...order, razorpayOrderId: razorpayOrder.id }, razorpayOrder };
});

exports.transitionOrderStatus = functions.https.onCall(async (data, context) => {
  const uid = authUid(context); const { orderId, status, note = '' } = data || {};
  if (typeof orderId !== 'string' || !['accepted', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'].includes(status)) throw new functions.https.HttpsError('invalid-argument', 'Invalid order transition.');
  const user = await userFor(uid); if (!user) throw new functions.https.HttpsError('permission-denied', 'Account profile is unavailable.');
  const ref = db.collection('orders').doc(orderId); let order;
  await db.runTransaction(async tx => { const snap = await tx.get(ref); if (!snap.exists) throw new functions.https.HttpsError('not-found', 'Order not found.'); order = snap.data(); const vendor = user.role === 'vendor' && user.storeId === order.storeId; const rider = user.role === 'rider' && order.riderId === uid; const customerCancellation = order.customerId === uid && order.status === 'placed' && status === 'cancelled'; const legal = user.role === 'admin' || (vendor && ((order.status === 'placed' && status === 'accepted') || (order.status === 'accepted' && status === 'preparing'))) || (rider && ((order.status === 'preparing' && status === 'out_for_delivery') || (order.status === 'out_for_delivery' && status === 'delivered'))) || customerCancellation; if (!legal) throw new functions.https.HttpsError('permission-denied', 'You are not allowed to make this transition.'); const time = new Date().toISOString(); const entry = { status, time, note: clean(note, 240) || `Order status changed to ${status}.` }; order = { ...order, status, statusHistory: [...(order.statusHistory || []), entry] }; tx.update(ref, { status, statusHistory: order.statusHistory, updatedAt: time }); });
  return { order };
});

exports.submitVendorApplication = functions.https.onCall(async (data, context) => {
  const applicantId = authUid(context); const a = data?.application || {};
  const application = { applicantId, storeName: clean(a.name, 100), ownerName: clean(a.ownerName, 60), ownerEmail: clean(a.ownerEmail, 254).toLowerCase(), ownerPhone: clean(a.ownerPhone, 20), address: clean(a.address, 150), city: clean(a.city, 80), pincodes: Array.isArray(a.pincodes) ? [...new Set(a.pincodes.filter(p => /^\d{6}$/.test(String(p))).map(String))].slice(0, 20) : [], gstin: clean(a.gstin, 20), upiId: clean(a.upiId, 120), bankAccount: clean(a.bankAccount, 40), description: clean(a.description, 400), status: 'pending', submittedAt: new Date().toISOString() };
  if (application.storeName.length < 3 || application.ownerName.length < 2 || !/^\S+@\S+\.\S+$/.test(application.ownerEmail) || !/^\d{10}$/.test(application.ownerPhone.replace(/\D/g, '')) || application.address.length < 5 || !application.pincodes.length || !/^[\w.-]+@[\w.-]+$/.test(application.upiId)) throw new functions.https.HttpsError('invalid-argument', 'Please provide complete, valid application details.');
  const ref = db.collection('vendorApplications').doc(); await ref.create(application); return { application: { id: ref.id, ...application } };
});

exports.submitStoreReview = functions.https.onCall(async (data, context) => {
  const userId = authUid(context); const { storeId, orderId, rating, comment } = data || {};
  if (typeof storeId !== 'string' || typeof orderId !== 'string' || !Number.isInteger(rating) || rating < 1 || rating > 5) throw new functions.https.HttpsError('invalid-argument', 'Invalid review.');
  const orderRef = db.collection('orders').doc(orderId); const reviewRef = db.collection('stores').doc(storeId).collection('reviews').doc(orderId); let review;
  await db.runTransaction(async tx => { const [orderSnap, reviewSnap] = await Promise.all([tx.get(orderRef), tx.get(reviewRef)]); const order = orderSnap.data(); if (!orderSnap.exists || order.customerId !== userId || order.storeId !== storeId || order.status !== 'delivered') throw new functions.https.HttpsError('permission-denied', 'Only your delivered orders can be reviewed.'); if (reviewSnap.exists || order.isReviewed) throw new functions.https.HttpsError('already-exists', 'This order has already been reviewed.'); review = { id: orderId, userId, rating, comment: clean(comment, 1000), orderId, createdAt: new Date().toISOString() }; tx.create(reviewRef, review); tx.update(orderRef, { isReviewed: true, reviewRating: rating }); });
  return { review };
});

exports.updateRiderLocation = functions.https.onCall(async (data, context) => {
  const uid = authUid(context); const { orderId, location } = data || {};
  if (typeof orderId !== 'string' || !Number.isFinite(Number(location?.lat)) || !Number.isFinite(Number(location?.lng)) || Number(location.lat) < -90 || Number(location.lat) > 90 || Number(location.lng) < -180 || Number(location.lng) > 180) throw new functions.https.HttpsError('invalid-argument', 'Invalid rider location.');
  const rider = await userFor(uid); if (rider?.role !== 'rider') throw new functions.https.HttpsError('permission-denied', 'Only riders may share delivery location.');
  const ref = db.collection('orders').doc(orderId); await db.runTransaction(async tx => { const snap = await tx.get(ref); if (!snap.exists || snap.data().riderId !== uid || snap.data().status !== 'out_for_delivery') throw new functions.https.HttpsError('permission-denied', 'You are not assigned to this active delivery.'); tx.update(ref, { riderLocation: { lat: Number(location.lat), lng: Number(location.lng), accuracy: Math.max(0, Number(location.accuracy) || 0), updatedAt: new Date().toISOString() } }); });
  return { success: true };
});

async function notifyUser(userId, notification, data) {
  const userSnap = await db.collection('users').doc(userId).get();
  const tokens = userSnap.data()?.fcmTokens || [];
  if (!tokens.length) return;
  const response = await admin.messaging().sendEachForMulticast({ tokens, notification, data });
  const stale = response.responses.flatMap((result, index) => !result.success && ['messaging/invalid-registration-token', 'messaging/registration-token-not-registered'].includes(result.error?.code) ? [tokens[index]] : []);
  if (stale.length) await userSnap.ref.update({ fcmTokens: admin.firestore.FieldValue.arrayRemove(...stale) });
}

exports.onOrderStatusChanged = functions.firestore.document('orders/{orderId}').onUpdate(async (change, context) => {
  const before = change.before.data(); const after = change.after.data();
  if (before.status === after.status) return null;
  try { await notifyUser(after.customerId, { title: 'Order updated', body: `Your order is ${String(after.status).replace(/_/g, ' ')}.` }, { orderId: context.params.orderId, status: after.status, url: `/order-status/${context.params.orderId}` }); }
  catch (err) { console.error('Order-status notification failed:', err.message); }
  return null;
});

exports.razorpayWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || functions.config().razorpay?.webhook_secret; const signature = req.get('x-razorpay-signature');
  if (!secret || !signature || !req.rawBody) return res.status(400).send('Signature verification failed');
  const expected = crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex'); if (expected.length !== signature.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return res.status(400).send('Invalid signature');
  const payment = req.body?.payload?.payment?.entity; if (!['payment.captured', 'order.paid'].includes(req.body?.event) || !payment?.notes?.orderId) return res.status(200).json({ received: true });
  const orderRef = db.collection('orders').doc(payment.notes.orderId); const eventRef = db.collection('paymentEvents').doc(String(payment.id));
  try { await db.runTransaction(async tx => { const [eventSnap, orderSnap] = await Promise.all([tx.get(eventRef), tx.get(orderRef)]); if (eventSnap.exists) return; const order = orderSnap.data(); if (!orderSnap.exists || order.razorpayOrderId !== payment.order_id || Number(payment.amount) !== Math.round(Number(order.total) * 100) || payment.status !== 'captured') throw new Error('Payment mismatch'); tx.create(eventRef, { orderId: orderRef.id, paymentId: payment.id, receivedAt: new Date().toISOString() }); if (order.paymentStatus !== 'paid') tx.update(orderRef, { paymentStatus: 'paid', paymentDetails: { gateway: 'razorpay', paymentId: payment.id, method: payment.method || 'unknown', paidAt: new Date().toISOString() } }); }); } catch (err) { console.error('Razorpay webhook rejected:', err.message); return res.status(400).send('Payment rejected'); }
  return res.status(200).json({ received: true });
});
