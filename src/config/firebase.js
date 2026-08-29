import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if valid Firebase configuration is provided
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  !firebaseConfig.apiKey.includes('YourFirebaseApiKeyHere') &&
  !firebaseConfig.apiKey.includes('...') &&
  !firebaseConfig.projectId.includes('your-project')
);

let app = null;
let db = null;
let auth = null;
let messaging = null;

if (isFirebaseConfigured) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app);
    auth = getAuth(app);

    // Initialize Firebase Cloud Messaging (browser only)
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        messaging = getMessaging(app);

        // Show browser notification for foreground FCM messages
        onMessage(messaging, (payload) => {
          const { title, body, icon } = payload.notification || {};
          if (Notification.permission === 'granted') {
            new Notification(title || 'Mandi Minutes', {
              body: body || 'You have a new update.',
              icon: icon || '/favicon.svg',
              badge: '/favicon.svg',
              tag: 'mandi-minutes-fcm',
            });
          }
        });

        console.log('🔥 Firebase + FCM initialized successfully for Virar Region');
      } catch (msgErr) {
        console.warn('Firebase Messaging init failed (non-fatal):', msgErr);
      }
    }
  } catch (err) {
    console.warn('Firebase initialization error:', err);
  }
} else {
  console.info('ℹ️ Firebase not configured — using local data and browser notifications.');
}

/**
 * Request browser notification permission and retrieve the FCM token.
 * Returns the FCM token string, or null if permission denied / FCM not configured.
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return null;

  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }
  if (permission !== 'granted') return null;

  if (!messaging) return null; // FCM not configured — browser-only notifications still work

  try {
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.ready,
    });
    console.log('FCM registration token:', token);
    return token;
  } catch (err) {
    console.warn('Could not retrieve FCM token:', err);
    return null;
  }
}

export { app, db, auth, messaging };

