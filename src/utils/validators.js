/**
 * Input validation and sanitization utilities for Mandi Minutes.
 * Designed for Indian hyperlocal delivery constraints (phone, pincode, address, catalog).
 */

/**
 * Validates a 10-digit Indian mobile number starting with 6, 7, 8, or 9.
 * Accepts optional +91 or 0 prefix.
 */
export function validateIndianPhone(phone) {
  if (!phone) return { valid: false, error: 'Mobile number is required' };
  const cleaned = String(phone).replace(/\D/g, '');
  const digits = cleaned.length === 12 && cleaned.startsWith('91') 
    ? cleaned.slice(2) 
    : cleaned.length === 11 && cleaned.startsWith('0')
    ? cleaned.slice(1)
    : cleaned;

  if (!/^[6-9]\d{9}$/.test(digits)) {
    return { valid: false, error: 'Please enter a valid 10-digit Indian mobile number' };
  }
  return { valid: true, value: digits };
}

/**
 * Validates a 6-digit Indian PIN code.
 * Optionally validates against Virar/Palghar/Maharashtra region prefixes (40xxxx).
 */
export function validatePincode(pincode, requireLocalRegion = false) {
  if (!pincode) return { valid: false, error: 'Pincode is required' };
  const cleaned = String(pincode).trim().replace(/\D/g, '');

  if (!/^\d{6}$/.test(cleaned)) {
    return { valid: false, error: 'Pincode must be exactly 6 digits' };
  }

  if (requireLocalRegion && !cleaned.startsWith('401')) {
    return { valid: false, error: 'Currently delivering only to Virar / Palghar region (401xxx)' };
  }

  return { valid: true, value: cleaned };
}

/**
 * Validates an email address.
 */
export function validateEmail(email) {
  if (!email) return { valid: false, error: 'Email address is required' };
  const trimmed = String(email).trim();
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }
  return { valid: true, value: trimmed };
}

/**
 * Validates a UPI Virtual Payment Address (VPA) / UPI ID (e.g., storename@okicici, name@upi).
 */
export function validateUPI(upi) {
  if (!upi) return { valid: false, error: 'UPI ID is required' };
  const trimmed = String(upi).trim();
  const re = /^[\w.-]{2,100}@[a-zA-Z0-9]{2,50}$/;
  if (!re.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid UPI ID (e.g. yourstore@okaxis, shop@upi)' };
  }
  return { valid: true, value: trimmed };
}

/**
 * Sanitizes input string to prevent XSS and strip unwanted HTML/script characters.
 */
export function sanitizeText(str, maxLength = 500) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[<>]/g, '') // strip < and >
    .replace(/javascript:/gi, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Validates address fields for delivery.
 */
export function validateAddress(address) {
  const errors = {};

  if (!address.line1 || sanitizeText(address.line1).length < 5) {
    errors.line1 = 'Street address must be at least 5 characters';
  }

  if (!address.city || sanitizeText(address.city).length < 2) {
    errors.city = 'Please specify a valid city';
  }

  const pinCheck = validatePincode(address.pincode);
  if (!pinCheck.valid) {
    errors.pincode = pinCheck.error;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    sanitized: {
      label: sanitizeText(address.label || 'Home', 20),
      line1: sanitizeText(address.line1, 150),
      city: sanitizeText(address.city, 50),
      pincode: pinCheck.value || '',
    }
  };
}

/**
 * Validates vendor product entry fields.
 */
export function validateProduct(product) {
  const errors = {};

  const name = sanitizeText(product.name, 100);
  if (!name || name.length < 2) {
    errors.name = 'Product name must be at least 2 characters';
  }

  const price = Number(product.price);
  if (isNaN(price) || price <= 0) {
    errors.price = 'Price must be greater than ₹0';
  }

  const stock = Number(product.stock);
  if (isNaN(stock) || stock < 0) {
    errors.stock = 'Stock cannot be negative';
  }

  if (!product.unit || sanitizeText(product.unit).length < 1) {
    errors.unit = 'Unit is required (e.g. 500g, 1kg, 1L)';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    sanitized: {
      name,
      brand: sanitizeText(product.brand || '', 50),
      price: Math.round(price * 100) / 100,
      stock: Math.floor(stock),
      unit: sanitizeText(product.unit, 20),
      category: sanitizeText(product.category || 'cat-1', 50),
      image: sanitizeText(product.image || '', 300),
      isAvailable: Boolean(product.isAvailable !== false),
    }
  };
}
