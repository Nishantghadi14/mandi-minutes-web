import { useState, useEffect, useCallback } from 'react';
import { X, Smartphone, Check, AlertCircle, QrCode, ArrowRight, Copy, CheckCheck, Wallet } from 'lucide-react';
import QRCode from 'qrcode';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../config/firebase';
import { useToast } from './Toast';

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
  customerName: _customerName,
  customerEmail: _customerEmail,
  customerPhone: _customerPhone,
  onSwitchToCod 
}) {
  const { addToast } = useToast();
  const [status, setStatus] = useState('pending'); // pending | verifying | success | failed
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');

  // Primary Merchant UPI Handle (0% Fee Direct Bank-to-Bank Transfer)
  const effectiveUpiId = import.meta.env.VITE_MERCHANT_UPI_ID || propUpiId || store?.upiId || 'mahalaxmi.kirana@okicici';
  const merchantName = storeName || store?.name || 'Mandi Minutes';
  
  // Standard NPCI UPI URI Specification
  const upiPayUrl = `upi://pay?pa=${encodeURIComponent(effectiveUpiId)}&pn=${encodeURIComponent(merchantName)}&am=${Number(amount).toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Order ${orderId}`)}`;

  // Generate dynamic high-res QR code
  useEffect(() => {
    if (isOpen && amount > 0) {
      QRCode.toDataURL(upiPayUrl, {
        width: 280,
        margin: 1.5,
        color: { dark: '#000000', light: '#FFFFFF' }
      }).then(url => setQrDataUrl(url)).catch(err => {
        console.warn('QR code generation failed:', err);
      });
    }
  }, [isOpen, amount, upiPayUrl]);

  useEffect(() => { 
    if (isOpen) {
      setStatus('pending');
      setUtrNumber('');
      setCopied(false);
    }
  }, [isOpen]);

  // Real-time Firestore listener for live order payment confirmation
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

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(effectiveUpiId);
    setCopied(true);
    addToast(`Copied UPI ID: ${effectiveUpiId}`, 'info');
    setTimeout(() => setCopied(false), 2500);
  };

  const markOrderPaid = useCallback(async (referenceId) => {
    if (db && isFirebaseConfigured && orderId) {
      try {
        await updateDoc(doc(db, 'orders', orderId), {
          paymentStatus: 'paid',
          status: 'placed',
          paymentDetails: {
            gateway: 'upi_direct',
            upiId: effectiveUpiId,
            utr: referenceId || null,
            paidAt: new Date().toISOString(),
          },
          statusHistory: [
            { status: 'placed', time: new Date().toISOString(), note: `Direct UPI payment confirmed (${referenceId ? `UTR: ${referenceId}` : 'Instant transfer'})` }
          ]
        });
      } catch (err) {
        console.warn('Firestore payment update notice:', err.message);
      }
    }
    setStatus('success');
  }, [orderId, effectiveUpiId]);

  const handleConfirmPayment = async () => {
    setStatus('verifying');
    await markOrderPaid(utrNumber.trim());
    addToast('Payment confirmed! Your order is being prepared 🎉', 'success');
  };

  if (!isOpen) return null;

  return (
    <div className="overlay flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-mandi-card border border-mandi-border rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md animate-fade-in overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-mandi-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-mandi-green-muted rounded-xl flex items-center justify-center">
              <QrCode size={20} className="text-mandi-green" />
            </div>
            <div>
              <h2 className="text-mandi-text font-bold text-base">Direct UPI Payment</h2>
              <p className="text-mandi-muted text-xs">0% Fees • Instant Bank Transfer</p>
            </div>
          </div>
          <button onClick={onClose} className="text-mandi-subtle hover:text-mandi-text transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          {/* Amount badge */}
          <div className="text-center mb-4 bg-mandi-surface border border-mandi-border rounded-2xl py-3 px-4">
            <p className="text-mandi-muted text-xs uppercase tracking-wider font-semibold">Total Payable</p>
            <p className="text-3xl sm:text-4xl font-black text-mandi-green">₹{amount}</p>
            <p className="text-mandi-subtle text-[11px] mt-0.5">Order Ref: #{orderId}</p>
          </div>

          {/* PENDING STATE */}
          {status === 'pending' && (
            <div className="space-y-4">
              {/* QR Code Card */}
              <div className="bg-white p-3.5 rounded-2xl text-center shadow-md max-w-[240px] mx-auto">
                {qrDataUrl ? (
                  <img 
                    src={qrDataUrl} 
                    alt={`UPI QR code for ₹${amount}`} 
                    className="w-48 h-48 mx-auto"
                  />
                ) : (
                  <div className="w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-xs">
                    Generating QR code...
                  </div>
                )}
                <p className="text-[11px] font-bold text-gray-700 mt-1">Scan with any UPI App</p>
                <div className="flex items-center justify-center gap-2 mt-1 opacity-80">
                  <span className="text-[10px] font-semibold text-gray-600">GPay • PhonePe • Paytm • BHIM</span>
                </div>
              </div>

              {/* UPI ID Copy Box */}
              <div className="flex items-center justify-between bg-mandi-surface border border-mandi-border rounded-xl px-3.5 py-2.5">
                <div className="min-w-0 pr-2">
                  <p className="text-mandi-muted text-[10px] uppercase font-semibold">Merchant UPI ID</p>
                  <p className="text-mandi-text font-mono font-bold text-xs truncate">{effectiveUpiId}</p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-mandi-card border border-mandi-border hover:border-mandi-green text-mandi-green transition-colors flex-shrink-0"
                >
                  {copied ? <CheckCheck size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Action 1: Mobile Deep Link */}
              <a
                href={upiPayUrl}
                className="btn-primary w-full py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95"
              >
                <Smartphone size={16} />
                <span>Pay via UPI App (GPay / PhonePe)</span>
              </a>

              {/* Action 2: UTR Reference Input + Confirm Button */}
              <div className="space-y-2 pt-2 border-t border-mandi-border">
                <input
                  type="text"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value.replace(/[^\w]/g, '').slice(0, 16))}
                  placeholder="Optional: Enter 12-digit UTR / Ref No."
                  className="input-field py-2 text-xs w-full text-center"
                />

                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  className="btn-outline w-full py-2.5 text-xs text-mandi-green font-bold border-mandi-green flex items-center justify-center gap-1.5 hover:bg-mandi-green hover:text-black transition-colors"
                >
                  <Check size={15} />
                  <span>I Have Completed Payment</span>
                </button>
              </div>

              {/* Action 3: Switch to Cash on Delivery */}
              <div className="pt-2 border-t border-mandi-border">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSwitchToCod?.();
                  }}
                  className="w-full py-2 text-xs text-mandi-muted hover:text-mandi-text transition-colors flex items-center justify-center gap-1.5"
                >
                  <Wallet size={14} className="text-mandi-subtle" />
                  <span>Change mind?</span>
                  <span className="text-mandi-green font-semibold">Switch to Cash on Delivery</span>
                </button>
              </div>
            </div>
          )}

          {/* VERIFYING STATE */}
          {status === 'verifying' && (
            <div className="text-center py-8 space-y-3">
              <div className="w-16 h-16 border-4 border-mandi-green border-t-transparent rounded-full animate-spin mx-auto" />
              <h3 className="text-mandi-text font-bold text-lg">Confirming Payment…</h3>
              <p className="text-mandi-muted text-xs">
                Recording your payment and dispatching order to the store.
              </p>
            </div>
          )}

          {/* SUCCESS STATE */}
          {status === 'success' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-mandi-green rounded-full mx-auto flex items-center justify-center shadow-lg shadow-mandi-green/20">
                <Check size={36} className="text-black" strokeWidth={3} />
              </div>
              <div>
                <h3 className="text-mandi-text font-black text-2xl">Payment Confirmed!</h3>
                <p className="text-mandi-muted text-sm mt-1">₹{amount} paid securely to {merchantName}</p>
                <p className="text-mandi-subtle text-xs mt-0.5">Order ID: {orderId}</p>
              </div>
              <button 
                onClick={onSuccess} 
                className="btn-primary w-full py-3.5 text-base font-bold flex items-center justify-center gap-2 shadow-lg"
              >
                <span>Track My Order</span>
                <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* FAILED STATE */}
          {status === 'failed' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-red-900 bg-opacity-30 border border-red-500 rounded-full mx-auto flex items-center justify-center">
                <AlertCircle size={36} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-mandi-text font-bold text-xl">Payment Incomplete</h3>
                <p className="text-mandi-muted text-xs text-mandi-muted mt-1">Could not verify the transaction.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStatus('pending')} className="btn-primary flex-1 py-2.5 text-xs font-bold">Retry Payment</button>
                <button onClick={onClose} className="btn-ghost flex-1 py-2.5 text-xs">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
