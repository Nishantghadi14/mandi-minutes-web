import { useState, useMemo, useRef, useEffect } from 'react';
import { 
  X, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Printer, 
  MessageCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Store, 
  Zap, 
  ShoppingBag, 
  Receipt, 
  CreditCard, 
  Smartphone, 
  Banknote, 
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  PackageCheck
} from 'lucide-react';
import LazyImage from '../common/LazyImage';

export default function LocalSaleModal({ store, products = [], categories = [], onClose, onSaleCompleted }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [billItems, setBillItems] = useState([]);
  const [discount, setDiscount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);

  // Mobile View Switcher: 'catalog' | 'bill' (on desktop, both show side-by-side)
  const [mobileTab, setMobileTab] = useState('catalog');

  // Custom Item Drawer / Form
  const [showCustomItemForm, setShowCustomItemForm] = useState(false);
  const [customItem, setCustomItem] = useState({ name: '', price: '', unit: '1 pc', quantity: 1 });
  const searchInputRef = useRef(null);

  // Auto focus search input on desktop open
  useEffect(() => {
    if (window.innerWidth >= 1024 && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Filtered store catalog
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = !searchQuery || 
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.brand?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, searchQuery, selectedCategory]);

  // Add catalog item to bill
  const handleAddItem = (prod) => {
    setBillItems(prev => {
      const existing = prev.find(item => item.productId === prod.id);
      if (existing) {
        return prev.map(item => 
          item.productId === prod.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [
        ...prev,
        {
          productId: prod.id,
          name: prod.name,
          brand: prod.brand || '',
          price: Number(prod.price) || 0,
          mrp: Number(prod.mrp) || Number(prod.price) || 0,
          unit: prod.unit || '1 unit',
          quantity: 1,
          image: prod.image || '',
          catalogStock: isNaN(Number(prod.stock)) ? 0 : Number(prod.stock),
        }
      ];
    });
  };

  // Add custom unlisted item
  const handleAddCustomItem = (e) => {
    e.preventDefault();
    if (!customItem.name.trim() || !customItem.price) return;

    const pVal = Math.max(0, parseFloat(customItem.price) || 0);
    const qVal = Math.max(1, parseInt(customItem.quantity, 10) || 1);

    setBillItems(prev => [
      ...prev,
      {
        productId: null, // Custom non-catalog item
        name: customItem.name.trim(),
        brand: 'Counter Item',
        price: pVal,
        mrp: pVal,
        unit: customItem.unit || '1 unit',
        quantity: qVal,
        image: '',
        catalogStock: null,
      }
    ]);

    setCustomItem({ name: '', price: '', unit: '1 pc', quantity: 1 });
    setShowCustomItemForm(false);
  };

  const handleUpdateQuantity = (index, delta) => {
    setBillItems(prev => {
      return prev.map((item, i) => {
        if (i !== index) return item;
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }).filter(Boolean);
    });
  };

  const handleUpdatePrice = (index, newPrice) => {
    const p = Math.max(0, parseFloat(newPrice) || 0);
    setBillItems(prev => prev.map((item, i) => i === index ? { ...item, price: p } : item));
  };

  const handleRemoveItem = (index) => {
    setBillItems(prev => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const totalItemCount = useMemo(() => {
    return billItems.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
  }, [billItems]);

  const subtotal = useMemo(() => {
    return billItems.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
  }, [billItems]);

  const discountAmount = useMemo(() => {
    const val = parseFloat(discount) || 0;
    return Math.min(subtotal, Math.max(0, val));
  }, [discount, subtotal]);

  const total = Math.max(0, subtotal - discountAmount);

  // Submit sale
  const handleCompleteSale = async () => {
    if (billItems.length === 0) return;
    setIsSubmitting(true);

    try {
      const salePayload = {
        storeId: store.id,
        storeName: store.name,
        items: billItems,
        paymentMethod,
        paymentStatus: paymentMethod === 'Khata / Due' ? 'pending' : 'paid',
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone.trim(),
        notes: notes.trim(),
        discount: discountAmount,
      };

      const completedOrder = await onSaleCompleted(salePayload);
      setCompletedSale(completedOrder || {
        ...salePayload,
        id: `sale-${Date.now()}`,
        placedAt: new Date().toISOString(),
        subtotal,
        total,
      });
    } catch (err) {
      console.error('Local sale completion failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset for next customer
  const handleResetForNextSale = () => {
    setBillItems([]);
    setDiscount('');
    setPaymentMethod('Cash');
    setCustomerName('');
    setCustomerPhone('');
    setNotes('');
    setCompletedSale(null);
    setSearchQuery('');
    setMobileTab('catalog');
  };

  // Print Receipt
  const printReceipt = () => {
    if (!completedSale) return;
    const win = window.open('', '_blank');
    const saleDate = new Date(completedSale.placedAt || Date.now()).toLocaleString('en-IN');
    
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt #${completedSale.id.slice(-6).toUpperCase()}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
            padding: 16px;
            color: #000;
            max-width: 320px;
            margin: 0 auto;
            font-size: 13px;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #777; margin: 10px 0; }
          .header { margin-bottom: 12px; }
          .store-name { font-size: 18px; font-weight: 900; }
          table { width: 100%; border-collapse: collapse; margin: 8px 0; }
          th { text-align: left; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #000; padding: 4px 0; }
          td { padding: 4px 0; font-size: 12px; }
          .total-line { font-size: 15px; font-weight: 900; }
          .footer { margin-top: 16px; font-size: 11px; color: #555; text-align: center; }
        </style>
      </head>
      <body>
        <div class="text-center header">
          <div class="store-name">${store.name}</div>
          <div>${store.address || 'Virar, Palghar'}</div>
          <div>Phone: ${store.ownerPhone || 'N/A'}</div>
          <div class="divider"></div>
          <div class="bold">RETAIL CASH MEMO / COUNTER RECEIPT</div>
          <div>Bill No: #${completedSale.id.slice(-6).toUpperCase()}</div>
          <div>Date: ${saleDate}</div>
          <div>Customer: ${completedSale.customerName || 'Walk-in'} ${completedSale.customerPhone ? `(${completedSale.customerPhone})` : ''}</div>
        </div>

        <div class="divider"></div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th class="text-center">Qty</th>
              <th class="text-right">Price</th>
              <th class="text-right">Amt</th>
            </tr>
          </thead>
          <tbody>
            ${completedSale.items.map(it => `
              <tr>
                <td>${it.name}<br/><span style="font-size:10px; color:#555;">${it.unit}</span></td>
                <td class="text-center">${it.quantity}</td>
                <td class="text-right">&#8377;${it.price}</td>
                <td class="text-right">&#8377;${it.price * it.quantity}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="divider"></div>

        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
          <span>Subtotal:</span>
          <span>&#8377;${completedSale.subtotal}</span>
        </div>
        ${completedSale.discount > 0 ? `
          <div style="display:flex; justify-content:space-between; margin-bottom:4px; color: #008000;">
            <span>Discount:</span>
            <span>-&#8377;${completedSale.discount}</span>
          </div>
        ` : ''}
        <div class="divider"></div>
        <div style="display:flex; justify-content:space-between;" class="total-line">
          <span>TOTAL PAID:</span>
          <span>&#8377;${completedSale.total}</span>
        </div>
        <div style="margin-top: 4px; font-size:11px;">
          Payment Method: <strong>${completedSale.paymentMethod}</strong>
        </div>

        <div class="divider"></div>
        <div class="footer">
          Thank you for shopping at ${store.name}!<br/>
          Powered by Mandi Minutes Local Kirana POS
        </div>
      </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  // WhatsApp Bill URL generator
  const getWhatsAppReceiptUrl = () => {
    if (!completedSale) return '#';
    const cleanPhone = (completedSale.customerPhone || '').replace(/\D/g, '');
    const phoneParam = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const itemText = completedSale.items
      .map(it => `• ${it.name} (${it.unit}) x ${it.quantity} = ₹${it.price * it.quantity}`)
      .join('\n');

    const msg = 
`🧾 *BILL RECEIPT - ${store.name.toUpperCase()}*
Receipt No: #${completedSale.id.slice(-6).toUpperCase()}
Date: ${new Date(completedSale.placedAt || Date.now()).toLocaleDateString('en-IN')}
Customer: ${completedSale.customerName || 'Valued Customer'}
----------------------------------
${itemText}
----------------------------------
*Subtotal:* ₹${completedSale.subtotal}
${completedSale.discount > 0 ? `*Discount:* -₹${completedSale.discount}\n` : ''}*TOTAL AMOUNT:* ₹${completedSale.total}
*Payment Mode:* ${completedSale.paymentMethod}

Thank you for visiting ${store.name}! 🙏
Powered by Mandi Minutes`;

    return `https://api.whatsapp.com/send?${phoneParam ? `phone=${phoneParam}&` : ''}text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="overlay flex items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-mandi-card border-0 sm:border border-mandi-border rounded-none sm:rounded-2xl w-full max-w-5xl h-[100dvh] sm:h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
        
        {/* Modal Top Header (Compact on mobile) */}
        <div className="p-3 sm:p-4 border-b border-mandi-border flex items-center justify-between bg-mandi-surface/70 flex-shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-md flex-shrink-0">
              <Zap size={20} className="text-yellow-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-mandi-text font-black text-base sm:text-xl leading-tight">Create Local Sale</h2>
                <span className="hidden sm:inline-block text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  ⚡ Live POS
                </span>
              </div>
              <p className="text-mandi-muted text-[11px] sm:text-xs">
                {store.name} • Stock Sync POS
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-mandi-surface border border-mandi-border flex items-center justify-center text-mandi-muted hover:text-mandi-text transition-all active:scale-95 flex-shrink-0"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* SALE SUCCESS SCREEN */}
        {completedSale ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-10 flex flex-col items-center justify-center text-center space-y-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-emerald-500/15 border-2 border-emerald-500 flex items-center justify-center text-mandi-green animate-bounce">
              <PackageCheck size={36} className="sm:size-11" />
            </div>

            <div className="space-y-1.5 max-w-md px-2">
              <span className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-[11px] sm:text-xs px-3 py-1 rounded-full border border-emerald-500/30">
                Receipt #{completedSale.id.slice(-6).toUpperCase()}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-mandi-text">Local Sale Completed! 🎉</h3>
              <p className="text-mandi-muted text-xs sm:text-sm">
                Recorded payment of <span className="text-mandi-green font-bold text-base">₹{completedSale.total}</span> via <span className="font-semibold text-mandi-text">{completedSale.paymentMethod}</span>.
              </p>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-2">
                <CheckCircle2 size={15} className="text-mandi-green flex-shrink-0" />
                <span>Inventory stock for <strong>{completedSale.items.length} items</strong> was automatically deducted!</span>
              </div>
            </div>

            {/* Quick Bill Summary Card */}
            <div className="w-full max-w-md bg-mandi-surface rounded-2xl p-3.5 border border-mandi-border text-left space-y-2 text-xs">
              <div className="flex justify-between font-bold text-mandi-text border-b border-mandi-border pb-2">
                <span>Customer</span>
                <span>{completedSale.customerName || 'Walk-in Customer'} {completedSale.customerPhone && `(${completedSale.customerPhone})`}</span>
              </div>
              <div className="space-y-1 py-1 max-h-36 overflow-y-auto">
                {completedSale.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-mandi-muted">
                    <span>{it.quantity}x {it.name} ({it.unit})</span>
                    <span className="text-mandi-text font-medium">₹{it.price * it.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold text-base border-t border-mandi-border pt-2 text-mandi-green">
                <span>Total Amount Paid</span>
                <span>₹{completedSale.total}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 w-full max-w-md px-2">
              <button
                type="button"
                onClick={printReceipt}
                className="btn-outline flex-1 py-2.5 px-3 text-xs font-bold flex items-center justify-center gap-1.5 hover:border-mandi-green"
              >
                <Printer size={15} /> Print Receipt
              </button>

              <a
                href={getWhatsAppReceiptUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#25D366] hover:bg-opacity-90 text-black font-bold py-2.5 px-3 rounded-xl text-xs flex-1 flex items-center justify-center gap-1.5 transition-all shadow-sm"
              >
                <MessageCircle size={15} /> WhatsApp Bill
              </a>
            </div>

            <div className="flex items-center gap-2.5 w-full max-w-md px-2 pt-1">
              <button
                type="button"
                onClick={handleResetForNextSale}
                className="btn-primary w-full py-3 text-xs sm:text-sm font-black flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Bill Next Customer
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-outline py-3 px-4 text-xs sm:text-sm font-bold"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* ACTIVE BILLING INTERFACE */
          <div className="flex-1 overflow-hidden flex flex-col">

            {/* MOBILE ONLY: Segmented View Switcher Tabs (< lg screens) */}
            <div className="lg:hidden p-2 bg-mandi-surface/80 border-b border-mandi-border flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setMobileTab('catalog')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  mobileTab === 'catalog'
                    ? 'bg-mandi-green text-black shadow-md'
                    : 'bg-mandi-card text-mandi-muted border border-mandi-border'
                }`}
              >
                <ShoppingBag size={14} />
                <span>Catalog ({products.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileTab('bill')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  mobileTab === 'bill'
                    ? 'bg-mandi-green text-black shadow-md'
                    : 'bg-mandi-card text-mandi-muted border border-mandi-border'
                }`}
              >
                <Receipt size={14} />
                <span>Current Bill</span>
                {billItems.length > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    mobileTab === 'bill' ? 'bg-black text-mandi-green' : 'bg-mandi-green text-black'
                  }`}>
                    {totalItemCount} • ₹{total}
                  </span>
                )}
              </button>
            </div>

            {/* Split Grid (Desktop: 2 columns | Mobile: single active tab view) */}
            <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-mandi-border">
              
              {/* LEFT COLUMN: Catalog Picker (7 cols on desktop | full-height on mobile when tab === 'catalog') */}
              <div className={`lg:col-span-7 flex-col h-full overflow-hidden bg-mandi-surface/30 ${
                mobileTab === 'catalog' ? 'flex' : 'hidden lg:flex'
              }`}>
                
                {/* Search & Category Filter Toolbar */}
                <div className="p-3 sm:p-4 border-b border-mandi-border space-y-2.5 flex-shrink-0 bg-mandi-card">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-mandi-subtle" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search items by name or brand..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="input-field pl-9 text-xs sm:text-sm w-full py-2"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-mandi-subtle hover:text-mandi-text text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowCustomItemForm(prev => !prev)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 whitespace-nowrap ${
                        showCustomItemForm 
                          ? 'bg-amber-500/20 text-amber-500 border-amber-500/40' 
                          : 'bg-mandi-surface border-mandi-border text-mandi-text hover:border-mandi-green'
                      }`}
                    >
                      <Plus size={14} /> Custom Item
                    </button>
                  </div>

                  {/* Inline Quick Custom Item Form */}
                  {showCustomItemForm && (
                    <form onSubmit={handleAddCustomItem} className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2.5 animate-fade-in text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <Sparkles size={13} /> Add Non-Catalog Counter Item
                        </span>
                        <button 
                          type="button" 
                          onClick={() => setShowCustomItemForm(false)} 
                          className="text-mandi-subtle hover:text-mandi-text"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="grid grid-cols-12 gap-2">
                        <input
                          required
                          type="text"
                          placeholder="Item Name (e.g. Loose Sugar)"
                          value={customItem.name}
                          onChange={e => setCustomItem(f => ({ ...f, name: e.target.value }))}
                          className="input-field col-span-12 sm:col-span-5 text-xs py-1.5 px-2.5"
                        />
                        <input
                          required
                          type="number"
                          inputMode="decimal"
                          min="1"
                          step="0.5"
                          placeholder="Price ₹"
                          value={customItem.price}
                          onChange={e => setCustomItem(f => ({ ...f, price: e.target.value }))}
                          className="input-field col-span-5 sm:col-span-3 text-xs py-1.5 px-2.5 font-bold text-mandi-green"
                        />
                        <input
                          type="text"
                          placeholder="Unit (500g, 1 pc)"
                          value={customItem.unit}
                          onChange={e => setCustomItem(f => ({ ...f, unit: e.target.value }))}
                          className="input-field col-span-4 sm:col-span-2 text-xs py-1.5 px-2"
                        />
                        <button
                          type="submit"
                          className="btn-primary col-span-3 sm:col-span-2 text-xs py-1.5 px-2 font-bold"
                        >
                          Add
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Category Pills */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('all')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                        selectedCategory === 'all'
                          ? 'bg-mandi-green text-black font-bold'
                          : 'bg-mandi-surface text-mandi-muted hover:text-mandi-text border border-mandi-border'
                      }`}
                    >
                      All ({products.length})
                    </button>
                    {categories.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCategory(c.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                          selectedCategory === c.id
                            ? 'bg-mandi-green text-black font-bold'
                            : 'bg-mandi-surface text-mandi-muted hover:text-mandi-text border border-mandi-border'
                        }`}
                      >
                        {c.icon} {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Products Grid (Generous scrolling area) */}
                <div className="flex-1 overflow-y-auto p-2.5 sm:p-4">
                  {filteredProducts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 text-mandi-muted">
                      <ShoppingBag size={40} className="text-mandi-subtle" />
                      <p className="text-sm font-semibold">No products found matching &ldquo;{searchQuery}&rdquo;</p>
                      <p className="text-xs text-mandi-subtle max-w-xs">
                        Try another keyword or click &ldquo;+ Custom Item&rdquo; above to bill an uncataloged product.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5 pb-20 lg:pb-0">
                      {filteredProducts.map(prod => {
                        const inCart = billItems.find(it => it.productId === prod.id);
                        const currentStock = Number(prod.stock) || 0;
                        const isLowStock = currentStock <= 5 && currentStock > 0;
                        const isOutOfStock = currentStock <= 0;

                        return (
                          <div
                            key={prod.id}
                            onClick={() => handleAddItem(prod)}
                            className={`card p-2 sm:p-2.5 flex flex-col justify-between cursor-pointer transition-all hover:border-mandi-green active:scale-[0.98] select-none ${
                              inCart ? 'ring-2 ring-mandi-green bg-mandi-green/5' : ''
                            }`}
                          >
                            <div>
                              <div className="relative w-full h-20 sm:h-24 rounded-lg overflow-hidden bg-mandi-surface mb-1.5 sm:mb-2 border border-mandi-border">
                                <LazyImage
                                  src={prod.image}
                                  alt={prod.name}
                                  className="w-full h-full object-cover"
                                  containerClass="w-full h-full"
                                />
                                {inCart && (
                                  <span className="absolute top-1 right-1 bg-mandi-green text-black font-black text-[10px] px-1.5 py-0.5 rounded-md shadow-md">
                                    {inCart.quantity} in bill
                                  </span>
                                )}
                                <span className={`absolute bottom-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm ${
                                  isOutOfStock 
                                    ? 'bg-red-600 text-white' 
                                    : isLowStock 
                                      ? 'bg-amber-500 text-black' 
                                      : 'bg-black/70 text-white backdrop-blur-sm'
                                }`}>
                                  {isOutOfStock ? '0 stock' : `${currentStock} ${prod.unit || ''}`}
                                </span>
                              </div>

                              <h4 className="text-mandi-text font-bold text-xs line-clamp-1">{prod.name}</h4>
                              <p className="text-mandi-subtle text-[11px] truncate">{prod.brand || prod.unit}</p>
                            </div>

                            <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-mandi-border/60">
                              <div>
                                <span className="text-mandi-green font-black text-xs sm:text-sm">₹{prod.price}</span>
                                {prod.mrp && prod.mrp > prod.price && (
                                  <span className="text-mandi-subtle line-through text-[10px] ml-1">₹{prod.mrp}</span>
                                )}
                              </div>
                              <button
                                type="button"
                                className={`p-1 sm:p-1.5 rounded-md text-xs font-bold flex items-center justify-center transition-all ${
                                  inCart 
                                    ? 'bg-mandi-green text-black shadow-sm' 
                                    : 'bg-mandi-surface border border-mandi-border text-mandi-text hover:bg-mandi-green hover:text-black'
                                }`}
                                title="Add to bill"
                              >
                                <Plus size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* MOBILE ONLY: Sticky Floating Bar when items are selected */}
                {mobileTab === 'catalog' && billItems.length > 0 && (
                  <div className="lg:hidden p-3 border-t border-mandi-border bg-mandi-card shadow-2xl flex items-center justify-between gap-3 flex-shrink-0 animate-fade-in">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-mandi-green/20 text-mandi-green flex items-center justify-center font-black">
                        <Receipt size={17} />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-mandi-muted">{totalItemCount} {totalItemCount === 1 ? 'item' : 'items'} in bill</span>
                        <p className="text-base font-black text-mandi-green leading-none">₹{total}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMobileTab('bill')}
                      className="btn-primary py-2.5 px-4 text-xs font-black flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
                    >
                      Review Bill & Pay <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: Live Bill & Checkout (5 cols on desktop | full-height on mobile when tab === 'bill') */}
              <div className={`lg:col-span-5 flex-col h-full overflow-hidden bg-mandi-card ${
                mobileTab === 'bill' ? 'flex' : 'hidden lg:flex'
              }`}>
                
                {/* Mobile Back-to-Catalog Banner */}
                <div className="lg:hidden p-2.5 bg-mandi-surface/70 border-b border-mandi-border flex items-center justify-between flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setMobileTab('catalog')}
                    className="text-xs font-bold text-mandi-green hover:underline flex items-center gap-1 py-0.5 active:scale-95"
                  >
                    <ArrowLeft size={14} /> Add more items from catalog
                  </button>
                  <span className="text-xs text-mandi-muted font-medium">
                    {billItems.length} {billItems.length === 1 ? 'variety' : 'varieties'}
                  </span>
                </div>

                {/* Bill Desktop Header */}
                <div className="p-3 sm:p-4 border-b border-mandi-border hidden lg:flex items-center justify-between flex-shrink-0 bg-mandi-surface/40">
                  <div className="flex items-center gap-2">
                    <Receipt size={18} className="text-mandi-green" />
                    <span className="font-bold text-mandi-text text-sm sm:text-base">Current Bill Items</span>
                    <span className="badge-green text-xs font-mono font-bold">
                      {billItems.length}
                    </span>
                  </div>
                  {billItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setBillItems([])}
                      className="text-xs text-red-500 hover:text-red-400 font-semibold"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {/* Items List (Smooth scrolling) */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
                  {billItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-mandi-muted">
                      <Store size={36} className="text-mandi-subtle stroke-1" />
                      <p className="text-xs sm:text-sm font-semibold text-mandi-text">No items in bill yet</p>
                      <p className="text-xs text-mandi-subtle max-w-xs">
                        Select products from the catalog or add a custom item to start billing.
                      </p>
                      <button
                        type="button"
                        onClick={() => setMobileTab('catalog')}
                        className="btn-outline text-xs py-2 px-3 lg:hidden mt-2"
                      >
                        ← Browse Catalog
                      </button>
                    </div>
                  ) : (
                    billItems.map((item, idx) => {
                      const isExceedingStock = item.catalogStock !== null && item.quantity > item.catalogStock;

                      return (
                        <div 
                          key={idx} 
                          className="p-2.5 sm:p-3 rounded-xl bg-mandi-surface border border-mandi-border space-y-2 text-xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h5 className="font-bold text-mandi-text text-xs sm:text-sm leading-tight">{item.name}</h5>
                              <p className="text-mandi-subtle text-[11px]">{item.unit}</p>
                              {isExceedingStock && (
                                <p className="text-amber-500 text-[10px] font-semibold flex items-center gap-1 mt-0.5">
                                  <AlertTriangle size={11} /> Only {item.catalogStock} recorded in stock
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-mandi-subtle hover:text-red-400 p-1 active:scale-95"
                              title="Remove item"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between pt-1.5 border-t border-mandi-border/60">
                            {/* Inline Rate Input */}
                            <div className="flex items-center gap-1">
                              <span className="text-mandi-muted text-[11px]">Rate: ₹</span>
                              <input
                                type="number"
                                inputMode="decimal"
                                min="0"
                                step="0.5"
                                value={item.price}
                                onChange={e => handleUpdatePrice(idx, e.target.value)}
                                className="w-16 input-field py-1 px-1.5 text-xs font-bold text-mandi-green"
                                title="Edit rate per unit"
                              />
                            </div>

                            {/* Quantity Stepper */}
                            <div className="flex items-center gap-1.5 bg-mandi-card border border-mandi-border rounded-lg p-0.5">
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(idx, -1)}
                                className="w-7 h-7 rounded bg-mandi-surface flex items-center justify-center text-mandi-muted hover:text-red-400 active:scale-95"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="w-7 text-center font-bold text-mandi-text text-xs">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(idx, 1)}
                                className="w-7 h-7 rounded bg-mandi-surface flex items-center justify-center text-mandi-muted hover:text-mandi-green active:scale-95"
                              >
                                <Plus size={12} />
                              </button>
                            </div>

                            {/* Line Total */}
                            <div className="text-right">
                              <span className="font-black text-mandi-text text-sm">
                                ₹{item.price * item.quantity}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Checkout Controls Footer (Spacious & Clean Layout) */}
                <div className="p-3 sm:p-4 border-t border-mandi-border bg-mandi-surface/60 space-y-3 flex-shrink-0">
                  
                  {/* Payment Method Selector */}
                  <div>
                    <label className="block text-[11px] font-semibold text-mandi-muted mb-1.5">
                      Payment Method *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {[
                        { id: 'Cash', icon: Banknote },
                        { id: 'UPI', icon: Smartphone },
                        { id: 'Card', icon: CreditCard },
                        { id: 'Khata / Due', icon: BookOpen },
                      ].map(pm => {
                        const Icon = pm.icon;
                        const active = paymentMethod === pm.id;
                        return (
                          <button
                            key={pm.id}
                            type="button"
                            onClick={() => setPaymentMethod(pm.id)}
                            className={`py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                              active
                                ? 'bg-mandi-green text-black border-mandi-green shadow-sm'
                                : 'bg-mandi-card border-mandi-border text-mandi-muted hover:text-mandi-text'
                            }`}
                          >
                            <Icon size={14} />
                            <span className="truncate">{pm.id}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Customer Details & Discount (Clean 2-row layout without cramped fields) */}
                  <div className="space-y-2 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-mandi-muted mb-0.5">Customer Name (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Walk-in Guest"
                          value={customerName}
                          onChange={e => setCustomerName(e.target.value)}
                          className="input-field text-xs py-1.5 px-2.5 w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-mandi-muted mb-0.5">Mobile (WhatsApp Bill)</label>
                        <input
                          type="tel"
                          inputMode="numeric"
                          placeholder="10-digit mobile"
                          value={customerPhone}
                          onChange={e => setCustomerPhone(e.target.value)}
                          className="input-field text-xs py-1.5 px-2.5 w-full"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-mandi-muted mb-0.5">Instant Discount (₹)</label>
                        <input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          placeholder="0"
                          value={discount}
                          onChange={e => setDiscount(e.target.value)}
                          className="input-field text-xs py-1.5 px-2.5 w-full font-bold text-mandi-green"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-mandi-muted mb-0.5">Notes (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Regular customer"
                          value={notes}
                          onChange={e => setNotes(e.target.value)}
                          className="input-field text-xs py-1.5 px-2.5 w-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Subtotal, Discount & Total Summary */}
                  <div className="space-y-1 pt-1.5 border-t border-mandi-border/60 text-xs">
                    <div className="flex justify-between text-mandi-muted">
                      <span>Subtotal:</span>
                      <span>₹{subtotal}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-mandi-green font-semibold">
                        <span>Discount:</span>
                        <span>-₹{discountAmount}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-sm font-black pt-1">
                      <span className="text-mandi-text">Grand Total:</span>
                      <span className="text-xl sm:text-2xl text-mandi-green font-black">₹{total}</span>
                    </div>
                  </div>

                  {/* Complete Sale Button */}
                  <button
                    type="button"
                    disabled={billItems.length === 0 || isSubmitting}
                    onClick={handleCompleteSale}
                    className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-lg transition-all ${
                      billItems.length === 0 || isSubmitting
                        ? 'bg-mandi-surface text-mandi-subtle border border-mandi-border cursor-not-allowed'
                        : 'btn-primary bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-500 text-white hover:scale-[1.01] active:scale-[0.98]'
                    }`}
                  >
                    {isSubmitting ? (
                      'Recording Sale & Deducting Stock...'
                    ) : (
                      <>
                        <Zap size={16} className="text-yellow-300" />
                        Complete Sale & Deduct Stock • ₹{total}
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
