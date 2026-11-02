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
 * Returns true if the build or runtime target is the dedicated Mandi Rider APK.
 */
export const isRiderApp = () => {
  if (typeof window === 'undefined') return false;
  // 1. Vite environment flag (build-time target)
  if (import.meta.env.VITE_APP_TARGET === 'rider') return true;

  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('target') === 'rider' || params.get('app') === 'rider') {
      sessionStorage.setItem('mandi_app_target', 'rider');
      return true;
    }
    if (params.get('target') === 'consumer' || params.get('app') === 'consumer') {
      sessionStorage.removeItem('mandi_app_target');
      return false;
    }
    if (sessionStorage.getItem('mandi_app_target') === 'rider') {
      return true;
    }
  } catch {}

  return false;
};

/**
 * Returns true if the user is in App View.
 * Active if:
 * 1. Dedicated Mandi Rider APK runtime or target
 * 2. Inside Capacitor native Android APK runtime
 * 3. URL query param has ?mode=app or ?app=true
 * 4. Currently on a route starting with /app
 * 5. Active tab session has app mode enabled and NOT currently visiting root '/'
 * Explicitly disabled if URL is '/' or query param has ?mode=web / ?mode=desktop
 */
export const isInAppMode = (currentPath) => {
  if (typeof window === 'undefined') return false;
  if (isRiderApp()) return true;

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
 * Returns the correct home path: '/rider' for rider app, '/app' for app mode, '/' for desktop website.
 */
export const getAppHomePath = () => {
  if (isRiderApp()) return '/rider';
  return isInAppMode() ? '/app' : '/';
};

export const isAndroid = () => {
  return Capacitor.getPlatform() === 'android';
};

/**
 * Redirects or launches the dedicated Mandi Rider Partner app.
 * - On native Android / Capacitor, dispatches an Android Intent to launch com.mandiminutes.rider.
 * - If not installed or running in a web browser, seamlessly routes to /rider?target=rider.
 */
export const redirectToRiderApp = () => {
  if (typeof window === 'undefined') return;

  const fallbackUrl = `${window.location.origin}/rider?target=rider`;

  // 1. If running natively in Android or on an Android mobile device:
  if (isNativeApp() || /Android/i.test(navigator?.userAgent || '')) {
    // Android Intent URI targeting package com.mandiminutes.rider with fallback URL
    const intentUri = `intent:#Intent;package=com.mandiminutes.rider;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;scheme=mandirider;S.browser_fallback_url=${encodeURIComponent(fallbackUrl)};end`;

    try {
      window.location.href = intentUri;
    } catch {
      window.location.href = fallbackUrl;
    }

    // Safety fallback: if native app didn't launch within 1.5s (e.g. not installed), redirect to web target
    setTimeout(() => {
      try {
        if (!document.hidden && window.location.pathname !== '/rider') {
          window.location.href = fallbackUrl;
        }
      } catch {}
    }, 1500);
    return;
  }

  // 2. On desktop / web browser / non-Android:
  window.location.href = fallbackUrl;
};

/**
 * Returns a web or app URL for Google Maps turn-by-turn driving navigation.
 * Uses exact latitude & longitude when available, otherwise falls back to address query.
 */
export const getGoogleMapsNavUrl = (lat, lng, addressLabel = 'Customer Doorstep') => {
  const numLat = Number(lat);
  const numLng = Number(lng);
  if (numLat && numLng && !isNaN(numLat) && !isNaN(numLng) && numLat !== 0 && numLng !== 0) {
    return `https://www.google.com/maps/dir/?api=1&destination=${numLat},${numLng}&travelmode=driving`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addressLabel)}&travelmode=driving`;
};

/**
 * Launches turn-by-turn driving navigation in Google Maps:
 * - On native Android / Android devices, triggers direct voice navigation (`google.navigation:q=lat,lng&mode=d`).
 * - On desktop or mobile browsers, opens Google Maps driving directions in a new tab.
 */
export const openGoogleMapsNavigation = (lat, lng, addressLabel = 'Customer Doorstep') => {
  if (typeof window === 'undefined') return;

  const numLat = Number(lat);
  const numLng = Number(lng);
  const hasExactCoords = numLat && numLng && !isNaN(numLat) && !isNaN(numLng) && numLat !== 0 && numLng !== 0;
  const webUrl = getGoogleMapsNavUrl(lat, lng, addressLabel);

  if (isAndroid() || /Android/i.test(navigator?.userAgent || '')) {
    if (hasExactCoords) {
      // Direct native turn-by-turn navigation intent in Google Maps app
      window.location.href = `google.navigation:q=${numLat},${numLng}&mode=d`;
      setTimeout(() => {
        try {
          if (!document.hidden) {
            window.open(webUrl, '_blank', 'noopener,noreferrer');
          }
        } catch {}
      }, 1200);
      return;
    }
  }

  window.open(webUrl, '_blank', 'noopener,noreferrer');
};

