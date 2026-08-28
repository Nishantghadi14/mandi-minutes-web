import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import ProductModal from '../components/vendor/ProductModal';
import InvoiceModal from '../components/vendor/InvoiceModal';
import { useToast } from '../components/common/Toast';
import LazyImage from '../components/common/LazyImage';
import { 
  Store, 
  ShoppingBag, 
  TrendingUp, 
  Plus, 
  Edit, 
  Trash2, 
  Printer, 
  Clock, 
  AlertTriangle, 
  MessageCircle, 
  ShieldAlert, 
  Zap, 
  DollarSign,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const PLATFORM_COMMISSION_RATE = 0.10; // 10% platform fee constant

export default function VendorDashboard() {
  const { user } = useAuth();
  const { stores, getProductsByStore, getOrdersByStore, addProduct, updateProduct, deleteProduct, updateOrderStatus } = useData();
  const { addToast } = useToast();

  // Strictly resolve store from authenticated user's storeId only — no default store fallbacks
  const store = user?.storeId ? stores.find(s => s.id === user.storeId) : null;
  const products = useMemo(() => store?.id ? getProductsByStore(store.id) : [], [store?.id, getProductsByStore]);
  const storeOrders = useMemo(() => store?.id ? getOrdersByStore(store.id) : [], [store?.id, getOrdersByStore]);

  const [activeTab, setActiveTab] = useState('orders');
  const [editingProduct, setEditingProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [orderFilter, setOrderFilter] = useState('all');
  const [timeframe, setTimeframe] = useState('7d'); // '7d' | '30d'
  const [stockThreshold, setStockThreshold] = useState(5);

  // SLA Calculation for Active Orders
  const ordersWithSla = useMemo(() => {
    const now = Date.now();
    return storeOrders.map(order => {
      const placedTimestamp = new Date(order.placedAt || 0).getTime();
      const elapsedMinutes = Math.floor((now - placedTimestamp) / (60 * 1000));

      let slaStatus = 'ok';
      let slaMessage = '';

      // Only express orders are subjected to the strict 5-min express SLA timer
      if (order.deliveryType !== 'scheduled') {
        if (order.status === 'placed') {
          if (elapsedMinutes >= 5) {
            slaStatus = 'breached';
            slaMessage = `Acceptance delayed (${elapsedMinutes}m ago)`;
          } else if (elapsedMinutes >= 3) {
            slaStatus = 'warning';
            slaMessage = `Accept within ${5 - elapsedMinutes}m`;
          }
        } else if (order.status === 'accepted' || order.status === 'preparing') {
          if (elapsedMinutes >= 15) {
            slaStatus = 'breached';
            slaMessage = `Packing delayed (${elapsedMinutes}m total)`;
          }
        }
      } else {
        slaMessage = `Scheduled for ${order.scheduledSlot?.label || order.scheduledSlot?.date || 'Slot'}`;
      }

      return {
        ...order,
        elapsedMinutes,
        slaStatus,
        slaMessage,
      };
    });
  }, [storeOrders]);

  const slaBreachedOrders = useMemo(() => {
    return ordersWithSla.filter(o => o.slaStatus === 'breached' && ['placed', 'accepted', 'preparing'].includes(o.status));
  }, [ordersWithSla]);

  const stats = useMemo(() => {
    const totalRev = storeOrders.reduce((s, o) => s + o.total, 0);
    const pending = storeOrders.filter(o => ['placed', 'accepted', 'preparing'].includes(o.status)).length;
    const lowStock = products.filter(p => p.stock <= stockThreshold).length;
    
    // SLA compliance calculation
    const completedOrOut = storeOrders.filter(o => ['delivered', 'out_for_delivery'].includes(o.status));
    const onTimeOrders = completedOrOut.filter(o => {
      const acceptStep = o.statusHistory?.find(h => h.status === 'accepted');
      if (!acceptStep) return true;
      const acceptDiff = (new Date(acceptStep.time).getTime() - new Date(o.placedAt).getTime()) / (60 * 1000);
      return acceptDiff <= 5;
    });
    const slaRate = completedOrOut.length > 0 ? Math.round((onTimeOrders.length / completedOrOut.length) * 100) : 100;

    return { rev: totalRev, count: storeOrders.length, pending, lowStock, slaRate };
  }, [storeOrders, products, stockThreshold]);

  // Sales Over Time (7 / 30 Days)
  const salesOverTime = useMemo(() => {
    const numDays = timeframe === '30d' ? 30 : 7;
    const now = new Date();
    const data = [];

    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = numDays === 7 
        ? d.toLocaleDateString('en-IN', { weekday: 'short' })
        : `${d.getDate()}/${d.getMonth() + 1}`;

      const dayTotal = storeOrders
        .filter(o => (o.placedAt || '').startsWith(dateStr))
        .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

      const dayOrders = storeOrders
        .filter(o => (o.placedAt || '').startsWith(dateStr)).length;

      data.push({
        date: label,
        fullDate: dateStr,
        sales: dayTotal,
        orders: dayOrders,
      });
    }
    return data;
  }, [storeOrders, timeframe]);

  // Low-Stock Products List
  const lowStockProducts = useMemo(() => {
    return products.filter(p => Number(p.stock) <= stockThreshold);
  }, [products, stockThreshold]);

  // Earnings Summary
  const earningsSummary = useMemo(() => {
    const grossSales = storeOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const platformCommission = Math.round(grossSales * PLATFORM_COMMISSION_RATE);
    const netPayout = grossSales - platformCommission;
    const deliveredCount = storeOrders.filter(o => o.status === 'delivered').length;
    return { grossSales, platformCommission, netPayout, deliveredCount, rate: PLATFORM_COMMISSION_RATE * 100 };
  }, [storeOrders]);

  // Top Selling Products Calculated Dynamically from Firestore Orders
  const topSellingProducts = useMemo(() => {
    const countMap = {};
    storeOrders.forEach(o => {
      (o.items || []).forEach(it => {
        const key = it.name;
        countMap[key] = (countMap[key] || 0) + it.quantity;
      });
    });

    return Object.entries(countMap)
      .map(([name, units]) => ({ name, units }))
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);
  }, [storeOrders]);

  const filteredOrders = useMemo(() => {
    if (orderFilter === 'all') return ordersWithSla;
    if (orderFilter === 'sla_breach') return slaBreachedOrders;
    return ordersWithSla.filter(o => o.status === orderFilter);
  }, [ordersWithSla, slaBreachedOrders, orderFilter]);

  const handleSaveProduct = (prodData) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, prodData);
      addToast('Product updated!', 'success');
    } else {
      addProduct({ ...prodData, storeId: store.id });
      addToast('Product added to catalog!', 'success');
    }
    setShowProductModal(false);
    setEditingProduct(null);
  };

  const handleStatusChange = (orderId, newStatus) => {
    updateOrderStatus(orderId, newStatus);
    addToast(`Order status updated to ${newStatus.replace(/_/g, ' ')}`, 'success');
  };

  if (!store) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="card p-8 border-orange-500 border-opacity-30 bg-orange-950 bg-opacity-20 space-y-4">
          <Store size={48} className="text-orange-400 mx-auto" />
          <h2 className="text-xl font-bold text-mandi-text">Store Not Linked</h2>
          <p className="text-mandi-muted text-sm max-w-md mx-auto">
            Your vendor account does not have an active store associated with ID "{user?.storeId || 'N/A'}". If you recently registered, please wait for admin verification.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <a href="/vendor-onboarding" className="btn-primary text-sm py-2 px-4">
              Submit Onboarding Form
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* SLA Alert Urgent Banner */}
      {slaBreachedOrders.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-red-950 bg-opacity-50 border-2 border-red-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-red-200 shadow-lg animate-pulse">
          <div className="flex items-center gap-3">
            <ShieldAlert size={24} className="text-red-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-100">
                🚨 SLA Urgency Alert: {slaBreachedOrders.length} Order{slaBreachedOrders.length > 1 ? 's' : ''} Delayed!
              </p>
              <p className="text-xs text-red-300">
                Orders have been waiting for acceptance/packing beyond the 10-15 min express guarantee.
              </p>
            </div>
          </div>
          <button
            onClick={() => setOrderFilter('sla_breach')}
            className="btn-primary text-xs py-2 px-4 bg-red-600 hover:bg-red-500 text-white font-bold"
          >
            Review Delayed Orders ({slaBreachedOrders.length})
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Store size={22} className="text-mandi-green" />
            <h1 className="text-mandi-text font-black text-2xl">{store.name}</h1>
            <span className="badge-green text-xs font-semibold uppercase">{store.status}</span>
          </div>
          <p className="text-mandi-muted text-xs mt-1">Vendor Dashboard • Owner: {store.ownerName} • Virar Region</p>
        </div>
        <button onClick={() => { setEditingProduct(null); setShowProductModal(true); }} className="btn-primary flex items-center gap-2 py-2.5 px-4 text-sm self-start sm:self-auto">
          <Plus size={16} />Add Product
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-mandi-muted text-xs font-medium">Total Revenue</span>
            <TrendingUp size={16} className="text-mandi-green" />
          </div>
          <div className="text-2xl font-black text-mandi-green">₹{stats.rev}</div>
          <span className="text-mandi-subtle text-xs">All-time sales</span>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-mandi-muted text-xs font-medium">Total Orders</span>
            <ShoppingBag size={16} className="text-blue-400" />
          </div>
          <div className="text-2xl font-black text-mandi-text">{stats.count}</div>
          <span className="text-mandi-subtle text-xs">Completed & active</span>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-mandi-muted text-xs font-medium">Active Orders</span>
            <Clock size={16} className="text-yellow-400" />
          </div>
          <div className="text-2xl font-black text-yellow-400">{stats.pending}</div>
          <span className="text-mandi-subtle text-xs">Need action</span>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-mandi-muted text-xs font-medium">SLA Compliance</span>
            <Zap size={16} className="text-mandi-green" />
          </div>
          <div className="text-2xl font-black text-mandi-green">{stats.slaRate}%</div>
          <span className="text-mandi-subtle text-xs">&le; 5 min acceptance</span>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-mandi-muted text-xs font-medium">Low Stock</span>
            <AlertTriangle size={16} className="text-orange-400" />
          </div>
          <div className="text-2xl font-black text-orange-400">{stats.lowStock}</div>
          <span className="text-mandi-subtle text-xs">&le; 5 units left</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-mandi-border mb-6">
        {[{ id: 'orders', label: `Orders (${storeOrders.length})` }, { id: 'products', label: `Products (${products.length})` }, { id: 'analytics', label: 'Sales & SLA Analytics' }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`py-3 px-4 font-semibold text-sm border-b-2 transition-all ${activeTab === t.id ? 'border-mandi-green text-mandi-green' : 'border-transparent text-mandi-muted'}`}>{t.label}</button>
        ))}
      </div>

      {/* TAB 1: Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { id: 'all', label: 'All Orders' },
              { id: 'sla_breach', label: `⚠️ Delayed (${slaBreachedOrders.length})` },
              { id: 'placed', label: 'Placed' },
              { id: 'accepted', label: 'Accepted' },
              { id: 'preparing', label: 'Packing' },
              { id: 'out_for_delivery', label: 'Out for Delivery' },
              { id: 'delivered', label: 'Delivered' },
            ].map(st => (
              <button 
                key={st.id} 
                onClick={() => setOrderFilter(st.id)} 
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${orderFilter === st.id ? 'bg-mandi-green text-black font-bold' : 'bg-mandi-surface text-mandi-muted border border-mandi-border'}`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {filteredOrders.length === 0 ? (
            <div className="card p-8 text-center text-mandi-muted">No orders matching filter</div>
          ) : (
            filteredOrders.map(order => (
              <div 
                key={order.id} 
                className={`card p-5 space-y-3 transition-all ${order.slaStatus === 'breached' ? 'border-red-600 bg-red-950 bg-opacity-10' : ''}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-mandi-border">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-mandi-text font-bold text-base">#{order.id.toUpperCase()}</span>
                      <span className="badge-green text-xs capitalize">{order.status.replace(/_/g, ' ')}</span>
                      {order.slaStatus === 'breached' && (
                        <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md animate-pulse">
                          ⚠️ {order.slaMessage}
                        </span>
                      )}
                      {order.slaStatus === 'warning' && (
                        <span className="bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-md">
                          ⏳ {order.slaMessage}
                        </span>
                      )}
                      {order.deliveryType === 'scheduled' && (
                        <span className="bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                          📅 Scheduled: {order.scheduledSlot?.label || order.scheduledSlot?.timeWindow || '2-Hour Slot'}
                        </span>
                      )}
                    </div>
                    <p className="text-mandi-muted text-xs mt-0.5">Placed: {new Date(order.placedAt).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={`https://api.whatsapp.com/send?phone=919920941603&text=${encodeURIComponent(`Hello! Updating you regarding your Mandi Minutes Order #${order.id.toUpperCase()} from ${store.name}.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#25D366] text-black font-bold py-1.5 px-3 text-xs rounded-xl flex items-center gap-1 hover:bg-opacity-90 transition-all shadow-sm"
                    >
                      <MessageCircle size={13} /> WhatsApp
                    </a>
                    <button onClick={() => setInvoiceOrder(order)} className="btn-outline py-1.5 px-3 text-xs flex items-center gap-1"><Printer size={12} />Invoice</button>
                    {order.status === 'placed' && (
                      <button onClick={() => handleStatusChange(order.id, 'accepted')} className="btn-primary py-1.5 px-3 text-xs font-bold">Accept Order</button>
                    )}
                    {order.status === 'accepted' && (
                      <button onClick={() => handleStatusChange(order.id, 'preparing')} className="btn-primary py-1.5 px-3 text-xs font-bold">Start Packing</button>
                    )}
                    {order.status === 'preparing' && (
                      <button onClick={() => handleStatusChange(order.id, 'out_for_delivery')} className="btn-primary py-1.5 px-3 text-xs font-bold">Out for Delivery</button>
                    )}
                    {order.status === 'out_for_delivery' && (
                      <button onClick={() => handleStatusChange(order.id, 'delivered')} className="btn-primary py-1.5 px-3 text-xs font-bold">Mark Delivered</button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-mandi-subtle mb-1">Customer Address:</p>
                    <p className="text-mandi-text">{order.address?.line1}, {order.address?.city} - {order.address?.pincode}</p>
                  </div>
                  <div>
                    <p className="text-mandi-subtle mb-1">Payment & Total:</p>
                    <p className="text-mandi-text font-bold">{order.paymentMethod} • <span className="text-mandi-green">₹{order.total}</span></p>
                  </div>
                </div>

                <div className="bg-mandi-surface rounded-xl p-3 space-y-1">
                  {order.items.map((it, i) => (
                    <div key={i} className="flex justify-between text-xs text-mandi-muted">
                      <span>{it.quantity}x {it.name} ({it.unit})</span>
                      <span className="text-mandi-text font-medium">₹{it.price * it.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: Products */}
      {activeTab === 'products' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-mandi-surface text-mandi-muted text-xs uppercase border-b border-mandi-border">
              <tr>
                <th className="p-3">Product</th>
                <th className="p-3">Unit</th>
                <th className="p-3">Price</th>
                <th className="p-3">Stock</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mandi-border">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-mandi-surface transition-colors">
                  <td className="p-3 flex items-center gap-3">
                    <LazyImage src={p.image} alt={p.name} className="w-full h-full object-cover rounded-lg" containerClass="w-10 h-10 rounded-lg flex-shrink-0" width={100} quality={50} />
                    <div>
                      <p className="text-mandi-text font-semibold text-xs">{p.name}</p>
                      <p className="text-mandi-subtle text-xs">{p.brand}</p>
                    </div>
                  </td>
                  <td className="p-3 text-mandi-muted text-xs">{p.unit}</td>
                  <td className="p-3 text-mandi-green font-bold text-xs">₹{p.price}</td>
                  <td className="p-3 text-xs">
                    <span className={`font-semibold ${p.stock <= 5 ? 'text-red-400' : 'text-mandi-text'}`}>{p.stock}</span>
                  </td>
                  <td className="p-3">
                    <button onClick={() => updateProduct(p.id, { isAvailable: !p.isAvailable })} className={`text-xs px-2.5 py-1 rounded-full font-medium ${p.isAvailable ? 'bg-mandi-green-muted text-mandi-green' : 'bg-red-900 text-red-200'}`}>
                      {p.isAvailable ? 'In Stock' : 'Out of Stock'}
                    </button>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setEditingProduct(p); setShowProductModal(true); }} className="p-1.5 rounded-lg bg-mandi-surface hover:border-mandi-green text-mandi-muted hover:text-mandi-text border border-mandi-border"><Edit size={14} /></button>
                      <button onClick={() => { deleteProduct(p.id); addToast('Product deleted', 'info'); }} className="p-1.5 rounded-lg bg-mandi-surface hover:border-red-500 text-red-400 border border-mandi-border"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Earnings Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-5 bg-gradient-to-br from-mandi-card to-mandi-surface border-mandi-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-mandi-muted text-xs font-semibold uppercase tracking-wider">Gross Sales</span>
                <div className="w-8 h-8 rounded-xl bg-blue-900 bg-opacity-30 flex items-center justify-center text-blue-400">
                  <DollarSign size={16} />
                </div>
              </div>
              <p className="text-2xl font-black text-mandi-text">₹{earningsSummary.grossSales.toLocaleString('en-IN')}</p>
              <p className="text-mandi-subtle text-xs mt-1">Total revenue across {storeOrders.length} order{storeOrders.length === 1 ? '' : 's'}</p>
            </div>

            <div className="card p-5 bg-gradient-to-br from-mandi-card to-mandi-surface border-mandi-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-mandi-muted text-xs font-semibold uppercase tracking-wider">Platform Fee ({earningsSummary.rate}%)</span>
                <div className="w-8 h-8 rounded-xl bg-yellow-900 bg-opacity-30 flex items-center justify-center text-yellow-400">
                  <Layers size={16} />
                </div>
              </div>
              <p className="text-2xl font-black text-yellow-400">-₹{earningsSummary.platformCommission.toLocaleString('en-IN')}</p>
              <p className="text-mandi-subtle text-xs mt-1">App infrastructure & delivery logistics</p>
            </div>

            <div className="card p-5 bg-gradient-to-br from-[#0d2a14] to-mandi-card border-mandi-green border-opacity-40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-300 text-xs font-semibold uppercase tracking-wider">Net Vendor Payout</span>
                <div className="w-8 h-8 rounded-xl bg-mandi-green bg-opacity-20 flex items-center justify-center text-mandi-green">
                  <ArrowUpRight size={18} />
                </div>
              </div>
              <p className="text-3xl font-black text-mandi-green">₹{earningsSummary.netPayout.toLocaleString('en-IN')}</p>
              <p className="text-mandi-muted text-xs mt-1">Direct settlement to your registered UPI / Bank</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales Over Time Line Chart */}
            <div className="lg:col-span-2 card p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-mandi-text font-bold text-lg">Sales Trend (₹)</h3>
                  <p className="text-mandi-muted text-xs">Daily store revenue calculated from confirmed orders</p>
                </div>
                <div className="flex bg-mandi-surface rounded-xl p-1 border border-mandi-border self-start sm:self-auto">
                  <button
                    onClick={() => setTimeframe('7d')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${timeframe === '7d' ? 'bg-mandi-green text-black' : 'text-mandi-muted hover:text-mandi-text'}`}
                  >
                    Last 7 Days
                  </button>
                  <button
                    onClick={() => setTimeframe('30d')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${timeframe === '30d' ? 'bg-mandi-green text-black' : 'text-mandi-muted hover:text-mandi-text'}`}
                  >
                    Last 30 Days
                  </button>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesOverTime} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis dataKey="date" stroke="#6B6B6B" fontSize={11} />
                    <YAxis stroke="#6B6B6B" fontSize={11} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#2A2A2A', borderRadius: '12px', color: '#FFF', fontSize: '12px' }}
                      formatter={(val) => [`₹${val}`, 'Sales']}
                    />
                    <Line type="monotone" dataKey="sales" stroke="#00C851" strokeWidth={3} dot={{ r: 4, fill: '#00C851' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Products */}
            <div className="card p-6">
              <h3 className="text-mandi-text font-bold text-lg mb-1">Top Selling Items</h3>
              <p className="text-mandi-muted text-xs mb-4">Most popular staples ordered from your store</p>
              {topSellingProducts.length === 0 ? (
                <p className="text-mandi-subtle text-xs py-8 text-center">No sales recorded yet</p>
              ) : (
                <div className="space-y-3">
                  {topSellingProducts.map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between border-b border-mandi-border pb-2 text-xs">
                      <span className="text-mandi-text font-medium truncate max-w-[160px]">{it.name}</span>
                      <span className="badge-green font-bold">{it.units} units</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Low-Stock Alert List */}
          <div className="card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-yellow-400" />
                <h3 className="text-mandi-text font-bold text-lg">Low Stock Alerts ({lowStockProducts.length})</h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-mandi-muted">
                <span>Alert threshold:</span>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={stockThreshold}
                  onChange={e => setStockThreshold(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-16 input-field py-1 px-2 text-xs text-center font-bold"
                />
                <span>units or fewer</span>
              </div>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="p-6 text-center text-mandi-muted text-xs bg-mandi-surface rounded-xl border border-mandi-border">
                ✅ All products have sufficient stock (above {stockThreshold} units).
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-mandi-surface text-mandi-muted border-b border-mandi-border">
                    <tr>
                      <th className="p-3">Product</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Price</th>
                      <th className="p-3">Current Stock</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-mandi-border">
                    {lowStockProducts.map(p => (
                      <tr key={p.id} className="hover:bg-mandi-surface transition-colors">
                        <td className="p-3 flex items-center gap-3">
                          <LazyImage src={p.image} alt={p.name} className="w-8 h-8 rounded-lg object-cover" />
                          <span className="font-semibold text-mandi-text">{p.name}</span>
                        </td>
                        <td className="p-3 text-mandi-muted">{p.category}</td>
                        <td className="p-3 text-mandi-green font-bold">₹{p.price}</td>
                        <td className="p-3">
                          <span className="bg-red-950 text-red-300 font-bold px-2 py-0.5 rounded border border-red-800">
                            {p.stock} {p.unit} remaining
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => { setEditingProduct(p); setShowProductModal(true); }}
                            className="btn-outline py-1 px-2.5 text-xs text-mandi-green hover:bg-mandi-green hover:text-black font-semibold"
                          >
                            Update Stock
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {showProductModal && (
        <ProductModal product={editingProduct} storeId={store.id} onClose={() => setShowProductModal(false)} onSave={handleSaveProduct} />
      )}
      {invoiceOrder && (
        <InvoiceModal order={invoiceOrder} onClose={() => setInvoiceOrder(null)} />
      )}
    </div>
  );
}
