import { useCallback, useEffect, useRef } from 'react';
import { requestNotificationPermission } from '../config/firebase';

const APP_ICON = '/favicon.svg';

const STATUS_MESSAGES = {
  accepted:         { title: '✅ Order Accepted!',        body: 'Your kirana store has confirmed your order.' },
  preparing:        { title: '📦 Order Being Packed',     body: 'Your items are being packed right now.' },
  out_for_delivery: { title: '🛵 Rider is on the Way!',   body: 'Your order is out for delivery. ~10-15 mins.' },
  delivered:        { title: '🎉 Order Delivered!',       body: 'Enjoy your groceries! Rate your experience.' },
};

function showNotification(title, body, tag = 'mandi-update') {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    new Notification(title, {
      body,
      icon: APP_ICON,
      badge: APP_ICON,
      tag,
      renotify: true,
    });
  } catch (err) {
    console.warn('Notification failed:', err);
  }
}

/**
 * useNotifications — manages browser notification permission and fires
 * order lifecycle notifications. Works immediately without Firebase keys.
 * FCM (background push) activates automatically once real Firebase credentials
 * are added to .env.
 */
export function useNotifications() {
  const permissionRequested = useRef(false);

  // Request permission once on first use (non-blocking)
  const requestPermission = useCallback(async () => {
    if (permissionRequested.current) return Notification.permission === 'granted';
    permissionRequested.current = true;
    await requestNotificationPermission();
    return Notification.permission === 'granted';
  }, []);

  /**
   * Fire an "Order Placed" browser notification.
   * @param {object} order - the newly created order object
   */
  const notifyOrderPlaced = useCallback(async (order) => {
    await requestPermission();
    const total = order?.total ? `₹${order.total}` : '';
    showNotification(
      '🛒 Order Placed Successfully!',
      `Your order ${total ? `worth ${total} ` : ''}from ${order?.storeName || 'kirana store'} has been placed. Estimated delivery: 10-15 mins.`,
      `order-placed-${order?.id}`
    );
  }, [requestPermission]);

  /**
   * Fire a status-update browser notification.
   * @param {string} statusKey - one of: accepted, preparing, out_for_delivery, delivered
   * @param {string} orderId - order ID for notification deduplication
   */
  const notifyStatusUpdate = useCallback(async (statusKey, orderId) => {
    const msg = STATUS_MESSAGES[statusKey];
    if (!msg) return;
    await requestPermission();
    showNotification(msg.title, msg.body, `order-status-${orderId}-${statusKey}`);
  }, [requestPermission]);

  return { requestPermission, notifyOrderPlaced, notifyStatusUpdate };
}
