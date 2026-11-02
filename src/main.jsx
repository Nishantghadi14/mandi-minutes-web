import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './i18n.js'; // Initialize i18next with en/hi/mr translations
import { isNativeApp } from './utils/platform';

// Tag document with native class for status bar and safe area insets
if (typeof document !== 'undefined' && isNativeApp()) {
  document.documentElement.classList.add('is-native-app');
  if (document.body) {
    document.body.classList.add('is-native-app');
  }
}

// Register Service Worker for PWA / offline support
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .catch(err => {
        console.warn('Service Worker registration failed:', err?.message);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
