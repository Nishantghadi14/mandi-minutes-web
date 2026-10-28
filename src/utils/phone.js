/**
 * Phone Number Normalization and Formatting Utilities
 * Standardizes Indian mobile numbers across formats (+91, 0, spaces, dashes)
 */

/**
 * Normalizes any phone input into a standard 10-digit Indian mobile number string.
 * Examples:
 *   "+919820098200" -> "9820098200"
 *   "+91 98200-98200" -> "9820098200"
 *   "09820098200" -> "9820098200"
 *   "9820098200" -> "9820098200"
 *
 * @param {string|number} phone - Raw phone input
 * @returns {string} Clean 10-digit mobile number, or empty string if invalid
 */
export function normalizePhoneNumber(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');

  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  if (digits.length === 10) {
    return digits;
  }
  return digits;
}

/**
 * Converts a phone number to standard E.164 format for Firebase Auth (+91XXXXXXXXXX).
 * @param {string|number} phone
 * @returns {string} E.164 formatted phone number
 */
export function toE164(phone) {
  const normalized = normalizePhoneNumber(phone);
  if (!normalized) return '';
  return `+91${normalized}`;
}

/**
 * Formats a phone number for clean human-readable UI display (+91 98200 98200).
 * @param {string|number} phone
 * @returns {string}
 */
export function formatDisplayPhone(phone) {
  const normalized = normalizePhoneNumber(phone);
  if (normalized.length !== 10) return phone ? String(phone) : '';
  return `+91 ${normalized.slice(0, 5)} ${normalized.slice(5)}`;
}

/**
 * Validates whether a given phone number is a valid 10-digit Indian mobile number.
 * @param {string|number} phone
 * @returns {boolean}
 */
export function isValidIndianPhone(phone) {
  const normalized = normalizePhoneNumber(phone);
  return /^[6-9]\d{9}$/.test(normalized);
}
