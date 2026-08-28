import { X, Printer } from 'lucide-react';

export default function InvoiceModal({ order, onClose }) {
  if (!order) return null;

  const printInvoice = () => {
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Invoice #${order.id}</title><style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
        .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px; border-bottom: 2px solid #00C851; margin-bottom: 20px; }
        .logo { font-size: 22px; font-weight: 900; color: #00C851; }
        .title { font-size: 16px; font-weight: 600; color: #555; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        th { background: #00C851; color: white; padding: 8px 12px; text-align: left; font-size: 13px; }
        td { padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 13px; }
        .total-row { font-weight: bold; background: #f5f5f5; }
        .footer { margin-top: 20px; font-size: 12px; color: #777; text-align: center; }
      </style></head><body>
        <div class="header"><div class="logo">⚡ Mandi Minutes</div><div class="title">INVOICE #${order.id.toUpperCase()}</div></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
          <div><strong>Store:</strong> ${order.storeName}<br/><strong>Date:</strong> ${new Date(order.placedAt).toLocaleDateString('en-IN')}</div>
          <div><strong>Delivery To:</strong> ${order.address?.line1}<br/>${order.address?.city} - ${order.address?.pincode}<br/><strong>Payment:</strong> ${order.paymentMethod}</div>
        </div>
        <table>
          <thead><tr><th>Item</th><th>Unit</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
          <tbody>
            ${order.items.map(i => `<tr><td>${i.name}</td><td>${i.unit}</td><td>${i.quantity}</td><td>&#8377;${i.price}</td><td>&#8377;${i.price * i.quantity}</td></tr>`).join('')}
            <tr class="total-row"><td colspan="4">Subtotal</td><td>&#8377;${order.subtotal}</td></tr>
            <tr class="total-row"><td colspan="4">Delivery</td><td>${order.deliveryCharge === 0 ? 'FREE' : '&#8377;' + order.deliveryCharge}</td></tr>
            <tr class="total-row"><td colspan="4"><strong>Total</strong></td><td><strong>&#8377;${order.total}</strong></td></tr>
          </tbody>
        </table>
        <div class="footer">Thank you for shopping with Mandi Minutes! | www.mandiminutes.com</div>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div className="overlay flex items-center justify-center p-4">
      <div className="bg-mandi-card border border-mandi-border rounded-2xl p-6 w-full max-w-lg animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-mandi-text font-bold text-lg">Invoice #{order.id.toUpperCase()}</h2>
          <div className="flex items-center gap-2">
            <button onClick={printInvoice} className="btn-primary py-2 px-3 text-sm flex items-center gap-1.5"><Printer size={14} />Print</button>
            <button onClick={onClose} className="text-mandi-subtle hover:text-mandi-text"><X size={20} /></button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div><p className="text-mandi-muted text-xs">Store</p><p className="text-mandi-text font-medium">{order.storeName}</p></div>
          <div><p className="text-mandi-muted text-xs">Date</p><p className="text-mandi-text font-medium">{new Date(order.placedAt).toLocaleDateString('en-IN')}</p></div>
          <div><p className="text-mandi-muted text-xs">Delivery Address</p><p className="text-mandi-text font-medium">{order.address?.line1}, {order.address?.city}</p></div>
          <div><p className="text-mandi-muted text-xs">Payment</p><p className="text-mandi-text font-medium">{order.paymentMethod}</p></div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-mandi-border"><th className="text-left text-mandi-muted font-medium py-2">Item</th><th className="text-right text-mandi-muted font-medium py-2">Qty</th><th className="text-right text-mandi-muted font-medium py-2">Price</th><th className="text-right text-mandi-muted font-medium py-2">Total</th></tr></thead>
            <tbody>
              {order.items.map((item, i) => (
                <tr key={i} className="border-b border-mandi-border">
                  <td className="py-2 text-mandi-text">{item.name}<br /><span className="text-mandi-muted text-xs">{item.unit}</span></td>
                  <td className="py-2 text-right text-mandi-muted">{item.quantity}</td>
                  <td className="py-2 text-right text-mandi-text">₹{item.price}</td>
                  <td className="py-2 text-right text-mandi-text font-medium">₹{item.price * item.quantity}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr><td colSpan="3" className="py-2 text-mandi-muted">Subtotal</td><td className="py-2 text-right text-mandi-text">₹{order.subtotal}</td></tr>
              <tr><td colSpan="3" className="py-2 text-mandi-muted">Delivery</td><td className="py-2 text-right text-mandi-green">{order.deliveryCharge === 0 ? 'FREE' : `₹${order.deliveryCharge}`}</td></tr>
              <tr className="border-t border-mandi-border"><td colSpan="3" className="py-2 text-mandi-text font-bold">Total</td><td className="py-2 text-right text-mandi-text font-bold text-lg">₹{order.total}</td></tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
