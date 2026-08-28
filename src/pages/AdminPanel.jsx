import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useToast } from '../components/common/Toast';
import LazyImage from '../components/common/LazyImage';
import { seedVirarDatabase } from '../config/seedDatabase';
import { isFirebaseConfigured } from '../config/firebase';
import { 
  Shield, 
  Store, 
  Package, 
  Megaphone, 
  HelpCircle, 
  Check, 
  X, 
  Plus, 
  Trash2, 
  Edit3, 
  ShoppingBag, 
  TrendingUp, 
  AlertCircle, 
  Building2, 
  Database, 
  BarChart3, 
  ShieldAlert, 
  Zap, 
  Activity 
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';

export default function AdminPanel() {
  const { stores, addStore, updateStore, deleteStore, products, deleteProduct, orders, updateOrderStatus, banners, addBanner, deleteBanner, tickets, resolveTicket } = useData();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('analytics');
  const [showAddStoreModal, setShowAddStoreModal] = useState(false);
  const [newStore, setNewStore] = useState({
    name: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    address: '',
    city: 'Virar, Palghar',
    pincodes: '401305, 401303',
    deliveryTime: '15-20 min',
    minOrder: 99,
    image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&q=80',
  });
  const [seeding, setSeeding] = useState(false);

  const [newBannerTitle, setNewBannerTitle] = useState('');
  const [newBannerSub, setNewBannerSub] = useState('');
  const [replyText, setReplyText] = useState({});

  // Summary stats
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const pendingVendors = stores.filter(s => s.status === 'pending').length;
  const openTickets = tickets.filter(t => t.status === 'open').length;

  // Platform Analytics Computed from Firestore
  const vendorPerformance = useMemo(() => {
    const map = {};
    stores.forEach(s => {
      map[s.id] = { id: s.id, name: s.name, ordersCount: 0, revenue: 0, delayedCount: 0 };
    });

    const now = Date.now();
    orders.forEach(o => {
      if (map[o.storeId]) {
        map[o.storeId].ordersCount += 1;
        map[o.storeId].revenue += (o.total || 0);

        if (['placed', 'accepted'].includes(o.status)) {
          const age = (now - new Date(o.placedAt || 0).getTime()) / (60 * 1000);
          if (age > 10) map[o.storeId].delayedCount += 1;
        }
      }
    });

    return Object.values(map);
  }, [stores, orders]);

  // High-Risk / Suspicious Orders Guardrail Monitor
  const highRiskOrders = useMemo(() => {
    return orders.filter(o => {
      const isHighCod = o.paymentMethod === 'Cash on Delivery' && o.total >= 1500;
      const isManyItems = (o.items || []).length >= 10;
      return isHighCod || isManyItems;
    });
  }, [orders]);

  const handleCreateStore = (e) => {
    e.preventDefault();
    if (!newStore.name || !newStore.ownerName) {
      addToast('Please enter store name and owner name', 'error');
      return;
    }
    const pincodeArray = newStore.pincodes.split(',').map(p => p.trim());
    addStore({
      ...newStore,
      pincodes: pincodeArray,
    });
    addToast(`Store "${newStore.name}" created and approved!`, 'success');
    setShowAddStoreModal(false);
    setNewStore({
      name: '', ownerName: '', ownerEmail: '', ownerPhone: '', address: '', city: 'Virar, Palghar', pincodes: '401305, 401303', deliveryTime: '15-20 min', minOrder: 99, image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&q=80',
    });
  };

  const handleDeleteStore = (storeId, storeName) => {
    if (window.confirm(`Are you sure you want to remove ${storeName}? This action cannot be undone.`)) {
      deleteStore(storeId);
      addToast(`Store "${storeName}" has been removed from platform`, 'info');
    }
  };

  const handleSeedVirar = async () => {
    setSeeding(true);
    try {
      const res = await seedVirarDatabase();
      addToast(res.message, 'success', 5000);
      window.location.reload();
    } catch (err) {
      addToast('Failed to seed database', 'error');
    } finally {
      setSeeding(false);
    }
  };

  const handleCreateBanner = (e) => {
    e.preventDefault();
    if (!newBannerTitle.trim()) return;
    addBanner({ title: newBannerTitle, subtitle: newBannerSub, color: 'from-green-900 to-mandi-dark' });
    setNewBannerTitle(''); setNewBannerSub('');
    addToast('Promo banner published!', 'success');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-mandi-green rounded-xl flex items-center justify-center text-black font-black flex-shrink-0">
            <Shield size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-mandi-text font-black text-2xl">Super Admin Panel</h1>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${isFirebaseConfigured ? 'bg-mandi-green-muted text-mandi-green border border-mandi-green border-opacity-30' : 'bg-mandi-surface text-mandi-muted border border-mandi-border'}`}>
                {isFirebaseConfigured ? '🔥 Firebase Active' : '💾 Local Virar Engine'}
              </span>
            </div>
            <p className="text-mandi-muted text-xs">Virar Region (Palghar District, MH) Control Center</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={handleSeedVirar} disabled={seeding} className="btn-outline text-xs py-2 px-3 flex items-center gap-1.5 border-mandi-green text-mandi-green hover:bg-mandi-green hover:text-black transition-all">
            <Database size={14} /> {seeding ? 'Seeding...' : 'Re-Seed Virar Catalog'}
          </button>
          <button onClick={() => setShowAddStoreModal(true)} className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5">
            <Plus size={14} /> Add Kirana Store
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="card p-4">
          <span className="text-mandi-muted text-xs font-medium">Platform GMV</span>
          <p className="text-2xl font-black text-mandi-green mt-1">₹{totalRevenue}</p>
          <span className="text-mandi-subtle text-[11px]">Across all kirana stores</span>
        </div>
        <div className="card p-4">
          <span className="text-mandi-muted text-xs font-medium">Active Stores</span>
          <p className="text-2xl font-black text-mandi-text mt-1">{stores.length}</p>
          <span className="text-mandi-subtle text-[11px]">{pendingVendors} pending review</span>
        </div>
        <div className="card p-4">
          <span className="text-mandi-muted text-xs font-medium">Total Products</span>
          <p className="text-2xl font-black text-blue-400 mt-1">{products.length}</p>
          <span className="text-mandi-subtle text-[11px]">In Virar live catalog</span>
        </div>
        <div className="card p-4">
          <span className="text-mandi-muted text-xs font-medium">Support Tickets</span>
          <p className="text-2xl font-black text-yellow-400 mt-1">{openTickets}</p>
          <span className="text-mandi-subtle text-[11px]">{tickets.length - openTickets} resolved</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-mandi-border mb-6 overflow-x-auto scrollbar-none">
        {[
          { id: 'analytics', label: 'Analytics & SLA Oversight' },
          { id: 'stores', label: `Stores (${stores.length})` },
          { id: 'orders', label: `Orders (${orders.length})` },
          { id: 'products', label: `Products (${products.length})` },
          { id: 'banners', label: `Banners (${banners.length})` },
          { id: 'tickets', label: `Tickets (${tickets.length})` },
        ].map(t => (
          <button 
            key={t.id} 
            onClick={() => setActiveTab(t.id)} 
            className={`py-3 px-4 font-semibold text-sm border-b-2 whitespace-nowrap transition-all ${activeTab === t.id ? 'border-mandi-green text-mandi-green font-bold' : 'border-transparent text-mandi-muted hover:text-mandi-text'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 0: Analytics & SLA Oversight */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Vendor SLA Breakdown Table */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-mandi-text font-bold text-base flex items-center gap-2">
                  <Activity size={18} className="text-mandi-green" /> Vendor SLA & Fulfillment Compliance
                </h3>
                <p className="text-mandi-muted text-xs mt-0.5">Real-time performance tracking across all partner kirana stores</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-mandi-surface text-mandi-muted uppercase border-b border-mandi-border">
                  <tr>
                    <th className="p-3">Store</th>
                    <th className="p-3">Total Orders</th>
                    <th className="p-3">Revenue (₹)</th>
                    <th className="p-3">Delayed Orders</th>
                    <th className="p-3">SLA Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mandi-border">
                  {vendorPerformance.map(v => (
                    <tr key={v.id} className="hover:bg-mandi-surface transition-colors">
                      <td className="p-3 font-semibold text-mandi-text">{v.name}</td>
                      <td className="p-3 text-mandi-muted">{v.ordersCount}</td>
                      <td className="p-3 text-mandi-green font-bold">₹{v.revenue}</td>
                      <td className="p-3">
                        <span className={`font-bold ${v.delayedCount > 0 ? 'text-red-400' : 'text-mandi-muted'}`}>
                          {v.delayedCount}
                        </span>
                      </td>
                      <td className="p-3">
                        {v.delayedCount === 0 ? (
                          <span className="badge-green text-[10px]">Optimal (100%)</span>
                        ) : (
                          <span className="bg-red-900 text-red-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            ⚠️ SLA Delays
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* High-Risk Fraud Guardrail Monitor */}
          <div className="card p-6 border-orange-500 border-opacity-30 bg-orange-950 bg-opacity-10">
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert size={20} className="text-orange-400" />
              <h3 className="text-mandi-text font-bold text-base">Fraud & High-Risk Guardrail Monitor</h3>
            </div>
            <p className="text-mandi-muted text-xs mb-4">Orders automatically flagged for high COD value (&ge; ₹1,500) or high item density requiring verification</p>

            {highRiskOrders.length === 0 ? (
              <p className="text-mandi-green text-xs py-2">✓ No high-risk or suspicious orders detected.</p>
            ) : (
              <div className="space-y-2">
                {highRiskOrders.map(o => (
                  <div key={o.id} className="p-3 rounded-xl bg-mandi-surface border border-mandi-border flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-mandi-text">#{o.id.toUpperCase()}</span>
                      <span className="text-mandi-muted ml-2">{o.paymentMethod} • ₹{o.total} • {o.items?.length} items</span>
                    </div>
                    <span className="bg-orange-500 text-black px-2 py-0.5 rounded font-bold text-[10px]">
                      High Value COD Flag
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 1: Stores */}
      {activeTab === 'stores' && (
        <div className="space-y-4">
          {stores.map(s => (
            <div key={s.id} className="card p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <LazyImage src={s.image} alt={s.name} className="w-16 h-16 rounded-xl object-cover" containerClass="w-16 h-16 rounded-xl flex-shrink-0" width={100} quality={60} />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-mandi-text font-bold text-base">{s.name}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${s.status === 'approved' ? 'bg-mandi-green-muted text-mandi-green' : 'bg-yellow-900 text-yellow-200'}`}>{s.status}</span>
                  </div>
                  <p className="text-mandi-muted text-xs mt-0.5">{s.address}, {s.city}</p>
                  <p className="text-mandi-subtle text-xs mt-0.5">Owner: {s.ownerName || 'Kirana Partner'} • Phone: {s.ownerPhone || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                {s.status === 'pending' && (
                  <button onClick={() => { updateStore(s.id, { status: 'approved' }); addToast(`Store ${s.name} approved!`, 'success'); }} className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1">
                    <Check size={14} /> Approve
                  </button>
                )}
                <button onClick={() => handleDeleteStore(s.id, s.name)} className="p-2 rounded-xl bg-mandi-surface hover:bg-red-950 text-red-400 border border-mandi-border hover:border-red-500 transition-all">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="card p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-mandi-border">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-mandi-text font-bold text-base">#{order.id.toUpperCase()}</span>
                    <span className="badge-green text-xs capitalize">{order.status.replace(/_/g, ' ')}</span>
                  </div>
                  <p className="text-mandi-muted text-xs mt-0.5">Store: <strong>{order.storeName}</strong> • {new Date(order.placedAt).toLocaleString('en-IN')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-mandi-green font-black text-base">₹{order.total}</span>
                  <span className="text-mandi-muted text-xs">({order.paymentMethod})</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: Products */}
      {activeTab === 'products' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-mandi-surface text-mandi-muted text-xs uppercase border-b border-mandi-border">
              <tr>
                <th className="p-3">Product</th>
                <th className="p-3">Unit</th>
                <th className="p-3">Price</th>
                <th className="p-3">Stock</th>
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
                  <td className="p-3 text-xs">{p.stock}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => { deleteProduct(p.id); addToast('Product deleted', 'info'); }} className="p-1.5 rounded-lg bg-mandi-surface text-red-400 border border-mandi-border hover:border-red-500">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: Banners */}
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
                <div>
                  <p className="text-mandi-text font-bold text-sm">{b.title}</p>
                  <p className="text-mandi-muted text-xs">{b.subtitle}</p>
                </div>
                <button onClick={() => { deleteBanner(b.id); addToast('Banner removed', 'info'); }} className="text-red-400 hover:text-red-300 p-2"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Tickets */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {tickets.map(t => (
            <div key={t.id} className="card p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <HelpCircle size={16} className="text-mandi-green" />
                  <h3 className="text-mandi-text font-bold text-sm">{t.subject}</h3>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full uppercase font-bold ${t.status === 'open' ? 'bg-yellow-900 text-yellow-200' : 'bg-mandi-green-muted text-mandi-green'}`}>{t.status}</span>
              </div>
              <p className="text-mandi-muted text-xs mb-3">{t.message}</p>
              {t.reply ? (
                <div className="bg-mandi-surface p-3 rounded-xl border border-mandi-border text-xs">
                  <p className="text-mandi-green font-semibold mb-1">Admin Reply:</p>
                  <p className="text-mandi-text">{t.reply}</p>
                </div>
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

      {/* Modal: Add New Store by Admin */}
      {showAddStoreModal && (
        <div className="overlay flex items-center justify-center p-4">
          <div className="bg-mandi-card border border-mandi-border rounded-2xl p-6 w-full max-w-lg animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Store size={20} className="text-mandi-green" />
                <h2 className="text-mandi-text font-bold text-lg">Add New Kirana Store</h2>
              </div>
              <button onClick={() => setShowAddStoreModal(false)} className="text-mandi-subtle hover:text-mandi-text"><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateStore} className="space-y-4">
              <div>
                <label className="block text-mandi-muted text-xs font-medium mb-1">Store Name *</label>
                <input required value={newStore.name} onChange={e => setNewStore({ ...newStore, name: e.target.value })} placeholder="e.g. Super Kirana Bazaar" className="input-field text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-mandi-muted text-xs font-medium mb-1">Owner Name *</label>
                  <input required value={newStore.ownerName} onChange={e => setNewStore({ ...newStore, ownerName: e.target.value })} placeholder="Owner Name" className="input-field text-sm" />
                </div>
                <div>
                  <label className="block text-mandi-muted text-xs font-medium mb-1">Owner Mobile</label>
                  <input type="tel" value={newStore.ownerPhone} onChange={e => setNewStore({ ...newStore, ownerPhone: e.target.value })} placeholder="10-digit number" className="input-field text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-mandi-muted text-xs font-medium mb-1">Address *</label>
                <input required value={newStore.address} onChange={e => setNewStore({ ...newStore, address: e.target.value })} placeholder="Shop address, locality" className="input-field text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-mandi-muted text-xs font-medium mb-1">City *</label>
                  <input required value={newStore.city} onChange={e => setNewStore({ ...newStore, city: e.target.value })} className="input-field text-sm" />
                </div>
                <div>
                  <label className="block text-mandi-muted text-xs font-medium mb-1">Served Pincodes *</label>
                  <input required value={newStore.pincodes} onChange={e => setNewStore({ ...newStore, pincodes: e.target.value })} placeholder="401305, 401303" className="input-field text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-mandi-muted text-xs font-medium mb-1">Cover Image URL</label>
                <input value={newStore.image} onChange={e => setNewStore({ ...newStore, image: e.target.value })} placeholder="https://..." className="input-field text-sm" />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary flex-1 py-2.5 text-sm">Create & Approve Store</button>
                <button type="button" onClick={() => setShowAddStoreModal(false)} className="btn-ghost py-2.5 text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
