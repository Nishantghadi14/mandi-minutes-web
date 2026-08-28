import { useEffect, useState } from 'react';
import { useData } from '../context/DataContext';
import { useToast } from '../components/common/Toast';
import { VIRAR_RIDERS } from '../data/virarCoordinates';
import RiderTrackerMap from '../components/common/RiderTrackerMap';
import { Navigation, Phone, CheckCircle, Package, MapPin, ShieldCheck, Bike, ArrowRight, Radio } from 'lucide-react';
import { useLocationStore } from '../store/useLocationStore';

export default function RiderPortal() {
  const { orders, updateOrderStatus } = useData();
  const { addToast } = useToast();
  const activeRider = VIRAR_RIDERS[0]; // Rahul Patil

  const [isOnDuty, setIsOnDuty] = useState(true);
  const riderGpsStatus = useLocationStore(state => state.riderGpsStatus);
  const startRiderTracking = useLocationStore(state => state.startRiderTracking);
  const stopRiderTracking = useLocationStore(state => state.stopRiderTracking);
  
  const activeOrders = orders.filter(o => ['placed', 'accepted', 'preparing', 'out_for_delivery'].includes(o.status));
  const completedOrders = orders.filter(o => o.status === 'delivered');

  const firstOutForDelivery = activeOrders.find(o => o.status === 'out_for_delivery') || activeOrders[0];

  useEffect(() => {
    if (isOnDuty) {
      startRiderTracking(firstOutForDelivery?.id || null);
    } else {
      stopRiderTracking();
    }
    return stopRiderTracking;
  }, [isOnDuty, firstOutForDelivery?.id, startRiderTracking, stopRiderTracking]);

  const handleNextStatus = (orderId, currentStatus) => {
    let nextStatus = 'accepted';
    if (currentStatus === 'placed') nextStatus = 'accepted';
    else if (currentStatus === 'accepted') nextStatus = 'preparing';
    else if (currentStatus === 'preparing') nextStatus = 'out_for_delivery';
    else if (currentStatus === 'out_for_delivery') nextStatus = 'delivered';

    updateOrderStatus(orderId, nextStatus);
    addToast(`Order ${orderId} updated to ${nextStatus.replace(/_/g, ' ')}!`, 'success');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Rider Header */}
      <div className="card p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src={activeRider.avatar} alt={activeRider.name} className="w-14 h-14 rounded-full border-2 border-mandi-green object-cover" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-mandi-text font-black text-xl">{activeRider.name}</h1>
              <span className="badge-green text-xs flex items-center gap-1"><ShieldCheck size={12} />Verified Rider</span>
            </div>
            <p className="text-mandi-muted text-xs">{activeRider.vehicle}</p>
            <p className="text-mandi-subtle text-xs">Virar West / East Sector • ★ {activeRider.rating} ({activeRider.trips} deliveries)</p>
            <div className="flex items-center gap-1.5 text-xs mt-1">
              <Radio size={12} className={riderGpsStatus === 'active' ? 'text-mandi-green animate-pulse' : 'text-mandi-muted'} />
              <span className={riderGpsStatus === 'active' ? 'text-mandi-green font-medium' : 'text-mandi-muted'}>
                {riderGpsStatus === 'active' ? 'Live GPS broadcasting to customer' : riderGpsStatus === 'requesting' ? 'Requesting GPS permission...' : riderGpsStatus === 'denied' ? 'GPS permission denied' : 'GPS is off'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <span className="text-xs text-mandi-muted font-medium">{isOnDuty ? 'ON DUTY' : 'OFF DUTY'}</span>
          <button
            onClick={() => { setIsOnDuty(!isOnDuty); addToast(isOnDuty ? 'Switched to Off-Duty' : 'Now On-Duty in Virar', 'info'); }}
            className={`w-12 h-6 rounded-full p-1 transition-colors ${isOnDuty ? 'bg-mandi-green' : 'bg-mandi-surface border border-mandi-border'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-black transition-transform ${isOnDuty ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {/* Rider Quick Metrics */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card p-4 text-center">
          <span className="text-mandi-muted text-xs font-medium">Assigned Active</span>
          <p className="text-2xl font-black text-mandi-green mt-1">{activeOrders.length}</p>
        </div>
        <div className="card p-4 text-center">
          <span className="text-mandi-muted text-xs font-medium">Delivered Today</span>
          <p className="text-2xl font-black text-mandi-text mt-1">{completedOrders.length}</p>
        </div>
        <div className="card p-4 text-center">
          <span className="text-mandi-muted text-xs font-medium">Daily Payout</span>
          <p className="text-2xl font-black text-yellow-400 mt-1">₹{completedOrders.length * 40}</p>
        </div>
      </div>

      {/* Active Deliveries List */}
      <h2 className="text-lg font-bold text-mandi-text mb-4 flex items-center gap-2">
        <Bike size={20} className="text-mandi-green" /> Virar Active Delivery Queue ({activeOrders.length})
      </h2>

      {activeOrders.length === 0 ? (
        <div className="card p-8 text-center">
          <Package size={48} className="text-mandi-subtle mx-auto mb-3" />
          <h3 className="text-mandi-text font-bold text-base mb-1">No Active Deliveries</h3>
          <p className="text-mandi-muted text-xs">New orders assigned in Virar will appear here automatically.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeOrders.map(order => (
            <div key={order.id} className="card p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-mandi-border">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-mandi-text font-bold text-base">#{order.id.toUpperCase()}</span>
                    <span className="badge-green text-xs capitalize">{order.status.replace(/_/g, ' ')}</span>
                  </div>
                  <p className="text-mandi-muted text-xs mt-0.5">Store: <strong>{order.storeName}</strong></p>
                </div>
                <div className="flex items-center gap-2">
                  <a href={`tel:9820098200`} className="btn-outline py-1.5 px-3 text-xs flex items-center gap-1">
                    <Phone size={12} /> Call Customer
                  </a>
                  <button
                    onClick={() => handleNextStatus(order.id, order.status)}
                    className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1"
                  >
                    {order.status === 'placed' && 'Accept Pickup'}
                    {order.status === 'accepted' && 'Start Packing'}
                    {order.status === 'preparing' && 'Out for Delivery'}
                    {order.status === 'out_for_delivery' && 'Confirm Delivery'}
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-mandi-subtle mb-1">Delivery Destination:</p>
                  <p className="text-mandi-text font-medium flex items-center gap-1">
                    <MapPin size={12} className="text-mandi-green" />
                    {order.address?.line1}, {order.address?.city} - {order.address?.pincode}
                  </p>
                </div>
                <div>
                  <p className="text-mandi-subtle mb-1">Collection Mode:</p>
                  <p className="text-mandi-text font-bold">{order.paymentMethod} • <span className="text-mandi-green">₹{order.total}</span></p>
                </div>
              </div>

              {/* Items in order */}
              <div className="bg-mandi-surface rounded-xl p-3 space-y-1">
                {order.items.map((it, i) => (
                  <div key={i} className="flex justify-between text-xs text-mandi-muted">
                    <span>{it.quantity}x {it.name} ({it.unit})</span>
                    <span className="text-mandi-text font-medium">₹{it.price * it.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
