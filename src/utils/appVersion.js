import { isNativeApp } from './platform';

export const CURRENT_APP_VERSION = '1.0.0';
export const CURRENT_BUILD_CODE = 1;

export const CUSTOMER_PACKAGE_ID = 'com.mandiminutes.app';
export const RIDER_PACKAGE_ID = 'com.mandiminutes.rider';

/**
 * Compares two semantic version strings (e.g. "1.0.1" vs "1.0.0").
 * Returns:
 *   1 if v1 > v2
 *  -1 if v1 < v2
 *   0 if v1 === v2
 */
export function compareVersions(v1, v2) {
  if (!v1 && !v2) return 0;
  if (!v1) return -1;
  if (!v2) return 1;
  const p1 = String(v1).replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
  const p2 = String(v2).replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
  const maxLen = Math.max(p1.length, p2.length);

  for (let i = 0; i < maxLen; i++) {
    const num1 = p1[i] || 0;
    const num2 = p2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

/**
 * Returns appropriate Google Play Store URL depending on web vs native container.
 */
export function getPlayStoreUrl(packageId = CUSTOMER_PACKAGE_ID, forceNative = null) {
  const native = forceNative !== null ? forceNative : isNativeApp();
  return native
    ? `market://details?id=${packageId}`
    : `https://play.google.com/store/apps/details?id=${packageId}`;
}

/**
 * Navigates to Google Play Store listing safely.
 */
export function openPlayStore(packageId = CUSTOMER_PACKAGE_ID) {
  const isNative = isNativeApp();
  try {
    if (isNative) {
      window.location.href = getPlayStoreUrl(packageId, true);
    } else {
      window.open(getPlayStoreUrl(packageId, false), '_blank', 'noopener,noreferrer');
    }
  } catch {
    window.open(getPlayStoreUrl(packageId, false), '_blank', 'noopener,noreferrer');
  }
}
