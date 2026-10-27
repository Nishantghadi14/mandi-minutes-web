import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import ProductModal from '../components/vendor/ProductModal';
import InvoiceModal from '../components/vendor/InvoiceModal';
import MasterCatalogModal from '../components/vendor/MasterCatalogModal';
import LocalSaleModal from '../components/vendor/LocalSaleModal';
import { useToast } from '../components/common/Toast';
import LazyImage from '../components/common/LazyImage';
import ImageUploadField from '../components/common/ImageUploadField';
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
  ArrowUpRight,
  Search,
  Filter,
  Sparkles,
  Settings,
  Save,
  Minus,
  Truck,
  CheckCircle2,
  Shield,
  ArrowLeft
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const PLATFORM_COMMISSION_RATE = 0.10; // 10% platform fee constant

export default function VendorDashboard() {
  const { user } = useAuth();
  const { stores, products: allProducts, categories, orders, updateOrderStatus, addProduct, updateProduct, deleteProduct, updateStore, recordLocalSale } = useData();
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const { storeId: routeStoreId } = useParams();
  const requestedStoreId = routeStoreId || searchParams.get('storeId');

  // Resolve store dynamically: matching requested store (if admin), logged-in vendor user email, storeId, or uid
  const store = useMemo(() => {
    if (!user) return null;

    // 1. Admin Inspection Mode: Allows Admin from Admin Panel to check any specific vendor's dashboard
    if (user.role === 'admin') {
      if (requestedStoreId) {
        const foundAdminStore = stores.find(s => s.id === requestedStoreId);
        if (foundAdminStore) return foundAdminStore;
      }
      return stores.find(s => s.id === 'store-mahalaxmi-1') || stores[0] || null;
    }

    // 2. Regular Vendor Resolution
    let found = stores.find(s => 
      (user.storeId && s.id === user.storeId) ||
      (user.email && s.ownerEmail?.toLowerCase() === user.email.toLowerCase()) ||
      (user.uid && s.id === user.uid)
    );
    if (!found && user.storeId) {
      try {
        const cached = JSON.parse(localStorage.getItem('mandi_synced_stores') || '[]');
        found = cached.find(s => s.id === user.storeId || s.ownerEmail?.toLowerCase() === user.email?.toLowerCase());
      } catch {}
    }
    if (!found && user.role === 'vendor' && user.storeId) {
      found = {
        id: user.storeId,
        name: user.storeName || 'My Kirana Store',
        ownerName: user.name || 'Store Partner',
        ownerEmail: user.email || '',
        ownerPhone: user.phone || '',
        rating: 0,
        totalRatings: 0,
        deliveryTime: '10-15 min',
        minOrder: 99,
        deliveryCharge: 0,
        isOpen: true,
        status: 'approved',
        categories: ['cat-1', 'cat-2', 'cat-3', 'cat-4'],
      };
    }
    return found || (user.role === 'vendor' ? null : stores[0]);
  }, [stores, user, requestedStoreId]);

  const products = useMemo(() => {
    if (!store?.id) return [];
    return allProducts.filter(p => p.storeId === store.id || (!p.storeId && store.id === 'store-mahalaxmi-1'));
  }, [store?.id, allProducts]);

  const storeOrders = useMemo(() => {
    if (!store?.id) return [];
    return (orders || []).filter(o => 
      o.storeId === store.id || 
      (!o.storeId && store.id === 'store-mahalaxmi-1')
    ).sort((a, b) => new Date(b.placedAt || 0) - new Date(a.placedAt || 0));
  }, [store?.id, orders]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const noteMap = {
        accepted: 'Store accepted the order and started packing',
        preparing: 'Store is actively packing the fresh items for dispatch',
        out_for_delivery: 'Items packed and handed to delivery partner for dispatch',
      };
      await updateOrderStatus(orderId, newStatus, noteMap[newStatus] || `Order status updated to ${newStatus}`);
      addToast(`Order #${orderId.slice(-6).toUpperCase()} updated to ${newStatus.replace(/_/g, ' ')}! 🎉`, 'success');
    } catch (err) {
      console.error('Vendor order status update error:', err);
      addToast('Failed to update order status. Please try again.', 'error');
    }
  };

  const [activeTab, setActiveTab] = useState('orders');
  const [editingProduct, setEditingProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showMasterModal, setShowMasterModal] = useState(false);
  const [showLocalSaleModal, setShowLocalSaleModal] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [orderFilter, setOrderFilter] = useState('all');
  const [timeframe, setTimeframe] = useState('7d'); // '7d' | '30d'
  const [stockThreshold, setStockThreshold] = useState(5);
  
  // Store Customization Form State
  const [storeForm, setStoreForm] = useState({
    name: '',
    ownerName: '',
    ownerPhone: '',
    description: '',
    status: 'approved',
    deliveryTime: '10-15 min',
    minOrder: 99,
    deliveryCharge: 0,
    image: '',
    coverImage: '',
    pincodes: '401305, 401303',
    address: '',
    city: 'Virar, Palghar',
    upiId: '',
    gstin: '',
  });

  // Sync storeForm when active store loads
  useEffect(() => {
    if (store) {
      setStoreForm({
        name: store.name || '',
        ownerName: store.ownerName || user?.name || '',
        ownerPhone: store.ownerPhone || user?.phone || '',
        description: store.description || '',
        status: store.status || 'approved',
        deliveryTime: store.deliveryTime || '10-15 min',
        minOrder: store.minOrder || 99,
        deliveryCharge: store.deliveryCharge || 0,
        image: store.image || '',
        coverImage: store.coverImage || '',
        pincodes: Array.isArray(store.pincodes) ? store.pincodes.join(', ') : (store.pincodes || '401305, 401303'),
        address: store.address || '',
        city: store.city || 'Virar, Palghar',
        upiId: store.upiId || '',
        gstin: store.gstin || '',
      });
    }
  }, [store, user]);
  
  // Product Search & Filter states
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  // Filtered products list for table display
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = !productSearch || p.name?.toLowerCase().includes(productSearch.toLowerCase()) || p.brand?.toLowerCase().includes(productSearch.toLowerCase());
      const matchesCat = selectedCategoryFilter === 'all' || p.category === selectedCategoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [products, productSearch, selectedCategoryFilter]);

  // Inline Price & Stock update handlers
  const handleInlinePriceChange = async (productId, newPrice) => {
    const pVal = parseFloat(newPrice);
    if (isNaN(pVal) || pVal <= 0) return;
    try {
      await updateProduct(productId, { price: pVal });
      addToast(`Price updated to ₹${pVal}`, 'success', 2000);
    } catch (err) {
      addToast(err.message || 'Could not update price', 'error');
    }
  };

  const handleStockAdjust = async (productId, currentStock, delta) => {
    const nextStock = Math.max(0, Number(currentStock) + delta);
    try {
      await updateProduct(productId, { stock: nextStock, isAvailable: nextStock > 0 });
      addToast(`Stock updated to ${nextStock}`, 'info', 2000);
    } catch (err) {
      addToast(err.message || 'Could not update stock', 'error');
    }
  };

  // SLA Calculation for Active Orders
  const ordersWithSla = useMemo(() => {
    const now = Date.now();
    return storeOrders.map(order => {
      const placedTimestamp = new Date(order.placedAt || 0).getTime();
      const elapsedMinutes = Math.floor((now - placedTimestamp) / (60 * 1000));

      let slaStatus = 'ok';
      let slaMessage = '';

      if (order.isLocalSale || order.orderType === 'local_sale') {
        slaMessage = 'Direct Counter Sale';
      } else if (order.deliveryType === 'scheduled') {
        slaMessage = `Scheduled for ${order.scheduledSlot?.label || order.scheduledSlot?.date || 'Slot'}`;
      } else if (order.deliveryType === 'same-day' && order.scheduledSlot?.id && order.scheduledSlot.id !== 'same-day-express') {
        slaMessage = `Same-Day (${order.scheduledSlot?.label || 'Today'})`;
      } else {
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
    
    const completedOrOut = storeOrders.filter(o => ['delivered', 'out_for_delivery'].includes(o.status));
    const onTimeOrders = completedOrOut.filter(o => {
      if (o.isLocalSale || o.orderType === 'local_sale') return true;
      const acceptStep = o.statusHistory?.find(h => h.status === 'accepted');
      if (!acceptStep) return true;
      const acceptDiff = (new Date(acceptStep.time).getTime() - new Date(o.placedAt).getTime()) / (60 * 1000);
      return acceptDiff <= 5;
    });
    const slaRate = completedOrOut.length > 0 ? Math.round((onTimeOrders.length / completedOrOut.length) * 100) : 100;

    return { rev: totalRev, count: storeOrders.length, pending, lowStock, slaRate };
  }, [storeOrders, products, stockThreshold]);

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

  const lowStockProducts = useMemo(() => {
    return products.filter(p => Number(p.stock) <= stockThreshold);
  }, [products, stockThreshold]);

  const earningsSummary = useMemo(() => {
    const grossSales = storeOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const onlineOrders = storeOrders.filter(o => !o.isLocalSale && o.orderType !== 'local_sale');
    const localOrders = storeOrders.filter(o => o.isLocalSale || o.orderType === 'local_sale');
    const onlineSales = onlineOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const localSales = localOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const platformCommission = Math.round(onlineSales * PLATFORM_COMMISSION_RATE);
    const netPayout = grossSales - platformCommission;
    const deliveredCount = storeOrders.filter(o => o.status === 'delivered').length;
    return { grossSales, onlineSales, localSales, platformCommission, netPayout, deliveredCount, rate: PLATFORM_COMMISSION_RATE * 100 };
  }, [storeOrders]);

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

  const localSalesCount = useMemo(() => {
    return storeOrders.filter(o => o.isLocalSale || o.orderType === 'local_sale').length;
  }, [storeOrders]);

  const filteredOrders = useMemo(() => {
    if (orderFilter === 'all') return ordersWithSla;
    if (orderFilter === 'sla_breach') return slaBreachedOrders;
    if (orderFilter === 'local_sale') return ordersWithSla.filter(o => o.isLocalSale || o.orderType === 'local_sale');
    return ordersWithSla.filter(o => o.status === orderFilter && !o.isLocalSale && o.orderType !== 'local_sale');
  }, [ordersWithSla, slaBreachedOrders, orderFilter]);

  const handleSaveProduct = async (prodData) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, prodData);
        addToast('Product updated!', 'success');
      } else {
        await addProduct({ ...prodData, storeId: store.id });
        addToast('Product added to catalog!', 'success');
      }
      setShowProductModal(false);
      setEditingProduct(null);
    } catch (err) { addToast(err.message || 'Could not save product.', 'error'); }
  };

  const handleCreateLocalSale = async (salePayload) => {
    try {
      const completedOrder = await recordLocalSale(salePayload);
      addToast('🎉 Local sale recorded and stock deducted!', 'success', 3500);
      return completedOrder;
    } catch (err) {
      console.error('Local sale creation error:', err);
      addToast(err.message || 'Could not record local sale.', 'error');
      throw err;
    }
  };

  const handleBatchSaveProducts = async (prodList) => {
    if (!store) return;
    try {
      for (const prod of prodList) {
        await addProduct({ ...prod, storeId: store.id });
      }
      addToast(`🎉 Added ${prodList.length} items to your shop catalog!`, 'success', 4000);
    } catch (err) {
      addToast(err.message || 'Could not add master products.', 'error');
    }
  };

  const handleSaveStoreCustomization = async (e) => {
    e.preventDefault();
    if (!store) return;
    try {
      const pinArray = storeForm.pincodes
        .split(',')
        .map(p => p.trim())
        .filter(Boolean);

      const updates = {
        name: storeForm.name,
        ownerName: storeForm.ownerName,
        ownerPhone: storeForm.ownerPhone,
        description: storeForm.description,
        status: storeForm.status,
        isOpen: storeForm.status !== 'closed',
        deliveryTime: storeForm.deliveryTime,
        minOrder: Number(storeForm.minOrder) || 99,
        deliveryCharge: Number(storeForm.deliveryCharge) || 0,
        image: storeForm.image,
        coverImage: storeForm.coverImage,
        pincodes: pinArray,
        address: storeForm.address,
        city: storeForm.city,
        upiId: storeForm.upiId,
        gstin: storeForm.gstin,
        updatedAt: new Date().toISOString(),
      };

      await updateStore(store.id, updates);
      addToast('🎉 Shop settings & customization updated successfully!', 'success', 4000);
    } catch (err) {
      addToast(err.message || 'Could not update store settings.', 'error');
    }
  };

  const handleToggleStoreStatus = async () => {
    if (!store?.id) return;
    const isCurrentlyClosed = store.status === 'closed' || store.isOpen === false;
    const nextStatus = isCurrentlyClosed ? 'approved' : 'closed';
    const nextIsOpen = isCurrentlyClosed;
    try {
      await updateStore(store.id, {
        status: nextStatus,
        isOpen: nextIsOpen,
        updatedAt: new Date().toISOString(),
      });
      setStoreForm(f => ({ ...f, status: nextStatus }));
      addToast(
        nextIsOpen 
          ? '🟢 Store is now OPEN & accepting online orders!' 
          : '🔴 Store is now PAUSED (walk-in counter sales only)', 
        nextIsOpen ? 'success' : 'info', 
        3000
      );
    } catch (err) {
      addToast(err.message || 'Could not update store status', 'error');
    }
  };

  if (!store) {
    if (user?.role === 'admin') {
      return (
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <div className="card p-8 border-amber-500/30 bg-amber-950/20 space-y-4">
            <Shield size={48} className="text-amber-400 mx-auto" />
            <h2 className="text-xl font-bold text-mandi-text">Admin Vendor Inspection</h2>
            <p className="text-mandi-muted text-sm max-w-md mx-auto">
              Select a vendor from the list to inspect their orders, inventory catalog, and store operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    setSearchParams({ storeId: e.target.value });
                  }
                }}
                defaultValue=""
                className="input-field text-sm py-2 px-3 bg-mandi-surface border border-mandi-border text-mandi-text cursor-pointer"
              >
                <option value="" disabled>Choose a Vendor / Store...</option>
                {stores.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                ))}
              </select>
              <Link to="/admin" className="btn-outline text-sm py-2 px-4">
                Back to Admin Panel
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="card p-8 border-orange-500/30 bg-orange-500/10 space-y-4">
          <Store size={48} className="text-orange-500 dark:text-orange-400 mx-auto" />
          <h2 className="text-xl font-bold text-mandi-text">Store Not Linked</h2>
          <p className="text-mandi-muted text-sm max-w-md mx-auto">
            Your vendor account is not associated with an active store. Please complete vendor onboarding or contact support.
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
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-24 md:pb-6">
      {/* Super Admin Vendor Inspection Mode Banner */}
      {/* Super Admin Vendor Inspection Mode Banner */}
      {user?.role === 'admin' && (
        <div className="mb-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-black font-black flex items-center justify-center flex-shrink-0">
                <Shield size={14} />
              </div>
              <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/40 px-1.5 py-0.5 rounded">
                  Super Admin Inspection Mode
                </span>
                <span className="text-mandi-text font-bold text-xs truncate">
                  {store.name}
                </span>
                <span className="text-mandi-subtle text-[10px]">
                  (ID: <span className="font-mono text-mandi-muted">{store.id}</span>)
                </span>
              </div>
            </div>

            <Link
              to="/admin"
              className="btn-outline text-[11px] py-1 px-2.5 flex items-center gap-1 font-bold whitespace-nowrap flex-shrink-0"
            >
              <ArrowLeft size={12} /> Back to Admin Panel
            </Link>
          </div>

          <div className="flex items-center gap-1.5 bg-mandi-surface border border-mandi-border rounded-lg px-2.5 py-1.5 text-xs text-mandi-text w-full">
            <Store size={13} className="text-amber-400 flex-shrink-0" />
            <span className="text-mandi-muted text-[11px] font-medium flex-shrink-0">Switch Vendor:</span>
            <select
              value={store.id}
              onChange={(e) => {
                setSearchParams({ storeId: e.target.value });
              }}
              className="bg-transparent font-bold text-mandi-green outline-none cursor-pointer text-xs flex-1 min-w-0 truncate"
            >
              {stores.map(st => (
                <option key={st.id} value={st.id} className="bg-mandi-card text-mandi-text">
                  {st.name} ({st.city || 'Virar'})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* SLA Alert Urgent Banner */}
      {slaBreachedOrders.length > 0 && (
        <div className="mb-3 p-3 rounded-2xl bg-red-500/15 border border-red-500/40 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldAlert size={18} className="text-red-500 dark:text-red-400 flex-shrink-0" />
            <p className="font-bold text-xs text-red-600 dark:text-red-300 truncate">
              🚨 SLA Urgency Alert: {slaBreachedOrders.length} Order{slaBreachedOrders.length > 1 ? 's' : ''} Delayed!
            </p>
          </div>
          <button
            onClick={() => setOrderFilter('sla_breach')}
            className="btn-primary text-[11px] py-1.5 px-3 bg-red-600 hover:bg-red-500 text-white font-bold whitespace-nowrap flex-shrink-0 shadow-sm"
          >
            Review ({slaBreachedOrders.length})
          </button>
        </div>
      )}

      {/* Clean App Header Bar */}
      <div className="card p-3 sm:p-4 mb-3.5 bg-mandi-card border border-mandi-border/80 shadow-sm">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-11 h-11 min-w-[44px] min-h-[44px] max-w-[44px] max-h-[44px] rounded-xl overflow-hidden border border-mandi-border/70 bg-mandi-surface flex-shrink-0 shadow-sm">
              <LazyImage
                src={store.image}
                alt={store.name}
                className="w-full h-full object-cover"
                containerClass="w-full h-full"
                width={100}
                quality={60}
                fallbackText="Store"
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-black text-mandi-text leading-tight truncate">
                {store.name}
              </h1>
              <p className="text-mandi-muted text-[11px] truncate mt-0.5">
                Vendor Portal • {store.city || 'Virar Region'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleStoreStatus}
            className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 flex-shrink-0 shadow-sm cursor-pointer ${
              store.status === 'closed'
                ? 'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25'
                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
            }`}
            title="Tap to toggle Store Open / Paused status"
          >
            <span className={`w-2 h-2 rounded-full ${store.status === 'closed' ? 'bg-red-500' : 'bg-emerald-400 animate-pulse'}`} />
            <span>{store.status === 'closed' ? 'Store Paused' : 'Store Open'}</span>
          </button>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch gap-2 mb-3.5">
        <button 
          type="button"
          onClick={() => setShowLocalSaleModal(true)} 
          className="btn-primary flex-1 bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-500 hover:from-emerald-500 hover:to-green-400 text-white flex items-center justify-center gap-1.5 text-xs font-black py-2.5 px-4 shadow-md active:scale-95 transition-all"
          title="Create in-store counter sale and deduct stock"
        >
          <Zap size={16} className="text-yellow-300" />
          <span>Create Local Sale (POS)</span>
        </button>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <button 
            onClick={() => setShowMasterModal(true)} 
            className="btn-outline text-mandi-green border-mandi-green/40 hover:bg-mandi-green hover:text-black flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 px-3 transition-all whitespace-nowrap"
          >
            <Sparkles size={14} />
            <span className="hidden sm:inline">Browse Master Catalog</span>
            <span className="sm:hidden">Master Catalog</span>
          </button>
          <button 
            onClick={() => { setEditingProduct(null); setShowProductModal(true); }} 
            className="btn-outline flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 px-3 whitespace-nowrap"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Add Custom Product</span>
            <span className="sm:hidden">Add Product</span>
          </button>
        </div>
      </div>

      {/* Stats Cards - Swipeable Carousel on Mobile, 5-col Grid on Desktop */}
      <div className="flex md:grid md:grid-cols-5 gap-2 overflow-x-auto pb-1 mb-3.5 scrollbar-none">
        <div className="card p-2.5 sm:p-3 min-w-[130px] flex-shrink-0 md:min-w-0 bg-mandi-card border border-mandi-border/70">
          <div className="flex items-center justify-between mb-1">
            <span className="text-mandi-muted text-[10px] sm:text-xs font-medium">Revenue</span>
            <TrendingUp size={14} className="text-mandi-green" />
          </div>
          <div className="text-lg sm:text-xl font-black text-mandi-green leading-none">₹{stats.rev}</div>
          <span className="text-mandi-subtle text-[10px] mt-1 block">All-time sales</span>
        </div>

        <div className="card p-2.5 sm:p-3 min-w-[130px] flex-shrink-0 md:min-w-0 bg-mandi-card border border-mandi-border/70">
          <div className="flex items-center justify-between mb-1">
            <span className="text-mandi-muted text-[10px] sm:text-xs font-medium">Total Orders</span>
            <ShoppingBag size={14} className="text-blue-400" />
          </div>
          <div className="text-lg sm:text-xl font-black text-mandi-text leading-none">{stats.count}</div>
          <span className="text-mandi-subtle text-[10px] mt-1 block">Completed & active</span>
        </div>

        <div className="card p-2.5 sm:p-3 min-w-[130px] flex-shrink-0 md:min-w-0 bg-mandi-card border border-mandi-border/70">
          <div className="flex items-center justify-between mb-1">
            <span className="text-mandi-muted text-[10px] sm:text-xs font-medium">Active Orders</span>
            <Clock size={14} className="text-yellow-400" />
          </div>
          <div className="text-lg sm:text-xl font-black text-yellow-400 leading-none">{stats.pending}</div>
          <span className="text-mandi-subtle text-[10px] mt-1 block">Need action</span>
        </div>

        <div className="card p-2.5 sm:p-3 min-w-[130px] flex-shrink-0 md:min-w-0 bg-mandi-card border border-mandi-border/70">
          <div className="flex items-center justify-between mb-1">
            <span className="text-mandi-muted text-[10px] sm:text-xs font-medium">SLA</span>
            <Zap size={14} className="text-mandi-green" />
          </div>
          <div className="text-lg sm:text-xl font-black text-mandi-green leading-none">{stats.slaRate}%</div>
          <span className="text-mandi-subtle text-[10px] mt-1 block">&le; 5 min acceptance</span>
        </div>

        <div 
          onClick={() => setActiveTab('analytics')}
          className="card p-2.5 sm:p-3 min-w-[130px] flex-shrink-0 md:min-w-0 bg-mandi-card border border-mandi-border/70 hover:border-orange-400/50 cursor-pointer"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-mandi-muted text-[10px] sm:text-xs font-medium">Low Stock</span>
            <AlertTriangle size={14} className="text-orange-400" />
          </div>
          <div className="text-lg sm:text-xl font-black text-orange-400 leading-none">{stats.lowStock}</div>
          <span className="text-mandi-subtle text-[10px] mt-1 block">&le; 5 units left</span>
        </div>
      </div>

      {/* App-Style Segmented Tab Bar */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-3.5 border-b border-mandi-border/70 scrollbar-none">
        {[
          { id: 'orders', label: 'Orders', icon: ShoppingBag, count: storeOrders.length },
          { id: 'products', label: 'Products & Pricing', icon: Layers, count: products.length },
          { id: 'analytics', label: 'Sales & SLA Analytics', icon: TrendingUp },
          { id: 'customization', label: 'Shop Settings', icon: Settings },
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`py-2 px-3 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-mandi-green text-black font-extrabold shadow-md'
                  : 'bg-mandi-surface text-mandi-muted hover:text-mandi-text border border-mandi-border/60'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-black' : 'text-mandi-muted'} />
              <span>{t.label}</span>
              {t.count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  isActive ? 'bg-black/20 text-black' : 'bg-mandi-card text-mandi-muted border border-mandi-border'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-3">

          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { id: 'all', label: 'All Orders' },
              { id: 'local_sale', label: `🏪 Local Sales (${localSalesCount})` },
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
            <div className="card p-8 text-center text-mandi-muted text-xs">No orders matching filter</div>
          ) : (
            filteredOrders.map(order => (
              <div 
                key={order.id} 
                className={`card p-3.5 sm:p-5 space-y-3 transition-all ${order.slaStatus === 'breached' ? 'border-red-500/40 bg-red-500/10' : ''}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-mandi-border">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-mandi-text font-bold text-sm sm:text-base">#{order.id.toUpperCase()}</span>
                      <span className="badge-green text-xs capitalize">{order.status.replace(/_/g, ' ')}</span>
                      {order.isLocalSale && (
                        <span className="bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                          <Store size={11} /> Local Sale
                        </span>
                      )}
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
                        <span className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                          📅 Scheduled: {order.scheduledSlot?.label || order.scheduledSlot?.timeWindow || 'Slot'}
                        </span>
                      )}
                      {order.deliveryType === 'same-day' && (
                        <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                          ⚡ Same-Day: {order.scheduledSlot?.label || 'Today'}
                        </span>
                      )}
                    </div>
                    <p className="text-mandi-muted text-xs mt-0.5">Placed: {new Date(order.placedAt).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                    <a
                      href={order.isLocalSale && order.customerPhone 
                        ? `https://api.whatsapp.com/send?phone=91${order.customerPhone.replace(/\D/g, '')}&text=${encodeURIComponent(`Hello ${order.customerName || 'Customer'}! Here is your bill receipt for ₹${order.total} from ${store.name}. Thank you for shopping with us!`)}`
                        : `https://api.whatsapp.com/send?phone=919920941603&text=${encodeURIComponent(`Hello! Updating you regarding your Mandi Minutes Order #${order.id.toUpperCase()} from ${store.name}.`)}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#25D366] text-black font-bold py-1.5 px-3 text-xs rounded-xl flex items-center gap-1 hover:bg-opacity-90 transition-all shadow-sm flex-1 sm:flex-initial justify-center"
                    >
                      <MessageCircle size={13} /> WhatsApp
                    </a>
                    <button type="button" onClick={() => setInvoiceOrder(order)} className="btn-outline py-1.5 px-3 text-xs flex items-center gap-1 flex-1 sm:flex-initial justify-center"><Printer size={12} />Invoice</button>
                    {order.isLocalSale ? (
                      <span className="text-xs font-bold text-mandi-green bg-mandi-green/15 border border-mandi-green/30 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 shadow-sm w-full sm:w-auto">
                        <CheckCircle2 size={13} className="text-mandi-green" /> In-Store Completed
                      </span>
                    ) : (
                      <>
                        {order.status === 'placed' && (
                          <button type="button" onClick={() => handleStatusChange(order.id, 'accepted')} className="btn-primary py-2 px-4 text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all w-full sm:w-auto text-center">Accept Order</button>
                        )}
                        {order.status === 'accepted' && (
                          <button type="button" onClick={() => handleStatusChange(order.id, 'preparing')} className="btn-primary py-2 px-4 text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all w-full sm:w-auto text-center">Start Packing</button>
                        )}
                        {order.status === 'preparing' && (
                          <button type="button" onClick={() => handleStatusChange(order.id, 'out_for_delivery')} className="btn-primary py-2 px-4 text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all w-full sm:w-auto text-center">Ready for Delivery Partner</button>
                        )}
                        {order.status === 'out_for_delivery' && (
                          <span className="text-xs font-bold text-amber-500 bg-amber-500/15 border border-amber-500/30 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 shadow-sm w-full sm:w-auto">
                            <Truck size={13} className="text-amber-500" /> With Delivery Partner
                          </span>
                        )}
                        {order.status === 'delivered' && (
                          <span className="text-xs font-bold text-mandi-green bg-mandi-green/15 border border-mandi-green/30 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 shadow-sm w-full sm:w-auto">
                            <CheckCircle2 size={13} className="text-mandi-green" /> Delivered by Partner
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-mandi-subtle mb-1">{order.isLocalSale ? 'Customer & Counter Pickup:' : 'Customer Address:'}</p>
                    <p className="text-mandi-text font-medium">
                      {order.isLocalSale 
                        ? `${order.customerName || 'Walk-in Customer'} ${order.customerPhone ? `(${order.customerPhone})` : ''}`
                        : `${order.address?.line1}, ${order.address?.city} - ${order.address?.pincode}`}
                    </p>
                    {order.notes && <p className="text-mandi-subtle text-[11px] italic mt-0.5">&ldquo;{order.notes}&rdquo;</p>}
                  </div>
                  <div>
                    <p className="text-mandi-subtle mb-1">Payment & Total:</p>
                    <p className="text-mandi-text font-bold">{order.paymentMethod} • <span className="text-mandi-green">₹{order.total}</span></p>
                    {order.paymentDetails?.utr && (
                      <p className="text-mandi-green font-mono text-[11px] mt-0.5">UTR / Ref: {order.paymentDetails.utr}</p>
                    )}
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

      {/* TAB 2: Products & Price Management */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Search & Category Filter Bar */}
          <div className="card p-3.5 sm:p-4 flex flex-col sm:flex-row gap-3 items-center justify-between bg-mandi-card border border-mandi-border shadow-sm">
            <div className="relative flex-1 w-full">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-mandi-subtle" />
              <input
                type="text"
                placeholder="Search products by name or brand..."
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                className="input-field pl-9 pr-8 text-xs w-full py-2"
              />
              {productSearch && (
                <button
                  type="button"
                  onClick={() => setProductSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-mandi-subtle hover:text-mandi-text text-xs p-1"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
              <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
                <Filter size={14} className="text-mandi-muted flex-shrink-0" />
                <select
                  value={selectedCategoryFilter}
                  onChange={e => setSelectedCategoryFilter(e.target.value)}
                  className="input-field text-xs py-2 px-2.5 w-full sm:w-auto cursor-pointer"
                >
                  <option value="all">All Categories ({products.length})</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <button
                type="button"
                onClick={() => setShowLocalSaleModal(true)}
                className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5 whitespace-nowrap shadow-sm hover:scale-105 active:scale-95 transition-all font-bold flex-shrink-0"
                title="Open quick POS to record an in-store sale and deduct stock"
              >
                <Zap size={13} className="text-yellow-300" /> POS Sale
              </button>
            </div>
          </div>

          {/* MOBILE PRODUCT CARDS (< md): Touch-Friendly App Experience (No Sideways Scroll) */}
          <div className="md:hidden space-y-3">
            {filteredProducts.length === 0 ? (
              <div className="card p-8 text-center text-mandi-muted text-xs">
                No products found matching &ldquo;{productSearch || selectedCategoryFilter}&rdquo;.
              </div>
            ) : (
              filteredProducts.map(p => (
                <div 
                  key={`mob-${p.id}`} 
                  className={`card p-3.5 space-y-3 bg-mandi-card border transition-all ${
                    p.stock <= stockThreshold ? 'border-amber-500/30 shadow-sm' : 'border-mandi-border/80'
                  }`}
                >
                  {/* Top Row: Thumbnail, Name, Unit, MRP, Edit/Delete */}
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-mandi-border/60 bg-mandi-surface flex-shrink-0">
                      <LazyImage
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-cover"
                        containerClass="w-full h-full"
                        width={100}
                        quality={50}
                        fallbackText="Item"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-sm font-bold text-mandi-text line-clamp-1">{p.name}</h4>
                        <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                          <button
                            type="button"
                            onClick={() => { setEditingProduct(p); setShowProductModal(true); }}
                            className="p-1.5 rounded-lg bg-mandi-surface hover:border-mandi-green text-mandi-muted hover:text-mandi-text border border-mandi-border"
                            title="Edit details"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => { deleteProduct(p.id); addToast('Product deleted', 'info'); }}
                            className="p-1.5 rounded-lg bg-mandi-surface hover:border-red-500 text-red-400 border border-mandi-border"
                            title="Delete product"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-mandi-subtle truncate mt-0.5">
                        {p.brand || 'Local Brand'} • {p.unit} {p.mrp ? `• MRP ₹${p.mrp}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Touch Controls Row: Price Input, Stock Stepper, In-Stock Toggle */}
                  <div className="grid grid-cols-12 gap-2 items-center pt-2.5 border-t border-mandi-border/60">
                    {/* Inline Selling Price */}
                    <div className="col-span-4 flex items-center bg-mandi-surface border border-mandi-border focus-within:border-mandi-green rounded-xl px-2 py-1.5">
                      <span className="text-mandi-green font-bold text-xs mr-1">₹</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="1"
                        step="0.5"
                        defaultValue={p.price}
                        key={`mob-price-${p.id}-${p.price}`}
                        onBlur={e => handleInlinePriceChange(p.id, e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
                        className="w-full bg-transparent text-xs font-bold text-mandi-green focus:outline-none"
                        title="Tap to edit selling price"
                      />
                    </div>

                    {/* Touch Stock Stepper */}
                    <div className="col-span-5 flex items-center justify-between bg-mandi-surface border border-mandi-border rounded-xl p-1">
                      <button
                        type="button"
                        onClick={() => handleStockAdjust(p.id, p.stock, -1)}
                        className="w-7 h-7 rounded-lg bg-mandi-card hover:bg-red-500/20 active:scale-90 text-mandi-muted hover:text-red-400 flex items-center justify-center font-black transition-all"
                        title="Decrease stock"
                      >
                        <Minus size={12} />
                      </button>
                      <span className={`text-xs font-black px-1 ${p.stock <= stockThreshold ? 'text-red-400' : 'text-mandi-text'}`}>
                        {p.stock}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleStockAdjust(p.id, p.stock, 1)}
                        className="w-7 h-7 rounded-lg bg-mandi-card hover:bg-mandi-green/20 active:scale-90 text-mandi-muted hover:text-mandi-green flex items-center justify-center font-black transition-all"
                        title="Increase stock"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Availability Toggle */}
                    <div className="col-span-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => updateProduct(p.id, { isAvailable: !p.isAvailable })}
                        className={`w-full py-1.5 rounded-xl text-[10px] font-bold text-center transition-all active:scale-95 ${
                          p.isAvailable 
                            ? 'bg-mandi-green-muted text-mandi-green border border-mandi-green/30' 
                            : 'bg-red-500/15 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {p.isAvailable ? 'In Stock' : 'Out'}
                      </button>
                    </div>
                  </div>

                  {p.stock <= stockThreshold && (
                    <div className="flex items-center gap-1.5 text-[10px] text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/25">
                      <AlertTriangle size={11} className="flex-shrink-0" />
                      <span>Low stock: only {p.stock} {p.unit} remaining on shelf</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* DESKTOP PRODUCT TABLE (>= md) */}
          <div className="hidden md:block card overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-mandi-surface text-mandi-muted text-xs uppercase border-b border-mandi-border">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3">Unit</th>
                  <th className="p-3">Selling Price (₹)</th>
                  <th className="p-3">Stock Quantity</th>
                  <th className="p-3">Availability</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mandi-border">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-mandi-muted text-xs">
                      No products found matching search/filter.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(p => (
                    <tr key={p.id} className="hover:bg-mandi-surface transition-colors">
                      <td className="p-3 flex items-center gap-3">
                        <LazyImage src={p.image} alt={p.name} className="w-full h-full object-cover rounded-lg" containerClass="w-10 h-10 rounded-lg flex-shrink-0" width={100} quality={50} />
                        <div>
                          <p className="text-mandi-text font-semibold text-xs">{p.name}</p>
                          <p className="text-mandi-subtle text-[11px]">{p.brand || 'Local Vendor'} {p.mrp ? `• MRP ₹${p.mrp}` : ''}</p>
                        </div>
                      </td>
                      <td className="p-3 text-mandi-muted text-xs">{p.unit}</td>
                      
                      {/* Inline Quick Price Edit */}
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-mandi-green font-bold text-xs">₹</span>
                          <input
                            type="number"
                            min="1"
                            step="0.5"
                            defaultValue={p.price}
                            key={`price-${p.id}-${p.price}`}
                            onBlur={e => handleInlinePriceChange(p.id, e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
                            className="w-20 bg-mandi-surface border border-mandi-border focus:border-mandi-green rounded-lg py-1 px-2 text-xs font-bold text-mandi-green text-left focus:outline-none"
                            title="Click to edit selling price"
                          />
                        </div>
                      </td>

                      {/* Inline Quick Stock Controls */}
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStockAdjust(p.id, p.stock, -1)}
                            className="w-6 h-6 rounded-md bg-mandi-surface border border-mandi-border hover:border-red-500 hover:text-red-400 flex items-center justify-center text-xs font-bold text-mandi-muted transition-all active:scale-95"
                            title="Decrease stock"
                          >
                            <Minus size={12} />
                          </button>
                          <span className={`w-8 text-center text-xs font-bold ${p.stock <= stockThreshold ? 'text-red-400' : 'text-mandi-text'}`}>
                            {p.stock}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleStockAdjust(p.id, p.stock, 1)}
                            className="w-6 h-6 rounded-md bg-mandi-surface border border-mandi-border hover:border-mandi-green hover:text-mandi-green flex items-center justify-center text-xs font-bold text-mandi-muted transition-all active:scale-95"
                            title="Increase stock"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </td>

                      <td className="p-3">
                        <button onClick={() => updateProduct(p.id, { isAvailable: !p.isAvailable })} className={`text-[11px] px-2.5 py-1 rounded-full font-semibold transition-all ${p.isAvailable ? 'bg-mandi-green-muted text-mandi-green' : 'bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/30'}`}>
                          {p.isAvailable ? 'In Stock' : 'Out of Stock'}
                        </button>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => { setEditingProduct(p); setShowProductModal(true); }} className="p-1.5 rounded-lg bg-mandi-surface hover:border-mandi-green text-mandi-muted hover:text-mandi-text border border-mandi-border" title="Edit details"><Edit size={14} /></button>
                          <button onClick={() => { deleteProduct(p.id); addToast('Product deleted', 'info'); }} className="p-1.5 rounded-lg bg-mandi-surface hover:border-red-500 text-red-400 border border-mandi-border" title="Delete product"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-5 sm:space-y-6">
          {/* Earnings Summary Cards - 2x2 on Mobile, 4x1 on Desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            <div className="card p-3.5 sm:p-5 bg-gradient-to-br from-mandi-card to-mandi-surface border-mandi-border shadow-sm">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-mandi-muted text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Gross Sales</span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-900/30 flex items-center justify-center text-blue-400">
                  <DollarSign size={15} />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-black text-mandi-text">₹{earningsSummary.grossSales.toLocaleString('en-IN')}</p>
              <p className="text-mandi-subtle text-[10px] sm:text-xs mt-0.5 sm:mt-1 truncate">All {storeOrders.length} orders</p>
            </div>

            <div className="card p-3.5 sm:p-5 bg-gradient-to-br from-purple-950/20 to-mandi-card border-purple-500/30 shadow-sm">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-purple-600 dark:text-purple-300 text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Local Sales</span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                  <Store size={15} />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400">₹{earningsSummary.localSales.toLocaleString('en-IN')}</p>
              <p className="text-mandi-subtle text-[10px] sm:text-xs mt-0.5 sm:mt-1 truncate">0% platform fee</p>
            </div>

            <div className="card p-3.5 sm:p-5 bg-gradient-to-br from-mandi-card to-mandi-surface border-mandi-border shadow-sm">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-mandi-muted text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Platform Fee</span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-yellow-900/30 flex items-center justify-center text-yellow-400">
                  <Layers size={15} />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-black text-yellow-400">-₹{earningsSummary.platformCommission.toLocaleString('en-IN')}</p>
              <p className="text-mandi-subtle text-[10px] sm:text-xs mt-0.5 sm:mt-1 truncate">10% online fee</p>
            </div>

            <div className="card p-3.5 sm:p-5 bg-gradient-to-br from-[#0d2a14] to-mandi-card border-mandi-green border-opacity-40 shadow-sm">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-green-300 text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Net Payout</span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-mandi-green/20 flex items-center justify-center text-mandi-green">
                  <ArrowUpRight size={16} />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-mandi-green">₹{earningsSummary.netPayout.toLocaleString('en-IN')}</p>
              <p className="text-mandi-muted text-[10px] sm:text-xs mt-0.5 sm:mt-1 truncate">Direct settlement</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
            {/* Sales Over Time Line Chart */}
            <div className="lg:col-span-2 card p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-mandi-text font-bold text-base sm:text-lg">Sales Trend (₹)</h3>
                  <p className="text-mandi-muted text-xs">Daily store revenue calculated from confirmed orders</p>
                </div>
                <div className="flex bg-mandi-surface rounded-xl p-1 border border-mandi-border self-start sm:self-auto">
                  <button
                    onClick={() => setTimeframe('7d')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${timeframe === '7d' ? 'bg-mandi-green text-black' : 'text-mandi-muted hover:text-mandi-text'}`}
                  >
                    7 Days
                  </button>
                  <button
                    onClick={() => setTimeframe('30d')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${timeframe === '30d' ? 'bg-mandi-green text-black' : 'text-mandi-muted hover:text-mandi-text'}`}
                  >
                    30 Days
                  </button>
                </div>
              </div>

              <div className="h-56 sm:h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesOverTime} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" />
                    <XAxis dataKey="date" stroke="var(--color-subtle)" fontSize={11} />
                    <YAxis stroke="var(--color-subtle)" fontSize={11} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '14px', color: 'var(--color-text)', fontSize: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
                      labelStyle={{ color: 'var(--color-text)', fontWeight: 'bold' }}
                      formatter={(val) => [`₹${val}`, 'Sales']}
                    />
                    <Line type="monotone" dataKey="sales" stroke="#00C851" strokeWidth={3} dot={{ r: 3, fill: '#00C851' }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Products */}
            <div className="card p-4 sm:p-6">
              <h3 className="text-mandi-text font-bold text-base sm:text-lg mb-1">Top Selling Items</h3>
              <p className="text-mandi-muted text-xs mb-4">Most popular staples ordered from your store</p>
              {topSellingProducts.length === 0 ? (
                <p className="text-mandi-subtle text-xs py-8 text-center">No sales recorded yet</p>
              ) : (
                <div className="space-y-3">
                  {topSellingProducts.map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between border-b border-mandi-border/70 pb-2 text-xs">
                      <div className="flex items-center gap-2 truncate max-w-[170px]">
                        <span className="w-5 h-5 rounded-full bg-mandi-surface text-mandi-muted text-[10px] font-black flex items-center justify-center flex-shrink-0">
                          #{idx + 1}
                        </span>
                        <span className="text-mandi-text font-medium truncate">{it.name}</span>
                      </div>
                      <span className="badge-green font-bold text-[11px]">{it.units} units</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Low-Stock Alert List */}
          <div className="card p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-yellow-400" />
                <h3 className="text-mandi-text font-bold text-base sm:text-lg">Low Stock Alerts ({lowStockProducts.length})</h3>
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
              <>
                {/* Mobile Low Stock Alert Cards (< md) */}
                <div className="md:hidden space-y-2.5">
                  {lowStockProducts.map(p => (
                    <div key={`low-mob-${p.id}`} className="p-3 rounded-xl bg-mandi-surface border border-amber-500/30 flex items-center justify-between gap-3 shadow-sm">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-mandi-border/60 bg-mandi-card flex-shrink-0">
                          <LazyImage src={p.image} alt={p.name} className="w-full h-full object-cover" containerClass="w-full h-full" fallbackText="Item" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-mandi-text truncate">{p.name}</p>
                          <p className="text-[11px] text-mandi-muted">{p.category} • <span className="text-mandi-green font-bold">₹{p.price}</span></p>
                          <span className="inline-block mt-1 bg-red-500/15 text-red-500 dark:text-red-300 font-bold px-2 py-0.5 rounded text-[10px] border border-red-500/30">
                            {p.stock} {p.unit} remaining
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setEditingProduct(p); setShowProductModal(true); }}
                        className="btn-outline py-1.5 px-3 text-xs text-mandi-green hover:bg-mandi-green hover:text-black font-bold whitespace-nowrap flex-shrink-0 shadow-sm"
                      >
                        Update Stock
                      </button>
                    </div>
                  ))}
                </div>

                {/* Desktop Low Stock Table (>= md) */}
                <div className="hidden md:block overflow-x-auto">
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
                            <span className="bg-red-500/15 text-red-600 dark:text-red-300 font-bold px-2 py-0.5 rounded border border-red-500/30">
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
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Shop Settings & Customization */}
      {activeTab === 'customization' && (
        <div className="card p-4 sm:p-6 max-w-4xl space-y-5 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-mandi-border gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-mandi-green bg-opacity-15 flex items-center justify-center text-mandi-green flex-shrink-0">
                <Settings size={22} />
              </div>
              <div>
                <h2 className="text-mandi-text font-bold text-base sm:text-lg">Shop Customization & Settings</h2>
                <p className="text-mandi-muted text-xs">Update your shop branding, operating hours, delivery parameters, and payout details.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSaveStoreCustomization}
              className="btn-primary py-2.5 px-5 text-xs font-bold flex items-center justify-center gap-1.5 w-full sm:w-auto"
            >
              <Save size={15} /> Save Changes
            </button>
          </div>

          <form onSubmit={handleSaveStoreCustomization} className="space-y-5 sm:space-y-6">
            {/* Store Status Toggle */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-mandi-surface border border-mandi-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-mandi-text font-bold text-sm">Store Operating Status</p>
                <p className="text-mandi-muted text-xs">Toggle whether your shop is actively accepting customer orders on Mandi Minutes.</p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setStoreForm(f => ({ ...f, status: f.status === 'closed' ? 'approved' : 'closed' }))}
                  className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    storeForm.status === 'closed'
                      ? 'bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/30'
                      : 'bg-mandi-green text-black'
                  }`}
                >
                  <Store size={15} />
                  {storeForm.status === 'closed' ? 'Store Paused / Closed' : 'Store Open (Active)'}
                </button>
              </div>
            </div>

            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-mandi-text font-semibold text-sm border-b border-mandi-border pb-2">Store Profile & Branding</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-mandi-muted text-xs font-medium mb-1">Store Name *</label>
                  <input
                    required
                    value={storeForm.name}
                    onChange={e => setStoreForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Gupta General Store"
                    className="input-field text-sm w-full"
                  />
                </div>
                <div>
                  <label className="block text-mandi-muted text-xs font-medium mb-1">Owner Name *</label>
                  <input
                    required
                    value={storeForm.ownerName}
                    onChange={e => setStoreForm(f => ({ ...f, ownerName: e.target.value }))}
                    placeholder="Full Owner Name"
                    className="input-field text-sm w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-mandi-muted text-xs font-medium mb-1">Owner Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    value={storeForm.ownerPhone}
                    onChange={e => setStoreForm(f => ({ ...f, ownerPhone: e.target.value }))}
                    placeholder="10-digit phone number"
                    className="input-field text-sm w-full"
                  />
                </div>
                <div>
                  <label className="block text-mandi-muted text-xs font-medium mb-1">Estimated Delivery Time *</label>
                  <select
                    value={storeForm.deliveryTime}
                    onChange={e => setStoreForm(f => ({ ...f, deliveryTime: e.target.value }))}
                    className="input-field text-sm w-full cursor-pointer"
                  >
                    <option value="10-15 min">10-15 min (Express)</option>
                    <option value="15-20 min">15-20 min</option>
                    <option value="20-30 min">20-30 min</option>
                    <option value="30-45 min">30-45 min</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-mandi-muted text-xs font-medium mb-1">Store Description / Bio</label>
                <textarea
                  rows={3}
                  value={storeForm.description}
                  onChange={e => setStoreForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Tell customers about your Kirana store specialties..."
                  className="input-field text-sm w-full"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div>
                  <ImageUploadField
                    label="Store's Picture (Logo / Storefront Photo)"
                    value={storeForm.image}
                    onChange={(val) => setStoreForm((f) => ({ ...f, image: val }))}
                    aspectRatio="square"
                    recommendedText="Recommended: 400×400px (1:1 Square)"
                    placeholderText="Image not available"
                  />
                </div>
                <div>
                  <ImageUploadField
                    label="Store Cover Picture (Hero Banner)"
                    value={storeForm.coverImage}
                    onChange={(val) => setStoreForm((f) => ({ ...f, coverImage: val }))}
                    aspectRatio="banner"
                    recommendedText="Recommended: 1200×400px (Panoramic Banner)"
                    placeholderText="Image not available"
                  />
                </div>
              </div>
            </div>

            {/* Delivery & Logistics Settings */}
            <div className="space-y-4">
              <h3 className="text-mandi-text font-semibold text-sm border-b border-mandi-border pb-2">Delivery & Order Thresholds</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-mandi-muted text-xs font-medium mb-1">Minimum Order Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={storeForm.minOrder}
                    onChange={e => setStoreForm(f => ({ ...f, minOrder: e.target.value }))}
                    className="input-field text-sm w-full"
                  />
                </div>
                <div>
                  <label className="block text-mandi-muted text-xs font-medium mb-1">Delivery Charge (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={storeForm.deliveryCharge}
                    onChange={e => setStoreForm(f => ({ ...f, deliveryCharge: e.target.value }))}
                    placeholder="0 for Free Delivery"
                    className="input-field text-sm w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-mandi-muted text-xs font-medium mb-1">Serviced Delivery PIN Codes (Comma-separated) *</label>
                <input
                  required
                  value={storeForm.pincodes}
                  onChange={e => setStoreForm(f => ({ ...f, pincodes: e.target.value }))}
                  placeholder="e.g. 401305, 401303"
                  className="input-field text-sm w-full"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-mandi-muted text-xs font-medium mb-1">Street Address *</label>
                  <input
                    required
                    value={storeForm.address}
                    onChange={e => setStoreForm(f => ({ ...f, address: e.target.value }))}
                    placeholder="Shop No., Market Street, Landmark"
                    className="input-field text-sm w-full"
                  />
                </div>
                <div>
                  <label className="block text-mandi-muted text-xs font-medium mb-1">City / Region *</label>
                  <input
                    required
                    value={storeForm.city}
                    onChange={e => setStoreForm(f => ({ ...f, city: e.target.value }))}
                    placeholder="Virar, Palghar"
                    className="input-field text-sm w-full"
                  />
                </div>
              </div>
            </div>

            {/* Payout & Legal Info */}
            <div className="space-y-4">
              <h3 className="text-mandi-text font-semibold text-sm border-b border-mandi-border pb-2">Payout & Bank Details</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-mandi-muted text-xs font-medium mb-1">UPI ID for Direct Payouts *</label>
                  <input
                    required
                    value={storeForm.upiId}
                    onChange={e => setStoreForm(f => ({ ...f, upiId: e.target.value }))}
                    placeholder="merchant@upi / 9920941603@ybl"
                    className="input-field text-sm w-full"
                  />
                </div>
                <div>
                  <label className="block text-mandi-muted text-xs font-medium mb-1">GSTIN Number (Optional)</label>
                  <input
                    value={storeForm.gstin}
                    onChange={e => setStoreForm(f => ({ ...f, gstin: e.target.value }))}
                    placeholder="27AAAAA0000A1Z5"
                    className="input-field text-sm w-full uppercase"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-mandi-border flex justify-end">
              <button
                type="submit"
                className="btn-primary py-3 px-8 text-sm font-bold flex items-center gap-2"
              >
                <Save size={16} /> Save Shop Customization
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modals */}
      {showProductModal && (
        <ProductModal product={editingProduct} storeId={store.id} onClose={() => setShowProductModal(false)} onSave={handleSaveProduct} />
      )}
      {showMasterModal && (
        <MasterCatalogModal storeId={store.id} onClose={() => setShowMasterModal(false)} onSaveBatch={handleBatchSaveProducts} />
      )}
      {showLocalSaleModal && (
        <LocalSaleModal
          store={store}
          products={products}
          categories={categories}
          onClose={() => setShowLocalSaleModal(false)}
          onSaleCompleted={handleCreateLocalSale}
        />
      )}
      {invoiceOrder && (
        <InvoiceModal order={invoiceOrder} onClose={() => setInvoiceOrder(null)} />
      )}
    </div>
  );
}
