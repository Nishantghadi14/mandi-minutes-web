import { Capacitor } from '@capacitor/core';

/**
 * Returns true if running inside the native Android APK (Capacitor),
 * or if explicitly previewing in App mode via ?mode=app query or /app route.
 */
export const isNativeApp = () => {
  if (typeof window === 'undefined') return false;
  return Capacitor.isNativePlatform();
};

/**
 * Returns true if the user is in App View.
 * Active if:
 * 1. Inside Capacitor native Android APK runtime
 * 2. URL query param has ?mode=app or ?app=true
 * 3. Currently on a route starting with /app
 * 4. Active tab session has app mode enabled and NOT currently visiting root '/'
 * Explicitly disabled if URL is '/' or query param has ?mode=web / ?mode=desktop
 */
export const isInAppMode = (currentPath) => {
  if (typeof window === 'undefined') return false;

  // 1. Capacitor native Android APK runtime is always in app mode
  if (Capacitor.isNativePlatform()) return true;

  // Clean up any stale localStorage flag
  try {
    localStorage.removeItem('mandi_app_mode');
  } catch {}

  try {
    const path = currentPath || window.location.pathname;
    const params = new URLSearchParams(window.location.search);

    // 2. Explicit switch to Web mode -> clear tab session
    if (params.get('mode') === 'web' || params.get('mode') === 'desktop') {
      sessionStorage.removeItem('mandi_app_session');
      return false;
    }

    // 3. Explicit switch to App mode via query param -> activate tab session
    if (params.get('mode') === 'app' || params.get('app') === 'true') {
      sessionStorage.setItem('mandi_app_session', 'true');
      return true;
    }

    // 4. Visiting website root '/' in browser -> ALWAYS Web View! Clear app session.
    if (path === '/') {
      sessionStorage.removeItem('mandi_app_session');
      return false;
    }

    // 5. Visiting /app route -> activate tab session
    if (path.startsWith('/app')) {
      sessionStorage.setItem('mandi_app_session', 'true');
      return true;
    }

    // 6. Sub-routes (/search, /orders, /profile): retain app mode if user arrived from /app
    if (sessionStorage.getItem('mandi_app_session') === 'true') {
      return true;
    }
  } catch {}

  return false;
};

/**
 * Returns the correct home path: '/app' for app mode, '/' for desktop website.
 */
export const getAppHomePath = () => {
  return isInAppMode() ? '/app' : '/';
};

export const isAndroid = () => {
  return Capacitor.getPlatform() === 'android';
};
