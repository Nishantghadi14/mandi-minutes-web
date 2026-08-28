import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { X, Smartphone, Check, AlertCircle, RefreshCw, Copy, ExternalLink, ShieldCheck, CreditCard } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useToast } from './Toast';
import { loadRazorpayScript } from '../../services/orderService';

/**
 * TODO: Architectural Tradeoff — Direct Peer UPI vs. Razorpay Route (Split Payments):
 * 
 * 1. Direct Peer UPI (Current):
 *    - Pros: 0% payment gateway fees for Kirana merchants, instant bank-to-bank settlement.
 *    - Cons: Cannot programmatically deduct platform commission (e.g. 10%) or delivery fees at the time of transaction;
 *      reconciliation requires store-specific UPI handles or manual invoice settlements.
 * 
 * 2. Razorpay Route (Recommended Long-term):
 *    - Pros: Automatically splits customer payments at checkout into vendor payout (e.g. 90%) and platform commission (10%),
 *      handles refunds/reversals automatically, simplifies tax and escrow accounting.
 *    - Cons: Incurs standard payment gateway fees (~2%) + Razorpay Route addon fee; requires automated vendor linked account KYC.
 */

export default function UPIPaymentModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  amount, 
  storeId, 
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
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [status, setStatus] = useState('pending'); // pending | gateway_open | verifying | success | failed
  const [copied, setCopied] = useState(false);
  const [loadingGateway, setLoadingGateway] = useState(false);

  const activeUpiId = propUpiId || store?.upiId || 'mahalaxmi.kirana@okicici';
  const txnNote = `MandiMinutes-${orderId || Date.now()}`;
  const upiString = `upi://pay?pa=${activeUpiId}&pn=${encodeURIComponent(storeName || store?.name || 'Mandi Minutes')}&am=${amount}&cu=INR&tn=${encodeURIComponent(txnNote)}`;

  // Generate dynamic QR code
  useEffect(() => {
    if (!isOpen) return;
    setStatus('pending');
    QRCode.toDataURL(upiString, {
      width: 280,
      margin: 2,
      color: { dark: '#00C851', light: '#1E1E1E' },
    }).then(setQrDataUrl).catch(() => {
      QRCode.toDataURL(upiString, { width: 280, margin: 2 }).then(setQrDataUrl);
    });
  }, [isOpen, upiString]);

  // Real-time Firestore listener for webhook payment confirmation
  useEffect(() => {
    if (!isOpen || !orderId || !db) return;

    const unsubscribe = onSnapshot(doc(db, 'orders', orderId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.paymentStatus === 'paid') {
          setStatus('success');
          addToast('Payment verified via Gateway Webhook! 🎉', 'success');
        }
      }
    });

    return () => unsubscribe();
  }, [isOpen, orderId, addToast]);

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(activeUpiId).then(() => {
      setCopied(true);
      addToast('UPI ID copied!', 'success');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Launch official Razorpay Gateway Checkout
  const handleLaunchGateway = async () => {
    setLoadingGateway(true);
    const scriptLoaded = await loadRazorpayScript();
    setLoadingGateway(false);

    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;

    if (!scriptLoaded || !window.Razorpay || !razorpayKey) {
      // In development / when key is not configured, inform user and allow COD fallback
      addToast('Razorpay Gateway key not configured. Please use Cash on Delivery.', 'info', 5000);
      return;
    }

    try {
      const options = {
        key: razorpayKey,
        amount: amount * 100, // amount in paise
        currency: 'INR',
        name: 'Mandi Minutes Virar',
        description: `Order #${orderId} - ${storeName || store?.name || 'Store'}`,
        image: '/favicon.svg',
        handler: function (response) {
          setStatus('verifying');
          addToast('Payment received! Waiting for server signature verification...', 'info');
        },
        prefill: {
          name: customerName || '',
          email: customerEmail || '',
          contact: customerPhone || '',
        },
        theme: {
          color: '#00C851',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setStatus('failed');
        addToast(`Payment failed: ${response.error.description}`, 'error');
      });
      rzp.open();
    } catch (err) {
      console.error('Error opening Razorpay checkout:', err);
      addToast('Could not initialize payment gateway', 'error');
    }
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
              <h2 className="text-mandi-text font-bold">UPI / Online Gateway</h2>
              <p className="text-mandi-muted text-xs">{storeName || store?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-mandi-subtle hover:text-mandi-text transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          {/* Amount badge */}
          <div className="text-center mb-5">
            <p className="text-mandi-muted text-xs uppercase tracking-wider">Amount to pay</p>
            <p className="text-4xl font-black text-mandi-green">₹{amount}</p>
            <p className="text-mandi-subtle text-xs mt-1">Order Ref: #{orderId}</p>
          </div>

          {/* PENDING STATE: Show Verified Payment Gateway Options */}
          {status === 'pending' && (
            <>
              {/* Razorpay Gateway Checkout CTA */}
              <button
                onClick={handleLaunchGateway}
                disabled={loadingGateway}
                className="btn-primary w-full py-3.5 text-base font-bold flex items-center justify-center gap-2 mb-4 shadow-lg active:scale-95"
              >
                <CreditCard size={18} />
                {loadingGateway ? 'Opening Gateway...' : 'Pay via UPI / Cards / NetBanking'}
              </button>

              {/* QR Code container */}
              <div className="flex flex-col items-center mb-4 p-4 bg-mandi-surface rounded-2xl border border-mandi-border">
                <div className="relative">
                  {qrDataUrl && (
                    <img
                      src={qrDataUrl}
                      alt="UPI QR Code"
                      className="w-48 h-48 rounded-xl border-2 border-mandi-green border-opacity-30"
                    />
                  )}
                </div>
                <p className="text-mandi-subtle text-xs text-center mt-3 flex items-center gap-1">
                  <ShieldCheck size={12} className="text-mandi-green" />
                  Scan with GPay, PhonePe, Paytm, or BHIM
                </p>
              </div>

              {/* UPI ID copy */}
              <div className="flex items-center justify-between bg-mandi-surface rounded-xl px-4 py-3 border border-mandi-border mb-4">
                <div>
                  <p className="text-mandi-subtle text-xs mb-0.5">Merchant UPI ID</p>
                  <p className="text-mandi-text text-sm font-mono font-semibold">{activeUpiId}</p>
                </div>
                <button onClick={handleCopyUPI} className="flex items-center gap-1.5 text-mandi-green text-xs font-semibold hover:opacity-80 transition-opacity">
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              {/* Zero-trust notice & COD switch */}
              <div className="space-y-2 pt-2 border-t border-mandi-border">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSwitchToCod?.();
                  }}
                  className="btn-outline w-full py-2.5 text-xs text-mandi-text flex items-center justify-center gap-1.5"
                >
                  Switch to Cash on Delivery (Instant)
                </button>
                <p className="text-mandi-subtle text-xs text-center">
                  Payments are cryptographically verified via gateway webhook. Orders are confirmed upon signature verification.
                </p>
              </div>
            </>
          )}

          {/* VERIFYING STATE */}
          {status === 'verifying' && (
            <div className="text-center py-6">
              <div className="w-16 h-16 border-4 border-mandi-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h3 className="text-mandi-text font-bold text-lg mb-2">Verifying Payment…</h3>
              <p className="text-mandi-muted text-xs mb-6">
                Listening for Cloud Function webhook signature verification. Do not close this window.
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
              <p className="text-mandi-muted text-sm mb-6">₹{amount} paid securely to {storeName}</p>
              <button onClick={onSuccess} className="btn-primary w-full py-3 text-base font-bold">
                🎉 Track My Order
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
              <p className="text-mandi-muted text-sm mb-6">The transaction could not be verified by the gateway.</p>
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
