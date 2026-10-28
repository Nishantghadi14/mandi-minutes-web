import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../components/common/Toast';
import { useNotifications } from '../utils/useNotifications';
import LazyImage from '../components/common/LazyImage';
import UPIPaymentModal from '../components/common/UPIPaymentModal';
import { createSecureOrder } from '../services/orderService';
import { validateAddress } from '../utils/validators';
import { getAppHomePath } from '../utils/platform';
import { MapPin, Plus, Zap, Clock, Smartphone, Wallet, ChevronRight, Check, AlertCircle, Loader2, Truck } from 'lucide-react';

const PAYMENT_METHODS = [
  { 
    id: 'cod', 
    label: 'Cash on Delivery / UPI on Delivery', 
    icon: Wallet, 
    desc: 'Pay with cash or scan UPI QR with delivery partner at your doorstep' 
  },
  { 
    id: 'upi', 
    label: 'Direct UPI Payment (Pay Now)', 
    icon: Smartphone, 
    desc: 'Pay instantly via Google Pay, PhonePe, Paytm, or BHIM to our account' 
  },
];

export const SAME_DAY_SLOTS = [
  {
    id: 'same-day-express',
    type: 'same-day',
    date: 'Today',
    timeWindow: '15–30 Mins',
    label: 'Express Instant (15-30 Mins)',
    desc: 'Hyperlocal rider assigned immediately from store',
    badge: 'Fastest ⚡',
  },
  {
    id: 'same-day-eve',
    type: 'same-day',
    date: 'Today',
    timeWindow: '05:00 PM – 08:30 PM',
    label: 'Today Evening (5PM–8:30PM)',
    desc: 'Fresh doorstep delivery before dinner',
    badge: 'Popular',
  },
  {
    id: 'same-day-night',
    type: 'same-day',
    date: 'Today',
    timeWindow: '08:30 PM – 10:30 PM',
    label: 'Tonight (8:30PM–10:30PM)',
    desc: 'Late evening relaxed doorstep drop',
    badge: null,
  },
];

export const SCHEDULED_SLOTS = [
  {
    id: 'tom-morn',
    type: 'scheduled',
    date: 'Tomorrow',
    timeWindow: '07:00 AM – 11:00 AM',
    label: 'Tomorrow Morning (7AM–11AM)',
    desc: 'Direct fresh harvest drop right to your door',
    badge: 'Recommended 🌅',
  },
  {
    id: 'tom-noon',
    type: 'scheduled',
    date: 'Tomorrow',
    timeWindow: '12:00 PM – 04:00 PM',
    label: 'Tomorrow Afternoon (12PM–4PM)',
    desc: 'Standard mid-day grocery slot',
    badge: null,
  },
  {
    id: 'tom-eve',
    type: 'scheduled',
    date: 'Tomorrow',
    timeWindow: '05:00 PM – 08:30 PM',
    label: 'Tomorrow Evening (5PM–8:30PM)',
    desc: 'Convenient after-work delivery',
    badge: null,
  },
  {
    id: 'day-after-morn',
    type: 'scheduled',
    date: 'Day After Tomorrow',
    timeWindow: '08:00 AM – 01:00 PM',
    label: 'Day After Tomorrow (8AM–1PM)',
    desc: 'Advance planned weekly groceries',
    badge: 'Advance 📅',
  },
];

