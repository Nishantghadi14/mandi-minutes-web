// Firebase Cloud Messaging background service worker
// This file handles push notifications when the Mandi Minutes app is in the background or closed.
// It activates automatically once real Firebase credentials are added to .env

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Firebase config is injected at runtime from the SW query string (set during SW registration)
// For now we initialize with placeholder values — they are replaced when real keys are added
const firebaseConfig = {
  apiKey: self.__FIREBASE_API_KEY__ || '',
  authDomain: self.__FIREBASE_AUTH_DOMAIN__ || '',
  projectId: self.__FIREBASE_PROJECT_ID__ || '',
  storageBucket: self.__FIREBASE_STORAGE_BUCKET__ || '',
  messagingSenderId: self.__FIREBASE_MESSAGING_SENDER_ID__ || '',
  appId: self.__FIREBASE_APP_ID__ || '',
};

// Only initialize if the config is present
if (firebaseConfig.apiKey && !firebaseConfig.apiKey.includes('YourFirebaseApiKeyHere')) {
  firebase.initializeApp(firebaseConfig);

  const messaging = firebase.messaging();

  // Handle background FCM messages and show a notification
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Background message received:', payload);

    const { title, body, icon } = payload.notification || {};
    const notificationOptions = {
      body: body || 'You have a new update from Mandi Minutes.',
      icon: icon || '/favicon.svg',
      badge: '/favicon.svg',
      tag: 'mandi-minutes-bg',
      renotify: true,
      data: payload.data || {},
    };

    self.registration.showNotification(
      title || 'Mandi Minutes 🛒',
      notificationOptions
    );
  });
}

// Handle notification click — open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/orders';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
