import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useToast } from '../components/common/Toast';
import LazyImage from '../components/common/LazyImage';
import ImageUploadField from '../components/common/ImageUploadField';
import { isFirebaseConfigured } from '../config/firebase';
import {
  Shield, Store, Megaphone, HelpCircle, Check, X, Plus, Trash2, RefreshCw,
  ShieldAlert, Activity, TrendingUp, Database, XCircle, Search,
  Users, Tag, Ban, RotateCcw,
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

// ── Cancellation Reason Options ───────────────────────────────────────────────
const CANCEL_REASONS = [
  'Customer Request',
  'Out of Stock',
  'Fraud Suspected',
  'Store Unavailable',
  'Duplicate Order',
  'Other',
];

// ── Cancel Order Modal ────────────────────────────────────────────────────────
function CancelOrderModal({ order, onConfirm, onClose }) {
  const [reason, setReason] = useState('Customer Request');
  const [notes, setNotes] = useState('');
  const [refundStatus, setRefundStatus] = useState(
    order?.paymentMethod?.toLowerCase().includes('cash') ? 'none' : 'pending'
  );

  const REFUND_OPTS = [
    { value: 'none',    label: 'No Refund',     sub: 'COD order' },
    { value: 'pending', label: 'Refund Pending', sub: 'Processing' },
    { value: 'issued',  label: 'Refund Issued',  sub: 'Completed' },
  ];

  return (
    <div className="overlay flex items-center justify-center p-4 z-50">
      <div className="bg-mandi-card border border-red-500/30 rounded-2xl p-6 w-full max-w-md animate-scale-in shadow-2xl">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-11 h-11 bg-red-950 rounded-xl flex items-center justify-center flex-shrink-0">
            <XCircle size={22} className="text-red-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-mandi-text font-bold text-lg">Cancel Order</h2>
            <p className="text-mandi-muted text-xs">
              #{order?.id?.slice(-8)?.toUpperCase()} &nbsp;&middot;&nbsp; &#x20b9;{order?.total} &nbsp;&middot;&nbsp; {order?.storeName || 'Local Store'}
            </p>
          </div>
          <button onClick={onClose} className="text-mandi-subtle hover:text-mandi-text p-1"><X size={18} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-mandi-muted text-xs font-medium mb-1.5">Cancellation Reason *</label>
            <select value={reason} onChange={e => setReason(e.target.value)} className="input-field text-sm w-full">
              {CANCEL_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-mandi-muted text-xs font-medium mb-1.5">Admin Notes <span className="text-mandi-subtle">(optional)</span></label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Internal notes about this cancellation..." rows={3} className="input-field text-sm w-full resize-none" />
          </div>

          <div>
            <label className="block text-mandi-muted text-xs font-medium mb-1.5">Refund Status</label>
            <div className="grid grid-cols-3 gap-2">
              {REFUND_OPTS.map(opt => (
                <button key={opt.value} type="button" onClick={() => setRefundStatus(opt.value)}
                  className={`py-2 px-2 rounded-xl text-center border transition-all ${refundStatus === opt.value ? 'border-mandi-green bg-mandi-green/10 text-mandi-green' : 'border-mandi-border bg-mandi-surface text-mandi-muted hover:border-mandi-green/40'}`}>
                  <p className="text-xs font-bold leading-tight">{opt.label}</p>
                  <p className="text-[10px] opacity-70 mt-0.5">{opt.sub}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={() => onConfirm({ reason, notes, refundStatus })}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2">
              <XCircle size={16} /> Confirm Cancellation
            </button>
            <button onClick={onClose} className="py-2.5 px-4 bg-mandi-surface text-mandi-muted hover:text-mandi-text border border-mandi-border rounded-xl text-sm transition-all">
              Keep Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Admin Panel ──────────────────────────────────────────────────────────
export default function AdminPanel() {
  const {
    stores, addStore, updateStore, deleteStore,
    products, deleteProduct,
    orders, updateOrderStatus,
    banners, addBanner, deleteBanner,
    tickets, resolveTicket,
    retryFetch, loadingStates, errorStates,
  } = useData();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('orders');
  const [showAddStoreModal, setShowAddStoreModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Cancellation
  const [cancelModal, setCancelModal] = useState(null);
  const [cancellationDetails, setCancellationDetails] = useState({});

  // Order filters
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState('all');
  const [orderDateFilter, setOrderDateFilter] = useState('all');

  // Coupons
  const [coupons, setCoupons] = useState([
    { id: 'coup1', code: 'WELCOME50', type: 'percent', value: 50, cap: 100, minOrder: 99,  expiry: '2026-12-31', uses: 0,  active: true },
    { id: 'coup2', code: 'FLAT30',    type: 'flat',    value: 30, cap: 30,  minOrder: 149, expiry: '2026-10-31', uses: 12, active: true },
  ]);
  const [newCoupon, setNewCoupon] = useState({ code: '', type: 'percent', value: 10, cap: 100, minOrder: 99, expiry: '' });
  const [showCouponForm, setShowCouponForm] = useState(false);

  // Users
  const [bannedUsers, setBannedUsers] = useState({});

  // Store / Banner forms
  const [newStore, setNewStore] = useState({ name: '', ownerName: '', ownerEmail: '', ownerPhone: '', address: '', city: 'Virar, Palghar', pincodes: '401305, 401303', deliveryTime: '15-20 min', minOrder: 99, image: '', coverImage: '' });
  const [newBannerTitle, setNewBannerTitle] = useState('');
  const [newBannerSub, setNewBannerSub] = useState('');
  const [replyText, setReplyText] = useState({});

  // Handlers
  const handleRefresh = async () => {
    setRefreshing(true);
    try { retryFetch('orders'); addToast('Real-time database sync refreshed!', 'success'); }
    finally { setTimeout(() => setRefreshing(false), 600); }
  };

  const handleCancelOrder = (order, { reason, notes, refundStatus }) => {
    updateOrderStatus(order.id, 'cancelled');
    setCancellationDetails(prev => ({ ...prev, [order.id]: { reason, notes, refundStatus, cancelledAt: new Date().toISOString() } }));
    setCancelModal(null);
    addToast(`Order #${order.id.slice(-6).toUpperCase()} cancelled — ${reason}`, 'error');
  };

  const handleCreateStore = (e) => {
    e.preventDefault();
    if (!newStore.name || !newStore.ownerName) { addToast('Store name and owner name are required', 'error'); return; }
    addStore({ ...newStore, pincodes: newStore.pincodes.split(',').map(p => p.trim()) });
    addToast(`Store "${newStore.name}" created and approved!`, 'success');
    setShowAddStoreModal(false);
    setNewStore({ name: '', ownerName: '', ownerEmail: '', ownerPhone: '', address: '', city: 'Virar, Palghar', pincodes: '401305, 401303', deliveryTime: '15-20 min', minOrder: 99, image: '', coverImage: '' });
  };

  const handleDeleteStore = (storeId, storeName) => {
    if (window.confirm(`Remove ${storeName}? This cannot be undone.`)) {
      deleteStore(storeId);
      addToast(`Store "${storeName}" removed`, 'info');
    }
  };

  const handleCreateBanner = (e) => {
    e.preventDefault();
    if (!newBannerTitle.trim()) return;
    addBanner({ title: newBannerTitle, subtitle: newBannerSub, color: 'from-green-900 to-mandi-dark' });
    setNewBannerTitle(''); setNewBannerSub('');
    addToast('Promo banner published!', 'success');
  };

  const handleCreateCoupon = (e) => {
    e.preventDefault();
    if (!newCoupon.code.trim()) { addToast('Enter a coupon code', 'error'); return; }
    setCoupons(prev => [...prev, { ...newCoupon, code: newCoupon.code.toUpperCase(), id: 'coup' + Date.now(), uses: 0, active: true }]);
    setNewCoupon({ code: '', type: 'percent', value: 10, cap: 100, minOrder: 99, expiry: '' });
    setShowCouponForm(false);
    addToast(`Coupon "${newCoupon.code.toUpperCase()}" created!`, 'success');
  };

  // KPIs
  const completedOrders  = useMemo(() => orders.filter(o => o.status === 'delivered'), [orders]);
  const cancelledOrders  = useMemo(() => orders.filter(o => o.status === 'cancelled'), [orders]);
  const totalGMV         = useMemo(() => completedOrders.reduce((s, o) => s + (o.total || 0), 0), [completedOrders]);
  const aov              = completedOrders.length > 0 ? Math.round(totalGMV / completedOrders.length) : 0;
  const activeStores     = useMemo(() => stores.filter(s => s.status === 'approved'), [stores]);
  const pendingVendors   = stores.filter(s => s.status === 'pending').length;
  const cancellationRate = orders.length > 0 ? Math.round((cancelledOrders.length / orders.length) * 100) : 0;

  // Chart
  const dailyOrderChart = useMemo(() => {
    const map = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      map[label] = { date: label, orders: 0, gmv: 0 };
    }
    orders.forEach(o => {
      const ts = o.placedAt ? new Date(o.placedAt) : null;
      if (!ts) return;
      const diffDays = Math.floor((now - ts) / 86400000);
      if (diffDays > 29 || diffDays < 0) return;
      const label = ts.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      if (map[label]) { map[label].orders += 1; if (o.status === 'delivered') map[label].gmv += (o.total || 0); }
    });
    return Object.values(map);
  }, [orders]);

  // Vendor Performance
  const vendorPerformance = useMemo(() => {
    const map = {};
    stores.forEach(s => { map[s.id] = { id: s.id, name: s.name, ordersCount: 0, gmv: 0, rating: s.rating || 0, delayedCount: 0 }; });
    const now = Date.now();
    orders.forEach(o => {
      if (map[o.storeId]) {
        map[o.storeId].ordersCount += 1;
        if (o.status === 'delivered') map[o.storeId].gmv += (o.total || 0);
        if (['placed', 'accepted'].includes(o.status)) {
          const age = (now - new Date(o.placedAt || 0).getTime()) / 60000;
          if (age > 10) map[o.storeId].delayedCount += 1;
        }
      }
    });
    return Object.values(map).sort((a, b) => b.gmv - a.gmv);
  }, [stores, orders]);

  const highRiskOrders = useMemo(() => orders.filter(o => {
    const isHighCod  = o.paymentMethod === 'Cash on Delivery' && o.total >= 1500;
    const isManyItems = (o.items || []).length >= 10;
    return isHighCod || isManyItems;
  }), [orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter(o => {
      const q = orderSearch.toLowerCase();
      if (q && !o.id.toLowerCase().includes(q) && !(o.customerName || '').toLowerCase().includes(q) && !(o.customerPhone || '').includes(q)) return false;
      if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) return false;
      if (orderPaymentFilter === 'cod' && !o.paymentMethod?.toLowerCase().includes('cash')) return false;
      if (orderPaymentFilter === 'upi' && !o.paymentMethod?.toLowerCase().includes('upi')) return false;
      if (orderDateFilter !== 'all' && o.placedAt) {
        const diffDays = Math.floor((now - new Date(o.placedAt)) / 86400000);
        if (orderDateFilter === 'today'  && diffDays > 0)  return false;
        if (orderDateFilter === '7days'  && diffDays > 7)  return false;
        if (orderDateFilter === '30days' && diffDays > 30) return false;
      }
      return true;
    });
  }, [orders, orderSearch, orderStatusFilter, orderPaymentFilter, orderDateFilter]);

  // Customers
  const customerList = useMemo(() => {
    const map = {};
    orders.forEach(o => {
      const key = o.customerEmail || o.customerPhone || o.customerName || 'unknown';
      if (!map[key]) map[key] = { name: o.customerName || 'Customer', email: o.customerEmail || '—', phone: o.customerPhone || '—', orders: 0, totalSpent: 0, lastOrder: null };
      map[key].orders += 1;
      if (o.status === 'delivered') map[key].totalSpent += (o.total || 0);
      const ts = o.placedAt ? new Date(o.placedAt) : null;
      if (ts && (!map[key].lastOrder || ts > map[key].lastOrder)) map[key].lastOrder = ts;
    });
    return Object.values(map).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  // Helpers
  const statusColor = (s) => ({
    delivered:        'bg-mandi-green-muted text-mandi-green',
    cancelled:        'bg-red-950 text-red-400',
    out_for_delivery: 'bg-blue-950 text-blue-400',
  }[s] || 'bg-yellow-950 text-yellow-300');

  const refundLabel = (r) => ({ none: 'No Refund', pending: 'Refund Pending', issued: 'Refund Issued' }[r] || r);
  const refundColor = (r) => ({ none: 'text-mandi-muted', pending: 'text-yellow-400', issued: 'text-mandi-green' }[r] || '');

  const TABS = [
    { id: 'analytics', label: 'Analytics & SLA' },
    { id: 'orders',    label: `Orders (${orders.length})` },
    { id: 'stores',    label: `Stores (${stores.length})` },
    { id: 'products',  label: `Products (${products.length})` },
    { id: 'users',     label: `Users (${customerList.length})` },
    { id: 'coupons',   label: `Coupons (${coupons.length})` },
    { id: 'banners',   label: `Banners (${banners.length})` },
    { id: 'tickets',   label: `Tickets (${tickets.length})` },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">

      {cancelModal && (
        <CancelOrderModal
          order={cancelModal.order}
          onConfirm={(details) => handleCancelOrder(cancelModal.order, details)}
          onClose={() => setCancelModal(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-mandi-green rounded-xl flex items-center justify-center text-black font-black flex-shrink-0">
            <Shield size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-mandi-text font-black text-2xl">Super Admin Panel</h1>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${isFirebaseConfigured ? 'bg-mandi-green-muted text-mandi-green border border-mandi-green border-opacity-30' : 'bg-mandi-surface text-mandi-muted border border-mandi-border'}`}>
                {isFirebaseConfigured ? '🔥 Firebase Real-Time' : '💾 Local Engine'}
              </span>
            </div>
            <p className="text-mandi-muted text-xs">Live Order Oversight, Inventory &amp; Operations Dashboard</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleRefresh} disabled={refreshing} className="btn-outline text-xs py-2 px-3 flex items-center gap-1.5 border-mandi-border text-mandi-text hover:border-mandi-green hover:text-mandi-green transition-all">
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-mandi-green' : ''} />
            {refreshing ? 'Syncing...' : 'Sync Live Orders'}
          </button>
          <button onClick={() => setShowAddStoreModal(true)} className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5">
            <Plus size={14} /> Add Kirana Store
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="card p-4"><span className="text-mandi-muted text-xs font-medium">Platform GMV</span><p className="text-2xl font-black text-mandi-green mt-1">₹{totalGMV.toLocaleString('en-IN')}</p><span className="text-mandi-subtle text-[11px]">{completedOrders.length} delivered</span></div>
        <div className="card p-4"><span className="text-mandi-muted text-xs font-medium">Total Orders</span><p className="text-2xl font-black text-mandi-text mt-1">{orders.length}</p><span className="text-mandi-subtle text-[11px]">{completedOrders.length} delivered</span></div>
        <div className="card p-4"><span className="text-mandi-muted text-xs font-medium">Avg. Order Value</span><p className="text-2xl font-black text-blue-400 mt-1">₹{aov}</p><span className="text-mandi-subtle text-[11px]">AOV across {completedOrders.length} orders</span></div>
        <div className="card p-4"><span className="text-mandi-muted text-xs font-medium">Active Stores</span><p className="text-2xl font-black text-yellow-400 mt-1">{activeStores.length}</p><span className="text-mandi-subtle text-[11px]">{pendingVendors} pending review</span></div>
        <div className="card p-4 border border-red-500/20 bg-red-950/10"><span className="text-mandi-muted text-xs font-medium">Cancelled</span><p className="text-2xl font-black text-red-400 mt-1">{cancelledOrders.length}</p><span className="text-mandi-subtle text-[11px]">{cancellationRate}% cancellation rate</span></div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-mandi-border mb-6 overflow-x-auto scrollbar-none">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`py-3 px-4 font-semibold text-sm border-b-2 whitespace-nowrap transition-all ${activeTab === t.id ? 'border-mandi-green text-mandi-green font-bold' : 'border-transparent text-mandi-muted hover:text-mandi-text'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB: Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4"><TrendingUp size={18} className="text-mandi-green" /><h3 className="text-mandi-text font-bold text-base">Daily Orders — Last 30 Days</h3></div>
            {orders.length === 0 ? (
              <p className="text-mandi-muted text-xs py-8 text-center">No orders yet — place a test order to populate the chart.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={dailyOrderChart} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#6b7280' }} interval={4} />
                  <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, fontSize: 11 }} labelStyle={{ color: '#d1d5db' }} formatter={(val, name) => [val, name === 'orders' ? 'Orders' : 'GMV (₹)']} />
                  <Line type="monotone" dataKey="orders" stroke="#4ade80" strokeWidth={2} dot={false} name="orders" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4"><Activity size={18} className="text-mandi-green" /><div><h3 className="text-mandi-text font-bold text-base">Store Comparison — Orders, GMV &amp; Rating</h3><p className="text-mandi-muted text-xs mt-0.5">Sorted by GMV. Delayed = in-progress order older than 10 min.</p></div></div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-mandi-surface text-mandi-muted uppercase border-b border-mandi-border">
                  <tr><th className="p-3">Store</th><th className="p-3">Orders</th><th className="p-3">GMV</th><th className="p-3">Rating</th><th className="p-3">SLA</th></tr>
                </thead>
                <tbody className="divide-y divide-mandi-border">
                  {vendorPerformance.map(v => (
                    <tr key={v.id} className="hover:bg-mandi-surface transition-colors">
                      <td className="p-3 font-semibold text-mandi-text">{v.name}</td>
                      <td className="p-3 text-mandi-muted">{v.ordersCount}</td>
                      <td className="p-3 text-mandi-green font-bold">₹{v.gmv.toLocaleString('en-IN')}</td>
                      <td className="p-3"><span className="flex items-center gap-1"><span className="text-yellow-400">★</span><span className="text-mandi-text font-medium">{v.rating > 0 ? v.rating.toFixed(1) : '—'}</span></span></td>
                      <td className="p-3">{v.delayedCount === 0 ? <span className="badge-green text-[10px]">On Track</span> : <span className="bg-red-900 text-red-200 px-2 py-0.5 rounded-full text-[10px] font-bold">⚠️ {v.delayedCount} Delayed</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card p-6 border-orange-500 border-opacity-30 bg-orange-950 bg-opacity-10">
            <div className="flex items-center gap-2 mb-3"><ShieldAlert size={20} className="text-orange-400" /><h3 className="text-mandi-text font-bold text-base">Fraud &amp; High-Risk Guardrail Monitor</h3></div>
            <p className="text-mandi-muted text-xs mb-4">Orders flagged for high COD value (≥ ₹1,500) or high item density</p>
            {highRiskOrders.length === 0 ? (
              <p className="text-mandi-green text-xs py-2">✓ No high-risk or suspicious orders detected.</p>
            ) : (
              <div className="space-y-2">
                {highRiskOrders.map(o => (
                  <div key={o.id} className="p-3 rounded-xl bg-mandi-surface border border-mandi-border flex items-center justify-between text-xs gap-3">
                    <div><span className="font-bold text-mandi-text">#{o.id.toUpperCase()}</span><span className="text-mandi-muted ml-2">{o.paymentMethod} · ₹{o.total} · {o.items?.length} items</span></div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="bg-orange-500 text-black px-2 py-0.5 rounded font-bold text-[10px]">High Value Flag</span>
                      {!['delivered', 'cancelled'].includes(o.status) && (
                        <button onClick={() => setCancelModal({ order: o })} className="py-1 px-2 rounded-lg bg-red-950 text-red-400 border border-red-500/30 hover:border-red-400 transition-all text-[10px] font-bold flex items-center gap-1"><XCircle size={11} /> Cancel</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="card p-4 space-y-3">
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mandi-subtle pointer-events-none" />
              <input type="text" value={orderSearch} onChange={e => setOrderSearch(e.target.value)} placeholder="Search by order ID, customer name or phone..." className="input-field pl-10 text-sm w-full" />
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <select value={orderStatusFilter} onChange={e => setOrderStatusFilter(e.target.value)} className="input-field text-xs py-1.5 px-3 flex-1 min-w-[140px]">
                <option value="all">All Statuses</option><option value="placed">Placed</option><option value="accepted">Accepted</option>
                <option value="preparing">Preparing</option><option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option><option value="cancelled">Cancelled</option>
              </select>
              <select value={orderPaymentFilter} onChange={e => setOrderPaymentFilter(e.target.value)} className="input-field text-xs py-1.5 px-3 flex-1 min-w-[130px]">
                <option value="all">All Payments</option><option value="upi">UPI / Online</option><option value="cod">Cash on Delivery</option>
              </select>
              <select value={orderDateFilter} onChange={e => setOrderDateFilter(e.target.value)} className="input-field text-xs py-1.5 px-3 flex-1 min-w-[130px]">
                <option value="all">All Time</option><option value="today">Today</option><option value="7days">Last 7 Days</option><option value="30days">Last 30 Days</option>
              </select>
              {(orderSearch || orderStatusFilter !== 'all' || orderPaymentFilter !== 'all' || orderDateFilter !== 'all') && (
                <button onClick={() => { setOrderSearch(''); setOrderStatusFilter('all'); setOrderPaymentFilter('all'); setOrderDateFilter('all'); }} className="text-xs text-mandi-muted hover:text-red-400 transition-colors flex items-center gap-1 px-2 py-1.5"><X size={13} /> Clear</button>
              )}
            </div>
            <p className="text-mandi-subtle text-xs">Showing {filteredOrders.length} of {orders.length} orders</p>
          </div>

          {errorStates?.orders && (
            <div className="card p-4 bg-amber-950/40 border-amber-600/50 flex items-start gap-3">
              <ShieldAlert className="text-amber-400 flex-shrink-0 mt-0.5" size={18} />
              <div className="text-xs"><p className="text-amber-200 font-bold">Cloud Sync: {errorStates.orders}</p><p className="text-amber-300/80">Showing locally synced orders.</p></div>
            </div>
          )}

          {loadingStates?.orders && orders.length === 0 ? (
            <div className="card p-12 text-center space-y-3"><RefreshCw size={24} className="animate-spin text-mandi-green mx-auto" /><h3 className="text-mandi-text font-bold">Syncing Live Orders...</h3></div>
          ) : filteredOrders.length === 0 ? (
            <div className="card p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-mandi-surface rounded-full flex items-center justify-center mx-auto text-mandi-muted"><Database size={24} /></div>
              <h3 className="text-mandi-text font-bold text-base">{orders.length === 0 ? 'No Orders Yet' : 'No Orders Match Filters'}</h3>
              <p className="text-mandi-muted text-xs max-w-sm mx-auto">{orders.length === 0 ? 'Orders placed by customers appear here in real-time.' : 'Try adjusting or clearing the filters.'}</p>
            </div>
          ) : (
            filteredOrders.map(order => {
              const cd = cancellationDetails[order.id];
              const isCancellable = !['delivered', 'cancelled'].includes(order.status);
              return (
                <div key={order.id} className={`card p-5 space-y-4 border transition-colors ${order.status === 'cancelled' ? 'border-red-500/20 bg-red-950/5' : 'border-mandi-border hover:border-mandi-green/40'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-mandi-border">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-mandi-text font-black text-base">#{order.id.toUpperCase().slice(-8)}</span>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${statusColor(order.status)}`}>{order.status.replace(/_/g, ' ')}</span>
                        {cd && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-mandi-surface border border-mandi-border text-mandi-muted">{cd.reason}</span>}
                      </div>
                      <p className="text-mandi-muted text-xs">Store: <strong className="text-mandi-text">{order.storeName || 'Local Store'}</strong> · {new Date(order.placedAt || Date.now()).toLocaleString('en-IN')}</p>
                      {cd && <p className="text-xs flex items-center gap-2"><span className={`font-semibold ${refundColor(cd.refundStatus)}`}>{refundLabel(cd.refundStatus)}</span>{cd.notes && <span className="text-mandi-subtle">· {cd.notes}</span>}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <div className="text-right">
                        <p className="text-mandi-green font-black text-xl">₹{order.total}</p>
                        <p className="text-mandi-subtle text-[11px]">{order.paymentMethod} · <span className={order.paymentStatus === 'paid' ? 'text-mandi-green font-semibold' : 'text-yellow-400'}>{order.paymentStatus?.toUpperCase()}</span></p>
                      </div>
                      <select value={order.status}
                        onChange={e => {
                          if (e.target.value === 'cancelled') { setCancelModal({ order }); }
                          else { updateOrderStatus(order.id, e.target.value); addToast(`Order #${order.id.slice(-6)} → ${e.target.value}`, 'info'); }
                        }}
                        className="bg-mandi-surface border border-mandi-border rounded-xl text-xs font-semibold px-3 py-2 text-mandi-text hover:border-mandi-green transition-colors cursor-pointer">
                        <option value="placed">Placed</option><option value="accepted">Accepted</option><option value="preparing">Preparing</option>
                        <option value="out_for_delivery">Out for Delivery</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option>
                      </select>
                      {isCancellable && (
                        <button onClick={() => setCancelModal({ order })}
                          className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-red-950 text-red-400 border border-red-500/30 hover:border-red-400 hover:bg-red-900/60 active:scale-95 transition-all text-xs font-bold">
                          <XCircle size={14} /> Cancel
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-mandi-surface p-3.5 rounded-xl space-y-1.5 border border-mandi-border/60">
                      <p className="text-mandi-muted font-semibold uppercase text-[10px] tracking-wider">Customer &amp; Delivery</p>
                      <p className="text-mandi-text font-bold text-sm">{order.customerName || 'Customer'}</p>
                      {order.customerPhone && <p className="text-mandi-muted">Phone: {order.customerPhone}</p>}
                      {order.customerEmail && <p className="text-mandi-subtle">{order.customerEmail}</p>}
                      <p className="text-mandi-text mt-1">{order.address?.line1}, {order.address?.city} - {order.address?.pincode}</p>
                      {order.paymentDetails?.utr && <p className="text-mandi-green font-mono text-[11px] mt-1">UTR: {order.paymentDetails.utr}</p>}
                    </div>
                    <div className="bg-mandi-surface p-3.5 rounded-xl space-y-1.5 border border-mandi-border/60">
                      <p className="text-mandi-muted font-semibold uppercase text-[10px] tracking-wider">Ordered Items ({order.items?.length || 0})</p>
                      <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-none divide-y divide-mandi-border/40">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex justify-between py-1 text-xs">
                            <span className="text-mandi-text">{item.name} × {item.quantity} {item.unit}</span>
                            <span className="text-mandi-muted font-semibold">₹{(Number(item.price) || 0) * (item.quantity || 1)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="pt-2 border-t border-mandi-border flex justify-between font-bold text-xs text-mandi-text">
                        <span>Total ({order.paymentMethod})</span><span className="text-mandi-green">₹{order.total}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB: Stores */}
      {activeTab === 'stores' && (
        <div className="space-y-4">
          {stores.map(s => (
            <div key={s.id} className={`card p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${s.status === 'suspended' ? 'border-red-500/20 bg-red-950/5' : ''}`}>
              <div className="flex items-center gap-4">
                <LazyImage src={s.image} alt={s.name} className="w-full h-full object-cover rounded-xl" containerClass="w-16 h-16 rounded-xl flex-shrink-0" width={100} quality={60} />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-mandi-text font-bold text-base">{s.name}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${s.status === 'approved' ? 'bg-mandi-green-muted text-mandi-green' : s.status === 'suspended' ? 'bg-red-950 text-red-400' : 'bg-yellow-900 text-yellow-200'}`}>{s.status}</span>
                  </div>
                  <p className="text-mandi-muted text-xs mt-0.5">{s.address}, {s.city}</p>
                  <p className="text-mandi-subtle text-xs mt-0.5">Owner: {s.ownerName || 'Kirana Partner'} · {s.ownerPhone || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
                {s.status === 'pending' && <button onClick={() => { updateStore(s.id, { status: 'approved' }); addToast(`${s.name} approved!`, 'success'); }} className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1"><Check size={14} /> Approve</button>}
                {s.status === 'approved' && <button onClick={() => { updateStore(s.id, { status: 'suspended' }); addToast(`${s.name} suspended`, 'error'); }} className="py-1.5 px-3 text-xs flex items-center gap-1 bg-orange-950 text-orange-400 border border-orange-500/30 hover:border-orange-400 rounded-xl transition-all font-semibold"><Ban size={14} /> Suspend</button>}
                {s.status === 'suspended' && <button onClick={() => { updateStore(s.id, { status: 'approved' }); addToast(`${s.name} reactivated!`, 'success'); }} className="py-1.5 px-3 text-xs flex items-center gap-1 bg-mandi-green-muted text-mandi-green border border-mandi-green/30 hover:border-mandi-green rounded-xl transition-all font-semibold"><RotateCcw size={14} /> Reactivate</button>}
                <button onClick={() => handleDeleteStore(s.id, s.name)} className="p-2 rounded-xl bg-mandi-surface hover:bg-red-950 text-red-400 border border-mandi-border hover:border-red-500 transition-all"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB: Products */}
      {activeTab === 'products' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-mandi-surface text-mandi-muted text-xs uppercase border-b border-mandi-border">
              <tr><th className="p-3">Product</th><th className="p-3">Unit</th><th className="p-3">Price</th><th className="p-3">Stock</th><th className="p-3 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-mandi-border">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-mandi-surface transition-colors">
                  <td className="p-3 flex items-center gap-3">
                    <LazyImage src={p.image} alt={p.name} className="w-full h-full object-cover rounded-lg" containerClass="w-10 h-10 rounded-lg flex-shrink-0" width={100} quality={50} />
                    <div><p className="text-mandi-text font-semibold text-xs">{p.name}</p><p className="text-mandi-subtle text-xs">{p.brand}</p></div>
                  </td>
                  <td className="p-3 text-mandi-muted text-xs">{p.unit}</td>
                  <td className="p-3 text-mandi-green font-bold text-xs">₹{p.price}</td>
                  <td className="p-3 text-xs">{p.stock}</td>
                  <td className="p-3 text-right"><button onClick={() => { deleteProduct(p.id); addToast('Product deleted', 'info'); }} className="p-1.5 rounded-lg bg-mandi-surface text-red-400 border border-mandi-border hover:border-red-500"><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB: Users */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {customerList.length === 0 ? (
            <div className="card p-12 text-center"><Users size={32} className="text-mandi-subtle mx-auto mb-3" /><p className="text-mandi-text font-bold">No customer data yet</p><p className="text-mandi-muted text-sm mt-1">Customer profiles derived from order history.</p></div>
          ) : (
            <div className="card overflow-x-auto">
              <div className="p-4 border-b border-mandi-border flex items-center gap-2">
                <Users size={16} className="text-mandi-green" />
                <h3 className="text-mandi-text font-bold text-sm">{customerList.length} Unique Customers</h3>
                <span className="text-mandi-subtle text-xs ml-auto">Derived from order history · sorted by spend</span>
              </div>
              <table className="w-full text-xs text-left">
                <thead className="bg-mandi-surface text-mandi-muted text-[11px] uppercase border-b border-mandi-border">
                  <tr><th className="p-3">Customer</th><th className="p-3">Contact</th><th className="p-3">Orders</th><th className="p-3">Total Spent</th><th className="p-3">Last Order</th><th className="p-3 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-mandi-border">
                  {customerList.map((c, idx) => {
                    const key = (c.email !== '—' ? c.email : c.phone !== '—' ? c.phone : c.name) + idx;
                    const isBanned = bannedUsers[key];
                    return (
                      <tr key={idx} className={`hover:bg-mandi-surface transition-colors ${isBanned ? 'opacity-50' : ''}`}>
                        <td className="p-3"><div className="flex items-center gap-2"><div className="w-7 h-7 bg-mandi-green rounded-full flex items-center justify-center text-xs font-bold text-black flex-shrink-0">{c.name[0].toUpperCase()}</div><div><p className="text-mandi-text font-semibold">{c.name}</p>{isBanned && <span className="text-[10px] text-red-400 font-bold">BANNED</span>}</div></div></td>
                        <td className="p-3 text-mandi-muted"><p>{c.email}</p><p className="text-mandi-subtle">{c.phone}</p></td>
                        <td className="p-3 text-mandi-text font-semibold">{c.orders}</td>
                        <td className="p-3 text-mandi-green font-bold">₹{c.totalSpent.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-mandi-muted">{c.lastOrder ? c.lastOrder.toLocaleDateString('en-IN') : '—'}</td>
                        <td className="p-3 text-right">
                          {isBanned ? (
                            <button onClick={() => { setBannedUsers(p => { const n={...p}; delete n[key]; return n; }); addToast(`${c.name} unbanned`, 'success'); }} className="py-1 px-2.5 text-[10px] font-bold rounded-lg bg-mandi-green-muted text-mandi-green border border-mandi-green/30 hover:border-mandi-green transition-all flex items-center gap-1 ml-auto"><RotateCcw size={11} /> Unban</button>
                          ) : (
                            <button onClick={() => { setBannedUsers(p => ({...p, [key]: true})); addToast(`${c.name} banned`, 'error'); }} className="py-1 px-2.5 text-[10px] font-bold rounded-lg bg-red-950 text-red-400 border border-red-500/30 hover:border-red-400 transition-all flex items-center gap-1 ml-auto"><Ban size={11} /> Ban</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: Coupons */}
      {activeTab === 'coupons' && (
        <div className="space-y-6">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><Tag size={16} className="text-mandi-green" /><h3 className="text-mandi-text font-bold text-sm">Discount Coupons Manager</h3></div>
              <button onClick={() => setShowCouponForm(p => !p)} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"><Plus size={14} /> {showCouponForm ? 'Cancel' : 'New Coupon'}</button>
            </div>

            {showCouponForm && (
              <form onSubmit={handleCreateCoupon} className="bg-mandi-surface rounded-xl p-4 border border-mandi-border mb-5 space-y-3 animate-scale-in">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-mandi-muted text-xs mb-1">Code *</label><input required value={newCoupon.code} onChange={e => setNewCoupon(p => ({...p, code: e.target.value.toUpperCase()}))} placeholder="e.g. SAVE20" className="input-field text-sm font-mono uppercase" /></div>
                  <div><label className="block text-mandi-muted text-xs mb-1">Type</label><select value={newCoupon.type} onChange={e => setNewCoupon(p => ({...p, type: e.target.value}))} className="input-field text-sm"><option value="percent">Percentage (%)</option><option value="flat">Flat Amount (₹)</option></select></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="block text-mandi-muted text-xs mb-1">{newCoupon.type === 'percent' ? 'Discount %' : 'Flat ₹ Off'} *</label><input required type="number" min="1" max={newCoupon.type === 'percent' ? 90 : 5000} value={newCoupon.value} onChange={e => setNewCoupon(p => ({...p, value: Number(e.target.value)}))} className="input-field text-sm" /></div>
                  <div><label className="block text-mandi-muted text-xs mb-1">Max Cap (₹)</label><input type="number" min="1" value={newCoupon.cap} onChange={e => setNewCoupon(p => ({...p, cap: Number(e.target.value)}))} className="input-field text-sm" /></div>
                  <div><label className="block text-mandi-muted text-xs mb-1">Min Order (₹)</label><input type="number" min="1" value={newCoupon.minOrder} onChange={e => setNewCoupon(p => ({...p, minOrder: Number(e.target.value)}))} className="input-field text-sm" /></div>
                </div>
                <div><label className="block text-mandi-muted text-xs mb-1">Expiry Date *</label><input required type="date" value={newCoupon.expiry} min={new Date().toISOString().split('T')[0]} onChange={e => setNewCoupon(p => ({...p, expiry: e.target.value}))} className="input-field text-sm" /></div>
                <button type="submit" className="btn-primary py-2 px-4 text-sm flex items-center gap-1.5"><Plus size={14} /> Create Coupon</button>
              </form>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-mandi-muted uppercase text-[10px] border-b border-mandi-border">
                  <tr><th className="py-2 pr-4">Code</th><th className="py-2 pr-4">Discount</th><th className="py-2 pr-4">Min Order</th><th className="py-2 pr-4">Expiry</th><th className="py-2 pr-4">Uses</th><th className="py-2 pr-4">Status</th><th className="py-2 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-mandi-border">
                  {coupons.map(c => {
                    const expired = new Date(c.expiry) < new Date();
                    return (
                      <tr key={c.id} className={`hover:bg-mandi-surface transition-colors ${!c.active || expired ? 'opacity-50' : ''}`}>
                        <td className="py-3 pr-4"><span className="font-mono font-black text-mandi-text bg-mandi-surface px-2 py-0.5 rounded-lg border border-mandi-border">{c.code}</span></td>
                        <td className="py-3 pr-4 text-mandi-green font-bold">{c.type === 'percent' ? `${c.value}%` : `₹${c.value}`}<span className="text-mandi-muted font-normal"> (cap ₹{c.cap})</span></td>
                        <td className="py-3 pr-4 text-mandi-muted">₹{c.minOrder}</td>
                        <td className="py-3 pr-4 text-mandi-muted">{c.expiry}{expired && <span className="ml-1 text-red-400 font-bold">EXPIRED</span>}</td>
                        <td className="py-3 pr-4 text-mandi-muted">{c.uses}</td>
                        <td className="py-3 pr-4"><span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${c.active && !expired ? 'bg-mandi-green-muted text-mandi-green' : 'bg-mandi-surface text-mandi-muted border border-mandi-border'}`}>{!c.active ? 'Inactive' : expired ? 'Expired' : 'Active'}</span></td>
                        <td className="py-3 text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            {c.active && !expired && <button onClick={() => { setCoupons(p => p.map(x => x.id === c.id ? {...x, active: false} : x)); addToast('Coupon deactivated', 'info'); }} className="py-1 px-2 text-[10px] font-bold rounded-lg bg-mandi-surface text-mandi-muted border border-mandi-border hover:border-mandi-green transition-all">Deactivate</button>}
                            <button onClick={() => { setCoupons(p => p.filter(x => x.id !== c.id)); addToast('Coupon deleted', 'info'); }} className="p-1.5 rounded-lg bg-mandi-surface text-red-400 border border-mandi-border hover:border-red-500 transition-all"><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Banners */}
      {activeTab === 'banners' && (
        <div className="space-y-6">
          <div className="card p-5 max-w-xl">
            <h3 className="text-mandi-text font-bold mb-3 text-sm flex items-center gap-2"><Megaphone size={16} className="text-mandi-green" />Add Promotional Banner</h3>
            <form onSubmit={handleCreateBanner} className="space-y-3">
              <input required value={newBannerTitle} onChange={e => setNewBannerTitle(e.target.value)} placeholder="Banner Title (e.g. 🎉 Flat 30% Off)" className="input-field text-sm" />
              <input value={newBannerSub} onChange={e => setNewBannerSub(e.target.value)} placeholder="Subtitle (e.g. Use code FLASH30)" className="input-field text-sm" />
              <button type="submit" className="btn-primary py-2 px-4 text-sm flex items-center gap-1.5"><Plus size={14} />Publish Banner</button>
            </form>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {banners.map(b => (
              <div key={b.id} className="card p-4 flex items-center justify-between">
                <div><p className="text-mandi-text font-bold text-sm">{b.title}</p><p className="text-mandi-muted text-xs">{b.subtitle}</p></div>
                <button onClick={() => { deleteBanner(b.id); addToast('Banner removed', 'info'); }} className="text-red-400 hover:text-red-300 p-2"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: Tickets */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {tickets.map(t => (
            <div key={t.id} className="card p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2"><HelpCircle size={16} className="text-mandi-green" /><h3 className="text-mandi-text font-bold text-sm">{t.subject}</h3></div>
                <span className={`text-xs px-2.5 py-1 rounded-full uppercase font-bold ${t.status === 'open' ? 'bg-yellow-900 text-yellow-200' : 'bg-mandi-green-muted text-mandi-green'}`}>{t.status}</span>
              </div>
              <p className="text-mandi-muted text-xs mb-3">{t.message}</p>
              {t.reply ? (
                <div className="bg-mandi-surface p-3 rounded-xl border border-mandi-border text-xs"><p className="text-mandi-green font-semibold mb-1">Admin Reply:</p><p className="text-mandi-text">{t.reply}</p></div>
              ) : (
                <div className="flex gap-2">
                  <input placeholder="Type resolution reply..." value={replyText[t.id] || ''} onChange={e => setReplyText({ ...replyText, [t.id]: e.target.value })} className="input-field text-xs py-1.5 flex-1" />
                  <button onClick={() => { resolveTicket(t.id, replyText[t.id] || 'Issue resolved'); addToast('Ticket resolved', 'success'); }} className="btn-primary py-1.5 px-3 text-xs">Resolve</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add Store */}
      {showAddStoreModal && (
        <div className="overlay flex items-center justify-center p-4">
          <div className="bg-mandi-card border border-mandi-border rounded-2xl p-6 w-full max-w-lg animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><Store size={20} className="text-mandi-green" /><h2 className="text-mandi-text font-bold text-lg">Add New Kirana Store</h2></div>
              <button onClick={() => setShowAddStoreModal(false)} className="text-mandi-subtle hover:text-mandi-text"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateStore} className="space-y-4">
              <div><label className="block text-mandi-muted text-xs font-medium mb-1">Store Name *</label><input required value={newStore.name} onChange={e => setNewStore({ ...newStore, name: e.target.value })} placeholder="e.g. Super Kirana Bazaar" className="input-field text-sm" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-mandi-muted text-xs font-medium mb-1">Owner Name *</label><input required value={newStore.ownerName} onChange={e => setNewStore({ ...newStore, ownerName: e.target.value })} placeholder="Owner Name" className="input-field text-sm" /></div>
                <div><label className="block text-mandi-muted text-xs font-medium mb-1">Owner Mobile</label><input type="tel" value={newStore.ownerPhone} onChange={e => setNewStore({ ...newStore, ownerPhone: e.target.value })} placeholder="10-digit number" className="input-field text-sm" /></div>
              </div>
              <div><label className="block text-mandi-muted text-xs font-medium mb-1">Address *</label><input required value={newStore.address} onChange={e => setNewStore({ ...newStore, address: e.target.value })} placeholder="Shop address, locality" className="input-field text-sm" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-mandi-muted text-xs font-medium mb-1">City *</label><input required value={newStore.city} onChange={e => setNewStore({ ...newStore, city: e.target.value })} className="input-field text-sm" /></div>
                <div><label className="block text-mandi-muted text-xs font-medium mb-1">Served Pincodes *</label><input required value={newStore.pincodes} onChange={e => setNewStore({ ...newStore, pincodes: e.target.value })} placeholder="401305, 401303" className="input-field text-sm" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ImageUploadField
                  label="Store's Picture (Logo / Storefront)"
                  value={newStore.image}
                  onChange={(val) => setNewStore({ ...newStore, image: val })}
                  aspectRatio="square"
                  recommendedText="400×400px (1:1)"
                  placeholderText="Image not available"
                />
                <ImageUploadField
                  label="Store Cover Picture (Hero Banner)"
                  value={newStore.coverImage}
                  onChange={(val) => setNewStore({ ...newStore, coverImage: val })}
                  aspectRatio="banner"
                  recommendedText="1200×400px"
                  placeholderText="Image not available"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary flex-1 py-2.5 text-sm">Create &amp; Approve Store</button>
                <button type="button" onClick={() => setShowAddStoreModal(false)} className="py-2.5 px-4 bg-mandi-surface text-mandi-muted hover:text-mandi-text border border-mandi-border rounded-xl text-sm transition-all">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
