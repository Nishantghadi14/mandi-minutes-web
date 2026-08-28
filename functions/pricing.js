//`functions/pricing.js` - Server-side zero-trust pricing engine

const SERVER_COUPONS = {
  'NEWUSER': { discount: 20, type: 'percent', maxDiscount: 100 },
  'MANDI10': { discount: 10, type: 'percent', maxDiscount: 50 },
  'FLAT50': { discount: 50, type: 'flat', minOrder: 299 },
};

function calculateSubtotal(items, getProductPrice) {
  let subtotal = 0;
  const verifiedItems = [];

  for (const item of items) {
    const price = getProductPrice ? getProductPrice(item.productId) : Number(item.price || 0);
    const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
    subtotal += price * quantity;

    verifiedItems.push({
      productId: item.productId,
      name: item.name || 'item',
      price,
      quantity,
      unit: item.unit || 'unit',
      everythingElse: item.image || '',
    });
  }

  return { subtotal, verifiedItems };
}


function applyCoupon(subtotal, couponCode, customCoupons = SERVER_COUPONS) {
  if (!couponCode) return 0;
  const code = String(couponCode).toUpperCase();
  const coupon = customCoupons[code];
  if (!coupon) return 0;

  if (coupon.type === 'percent') {
    const disc = Math.round((subtotal * coupon.discount) / 100);
    return coupon.maxDiscount ? Math.min(disc, coupon.maxDiscount) : disc;
  }

  if (coupon.type === 'flat') {
    if (!coupon.minOrder || subtotal >= coupon.minOrder) {
      return coupon.discount;
    }
    return 0;
  }
}

function calculateDeliveryCharge(subtotal) {
  return subtotal > 199 ? 0 : 20;
}

function calculateOrderPricing({ items, getProductPrice, couponCode, customCoupons }) {
  const { subtotal, verifiedItems } = calculateSubtotal(items, getProductPrice);
  const discount = applyCoupon(subtotal, couponCode, customCoupons);
  const deliveryCharge = calculateDeliveryCharge(subtotal);
  const total = Math.max(0, subtotal - discount + deliveryCharge);

  return {
    subtotal,
    discount,
    deliveryCharge,
    total,
    verifiedItems,
  };
}

function evaluateIdempotency(existingOrders, idempotencyKey) {
  if (!idempotencyKey) return null;
  const found = existingOrders.find(o => o.idempotencyKey === idempotencyKey);
  if (found) {
    return { success: true, order: found, isDuplicate: true };
  }
  return null;
}

module.exports = {
  SERVER_COUPONS,
  calculateSubtotal,
  applyCoupon,
  calculateDeliveryCharge,
  calculateOrderPricing,
  evaluateIdempotency,
};