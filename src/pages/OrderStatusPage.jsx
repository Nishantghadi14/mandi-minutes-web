import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useToast } from '../components/common/Toast';
import OrderTracker from '../components/tracking/OrderTracker';
import RiderTrackerMap from '../components/common/RiderTrackerMap';
import { VIRAR_RIDERS } from '../data/virarCoordinates';
import { generateWhatsAppOrderMessage, generateCustomerShareMessage } from '../utils/whatsappFormatter';
import { CheckCircle2, ArrowLeft, Store, MapPin, Package, Phone, Bike, ShieldCheck, MessageCircle, Share2, RefreshCw, WifiOff } from 'lucide-react';

export default function OrderStatusPage() {
  const { orderId } = useParams();
  const loc = useLocation();
  const navigate = useNavigate();
  const { orders, stores, loadingStates, errorStates, retryFetch } = useData();
  const { addToast } = useToast();

  const orderFromState = loc.state?.order;
  const autoProgress = loc.state?.autoProgress || false;
  
  // Find order from state or live Firestore collection
  const order = orderFromState || orders.find(o => String(o.id).toLowerCase() === String(orderId).toLowerCase());

  const isLoading = Boolean(loadingStates?.orders);
  const hasError = Boolean(errorStates?.orders);

  if (isLoading && !order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="h-10 bg-mandi-card rounded-xl w-60" />
        <div className="h-28 bg-mandi-card rounded-2xl w-full" />
        <div className="h-64 bg-mandi-card rounded-2xl w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <Package size={48} className="text-mandi-subtle mx-auto mb-4" />
        <h2 className="text-mandi-text font-bold text-2xl mb-2">Order Not Found</h2>
        <p className="text-mandi-muted text-sm mb-6">Could not locate order #{orderId}. It may have been archived or belongs to another account.</p>
        <div className="flex justify-center gap-3">
          <button onClick={() => retryFetch?.('orders')} className="btn-outline flex items-center gap-1.5">
            <RefreshCw size={14} /> Retry Sync
          </button>
          <button onClick={() => navigate('/orders')} className="btn-primary">View My Orders</button>
        </div>
      </div>
    );
  }

  const store = stores.find(s => s.id === order.storeId);
  const rider = VIRAR_RIDERS[0]; // Rahul Patil

  const { waUrl: storeWaUrl } = generateWhatsAppOrderMessage(order, store);
  const { waUrl: shareWaUrl } = generateCustomerShareMessage(order);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Network Alert */}
      {hasError && (
        <div className="mb-4 p-3.5 rounded-xl bg-red-950 bg-opacity-40 border border-red-800 flex items-center justify-between text-red-200 text-xs">
          <div className="flex items-center gap-2">
            <WifiOff size={16} className="text-red-400" />
            <span>Connection dropped. Showing latest cached order status.</span>
          </div>
          <button onClick={() => retryFetch?.('orders')} className="btn-primary text-xs py-1 px-2.5 bg-red-600">Retry</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/orders')} className="w-9 h-9 bg-mandi-card border border-mandi-border rounded-xl flex items-center justify-center hover:border-mandi-green transition-colors">
            <ArrowLeft size={18} className="text-mandi-text" />
          </button>
          <div>
            <h1 className="text-mandi-text font-black text-xl">Order #{String(order.id).toUpperCase()}</h1>
            <p className="text-mandi-muted text-xs">Placed on {new Date(order.placedAt || Date.now()).toLocaleString('en-IN')}</p>
          </div>
        </div>
        <Link to="/rider" className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5">
          <Bike size={14} /> Rider Portal
        </Link>
      </div>

      {/* Confirmation Banner */}
      <div className="bg-gradient-to-r from-mandi-green-dark to-green-900 border border-mandi-green border-opacity-30 rounded-2xl p-5 mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-mandi-green rounded-full flex items-center justify-center flex-shrink-0 text-black">
            <CheckCircle2 size={28} />
          </div>
          <div>
            <h2 className="text-mandi-text font-bold text-lg">Order Confirmed! 🎉</h2>
            <p className="text-green-200 text-xs">Estimated Delivery: <span className="font-bold text-white">10-15 Mins</span> to Virar</p>
          </div>
        </div>
      </div>

      {/* WhatsApp Kirana Direct Action Card */}
      <div className="card p-4 mb-6 bg-gradient-to-r from-[#0d2a14] to-mandi-card border-mandi-green border-opacity-40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#25D366] bg-opacity-20 rounded-xl flex items-center justify-center text-[#25D366]">
            <MessageCircle size={22} />
          </div>
          <div>
            <h3 className="text-mandi-text font-bold text-sm">Send Order Bill to Kirana Shop</h3>
            <p className="text-mandi-muted text-xs">Send 1-click formatted order receipt directly to {order.storeName}'s WhatsApp</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <a
            href={storeWaUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => addToast('Opening WhatsApp with your order bill...', 'success')}
            className="flex-1 sm:flex-initial bg-[#25D366] text-black font-bold text-xs py-2.5 px-4 rounded-xl hover:bg-opacity-90 transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95"
          >
            <MessageCircle size={15} /> Send WhatsApp Bill
          </a>
          <a
            href={shareWaUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => addToast('Opening WhatsApp to share receipt...', 'info')}
            className="btn-outline py-2.5 px-3 text-xs flex items-center justify-center gap-1 hover:border-mandi-green active:scale-95"
            title="Share with family or friends"
          >
            <Share2 size={14} /> Share
          </a>
        </div>
      </div>

      {/* Live GPS Delivery Map */}
      <div className="mb-6">
        <h3 className="text-mandi-text font-bold text-sm mb-3 flex items-center gap-2">
          <Bike size={16} className="text-mandi-green" /> Virar Live GPS Delivery Map
        </h3>
        <RiderTrackerMap 
          orderId={order.id}
          storeId={order.storeId || 'store-mahalaxmi-1'} 
          customerPincode={order.address?.pincode || '401305'} 
          orderStatus={order.status || 'out_for_delivery'} 
          liveRiderLocation={order.riderLocation || null}
        />
      </div>

      {/* Assigned Virar Rider Details */}
      <div className="card p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={rider.avatar} alt={rider.name} className="w-12 h-12 rounded-full border-2 border-mandi-green object-cover" />
          <div>
            <div className="flex items-center gap-2">
              <p className="text-mandi-text font-bold text-sm">{rider.name}</p>
              <span className="badge-green text-xs flex items-center gap-0.5"><ShieldCheck size={10} />Assigned Rider</span>
            </div>
            <p className="text-mandi-muted text-xs">{rider.vehicle}</p>
          </div>
        </div>
        <a href={`tel:${rider.phone}`} className="btn-primary py-2 px-3 text-xs flex items-center gap-1.5">
          <Phone size={14} /> Call Rider
        </a>
      </div>

      {/* Live Order Tracker Timeline */}
      <div className="mb-6">
        <OrderTracker order={order} autoProgress={autoProgress} />
      </div>

      {/* Order Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="card p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Store size={16} className="text-mandi-green" />
            <span className="text-mandi-text font-semibold text-sm">{order.storeName || 'Virar Kirana Store'}</span>
          </div>
          <p className="text-mandi-subtle text-xs">Fulfilling Kirana Store (Virar)</p>
        </div>
        <div className="card p-4 space-y-2">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-mandi-green" />
            <span className="text-mandi-text font-semibold text-sm">{order.address?.label || 'Home'}</span>
          </div>
          <p className="text-mandi-muted text-xs truncate">{order.address?.line1 || 'Virar West'}, {order.address?.city || 'Virar, Palghar'} - {order.address?.pincode || '401305'}</p>
        </div>
      </div>
    </div>
  );
}
