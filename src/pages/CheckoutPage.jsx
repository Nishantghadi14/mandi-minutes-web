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
import { MapPin, Plus, Zap, Clock, Smartphone, Wallet, ChevronRight, Check, AlertCircle, Loader2 } from 'lucide-react';

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI / Online Gateway', icon: Smartphone, desc: 'Instant UPI, GPay, PhonePe, Cards' },
  { id: 'cod', label: 'Cash on Delivery', icon: Wallet, desc: 'Pay with cash upon delivery' },
];

const SCHEDULED_WINDOWS = [
  { id: 'today-aft', date: 'Today', timeWindow: '12:00 PM – 02:00 PM', label: 'Today (12PM–2PM)' },
  { id: 'today-eve', date: 'Today', timeWindow: '04:00 PM – 06:00 PM', label: 'Today (4PM–6PM)' },
  { id: 'today-night', date: 'Today', timeWindow: '07:00 PM – 09:00 PM', label: 'Today (7PM–9PM)' },
  { id: 'tom-morn', date: 'Tomorrow', timeWindow: '08:00 AM – 10:00 AM', label: 'Tomorrow (8AM–10AM)' },
  { id: 'tom-noon', date: 'Tomorrow', timeWindow: '11:00 AM – 01:00 PM', label: 'Tomorrow (11AM–1PM)' },
  { id: 'tom-eve', date: 'Tomorrow', timeWindow: '04:00 PM – 06:00 PM', label: 'Tomorrow (4PM–6PM)' },
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
  const [selectedAddress, setSelectedAddress] = useState(user?.addresses?.find(a => a.isDefault) || user?.addresses?.[0]);
  const [showAddressForm, setShowAddressForm] = useState(!user?.addresses?.length);
  const [newAddress, setNewAddress] = useState({ label: 'Home', line1: '', city: 'Virar, Palghar', pincode: '401305' });
  const [addressErrors, setAddressErrors] = useState({});
  const [deliveryMode, setDeliveryMode] = useState('express'); // 'express' | 'scheduled'
  const [selectedWindowId, setSelectedWindowId] = useState('today-aft');
  const [selectedPayment, setSelectedPayment] = useState('upi');
  const [placing, setPlacing] = useState(false);
  const [step, setStep] = useState(1);
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);

  // Auto-sync selected address when user profile loads
  useEffect(() => {
    if (!selectedAddress) {
      if (user?.addresses?.length) {
        setSelectedAddress(user.addresses.find(a => a.isDefault) || user.addresses[0]);
        setShowAddressForm(false);
      } else {
        const defaultAddr = { id: 'addr-default', label: 'Home', line1: 'Shop 4, Agashi Road, Near Station', city: 'Virar West, Palghar', pincode: '401305', isDefault: true };
        setSelectedAddress(defaultAddr);
        setShowAddressForm(false);
      }
    }
  }, [user, selectedAddress]);

  if (!items.length) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <AlertCircle size={48} className="text-mandi-subtle mx-auto mb-4" />
        <h2 className="text-mandi-text font-bold text-2xl mb-2">Cart is empty</h2>
        <button onClick={() => navigate('/')} className="btn-primary mt-4">Go Shopping</button>
      </div>
    );
  }

  const handleAddAddress = () => {
    const check = validateAddress(newAddress);
    if (!check.valid) {
      setAddressErrors(check.errors);
      const firstErr = Object.values(check.errors)[0];
      addToast(firstErr || 'Please check address fields', 'error');
      return;
    }

    setAddressErrors({});
    const addr = { ...check.sanitized, id: `addr-${Date.now()}`, isDefault: true };
    const updated = [addr, ...(user?.addresses || [])];
    updateUser({ addresses: updated });
    setSelectedAddress(addr);
    setShowAddressForm(false);
    setStep(2); // Auto advance to payment step
    addToast('Address confirmed! Proceed to payment 🎉', 'success');
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) { 
      addToast('Please select a delivery address', 'error'); 
      return; 
    }

    if (placing) return; // Prevent double taps

    setPlacing(true);
    try {
      const isScheduled = deliveryMode === 'scheduled';
      const chosenWindow = SCHEDULED_WINDOWS.find(w => w.id === selectedWindowId);
      const scheduledSlot = isScheduled && chosenWindow ? {
        date: chosenWindow.date,
        timeWindow: chosenWindow.timeWindow,
        label: chosenWindow.label,
      } : null;

      // 1. Calculate price server-side and validate against Firestore product catalog with idempotency
      const verifiedOrder = await createSecureOrder({
        items,
        storeId,
        address: selectedAddress,
        deliveryType: isScheduled ? 'scheduled' : 'express',
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
            ? `Order scheduled for ${chosenWindow?.label}! Pay on delivery 🎉` 
            : 'Order placed successfully! Pay on delivery 🎉', 
          'success'
        );
        navigate(`/order-status/${verifiedOrder.id}`, { state: { order: verifiedOrder, autoProgress: !isScheduled } });
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
    navigate(`/order-status/${pendingOrder.id}`, { state: { order: pendingOrder, autoProgress: true } });
  };

  const stepLabels = ['Delivery Address', 'Payment & Schedule', 'Confirm Order'];

  return (
    <>
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <h1 className="text-mandi-text font-black text-2xl mb-6">Checkout</h1>

      {/* Progress steps */}
      <div className="flex items-center gap-2 mb-6">
        {stepLabels.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div className={`flex items-center gap-2 ${i < step - 1 ? 'cursor-pointer' : ''}`} onClick={() => i < step - 1 && setStep(i + 1)}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i + 1 < step ? 'bg-mandi-green text-black' : i + 1 === step ? 'bg-mandi-green text-black ring-2 ring-mandi-green ring-offset-2 ring-offset-mandi-dark' : 'bg-mandi-surface border border-mandi-border text-mandi-muted'}`}>
                {i + 1 < step ? <Check size={14} /> : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${i + 1 <= step ? 'text-mandi-text' : 'text-mandi-muted'}`}>{label}</span>
            </div>
            {i < stepLabels.length - 1 && <div className={`flex-1 h-0.5 ${i + 1 < step ? 'bg-mandi-green' : 'bg-mandi-border'}`} />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {/* Step 1: Address */}
          {step >= 1 && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-mandi-text font-bold flex items-center gap-2"><MapPin size={18} className="text-mandi-green" />Delivery Address</h2>
                {step > 1 && <button onClick={() => setStep(1)} className="text-mandi-green text-sm hover:underline">Change</button>}
              </div>
              {!showAddressForm && user?.addresses?.map(addr => (
                <div key={addr.id} onClick={() => setSelectedAddress(addr)} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer mb-2 transition-all ${selectedAddress?.id === addr.id ? 'border-mandi-green bg-mandi-green-muted' : 'border-mandi-border hover:border-mandi-border-light'}`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 ${selectedAddress?.id === addr.id ? 'border-mandi-green bg-mandi-green' : 'border-mandi-border'}`} />
                  <div>
                    <p className="text-mandi-text text-sm font-semibold">{addr.label}</p>
                    <p className="text-mandi-muted text-xs">{addr.line1}, {addr.city} - {addr.pincode}</p>
                  </div>
                </div>
              ))}
              {showAddressForm ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    {['Home', 'Office', 'Other'].map(l => (
                      <button key={l} onClick={() => setNewAddress(a => ({ ...a, label: l }))} className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${newAddress.label === l ? 'bg-mandi-green text-black border-mandi-green' : 'border-mandi-border text-mandi-muted'}`}>{l}</button>
                    ))}
                  </div>
                  <div>
                    <input 
                      placeholder="Street address, apartment, landmark" 
                      value={newAddress.line1} 
                      onChange={e => { setNewAddress(a => ({ ...a, line1: e.target.value })); setAddressErrors(err => ({ ...err, line1: null })); }} 
                      className={`input-field text-sm ${addressErrors.line1 ? 'border-red-500' : ''}`} 
                    />
                    {addressErrors.line1 && <p className="text-red-400 text-xs mt-1">{addressErrors.line1}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input 
                        placeholder="City" 
                        value={newAddress.city} 
                        onChange={e => { setNewAddress(a => ({ ...a, city: e.target.value })); setAddressErrors(err => ({ ...err, city: null })); }} 
                        className={`input-field text-sm ${addressErrors.city ? 'border-red-500' : ''}`} 
                      />
                      {addressErrors.city && <p className="text-red-400 text-xs mt-1">{addressErrors.city}</p>}
                    </div>
                    <div>
                      <input 
                        placeholder="Pincode" 
                        value={newAddress.pincode} 
                        onChange={e => { setNewAddress(a => ({ ...a, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })); setAddressErrors(err => ({ ...err, pincode: null })); }} 
                        className={`input-field text-sm ${addressErrors.pincode ? 'border-red-500' : ''}`} 
                        maxLength={6} 
                      />
                      {addressErrors.pincode && <p className="text-red-400 text-xs mt-1">{addressErrors.pincode}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleAddAddress} className="btn-primary text-sm py-2 flex-1">Save Address</button>
                    {user?.addresses?.length > 0 && <button onClick={() => setShowAddressForm(false)} className="btn-ghost text-sm py-2">Cancel</button>}
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowAddressForm(true)} className="flex items-center gap-2 text-mandi-green text-sm font-medium hover:underline mt-2">
                  <Plus size={14} />Add new address
                </button>
              )}
              {step === 1 && selectedAddress && (
                <button onClick={() => setStep(2)} className="btn-primary w-full mt-4 flex items-center justify-center gap-2">Continue <ChevronRight size={16} /></button>
              )}
            </div>
          )}

          {/* Step 2: Slot & Payment */}
          {step >= 2 && (
            <div className="card p-5 space-y-4">
              <div>
                <h3 className="text-mandi-text font-bold text-sm mb-3">Delivery Mode</h3>
                
                {/* Express vs Scheduled Toggle */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div
                    onClick={() => setDeliveryMode('express')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${deliveryMode === 'express' ? 'border-mandi-green bg-mandi-green-muted' : 'border-mandi-border hover:border-mandi-border-light'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-mandi-text text-xs font-semibold">⚡ Express Delivery</span>
                      <span className="badge-green text-[10px]">10-15 Min</span>
                    </div>
                    <p className="text-mandi-muted text-xs">Direct hyperlocal fulfillment</p>
                  </div>

                  <div
                    onClick={() => setDeliveryMode('scheduled')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${deliveryMode === 'scheduled' ? 'border-mandi-green bg-mandi-green-muted' : 'border-mandi-border hover:border-mandi-border-light'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-mandi-text text-xs font-semibold">📅 Scheduled Slot</span>
                      <span className="bg-orange-950 text-orange-300 border border-orange-800 text-[10px] px-1.5 py-0.5 rounded font-bold">Choose Time</span>
                    </div>
                    <p className="text-mandi-muted text-xs">2-hour delivery window</p>
                  </div>
                </div>

                {/* Scheduled 2-Hour Windows Grid */}
                {deliveryMode === 'scheduled' && (
                  <div className="space-y-2 pt-1 pb-2">
                    <p className="text-xs font-medium text-mandi-subtle">Select preferred 2-hour slot:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {SCHEDULED_WINDOWS.map(w => (
                        <div
                          key={w.id}
                          onClick={() => setSelectedWindowId(w.id)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${selectedWindowId === w.id ? 'border-mandi-green bg-mandi-surface ring-1 ring-mandi-green' : 'border-mandi-border hover:border-mandi-border-light'}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-mandi-text">{w.date}</span>
                            <Clock size={12} className="text-mandi-green" />
                          </div>
                          <span className="text-mandi-muted text-[11px] font-mono">{w.timeWindow}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-mandi-text font-bold text-sm mb-3">Payment Method</h3>
                <div className="space-y-2">
                  {PAYMENT_METHODS.map(p => {
                    const Icon = p.icon;
                    return (
                      <div key={p.id} onClick={() => setSelectedPayment(p.id)} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedPayment === p.id ? 'border-mandi-green bg-mandi-green-muted' : 'border-mandi-border hover:border-mandi-border-light'}`}>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedPayment === p.id ? 'border-mandi-green bg-mandi-green' : 'border-mandi-border'}`} />
                        <Icon size={18} className="text-mandi-green" />
                        <div className="flex-1">
                          <p className="text-mandi-text text-sm font-semibold">{p.label}</p>
                          <p className="text-mandi-muted text-xs">{p.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="btn-ghost text-sm py-2 flex-1">{t('common.back', 'Back')}</button>
                <button 
                  onClick={handlePlaceOrder} 
                  disabled={placing} 
                  className="btn-primary text-sm py-2 flex-1 flex items-center justify-center gap-2"
                >
                  {placing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    selectedPayment === 'upi' ? t('checkout.online', 'Pay Online') : t('checkout.placeOrder', 'Place Order')
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="card p-5 h-fit space-y-4">
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
            <div className="flex items-center gap-1 text-mandi-green font-semibold">
              <Zap size={12} />
              <span>{t('common.express', '10-15 min delivery')}</span>
            </div>
            <p>Direct from store. No price markup.</p>
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
        customerPhone={user?.phone}
        onSuccess={handleUpiSuccess}
      />
    )}
    </>
  );
}
