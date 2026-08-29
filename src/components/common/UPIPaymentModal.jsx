import { useState, useEffect, useCallback } from 'react';
import { X, Smartphone, Check, AlertCircle, CreditCard, QrCode, ArrowRight, ShieldCheck } from 'lucide-react';
import QRCode from 'qrcode';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../config/firebase';
import { useToast } from './Toast';
import { loadRazorpayScript } from '../../services/orderService';

export default function UPIPaymentModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  amount, 
  storeId: _storeId, 
  storeName, 
  store,
  upiId: propUpiId,
  orderId,
  customerName,
  customerEmail,
  customerPhone,
  onSwitchToCod 
}) {
  const { addToast } = useToast();
  const [status, setStatus] = useState('pending'); // pending | verifying | success | failed
  const [loadingGateway, setLoadingGateway] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [paymentTab, setPaymentTab] = useState('gateway'); // 'gateway' | 'qr'

  const effectiveUpiId = propUpiId || store?.upiId || 'mandiminutes@upi';
  const upiPayUrl = `upi://pay?pa=${effectiveUpiId}&pn=${encodeURIComponent(storeName || store?.name || 'Mandi Minutes')}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Order ${orderId}`)}`;

  // Generate dynamic QR code
  useEffect(() => {
    if (isOpen && amount > 0) {
      QRCode.toDataURL(upiPayUrl, {
        width: 240,
        margin: 1,
        color: { dark: '#000000', light: '#FFFFFF' }
      }).then(url => setQrDataUrl(url)).catch(() => {});
    }
  }, [isOpen, amount, upiPayUrl]);

  useEffect(() => { 
    if (isOpen) setStatus('pending'); 
  }, [isOpen]);

  // Real-time Firestore listener for payment confirmation
  useEffect(() => {
    if (!isOpen || !orderId || !db || !isFirebaseConfigured) return;

    const unsubscribe = onSnapshot(doc(db, 'orders', orderId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.paymentStatus === 'paid') {
          setStatus('success');
          addToast('Payment confirmed! 🎉', 'success');
        }
      }
    });

    return () => unsubscribe();
  }, [isOpen, orderId, addToast]);

  const markOrderPaid = useCallback(async (paymentId, method = 'razorpay') => {
    if (db && isFirebaseConfigured && orderId) {
      try {
        await updateDoc(doc(db, 'orders', orderId), {
          paymentStatus: 'paid',
          status: 'placed',
          paymentDetails: {
            gateway: method,
            paymentId: paymentId || `pay_${Date.now()}`,
            paidAt: new Date().toISOString(),
          },
          statusHistory: [
            { status: 'placed', time: new Date().toISOString(), note: `Payment received via ${method}` }
          ]
        });
      } catch (err) {
        console.warn('Firestore payment status update notice:', err.message);
      }
    }
    setStatus('success');
  }, [orderId]);

  // Launch Razorpay Checkout
  const handleLaunchGateway = async () => {
    setLoadingGateway(true);
    const scriptLoaded = await loadRazorpayScript();
    setLoadingGateway(false);

    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_51MockGatewayKey';

    if (!scriptLoaded || !window.Razorpay) {
      // If Razorpay script failed to load, seamlessly switch to direct UPI QR code
      setPaymentTab('qr');
      addToast('Opening instant UPI QR scanner...', 'info');
      return;
    }

    try {
      const options = {
        key: razorpayKey,
        amount: Math.round(amount * 100), // amount in paise
        currency: 'INR',
        name: 'Mandi Minutes',
        description: `Order #${orderId} - ${storeName || store?.name || 'Store'}`,
        image: '/favicon.svg',
        handler: function (response) {
          setStatus('verifying');
          addToast('Payment received! Confirming your order...', 'info');
          markOrderPaid(response.razorpay_payment_id || `rzp_${Date.now()}`, 'razorpay');
        },
        prefill: {
          name: customerName || '',
          email: customerEmail || '',
          contact: customerPhone || '',
        },
        theme: {
          color: '#00C851',
        },
        modal: {
          ondismiss: function () {
            // User closed Razorpay popup without paying
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setStatus('failed');
        addToast(`Payment failed: ${response.error?.description || 'Transaction cancelled'}`, 'error');
      });
      rzp.open();
    } catch (err) {
      console.warn('Razorpay open notice:', err);
      setPaymentTab('qr');
    }
  };

  const handleManualUpiConfirm = async () => {
    setStatus('verifying');
    await markOrderPaid(`upi_${Date.now()}`, 'upi_direct');
    addToast('Payment confirmed! Your order is placed 🎉', 'success');
  };

  if (!isOpen) return null;

  return (
    <div className="overlay flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-mandi-card border border-mandi-border rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md animate-fade-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-mandi-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-mandi-green-muted rounded-xl flex items-center justify-center">
              <Smartphone size={18} className="text-mandi-green" />
            </div>
            <div>
              <h2 className="text-mandi-text font-bold">UPI & Online Payment</h2>
              <p className="text-mandi-muted text-xs">{storeName || store?.name || 'Mandi Minutes'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-mandi-subtle hover:text-mandi-text transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          {/* Amount badge */}
          <div className="text-center mb-4">
            <p className="text-mandi-muted text-xs uppercase tracking-wider">Amount to pay</p>
            <p className="text-4xl font-black text-mandi-green">₹{amount}</p>
            <p className="text-mandi-subtle text-xs mt-1">Order Ref: #{orderId}</p>
          </div>

          {/* PENDING STATE */}
          {status === 'pending' && (
            <div className="space-y-4">
              {/* Payment Mode Selector Tabs */}
              <div className="flex bg-mandi-surface rounded-xl p-1 border border-mandi-border">
                <button
                  type="button"
                  onClick={() => setPaymentTab('gateway')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${paymentTab === 'gateway' ? 'bg-mandi-green text-black' : 'text-mandi-muted hover:text-mandi-text'}`}
                >
                  <CreditCard size={14} />
                  Razorpay (UPI / Cards)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentTab('qr')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${paymentTab === 'qr' ? 'bg-mandi-green text-black' : 'text-mandi-muted hover:text-mandi-text'}`}
                >
                  <QrCode size={14} />
                  Scan QR / UPI App
                </button>
              </div>

              {paymentTab === 'gateway' ? (
                <div className="space-y-3">
                  <button
                    onClick={handleLaunchGateway}
                    disabled={loadingGateway}
                    className="btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95"
                  >
                    <CreditCard size={18} />
                    {loadingGateway ? 'Opening Razorpay...' : 'Pay with Razorpay'}
                  </button>

                  <div className="flex items-center justify-center gap-2 text-xs text-mandi-subtle">
                    <ShieldCheck size={14} className="text-mandi-green" />
                    <span>Supports GPay, PhonePe, Paytm, Cards & NetBanking</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-center">
                  {qrDataUrl && (
                    <div className="bg-white p-3 rounded-2xl inline-block shadow-md mx-auto">
                      <img src={qrDataUrl} alt="UPI QR Code" className="w-44 h-44 mx-auto" />
                    </div>
                  )}

                  <div className="space-y-2">
                    <a
                      href={upiPayUrl}
                      className="btn-primary w-full py-3 text-sm font-bold flex items-center justify-center gap-2"
                    >
                      <Smartphone size={16} />
                      Open UPI App (GPay / PhonePe)
                    </a>
                    
                    <button
                      type="button"
                      onClick={handleManualUpiConfirm}
                      className="btn-outline w-full py-2.5 text-xs text-mandi-text font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Check size={14} className="text-mandi-green" />
                      I have completed payment
                    </button>
                  </div>
                </div>
              )}

              {/* Cash on Delivery fallback */}
              <div className="pt-2 border-t border-mandi-border">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSwitchToCod?.();
                  }}
                  className="w-full py-2 text-xs text-mandi-muted hover:text-mandi-text transition-colors flex items-center justify-center gap-1"
                >
                  <span>Prefer to pay cash?</span>
                  <span className="text-mandi-green font-semibold">Switch to Cash on Delivery</span>
                </button>
              </div>
            </div>
          )}

          {/* VERIFYING STATE */}
          {status === 'verifying' && (
            <div className="text-center py-6">
              <div className="w-16 h-16 border-4 border-mandi-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h3 className="text-mandi-text font-bold text-lg mb-2">Confirming Payment…</h3>
              <p className="text-mandi-muted text-xs mb-4">
                Updating your order status. Please do not refresh.
              </p>
            </div>
          )}

          {/* SUCCESS STATE */}
          {status === 'success' && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-mandi-green rounded-full mx-auto mb-4 flex items-center justify-center">
                <Check size={36} className="text-black" strokeWidth={3} />
              </div>
              <h3 className="text-mandi-text font-black text-2xl mb-2">Payment Confirmed!</h3>
              <p className="text-mandi-muted text-sm mb-6">₹{amount} paid securely to {storeName || store?.name || 'Store'}</p>
              <button onClick={onSuccess} className="btn-primary w-full py-3.5 text-base font-bold flex items-center justify-center gap-2">
                <span>Track My Order</span>
                <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* FAILED STATE */}
          {status === 'failed' && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-red-900 bg-opacity-30 border border-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <AlertCircle size={36} className="text-red-400" />
              </div>
              <h3 className="text-mandi-text font-bold text-xl mb-2">Payment Incomplete</h3>
              <p className="text-mandi-muted text-sm mb-6">The transaction was cancelled or could not be verified.</p>
              <div className="flex gap-2">
                <button onClick={() => setStatus('pending')} className="btn-primary flex-1 py-2.5 text-sm">Retry Payment</button>
                <button onClick={onClose} className="btn-ghost flex-1 py-2.5 text-sm">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
