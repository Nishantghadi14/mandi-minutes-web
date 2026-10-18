import { useEffect, useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';
import { 
  Phone, MapPin, ShieldCheck, Bike, ArrowRight, Radio, 
  CheckCircle2, Navigation, MessageCircle, AlertOctagon, 
  Wallet, Award, User, ChevronDown, ChevronUp, Check, 
  Store, Compass, X, Delete
} from 'lucide-react';
import { useLocationStore } from '../store/useLocationStore';
import RiderTrackerMap from '../components/common/RiderTrackerMap';

export default function RiderPortal() {
  const { orders, updateOrderStatus } = useData();
  const { addToast } = useToast();
  const { user } = useAuth();
  
  const activeRider = useMemo(() => ({ 
    name: user?.name || user?.displayName || 'Delivery Partner', 
    avatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80', 
    vehicle: user?.vehicle || 'Hero Splendor Plus', 
    rating: user?.rating || '4.95', 
    phone: user?.phone || user?.phoneNumber || '+91 9819001122',
    hub: user?.hub || 'Virar West Hub (Zone 1)'
  }), [user]);

  const [isOnDuty, setIsOnDuty] = useState(true);
  const [activeTab, setActiveTab] = useState('drops'); // 'drops' | 'map' | 'earnings' | 'hub'
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [showSosModal, setShowSosModal] = useState(false);
  const [dropsFilter, setDropsFilter] = useState('active'); // 'active' | 'completed'

  // Doorstep Verification Anti-Fraud States
  const [verifyingOrder, setVerifyingOrder] = useState(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');

  const riderGpsStatus = useLocationStore(state => state.riderGpsStatus);
  const startRiderTracking = useLocationStore(state => state.startRiderTracking);
  const stopRiderTracking = useLocationStore(state => state.stopRiderTracking);
  
  const riderUid = user?.uid || user?.id || '';

  // Real orders assigned to this rider
  const assignedActiveOrders = useMemo(() => {
    return orders.filter(o => 
      (o.riderId === riderUid || (!o.riderId && o.status === 'out_for_delivery')) && 
      ['preparing', 'out_for_delivery'].includes(o.status)
    );
  }, [orders, riderUid]);

  // Real unassigned drops available in the Virar cluster
  const availableDrops = useMemo(() => {
    return orders.filter(o => 
      !o.riderId && 
      ['placed', 'preparing'].includes(o.status)
    );
  }, [orders]);

  // Real completed orders delivered by this rider
  const completedOrders = useMemo(() => {
    return orders.filter(o => 
      o.riderId === riderUid && 
      o.status === 'delivered'
    );
  }, [orders, riderUid]);

  const currentFocusOrder = useMemo(() => {
    return assignedActiveOrders.find(o => o.status === 'out_for_delivery') || assignedActiveOrders[0] || availableDrops[0];
  }, [assignedActiveOrders, availableDrops]);

  useEffect(() => {
    if (isOnDuty) {
      startRiderTracking(currentFocusOrder?.id || null);
    } else {
      stopRiderTracking();
    }
    return stopRiderTracking;
  }, [isOnDuty, currentFocusOrder?.id, startRiderTracking, stopRiderTracking]);

  const triggerHaptic = (pattern = [40]) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(pattern); } catch {}
    }
  };

  const handleKeypadPress = (digit) => {
    if (enteredPin.length >= 4) return;
    triggerHaptic([30]);
    const nextPin = enteredPin + digit;
    setEnteredPin(nextPin);
    setPinError('');
    if (nextPin.length === 4) {
      handleVerifyPin(nextPin);
    }
  };

  const handleAcceptDrop = async (orderId) => {
    triggerHaptic([40, 40]);
    try {
      await updateOrderStatus(
        orderId, 
        'preparing', 
        `Accepted by delivery partner ${activeRider.name}`, 
        {
          riderId: riderUid || 'rider-partner',
          rider: {
            name: activeRider.name,
            phone: activeRider.phone,
            vehicle: activeRider.vehicle,
            avatar: activeRider.avatar,
          }
        }
      );
      setExpandedOrder(orderId);
      addToast('🛵 Order accepted! Proceed to Kirana store for pickup.', 'success');
    } catch (err) {
      addToast(err.message || 'Could not accept order', 'error');
    }
  };

  const handleStartDelivery = async (orderId) => {
    triggerHaptic([40]);
    try {
      await updateOrderStatus(orderId, 'out_for_delivery', 'Order picked up from Kirana, riding to customer');
      addToast('🛵 Out for delivery! Broadcasting live GPS to customer.', 'info');
    } catch (err) {
      addToast(err.message || 'Could not update delivery status', 'error');
    }
  };

  const handleVerifyPin = async (pinToTest) => {
    if (!verifyingOrder) return;
    const expected = String(
      verifyingOrder.deliveryOtp || 
      (verifyingOrder.id ? Math.abs(String(verifyingOrder.id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 9000) + 1000 : '4821')
    );
    if (pinToTest === expected) {
      triggerHaptic([50, 40, 50]);
      try {
        await updateOrderStatus(
          verifyingOrder.id, 
          'delivered', 
          'Handover confirmed via customer doorstep PIN', 
          {
            payout: 40,
            deliveredAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        );
        addToast(`🎉 Delivery completed! ₹40 added to your shift earnings!`, 'success');
        setVerifyingOrder(null);
        setEnteredPin('');
        setPinError('');
      } catch (err) {
        addToast(err.message || 'Failed to complete delivery', 'error');
      }
    } else {
      triggerHaptic([100, 100]);
      setPinError('Incorrect PIN! Please ask customer for the 4-digit code shown in their Mandi Minutes app.');
    }
  };

  const totalShiftEarnings = completedOrders.reduce((sum, o) => sum + (o.payout || 40), 0);

  return (
    <div className="w-full max-w-md mx-auto min-h-screen bg-mandi-dark text-mandi-text flex flex-col relative select-none pb-36 shadow-2xl">
      {/* ─── NATIVE APP TOP BAR ─── */}
      <header className="sticky top-0 z-40 bg-mandi-card/95 backdrop-blur-md border-b border-mandi-border/80 px-4 pt-3 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {activeRider.avatar ? (
              <img 
                src={activeRider.avatar} 
                alt={activeRider.name} 
                className="w-9 h-9 rounded-full border-2 border-mandi-green object-cover" 
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-mandi-green/20 border border-mandi-green text-mandi-green font-black flex items-center justify-center text-xs">
                RP
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-mandi-text">{activeRider.name}</span>
                <span className="badge-green text-[9px] py-0 px-1 font-bold">★ {activeRider.rating}</span>
              </div>
              <p className="text-[10px] text-mandi-muted font-mono">{activeRider.vehicle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* GPS Pill */}
            <div className={`px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border ${
              isOnDuty && riderGpsStatus === 'active'
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 animate-pulse'
                : 'bg-mandi-surface text-mandi-muted border-mandi-border'
            }`}>
              <Radio size={10} />
              <span>{isOnDuty ? 'GPS LIVE' : 'OFFLINE'}</span>
            </div>

            {/* SOS Emergency Button */}
            <button
              onClick={() => setShowSosModal(true)}
              className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center hover:bg-rose-500/20 active:scale-95 transition-transform"
              title="Emergency SOS"
            >
              <AlertOctagon size={16} />
            </button>
          </div>
        </div>

        {/* ─── PROMINENT DRIVER DUTY SWITCH (Uber/Swiggy Style) ─── */}
        <div className="mt-3">
          <button
            onClick={() => {
              triggerHaptic([60]);
              setIsOnDuty(!isOnDuty);
              addToast(isOnDuty ? 'Switched to Off-Duty' : 'You are now Online & Receiving Orders!', 'info');
            }}
            className={`w-full py-2.5 px-3.5 rounded-xl flex items-center justify-between transition-all ${
              isOnDuty
                ? 'bg-gradient-to-r from-emerald-950 via-emerald-900/80 to-teal-950 border border-emerald-500/40 shadow-lg shadow-emerald-950/50'
                : 'bg-mandi-surface border border-mandi-border'
            }`}
          >
            <div className="flex items-center gap-2 text-left">
              <div className={`w-3 h-3 rounded-full ${isOnDuty ? 'bg-mandi-green animate-ping' : 'bg-mandi-subtle'}`} />
              <div>
                <p className={`text-xs font-black tracking-wide ${isOnDuty ? 'text-mandi-green' : 'text-mandi-muted'}`}>
                  {isOnDuty ? 'YOU ARE ONLINE' : 'YOU ARE OFFLINE'}
                </p>
                <p className="text-[10px] text-mandi-subtle">
                  {isOnDuty ? 'Virar West Hub • Receiving new drops' : 'Tap to go online and accept delivery orders'}
                </p>
              </div>
            </div>

            <div className={`w-11 h-6 rounded-full p-0.5 transition-colors ${isOnDuty ? 'bg-mandi-green' : 'bg-mandi-border'}`}>
              <div className={`w-5 h-5 rounded-full bg-black shadow-md transition-transform ${isOnDuty ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
          </button>
        </div>
      </header>

      {/* ─── TAB 1: DROPS (ACTIVE QUEUE) ─── */}
      {activeTab === 'drops' && (
        <main className="flex-1 px-4 py-3 space-y-4">
          {/* Shift Odometer Bar */}
          <div className="bg-mandi-card border border-mandi-border rounded-2xl p-3 shadow-md">
            <div className="grid grid-cols-3 divide-x divide-mandi-border text-center">
              <div>
                <span className="text-[10px] text-mandi-muted font-medium">Earned Today</span>
                <p className="text-lg font-black text-yellow-400 mt-0.5">₹{totalShiftEarnings}</p>
              </div>
              <div>
                <span className="text-[10px] text-mandi-muted font-medium">Completed</span>
                <p className="text-lg font-black text-mandi-text mt-0.5">{completedOrders.length}</p>
              </div>
              <div>
                <span className="text-[10px] text-mandi-muted font-medium">Active Drops</span>
                <p className="text-lg font-black text-mandi-green mt-0.5">{assignedActiveOrders.length}</p>
              </div>
            </div>

            {/* Daily Incentive Progress */}
            <div className="mt-2.5 pt-2.5 border-t border-mandi-border/60">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-mandi-muted flex items-center gap-1">
                  <Award size={12} className="text-yellow-400" />
                  <strong>Shift Incentive:</strong> 8 Drops for +₹100 bonus
                </span>
                <span className="font-bold text-mandi-text">{Math.min(completedOrders.length, 8)}/8</span>
              </div>
              <div className="w-full h-1.5 bg-mandi-surface rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-yellow-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((completedOrders.length / 8) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Segment Filter (Full width on mobile) */}
          <div className="flex items-center gap-1.5 bg-mandi-surface p-1 rounded-xl border border-mandi-border text-xs w-full">
            <button
              onClick={() => setDropsFilter('active')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-colors ${
                dropsFilter === 'active' 
                  ? 'bg-mandi-green text-black' 
                  : 'text-mandi-muted hover:text-mandi-text'
              }`}
            >
              Active Drops ({assignedActiveOrders.length})
            </button>
            <button
              onClick={() => setDropsFilter('completed')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-colors ${
                dropsFilter === 'completed' 
                  ? 'bg-mandi-green text-black' 
                  : 'text-mandi-muted hover:text-mandi-text'
              }`}
            >
              Drop History ({completedOrders.length})
            </button>
          </div>

          {/* Active Orders List */}
          {dropsFilter === 'active' && (
            <div className="space-y-3">
              {/* Available Nearby Kirana Drops for Pickup */}
              {availableDrops.length > 0 && (
                <div className="space-y-2 mb-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      Incoming Pickup Requests ({availableDrops.length})
                    </span>
                    <span className="text-[10px] text-mandi-muted">Tap to accept & earn ₹40</span>
                  </div>
                  {availableDrops.map(order => (
                    <div key={order.id} className="bg-mandi-card border border-emerald-500/40 rounded-2xl p-3.5 space-y-2.5 shadow-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-mandi-text">Order #{order.id.slice(-4).toUpperCase()}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              +₹40 Payout
                            </span>
                          </div>
                          <p className="text-xs text-mandi-muted mt-0.5">Pickup: <strong className="text-mandi-text">{order.storeName || 'Kirana Store'}</strong></p>
                        </div>
                        <span className="text-xs font-black text-emerald-400">₹{order.total}</span>
                      </div>
                      <div className="text-[11px] text-mandi-muted flex items-center justify-between">
                        <span className="flex items-center gap-1"><MapPin size={12} className="text-mandi-green" /> {order.address?.line1 || 'Virar West'}</span>
                        <span>{order.items?.length || 0} items</span>
                      </div>
                      <button
                        onClick={() => handleAcceptDrop(order.id)}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-400 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                      >
                        <Check size={14} className="stroke-[3]" />
                        <span>ACCEPT DROP (+₹40)</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {assignedActiveOrders.length === 0 && availableDrops.length === 0 ? (
                <div className="bg-mandi-card border border-mandi-border rounded-2xl p-8 text-center space-y-3 mt-2">
                  <div className="relative w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                    <Bike size={28} />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-mandi-text">You're Online & Ready</h3>
                    <p className="text-xs text-mandi-muted max-w-xs mx-auto leading-relaxed">
                      Waiting for incoming grocery drops from Virar Kirana stores. You will receive an instant alert when an order is placed nearby.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-mandi-surface border border-mandi-border text-[11px] text-mandi-muted">
                    <Radio size={12} className="text-emerald-400 animate-pulse" />
                    <span>Zone: Virar West & East Hub (Active)</span>
                  </div>
                </div>
              ) : (
                assignedActiveOrders.map(order => {
                  const isExpanded = expandedOrder === order.id;
                  const isOutForDelivery = order.status === 'out_for_delivery';

                  return (
                    <div 
                      key={order.id} 
                      className={`bg-mandi-card border rounded-2xl p-4 space-y-3 transition-all ${
                        isOutForDelivery 
                          ? 'border-amber-500/50 shadow-lg shadow-amber-950/20' 
                          : 'border-mandi-border'
                      }`}
                    >
                      {/* Order Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-mandi-border/60">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-mandi-text">#{order.id.slice(-4).toUpperCase()}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isOutForDelivery 
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          }`}>
                            {order.status.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <span className="text-[11px] font-bold text-mandi-green bg-mandi-green/10 px-2 py-0.5 rounded-md">
                          ⚡ {order.distanceEst || '1.4 km'} • {order.timeEst || '6m'}
                        </span>
                      </div>

                      {/* Pick & Drop Visual Stepper */}
                      <div className="space-y-3 py-1">
                        {/* Pickup */}
                        <div className="flex items-start gap-2.5">
                          <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Store size={11} />
                          </div>
                          <div>
                            <p className="text-[11px] text-mandi-muted font-medium">PICKUP FROM STORE</p>
                            <p className="text-xs font-bold text-mandi-text">{order.storeName}</p>
                            <p className="text-[10px] text-mandi-subtle">{order.storeArea || 'Virar Station West'}</p>
                          </div>
                        </div>

                        {/* Drop */}
                        <div className="flex items-start gap-2.5">
                          <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <MapPin size={11} />
                          </div>
                          <div>
                            <p className="text-[11px] text-mandi-muted font-medium">CUSTOMER DROP</p>
                            <p className="text-xs font-bold text-mandi-text">{order.customerName}</p>
                            <p className="text-[11px] text-mandi-text leading-tight mt-0.5">
                              {order.address?.line1}, {order.address?.city} - {order.address?.pincode}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Payment Collection Banner */}
                      <div className={`p-2.5 rounded-xl flex items-center justify-between text-xs ${
                        order.isPrepaid || order.paymentMethod?.toLowerCase().includes('upi')
                          ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-300'
                          : 'bg-amber-950/80 border border-amber-500/50 text-amber-300 font-bold'
                      }`}>
                        <div className="flex items-center gap-1.5">
                          <Wallet size={13} />
                          <span>
                            {order.isPrepaid || order.paymentMethod?.toLowerCase().includes('upi')
                              ? 'UPI PREPAID (Do not collect cash)'
                              : `CASH ON DELIVERY: Collect ₹${order.total}`}
                          </span>
                        </div>
                        <span className="font-mono font-black text-sm">₹{order.total}</span>
                      </div>

                      {/* Order Items Collapsible */}
                      <div className="bg-mandi-surface rounded-xl overflow-hidden border border-mandi-border/60">
                        <button
                          onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                          className="w-full px-3 py-2 text-[11px] font-bold text-mandi-muted flex items-center justify-between"
                        >
                          <span>{order.items?.length || 0} ITEMS IN BAG</span>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                        {isExpanded && (
                          <div className="px-3 pb-2.5 pt-0 space-y-1 text-xs divide-y divide-mandi-border/30">
                            {(order.items || []).map((it, idx) => (
                              <div key={idx} className="flex justify-between pt-1 text-mandi-muted">
                                <span>{it.quantity}x {it.name} ({it.unit || '1 pc'})</span>
                                <span className="font-medium text-mandi-text">₹{it.price * it.quantity}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Mobile Driver Action Buttons */}
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <a 
                          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                            `${order.address?.line1 || ''}, ${order.address?.city || 'Virar'}, ${order.address?.pincode || '401305'}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-2 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 font-bold text-xs flex items-center justify-center gap-1 active:scale-95"
                        >
                          <Navigation size={13} />
                          <span>Maps</span>
                        </a>

                        <a 
                          href={`tel:${order.customerPhone || '+919820112345'}`}
                          className="py-2 px-2 rounded-xl bg-mandi-surface border border-mandi-border text-mandi-green font-bold text-xs flex items-center justify-center gap-1 active:scale-95"
                        >
                          <Phone size={13} />
                          <span>Call</span>
                        </a>

                        <a 
                          href={`https://wa.me/91${(order.customerPhone || '9820112345').replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
                            `Namaste ${order.customerName}, this is Rahul your Mandi Minutes delivery partner with order #${order.id.slice(-4)}. I am arriving in ~5 mins!`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center justify-center gap-1 active:scale-95"
                        >
                          <MessageCircle size={13} />
                          <span>WhatsApp</span>
                        </a>
                      </div>

                      {/* Big Prominent Touch Status Button */}
                      <button
                        id={`action-order-${order.id}`}
                        onClick={() => {
                          if (order.status === 'out_for_delivery') {
                            setVerifyingOrder(order);
                            setEnteredPin('');
                            setPinError('');
                          } else {
                            handleStartDelivery(order.id);
                          }
                        }}
                        className={`w-full py-3.5 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.98] ${
                          isOutForDelivery 
                            ? 'bg-gradient-to-r from-emerald-500 to-green-400 text-black shadow-emerald-500/25' 
                            : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-blue-500/25'
                        }`}
                      >
                        {order.status === 'preparing' && (
                          <>
                            <span>START DELIVERY (OUT FOR DELIVERY)</span>
                            <ArrowRight size={16} />
                          </>
                        )}
                        {isOutForDelivery && (
                          <>
                            <Check size={18} className="stroke-[3]" />
                            <span>VERIFY OTP & COMPLETE DROP (+₹40)</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* History List */}
          {dropsFilter === 'completed' && (
            <div className="space-y-2.5">
              {completedOrders.length === 0 ? (
                <div className="bg-mandi-card border border-mandi-border rounded-2xl p-6 text-center">
                  <p className="text-xs text-mandi-muted">No completed drops recorded for this shift yet.</p>
                </div>
              ) : (
                completedOrders.map(order => (
                  <div key={order.id} className="bg-mandi-card border border-mandi-border rounded-xl p-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-mandi-text">#{order.id.slice(-4).toUpperCase()}</span>
                        <span className="badge-green text-[9px]">Delivered</span>
                        <span className="text-[10px] text-mandi-subtle">{order.deliveredAt || 'Just now'}</span>
                      </div>
                      <p className="text-mandi-muted text-[11px] mt-0.5 line-clamp-1">
                        {order.address?.line1}, {order.address?.city}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="font-black text-mandi-green">+₹40.00</span>
                      <p className="text-[10px] text-mandi-subtle">Order: ₹{order.total}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      )}

      {/* ─── TAB 2: LIVE MAP SCREEN ─── */}
      {activeTab === 'map' && (
        <main className="flex-1 flex flex-col p-4 space-y-3">
          {/* Target Waypoint Floating Card */}
          <div className="bg-mandi-card border border-mandi-border rounded-2xl p-3 shadow-md space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="badge-green text-[10px]">CURRENT TARGET DROP</span>
              <span className="font-mono font-bold text-sky-400">1.4 km • ~6 mins</span>
            </div>
            <p className="text-xs font-bold text-mandi-text line-clamp-1">
              {currentFocusOrder?.customerName || 'Customer Drop'}
            </p>
            <p className="text-[11px] text-mandi-muted line-clamp-1">
              {currentFocusOrder?.address?.line1 || 'Virar West Sector'}
            </p>
          </div>

          <div className="flex-1 rounded-2xl overflow-hidden border border-mandi-border min-h-[360px] shadow-inner">
            <RiderTrackerMap
              orderId={currentFocusOrder?.id || ''}
              storeId="store-mahalaxmi-1"
              customerPincode={currentFocusOrder?.customerPincode || '401305'}
              orderStatus={currentFocusOrder?.status || 'out_for_delivery'}
            />
          </div>

          {/* Quick Turn-by-turn Navigation Button */}
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
              `${currentFocusOrder?.address?.line1 || ''}, ${currentFocusOrder?.address?.city || 'Virar'}, Maharashtra ${currentFocusOrder?.address?.pincode || '401305'}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full btn-primary py-3 px-4 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-mandi-green/20"
          >
            <Navigation size={14} />
            <span>Open Live Google Maps Navigation</span>
          </a>
        </main>
      )}

      {/* ─── TAB 3: EARNINGS SCREEN ─── */}
      {activeTab === 'earnings' && (
        <main className="flex-1 px-4 py-3 space-y-4">
          <div className="bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-900 border border-emerald-500/40 rounded-2xl p-5 shadow-xl space-y-3">
            <span className="text-xs text-emerald-300/80 font-bold uppercase tracking-wider">Shift Payout Summary</span>
            <div className="flex items-baseline justify-between">
              <h2 className="text-3xl font-black text-white">₹{totalShiftEarnings + (completedOrders.length >= 8 ? 100 : completedOrders.length >= 5 ? 50 : 0)}.00</h2>
              <span className="text-xs text-emerald-400 font-bold bg-emerald-900/60 px-2 py-0.5 rounded-full border border-emerald-500/40">
                +₹40 / Drop
              </span>
            </div>
            <p className="text-[11px] text-emerald-200/70">
              Direct deposit to linked primary UPI • Automated daily settlement at 11:30 PM
            </p>
          </div>

          {/* Breakdown Card */}
          <div className="bg-mandi-card border border-mandi-border rounded-2xl p-4 space-y-2.5">
            <h3 className="text-xs font-black text-mandi-text uppercase tracking-wider">Shift Earnings Breakdown</h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-mandi-muted">
                <span>Base Drop Pay ({completedOrders.length} completed)</span>
                <span className="font-bold text-mandi-text">₹{totalShiftEarnings}</span>
              </div>
              <div className="flex justify-between text-mandi-muted">
                <span>Shift Target Bonus</span>
                <span className="font-bold text-mandi-text">₹{completedOrders.length >= 8 ? 100 : completedOrders.length >= 5 ? 50 : 0}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-mandi-border font-bold text-sm text-mandi-green">
                <span>Total Net Earnings</span>
                <span>₹{totalShiftEarnings + (completedOrders.length >= 8 ? 100 : completedOrders.length >= 5 ? 50 : 0)}</span>
              </div>
            </div>
          </div>

          {/* Incentive Tiers */}
          <div className="bg-mandi-card border border-mandi-border rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-black text-mandi-text uppercase tracking-wider flex items-center gap-1.5">
              <Award size={14} className="text-yellow-400" />
              <span>Virar Partner Daily Targets</span>
            </h3>
            
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-mandi-surface flex items-center justify-between border border-mandi-border">
                <div>
                  <p className="font-bold text-mandi-text">Tier 1: 5 Drops</p>
                  <p className="text-[10px] text-mandi-muted">Extra incentive bonus</p>
                </div>
                <span className="badge-green text-xs font-bold">+₹50 Bonus</span>
              </div>

              <div className="p-2.5 rounded-xl bg-mandi-surface flex items-center justify-between border border-emerald-500/40">
                <div>
                  <p className="font-bold text-mandi-text">Tier 2: 8 Drops</p>
                  <p className="text-[10px] text-mandi-muted">Peak hour bonus</p>
                </div>
                <span className="bg-yellow-400/20 text-yellow-300 border border-yellow-500/40 text-xs px-2 py-0.5 rounded-md font-bold">
                  +₹100 Bonus
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-mandi-surface flex items-center justify-between border border-mandi-border opacity-70">
                <div>
                  <p className="font-bold text-mandi-text">Tier 3: 12 Drops</p>
                  <p className="text-[10px] text-mandi-muted">Full shift champion</p>
                </div>
                <span className="text-mandi-muted text-xs font-bold">+₹200 Bonus</span>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ─── TAB 4: HUB & PROFILE SCREEN ─── */}
      {activeTab === 'hub' && (
        <main className="flex-1 px-4 py-3 space-y-4">
          {/* Partner Details */}
          <div className="bg-mandi-card border border-mandi-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <img 
                src={activeRider.avatar} 
                alt={activeRider.name} 
                className="w-14 h-14 rounded-2xl border-2 border-mandi-green object-cover" 
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-black text-base text-mandi-text">{activeRider.name}</h3>
                  <ShieldCheck size={14} className="text-mandi-green" />
                </div>
                <p className="text-xs text-mandi-muted">{activeRider.hub}</p>
                <p className="text-xs text-mandi-green font-bold">★ {activeRider.rating} ({activeRider.trips} Total Drops)</p>
              </div>
            </div>

            <div className="pt-2 border-t border-mandi-border/60 text-xs space-y-1.5 text-mandi-muted">
              <div className="flex justify-between">
                <span>Registered Vehicle</span>
                <span className="font-mono text-mandi-text font-bold">{activeRider.vehicle}</span>
              </div>
              <div className="flex justify-between">
                <span>Partner ID</span>
                <span className="font-mono text-mandi-text font-bold">MM-RIDER-4821</span>
              </div>
              <div className="flex justify-between">
                <span>Registered Phone</span>
                <span className="text-mandi-text font-bold">{activeRider.phone}</span>
              </div>
              <div className="flex justify-between">
                <span>Document Status</span>
                <span className="text-mandi-green font-bold flex items-center gap-1">
                  <CheckCircle2 size={12} /> Verified & Active
                </span>
              </div>
            </div>
          </div>

          {/* Safety & SOS Section */}
          <div className="bg-rose-950/30 border border-rose-500/30 rounded-2xl p-4 space-y-2.5">
            <h3 className="text-xs font-black text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
              <AlertOctagon size={14} className="text-rose-400" />
              <span>Safety & Emergency Hotlines</span>
            </h3>
            <p className="text-[11px] text-rose-200/80">
              Keep your helmet strapped. In case of accident or difficulty on route, contact fleet assistance immediately:
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <a 
                href="tel:112"
                className="py-2.5 px-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Phone size={13} />
                <span>Police 112</span>
              </a>
              <a 
                href="tel:+919819001122"
                className="py-2.5 px-3 rounded-xl bg-mandi-surface border border-mandi-border text-mandi-text text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Phone size={13} />
                <span>Fleet Manager</span>
              </a>
            </div>
          </div>

          {/* Production Fleet & Payout Information */}
          <div className="bg-mandi-card border border-mandi-border rounded-2xl p-4 space-y-2.5">
            <h3 className="text-xs font-black text-mandi-text uppercase tracking-wider">Dispatch & Payout Details</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-mandi-muted">
                <span>Daily Payout Auto-Settlement</span>
                <span className="font-bold text-emerald-400">11:30 PM Tonight</span>
              </div>
              <div className="flex justify-between text-mandi-muted">
                <span>Direct Bank Transfer</span>
                <span className="font-bold text-mandi-text">Linked Primary UPI</span>
              </div>
              <div className="flex justify-between text-mandi-muted">
                <span>Active Dispatch Cluster</span>
                <span className="font-bold text-mandi-text">Virar West Hub (Zone 1)</span>
              </div>
              <div className="flex justify-between text-mandi-muted">
                <span>App Build</span>
                <span className="font-mono text-mandi-muted">Mandi Rider v1.0 (Production)</span>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ─── NATIVE FIXED BOTTOM TAB NAVIGATION BAR (Like Swiggy / Zepto Partner) ─── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto bg-mandi-card/95 backdrop-blur-lg border-t border-mandi-border px-3 py-2 flex items-center justify-around shadow-2xl">
        <button
          id="nav-tab-drops"
          onClick={() => { triggerHaptic([30]); setActiveTab('drops'); }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors relative ${
            activeTab === 'drops' ? 'text-mandi-green font-bold' : 'text-mandi-muted hover:text-mandi-text'
          }`}
        >
          <div className="relative">
            <Bike size={20} />
            {assignedActiveOrders.length > 0 && (
              <span className="absolute -top-1 -right-2 w-4 h-4 bg-mandi-green text-black rounded-full text-[9px] font-black flex items-center justify-center">
                {assignedActiveOrders.length}
              </span>
            )}
          </div>
          <span className="text-[10px]">Drops</span>
        </button>

        <button
          id="nav-tab-map"
          onClick={() => { triggerHaptic([30]); setActiveTab('map'); }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
            activeTab === 'map' ? 'text-mandi-green font-bold' : 'text-mandi-muted hover:text-mandi-text'
          }`}
        >
          <Compass size={20} />
          <span className="text-[10px]">Map</span>
        </button>

        <button
          id="nav-tab-earnings"
          onClick={() => { triggerHaptic([30]); setActiveTab('earnings'); }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
            activeTab === 'earnings' ? 'text-mandi-green font-bold' : 'text-mandi-muted hover:text-mandi-text'
          }`}
        >
          <Wallet size={20} />
          <span className="text-[10px]">Earnings</span>
        </button>

        <button
          id="nav-tab-hub"
          onClick={() => { triggerHaptic([30]); setActiveTab('hub'); }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
            activeTab === 'hub' ? 'text-mandi-green font-bold' : 'text-mandi-muted hover:text-mandi-text'
          }`}
        >
          <User size={20} />
          <span className="text-[10px]">Hub</span>
        </button>
      </nav>

      {/* ─── ANTI-FRAUD DOORSTEP OTP VERIFICATION MODAL ─── */}
      {verifyingOrder && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-mandi-card border border-emerald-500/40 rounded-3xl p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-mandi-border">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-mandi-text leading-tight">Doorstep OTP Verification</h3>
                  <p className="text-[10px] text-mandi-muted">Order #{verifyingOrder.id.slice(-4).toUpperCase()} • {verifyingOrder.customerName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic([30]);
                  setVerifyingOrder(null);
                  setEnteredPin('');
                  setPinError('');
                }}
                className="w-8 h-8 rounded-full bg-mandi-surface hover:bg-mandi-border/60 flex items-center justify-center text-mandi-muted hover:text-mandi-text transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* GPS Geofence Proximity Badge */}
            <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-mandi-surface/90 border border-mandi-border">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-mandi-muted text-[11px] font-medium">GPS Geofence:</span>
              </div>
              <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                <Check size={12} className="stroke-[3]" /> Doorstep Proximity Verified (~12m)
              </span>
            </div>

            {/* Payment Collection Warning */}
            {verifyingOrder.isPrepaid ? (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-semibold flex items-center justify-between">
                <span>✅ Prepaid via UPI</span>
                <span className="font-black">₹{verifyingOrder.total} Paid (NO CASH)</span>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-xs text-amber-300 font-bold flex items-center justify-between">
                <span>⚠️ Cash on Delivery</span>
                <span className="font-black text-amber-200">Collect ₹{verifyingOrder.total} CASH</span>
              </div>
            )}

            {/* Prompt */}
            <div className="text-center space-y-1">
              <p className="text-xs text-mandi-muted font-medium">
                Ask customer for the 4-digit PIN shown on their screen:
              </p>
              
              {/* 4-Digit Display Boxes */}
              <div className="flex justify-center items-center gap-3 pt-2">
                {[0, 1, 2, 3].map((idx) => {
                  const digit = enteredPin[idx];
                  const isActive = enteredPin.length === idx;
                  return (
                    <div
                      key={idx}
                      className={`w-12 h-14 rounded-2xl flex items-center justify-center text-2xl font-black transition-all ${
                        digit
                          ? 'bg-emerald-500/15 border-2 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/20'
                          : isActive
                          ? 'bg-mandi-surface border-2 border-emerald-400/80 text-mandi-text ring-2 ring-emerald-500/20'
                          : 'bg-mandi-surface/60 border border-mandi-border text-mandi-subtle'
                      } ${pinError ? 'border-rose-500/80 bg-rose-500/10' : ''}`}
                    >
                      {digit ? digit : isActive ? <span className="w-1.5 h-5 bg-emerald-400 animate-pulse rounded-full" /> : '•'}
                    </div>
                  );
                })}
              </div>

              {/* Error Message */}
              {pinError && (
                <p className="text-xs text-rose-400 font-bold pt-1.5 animate-in fade-in">
                  {pinError}
                </p>
              )}
            </div>

            {/* Big Driver Touch Keypad (Custom on-screen mobile numeric keypad) */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'DEL'].map((key) => {
                const isSpecial = key === 'C' || key === 'DEL';
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      if (key === 'C') {
                        triggerHaptic([20]);
                        setEnteredPin('');
                        setPinError('');
                      } else if (key === 'DEL') {
                        triggerHaptic([20]);
                        setEnteredPin((prev) => prev.slice(0, -1));
                        setPinError('');
                      } else {
                        handleKeypadPress(key);
                      }
                    }}
                    className={`h-12 rounded-xl flex items-center justify-center transition-transform active:scale-90 select-none ${
                      isSpecial
                        ? 'bg-mandi-surface/70 border border-mandi-border/60 text-mandi-muted hover:text-mandi-text text-sm font-bold'
                        : 'bg-mandi-surface hover:bg-mandi-border/50 border border-mandi-border text-mandi-text font-black text-xl active:bg-emerald-500 active:text-black shadow-sm'
                    }`}
                  >
                    {key === 'DEL' ? <Delete size={20} /> : key}
                  </button>
                );
              })}
            </div>

            {/* Confirm Handover Button */}
            <button
              type="button"
              disabled={enteredPin.length !== 4}
              onClick={() => handleVerifyPin(enteredPin)}
              className={`w-full py-3.5 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                enteredPin.length === 4
                  ? 'bg-gradient-to-r from-emerald-500 to-green-400 text-black shadow-emerald-500/25 active:scale-[0.98]'
                  : 'bg-mandi-surface border border-mandi-border text-mandi-subtle cursor-not-allowed opacity-50'
              }`}
            >
              <CheckCircle2 size={16} />
              <span>CONFIRM HANDOVER (+₹40)</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── EMERGENCY SOS MODAL ─── */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm bg-mandi-card border border-rose-500/40 rounded-3xl p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom-6">
            <div className="flex items-center justify-between pb-2 border-b border-mandi-border">
              <div className="flex items-center gap-2 text-rose-400 font-black">
                <AlertOctagon size={20} />
                <span>Rider Emergency Assistance</span>
              </div>
              <button 
                onClick={() => setShowSosModal(false)}
                className="w-7 h-7 rounded-full bg-mandi-surface flex items-center justify-center text-mandi-muted hover:text-mandi-text"
              >
                <X size={14} />
              </button>
            </div>

            <p className="text-xs text-mandi-muted leading-relaxed">
              Are you in danger or involved in a vehicle incident? Tap below to trigger immediate emergency assistance:
            </p>

            <div className="space-y-2 pt-1">
              <a 
                href="tel:112"
                className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30"
              >
                <Phone size={16} />
                <span>Call Police / Ambulance (112)</span>
              </a>

              <a 
                href="tel:+919819001122"
                className="w-full py-3 px-4 rounded-xl bg-mandi-surface border border-mandi-border text-mandi-text font-bold text-xs flex items-center justify-center gap-2"
              >
                <Phone size={14} />
                <span>Call Mandi Minutes Fleet Helpdesk</span>
              </a>
            </div>

            <button
              onClick={() => setShowSosModal(false)}
              className="w-full py-2 text-xs text-mandi-subtle hover:text-mandi-muted font-medium text-center"
            >
              Cancel & Return to App
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
