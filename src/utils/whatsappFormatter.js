// WhatsApp Order Message Formatter for Virar Kirana Stores & Customers

export function generateWhatsAppOrderMessage(order, store) {
  const storePhone = store?.ownerPhone || '9920941603';
  const cleanPhone = String(storePhone).replace(/\D/g, '').slice(-10);

  const itemsList = (order.items || [])
    .map(i => `• ${i.quantity}x ${i.name} (${i.unit || 'unit'}) - ₹${i.price * i.quantity}`)
    .join('\n');

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mandi-minutes.vercel.app';
  const orderIdStr = String(order.id || '').toUpperCase();

  const message = `🚨 *NEW ORDER — MANDI MINUTES (VIRAR)*
----------------------------------------
📦 *Order ID:* #${orderIdStr}
🏪 *Store:* ${order.storeName || store?.name || 'Local Store'}
👤 *Customer:* ${order.address?.label || 'Customer'} (${order.address?.pincode || '401305'})
📍 *Address:* ${order.address?.line1 || 'Virar West'}, ${order.address?.city || 'Virar, Palghar'}

🛒 *ITEMS:*
${itemsList}

----------------------------------------
💰 *Total Bill:* ₹${order.total} (${order.paymentMethod || 'Paid'})
⚡ *Slot:* ${order.deliveryType === 'express' ? 'Express 10-15 Mins' : order.deliveryType || 'Standard'}

🔗 *Live Tracking:* ${origin}/order-status/${order.id}

Please pack this order for Mandi Minutes delivery rider! 🛵`;

  // Use api.whatsapp.com for best compatibility across mobile app & WhatsApp Web
  const waUrl = `https://api.whatsapp.com/send?phone=91${cleanPhone}&text=${encodeURIComponent(message)}`;
  return { message, waUrl, cleanPhone };
}

export function generateCustomerShareMessage(order) {
  const itemsSummary = (order.items || []).map(i => `${i.quantity}x ${i.name}`).join(', ');
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://mandi-minutes.vercel.app';

  const message = `🛒 *Mandi Minutes Order Receipt*
Order #${String(order.id || '').toUpperCase()} from ${order.storeName || 'Kirana Store'}
Items: ${itemsSummary}
Total Amount: ₹${order.total} (${order.paymentMethod || 'Paid'})
Status: ${order.status?.replace(/_/g, ' ').toUpperCase() || 'CONFIRMED'}

⚡ Delivered in 10-15 Mins in Virar!
📍 Track Live: ${origin}/order-status/${order.id}`;

  const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  return { message, waUrl };
}