export default function CheckoutPage() {
  const { t } = useTranslation();
  const { items, subtotal, discount, deliveryCharge, total, clearCart, storeId, coupon } = useCart();
  const { user, updateUser } = useAuth();
  const { stores } = useData();
  const { addToast } = useToast();
  const { notifyOrderPlaced } = useNotifications();
  const navigate = useNavigate();

  const store = stores.find(s => s.id === storeId);
  const isMockAddress = (a) => !a || a.id === 'addr-1' || a.line1 === 'Virar West, Maharashtra, 401303';

  const getInitialAddress = () => {
    if (user?.addresses?.length) {
      const validAddrs = user.addresses.filter(a => !isMockAddress(a));
      if (validAddrs.length) {
        return validAddrs.find(a => a.isDefault) || validAddrs[0];
      }
    }
    try {
      const stored = JSON.parse(localStorage.getItem('mandi_checkout_address') || 'null');
      if (stored && !isMockAddress(stored) && validateAddress(stored).valid) return stored;
    } catch {}
    return null;
  };

  const [selectedAddress, setSelectedAddress] = useState(getInitialAddress);
  const [showAddressForm, setShowAddressForm] = useState(!getInitialAddress());
  const [newAddress, setNewAddress] = useState({ label: 'Home', line1: '', area: '', landmark: '', city: 'Virar West', pincode: '401305' });
  const [addressErrors, setAddressErrors] = useState({});
  const [deliveryMode, setDeliveryMode] = useState('same-day'); // 'same-day' | 'scheduled'
  const [selectedSameDaySlotId, setSelectedSameDaySlotId] = useState('same-day-express');
  const [selectedScheduledSlotId, setSelectedScheduledSlotId] = useState('tom-morn');
  const [selectedPayment, setSelectedPayment] = useState('cod');
  const [placing, setPlacing] = useState(false);
  const [step, setStep] = useState(1);
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);

  const currentSlot = deliveryMode === 'same-day'
    ? (SAME_DAY_SLOTS.find(s => s.id === selectedSameDaySlotId) || SAME_DAY_SLOTS[0])
    : (SCHEDULED_SLOTS.find(s => s.id === selectedScheduledSlotId) || SCHEDULED_SLOTS[0]);

  // Sync saved address when user profile loads - never wipe out valid local address
  useEffect(() => {
    if (user?.addresses?.length) {
      const validAddrs = user.addresses.filter(a => !isMockAddress(a));
      if (validAddrs.length > 0) {
        setSelectedAddress(prev => {
          if (!prev || isMockAddress(prev) || !validAddrs.some(a => a.id === prev.id)) {
            return validAddrs.find(a => a.isDefault) || validAddrs[0];
          }
          return prev;
        });
        setShowAddressForm(false);
      } else {
        setSelectedAddress(null);
        setShowAddressForm(true);
      }
    } else {
      // Check if user already has an address in local storage
      try {
        const stored = JSON.parse(localStorage.getItem('mandi_checkout_address') || 'null');
        if (stored && !isMockAddress(stored) && validateAddress(stored).valid) {
          setSelectedAddress(prev => prev || stored);
          setShowAddressForm(false);
          return;
        }
      } catch {}
      setSelectedAddress(null);
      setShowAddressForm(true);
    }
  }, [user]);

  // Guard: Mandatory address before proceeding to Step 2
  useEffect(() => {
    if (step > 1 && !selectedAddress) {
      setStep(1);
      setShowAddressForm(true);
      addToast('Please enter and save your delivery address first', 'error');
    }
  }, [step, selectedAddress, addToast]);

  if (!items.length) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <AlertCircle size={48} className="text-mandi-subtle mx-auto mb-4" />
        <h2 className="text-mandi-text font-bold text-2xl mb-2">Cart is empty</h2>
        <button onClick={() => navigate(getAppHomePath())} className="btn-primary mt-4">Go Shopping</button>
      </div>
    );
  }

  const handleAddAddress = () => {
    const check = validateAddress(newAddress);
    if (!check.valid) {
      setAddressErrors(check.errors);
      const firstErr = Object.values(check.errors)[0];
      addToast(firstErr || 'Please fill in all required address fields', 'error');
      return false;
    }

    setAddressErrors({});
    const addr = { ...check.sanitized, id: `addr-${Date.now()}`, isDefault: true };
    try {
      localStorage.setItem('mandi_checkout_address', JSON.stringify(addr));
    } catch {}

    const updated = [addr, ...(user?.addresses || [])];
    if (typeof updateUser === 'function') {
      updateUser({ addresses: updated });
    }
    setSelectedAddress(addr);
    setShowAddressForm(false);
    setStep(2); // Auto advance to Step 2
    addToast('Delivery address saved! Proceeding to Step 2 🎉', 'success');
    return true;
  };

  const handleProceedToStep2 = () => {
    if (showAddressForm) {
      handleAddAddress();
      return;
    }

    if (!selectedAddress) {
      setShowAddressForm(true);
      addToast('Please enter and save your delivery address before proceeding', 'error');
      return;
    }

    setStep(2);
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) { 
      setStep(1);
      setShowAddressForm(true);
      addToast('Please enter and save your delivery address before placing order', 'error'); 
      return; 
    }

    if (placing) return; // Prevent double taps

    setPlacing(true);
    try {
      const isScheduled = deliveryMode === 'scheduled';
      const scheduledSlot = currentSlot ? {
        id: currentSlot.id,
        type: currentSlot.type,
        date: currentSlot.date,
        timeWindow: currentSlot.timeWindow,
        label: currentSlot.label,
      } : null;

      const effectiveStoreId = storeId || store?.id || (items && items[0]?.storeId) || 'store-mahalaxmi-1';

      // 1. Calculate price server-side and validate against Firestore product catalog with idempotency
      const verifiedOrder = await createSecureOrder({
        items,
        storeId: effectiveStoreId,
        storeName: store?.name || 'Local Store',
        address: selectedAddress,
        deliveryType: deliveryMode,
        scheduledSlot,
        couponCode: coupon?.code || null,
        paymentMethod: selectedPayment === 'cod' ? 'Cash on Delivery' : 'UPI / Online Gateway',
      });

      if (selectedPayment === 'upi') {
        setPendingOrder(verifiedOrder);
        setShowUpiModal(true);
      } else {
        // Cash on Delivery
        clearCart();
        notifyOrderPlaced(verifiedOrder);
        addToast(
          isScheduled 
            ? `Order scheduled for ${currentSlot?.label}! Pay on delivery 🎉` 
            : `Order placed for Same-Day Delivery (${currentSlot?.label})! Pay on delivery 🎉`, 
          'success'
        );
        navigate(`/order-status/${verifiedOrder.id}`, { state: { order: verifiedOrder } });
      }
    } catch (err) {
      console.error('Order creation error:', err);
      addToast(err.message || 'Failed to place order. Try again.', 'error');
    } finally {
      setPlacing(false);
    }
  };

  const handleUpiSuccess = () => {
    setShowUpiModal(false);
    clearCart();
    notifyOrderPlaced(pendingOrder);
    addToast('Payment verified! Your order is being prepared 🎉', 'success');
    navigate(`/order-status/${pendingOrder.id}`, { state: { order: pendingOrder } });
  };

  const stepLabels = ['Delivery Address', 'Delivery & Payment'];

  return (
    <>
    <div className="max-w-3xl mx-auto px-3.5 sm:px-4 py-4 sm:py-6 pb-12 md:pb-8">
      <h1 className="text-mandi-text font-black text-xl sm:text-2xl mb-4 sm:mb-6">Checkout</h1>

      {/* Progress steps */}
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        {stepLabels.map((label, i) => (
          <div key={label} className="flex items-center gap-1.5 sm:gap-2 flex-1">
            <div 
              className={`flex items-center gap-1.5 sm:gap-2 ${i + 1 === 1 || (i + 1 === 2 && selectedAddress) ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`} 
              onClick={() => {
                const targetStep = i + 1;
                if (targetStep === 1) {
                  setStep(1);
                } else if (targetStep === 2) {
                  if (!selectedAddress) {
                    setShowAddressForm(true);
                    addToast('Please enter and save your delivery address first', 'error');
                    return;
                  }
                  setStep(2);
                }
              }}
            >
              <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i + 1 < step ? 'bg-mandi-green text-black' : i + 1 === step ? 'bg-mandi-green text-black ring-2 ring-mandi-green ring-offset-2 ring-offset-mandi-dark' : 'bg-mandi-surface border border-mandi-border text-mandi-muted'}`}>
                {i + 1 < step ? <Check size={13} /> : i + 1}
              </div>
              <span className={`text-[11px] sm:text-xs font-medium hidden sm:block ${i + 1 <= step ? 'text-mandi-text' : 'text-mandi-muted'}`}>{label}</span>
            </div>
            {i < stepLabels.length - 1 && <div className={`flex-1 h-0.5 ${step > 1 ? 'bg-mandi-green' : 'bg-mandi-border'}`} />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="md:col-span-2 space-y-4">
          {/* Step 1: Address */}
          {step >= 1 && (
            <div className="card p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3.5 sm:mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-mandi-text font-bold text-sm sm:text-base flex items-center gap-2">
                    <MapPin size={17} className="text-mandi-green" /> Delivery Address
                  </h2>
                  <span className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
                    Required
                  </span>
                </div>
                {step > 1 && (
                  <button onClick={() => setStep(1)} className="text-mandi-green text-xs sm:text-sm hover:underline font-semibold">
                    Change
                  </button>
                )}
              </div>

              {!showAddressForm && user?.addresses?.length > 0 ? (
                <div className="space-y-2 mb-3">
                  {user.addresses.map(addr => (
                    <div 
                      key={addr.id} 
                      onClick={() => setSelectedAddress(addr)} 
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedAddress?.id === addr.id 
                          ? 'border-mandi-green bg-mandi-green-muted ring-1 ring-mandi-green' 
                          : 'border-mandi-border hover:border-mandi-border-light'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        selectedAddress?.id === addr.id ? 'border-mandi-green bg-mandi-green' : 'border-mandi-border'
                      }`}>
                        {selectedAddress?.id === addr.id && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-mandi-text text-sm font-semibold">{addr.label}</p>
                          {addr.isDefault && (
                            <span className="text-[9px] font-bold text-mandi-green bg-mandi-green/15 px-1.5 py-0.2 rounded">Default</span>
                          )}
                        </div>
                        <p className="text-mandi-muted text-xs mt-0.5">{addr.line1}, {addr.city} - {addr.pincode}</p>
                      </div>
                    </div>
                  ))}

                  <button 
                    type="button"
                    onClick={() => setShowAddressForm(true)} 
                    className="flex items-center gap-1.5 text-mandi-green text-xs font-semibold hover:underline pt-1"
                  >
                    <Plus size={14} /> Add another address
                  </button>
                </div>
              ) : null}

              {showAddressForm ? (
                <div className="space-y-3 bg-mandi-surface/50 p-3.5 rounded-2xl border border-mandi-border/80">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-mandi-text">Add Delivery Address</p>
                      <p className="text-[11px] text-mandi-subtle">Instant 10-minute grocery delivery</p>
                    </div>
                    <span className="text-[10px] text-red-400 font-semibold bg-red-500/10 px-2 py-0.5 rounded-full">*Required</span>
                  </div>

                  {/* Save As Tag */}
                  <div>
                    <label className="text-[11px] font-semibold text-mandi-muted mb-1.5 block">Save Address As</label>
                    <div className="flex gap-2">
                      {['Home', 'Work', 'Other'].map(l => (
                        <button 
                          key={l} 
                          type="button"
                          onClick={() => setNewAddress(a => ({ ...a, label: l }))} 
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            newAddress.label === l ? 'bg-mandi-green text-black border-mandi-green font-bold' : 'border-mandi-border text-mandi-muted hover:border-mandi-border-light'
                          }`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* House / Flat / Building */}
                  <div>
                    <label className="text-[11px] font-semibold text-mandi-muted mb-1 block">
                      House / Flat / Floor / Building Name *
                    </label>
                    <input 
                      placeholder="Flat, house no., building name" 
                      value={newAddress.line1} 
                      onChange={e => { 
                        setNewAddress(a => ({ ...a, line1: e.target.value })); 
                        setAddressErrors(err => ({ ...err, line1: null })); 
                      }} 
                      className={`input-field text-sm ${addressErrors.line1 ? 'border-red-500 ring-1 ring-red-500' : ''}`} 
                    />
                    {addressErrors.line1 && <p className="text-red-400 text-xs mt-1">{addressErrors.line1}</p>}
                  </div>

                  {/* Area / Sector / Street */}
                  <div>
                    <label className="text-[11px] font-semibold text-mandi-muted mb-1 block">
                      Area / Sector / Street Address
                    </label>
                    <input 
                      placeholder="Area, street, or sector" 
                      value={newAddress.area || ''} 
                      onChange={e => setNewAddress(a => ({ ...a, area: e.target.value }))} 
                      className="input-field text-sm" 
                    />
                  </div>

                  {/* Nearby Landmark */}
                  <div>
                    <label className="text-[11px] font-semibold text-mandi-muted mb-1 block">
                      Nearby Landmark (Optional)
                    </label>
                    <input 
                      placeholder="Landmark or famous spot" 
                      value={newAddress.landmark || ''} 
                      onChange={e => setNewAddress(a => ({ ...a, landmark: e.target.value }))} 
                      className="input-field text-sm" 
                    />
                  </div>

                  {/* City & Pincode */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-semibold text-mandi-muted mb-1 block">City *</label>
                      <input 
                        placeholder="City" 
                        value={newAddress.city} 
                        onChange={e => { 
                          setNewAddress(a => ({ ...a, city: e.target.value })); 
                          setAddressErrors(err => ({ ...err, city: null })); 
                        }} 
                        className={`input-field text-sm ${addressErrors.city ? 'border-red-500 ring-1 ring-red-500' : ''}`} 
                      />
                      {addressErrors.city && <p className="text-red-400 text-xs mt-1">{addressErrors.city}</p>}
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-mandi-muted mb-1 block">6-Digit Pincode *</label>
                      <input 
                        placeholder="6-digit Pincode" 
                        value={newAddress.pincode} 
                        onChange={e => { 
                          setNewAddress(a => ({ ...a, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })); 
                          setAddressErrors(err => ({ ...err, pincode: null })); 
                        }} 
                        className={`input-field text-sm ${addressErrors.pincode ? 'border-red-500 ring-1 ring-red-500' : ''}`} 
                        maxLength={6} 
                      />
                      {addressErrors.pincode && <p className="text-red-400 text-xs mt-1">{addressErrors.pincode}</p>}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button 
                      type="button" 
                      onClick={handleAddAddress} 
                      className="btn-primary text-xs sm:text-sm py-2.5 flex-1 flex items-center justify-center gap-1.5 font-bold cursor-pointer"
                    >
                      Save Address & Continue <ChevronRight size={15} />
                    </button>
                    {user?.addresses?.length > 0 && (
                      <button 
                        type="button" 
                        onClick={() => setShowAddressForm(false)} 
                        className="btn-ghost text-xs sm:text-sm py-2.5 px-3 cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Step 1 continue button when selecting existing saved address */}
              {step === 1 && !showAddressForm && (
                <button 
                  type="button"
                  onClick={handleProceedToStep2} 
                  disabled={!selectedAddress}
                  className="btn-primary w-full mt-4 flex items-center justify-center gap-2 py-2.5"
                >
                  Deliver to this Address & Continue <ChevronRight size={16} />
                </button>
              )}
            </div>
          )}

          {/* Step 2: Slot & Payment */}
          {step >= 2 && (
            <div className="card p-4 sm:p-5 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-mandi-text font-bold text-sm sm:text-base flex items-center gap-2">
                      <Truck size={17} className="text-mandi-green" /> Delivery Preference
                    </h3>
                    <p className="text-xs text-mandi-muted mt-0.5">Select when you want your groceries delivered</p>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 hidden sm:inline-flex items-center gap-1">
                    Free on ₹199+
                  </span>
                </div>

                {/* Delivery Mode Tabs: Same-Day Delivery vs Schedule Delivery */}
                <div className="grid grid-cols-2 gap-2.5 p-1 bg-mandi-surface rounded-2xl border border-mandi-border mb-3.5">
                  <button
                    type="button"
                    onClick={() => setDeliveryMode('same-day')}
                    className={`p-3 rounded-xl text-left transition-all relative flex flex-col justify-between ${
                      deliveryMode === 'same-day'
                        ? 'bg-mandi-card border-2 border-mandi-green shadow-clay-card text-mandi-text ring-1 ring-mandi-green/40'
                        : 'border border-transparent hover:bg-mandi-card/50 text-mandi-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`text-xs sm:text-sm font-bold flex items-center gap-1.5 ${deliveryMode === 'same-day' ? 'text-mandi-green' : 'text-mandi-text'}`}>
                        <Zap size={15} className={deliveryMode === 'same-day' ? 'text-mandi-green' : 'text-mandi-muted'} />
                        Same-Day Delivery
                      </span>
                      <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-1.5 py-0.5 rounded">
                        Today
                      </span>
                    </div>
                    <p className="text-[11px] text-mandi-muted leading-tight">
                      Instant 15–30 min or evening drop today
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMode('scheduled')}
                    className={`p-3 rounded-xl text-left transition-all relative flex flex-col justify-between ${
                      deliveryMode === 'scheduled'
                        ? 'bg-mandi-card border-2 border-mandi-green shadow-clay-card text-mandi-text ring-1 ring-mandi-green/40'
                        : 'border border-transparent hover:bg-mandi-card/50 text-mandi-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`text-xs sm:text-sm font-bold flex items-center gap-1.5 ${deliveryMode === 'scheduled' ? 'text-mandi-green' : 'text-mandi-text'}`}>
                        <Clock size={15} className={deliveryMode === 'scheduled' ? 'text-mandi-green' : 'text-mandi-muted'} />
                        Schedule Delivery
                      </span>
                      <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black px-1.5 py-0.5 rounded">
                        Pick Slot
                      </span>
                    </div>
                    <p className="text-[11px] text-mandi-muted leading-tight">
                      Pick tomorrow morning or advance slot
                    </p>
                  </button>
                </div>

                {/* Slot Selection Grid for Active Mode */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-mandi-subtle px-0.5">
                    <span className="font-semibold text-mandi-text">
                      {deliveryMode === 'same-day' ? "Select Today's Slot:" : 'Select Scheduled Date & Slot:'}
                    </span>
                    <span className="text-[11px] text-mandi-muted">
                      {deliveryMode === 'same-day' ? '⚡ Direct Virar hyperlocal fulfillment' : '📦 Packed overnight, delivered fresh'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(deliveryMode === 'same-day' ? SAME_DAY_SLOTS : SCHEDULED_SLOTS).map(slot => {
                      const isSelected = deliveryMode === 'same-day'
                        ? selectedSameDaySlotId === slot.id
                        : selectedScheduledSlotId === slot.id;

                      return (
                        <div
                          key={slot.id}
                          onClick={() => {
                            if (deliveryMode === 'same-day') {
                              setSelectedSameDaySlotId(slot.id);
                            } else {
                              setSelectedScheduledSlotId(slot.id);
                            }
                          }}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? 'border-mandi-green bg-mandi-green-muted ring-1 ring-mandi-green shadow-clay-badge'
                              : 'border-mandi-border hover:border-mandi-border-light bg-mandi-surface/50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              isSelected ? 'border-mandi-green bg-mandi-green' : 'border-mandi-border'
                            }`}>
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-xs text-mandi-text">{slot.label}</span>
                                {slot.badge && (
                                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black px-1.5 py-0.5 rounded">
                                    {slot.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-mandi-muted text-[11px] truncate mt-0.5">{slot.desc}</p>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-mandi-green ml-2 flex-shrink-0">
                            {deliveryCharge === 0 ? 'FREE' : '₹' + deliveryCharge}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-mandi-text font-bold text-sm mb-3">Payment Method</h3>
                <div className="space-y-2">
                  {PAYMENT_METHODS.map(p => {
                    const Icon = p.icon;
                    return (
                      <div 
                        key={p.id} 
                        onClick={() => setSelectedPayment(p.id)} 
                        className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                          selectedPayment === p.id 
                            ? 'border-mandi-green bg-mandi-green-muted ring-1 ring-mandi-green shadow-clay-badge' 
                            : 'border-mandi-border hover:border-mandi-border-light bg-mandi-surface/40'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          selectedPayment === p.id ? 'border-mandi-green bg-mandi-green' : 'border-mandi-border'
                        }`}>
                          {selectedPayment === p.id && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                        </div>
                        <Icon size={18} className="text-mandi-green flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-mandi-text text-sm font-semibold">{p.label}</p>
                          <p className="text-mandi-muted text-xs">{p.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setStep(1)} className="btn-ghost text-sm py-2.5 flex-1">{t('common.back', 'Back')}</button>
                <button 
                  type="button"
                  onClick={handlePlaceOrder} 
                  disabled={placing} 
                  className="btn-primary text-sm py-2.5 flex-[2] flex items-center justify-center gap-2 font-bold shadow-lg"
                >
                  {placing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Processing Order...</span>
                    </>
                  ) : selectedPayment === 'cod' ? (
                    <span className="flex items-center gap-2">
                      <Wallet size={16} /> Place Order (Pay on Delivery)
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Smartphone size={16} /> Pay Now via UPI
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="card p-4 sm:p-5 h-fit space-y-4">
          <h2 className="text-mandi-text font-bold text-base">{t('checkout.summary', 'Order Summary')}</h2>
          {store && (
            <p className="text-mandi-muted text-xs">From <strong className="text-mandi-text">{store.name}</strong></p>
          )}

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {items.map(item => (
              <div key={item.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <LazyImage src={item.image} alt={item.name} className="w-8 h-8 rounded-lg object-cover" containerClass="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0" width={32} height={32} />
                  <div>
                    <p className="text-mandi-text font-medium truncate max-w-[120px]">{item.name}</p>
                    <p className="text-mandi-muted text-[10px]">x{item.quantity}</p>
                  </div>
                </div>
                <span className="text-mandi-text font-semibold">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-mandi-border pt-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-mandi-muted">
              <span>{t('checkout.subtotal', 'Subtotal')}</span>
              <span>₹{subtotal}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-mandi-green">
                <span>{t('checkout.discount', 'Discount')} ({coupon?.code})</span>
                <span>-₹{discount}</span>
              </div>
            )}
            <div className="flex justify-between text-mandi-muted">
              <span>{t('checkout.deliveryCharge', 'Delivery Charge')}</span>
              <span>{deliveryCharge === 0 ? <span className="text-mandi-green">{t('checkout.free', 'FREE')}</span> : `₹${deliveryCharge}`}</span>
            </div>
            <div className="border-t border-mandi-border pt-2 flex justify-between text-mandi-text font-bold text-sm">
              <span>{t('checkout.total', 'Total')}</span>
              <span>₹{total}</span>
            </div>
          </div>

          <div className="bg-mandi-surface rounded-xl p-3 text-[11px] text-mandi-muted space-y-1">
            <div className="flex items-center gap-1.5 text-mandi-green font-semibold">
              {deliveryMode === 'scheduled' ? <Clock size={13} /> : <Zap size={13} />}
              <span>
                {deliveryMode === 'scheduled'
                  ? `Scheduled Delivery • ${currentSlot?.label || 'Tomorrow'}`
                  : `Same-Day Delivery • ${currentSlot?.label || 'Express'}`}
              </span>
            </div>
            <p>
              {deliveryMode === 'scheduled'
                ? 'Freshly packed overnight. Delivered on your chosen slot right to your door.'
                : 'Direct hyperlocal delivery from neighborhood Kirana store.'}
            </p>
          </div>
        </div>
      </div>
    </div>

    {/* Razorpay UPI / Card Gateway Modal */}
    {showUpiModal && pendingOrder && (
      <UPIPaymentModal
        isOpen={showUpiModal}
        onClose={() => setShowUpiModal(false)}
        amount={pendingOrder.total}
        orderId={pendingOrder.id}
        razorpayOrderId={pendingOrder.razorpayOrder?.id || pendingOrder.razorpayOrderId}
        store={store}
        storeId={storeId || pendingOrder.storeId}
        storeName={store?.name}
        upiId={store?.upiId}
        customerName={user?.name}
        customerEmail={user?.email}
        onSuccess={handleUpiSuccess}
        onSwitchToCod={async () => {
          setShowUpiModal(false);
          clearCart();
          notifyOrderPlaced(pendingOrder);
          addToast('Switched to Cash on Delivery! Pay upon delivery 🎉', 'success');
          navigate(`/order-status/${pendingOrder.id}`, { state: { order: { ...pendingOrder, paymentMethod: 'Cash on Delivery', paymentStatus: 'cod_pending' } } });
        }}
      />
    )}
    </>
  );
}
