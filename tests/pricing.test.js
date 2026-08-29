import { describe, it, expect } from 'vitest';
const {
  calculateSubtotal,
  applyCoupon,
  calculateDeliveryCharge,
  calculateOrderPricing,
  evaluateIdempotency,
} = require('../functions/pricing');

describe('Order Subtotal Calculation (Zero Client Trust)', () => {
  it('calculates subtotal across single item and quantity correctly', () => {
    const items = [{ productId: 'prod-rice', quantity: 2 }];
    const catalog = { 'prod-rice': 60 };
    const { subtotal } = calculateSubtotal(items, (id) => catalog[id]);
    expect(subtotal).toBe(120);
  });

  it('calculates subtotal across multiple distinct items with varying quantities', () => {
    const items = [
      { productId: 'prod-silky-rice', quantity: 3 }, // 48 * 3 = 144
      { productId: 'prod-toor-dal', quantity: 2 },    // 140 * 2 = 280
      { productId: 'prod-whole-chana', quantity: 1 }, // 100 * 1 = 100
    ];
    const catalog = {
      'prod-silky-rice': 48,
      'prod-toor-dal': 140,
      'prod-whole-chana': 100,
    };
    const { subtotal, verifiedItems } = calculateSubtotal(items, (id) => catalog[id]);
    expect(subtotal).toBe(524);
    expect(verifiedItems).toHaveLength(3);
  });

  it('sanitizes invalid or zero quantity to minimum 1', () => {
    const items = [{ productId: 'prod-item', quantity: 0 }];
    const catalog = { 'prod-item': 50 };
    const { subtotal, verifiedItems } = calculateSubtotal(items, (id) => catalog[id]);
    expect(subtotal).toBe(50);
    expect(verifiedItems[0].quantity).toBe(1);
  });
});

describe('Server-side Coupon Logic (SERVER_COUPONS)', () => {
  it('correctly applies NEWUSER (20% off up to max ₹100)', () => {
    expect(applyCoupon(200, 'NEWUSER')).toBe(40);
    expect(applyCoupon(400, 'NEWUSER')).toBe(80);
    expect(applyCoupon(600, 'NEWUSER')).toBe(100);
    expect(applyCoupon(1000, 'NEWUSER')).toBe(100);
  });

  it('correctly applies MANDI10 (10% off up to max ₹50)', () => {
    expect(applyCoupon(200, 'MANDI10')).toBe(20);
    expect(applyCoupon(400, 'MANDI10')).toBe(40);
    expect(applyCoupon(600, 'MANDI10')).toBe(50);
  });

  it('correctly applies FLAT50 (₹50 flat off with min order ₹299)', () => {
    expect(applyCoupon(250, 'FLAT50')).toBe(0);
    expect(applyCoupon(298, 'FLAT50')).toBe(0);
    expect(applyCoupon(299, 'FLAT50')).toBe(50);
    expect(applyCoupon(500, 'FLAT50')).toBe(50);
  });

  it('correctly applies REF50 (₹50 referral discount with min order ₹199)', () => {
    expect(applyCoupon(150, 'REF50')).toBe(0);
    expect(applyCoupon(198, 'REF50')).toBe(0);
    expect(applyCoupon(199, 'REF50')).toBe(50);
    expect(applyCoupon(400, 'REF50')).toBe(50);
    expect(applyCoupon(400, 'ref50')).toBe(50);
  });

  it('handles case-insensitivity and invalid coupon codes', () => {
    expect(applyCoupon(500, 'newuser')).toBe(100);
    expect(applyCoupon(500, 'mandi10')).toBe(50);
    expect(applyCoupon(500, 'flat50')).toBe(50);
    expect(applyCoupon(500, 'ref50')).toBe(50);
    expect(applyCoupon(500, 'INVALID_CODE')).toBe(0);
    expect(applyCoupon(500, null)).toBe(0);
    expect(applyCoupon(500, undefined)).toBe(0);
  });
});

describe('Delivery Charge Tiering (Free above ₹199, ₹20 below)', () => {
  it('charges ₹20 for orders ₹199 and below', () => {
    expect(calculateDeliveryCharge(0)).toBe(20);
    expect(calculateDeliveryCharge(50)).toBe(20);
    expect(calculateDeliveryCharge(100)).toBe(20);
    expect(calculateDeliveryCharge(199)).toBe(20);
  });

  it('charges ₹0 for orders above ₹199', () => {
    expect(calculateDeliveryCharge(200)).toBe(0);
    expect(calculateDeliveryCharge(250)).toBe(0);
    expect(calculateDeliveryCharge(1000)).toBe(0);
  });
});

describe('Full Order Pricing Pipeline', () => {
  it('computes end-to-end total with subtotal, coupon discount, and delivery fee', () => {
    const items = [
      { productId: 'p1', quantity: 2 },
      { productId: 'p2', quantity: 1 },
    ];
    const catalog = { p1: 100, p2: 100 };
    const pricing = calculateOrderPricing({
      items,
      getProductPrice: (id) => catalog[id],
      couponCode: 'MANDI10',
    });

    expect(pricing.subtotal).toBe(300);
    expect(pricing.discount).toBe(30);
    expect(pricing.deliveryCharge).toBe(0);
    expect(pricing.total).toBe(270);
  });

  it('computes end-to-end total for small order below ₹199 with delivery fee', () => {
    const items = [{ productId: 'p1', quantity: 1 }];
    const catalog = { p1: 100 };
    const pricing = calculateOrderPricing({
      items,
      getProductPrice: (id) => catalog[id],
      couponCode: null,
    });

    expect(pricing.subtotal).toBe(100);
    expect(pricing.discount).toBe(0);
    expect(pricing.deliveryCharge).toBe(20);
    expect(pricing.total).toBe(120);
  });
});

describe('Idempotency Evaluation', () => {
  it('returns existing order when idempotencyKey matches', () => {
    const existingOrders = [
      { id: 'ord-101', idempotencyKey: 'idem_key_abc_123', total: 250 },
      { id: 'ord-102', idempotencyKey: 'idem_key_xyz_456', total: 400 },
    ];

    const result = evaluateIdempotency(existingOrders, 'idem_key_abc_123');
    expect(result).not.toBeNull();
    expect(result.isDuplicate).toBe(true);
    expect(result.order.id).toBe('ord-101');
  });

  it('returns null when idempotencyKey is new or absent', () => {
    const existingOrders = [
      { id: 'ord-101', idempotencyKey: 'idem_key_abc_123', total: 250 },
    ];

    expect(evaluateIdempotency(existingOrders, 'idem_key_fresh')).toBeNull();
    expect(evaluateIdempotency(existingOrders, null)).toBeNull();
    expect(evaluateIdempotency(existingOrders, undefined)).toBeNull();
  });
});

