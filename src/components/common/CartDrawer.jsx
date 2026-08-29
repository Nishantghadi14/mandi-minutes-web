import { ShoppingCart, X, Minus, Plus, Trash2, Tag, ArrowRight, Package, Zap } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from './Toast';
import { useState } from 'react';
import LazyImage from './LazyImage';

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, updateQuantity, clearCart, subtotal, discount, deliveryCharge, total, itemCount, coupon, applyCoupon, removeCoupon } = useCart();
  const { user, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const handleCheckout = () => {
    // Check Zustand user OR localStorage fallback (same as ProtectedRoute)
    const effectiveUser = user || (() => {
      try { return JSON.parse(localStorage.getItem('mandi_local_user') || 'null'); } catch { return null; }
    })();
    if (!effectiveUser) { openAuthModal('login'); return; }
    setIsOpen(false);
    navigate('/checkout');
  };

  const handleCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    try {
      const result = applyCoupon(couponInput);
      addToast(`Coupon applied! ${result.label}`, 'success');
      setCouponInput('');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setCouponLoading(false);
    }
  };

  return (
    <>
      {isOpen && <div className="overlay" onClick={() => setIsOpen(false)} />}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-mandi-card border-l border-mandi-border z-50 transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-mandi-border">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} className="text-mandi-green" />
            <h2 className="font-bold text-mandi-text text-lg">My Cart</h2>
            {itemCount > 0 && <span className="badge-green">{itemCount}</span>}
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button 
                onClick={clearCart} 
                className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-950 hover:bg-opacity-30 transition-colors"
                title="Clear all items"
              >
                Clear
              </button>
            )}
            <button onClick={() => setIsOpen(false)} className="p-2 rounded-lg hover:bg-mandi-surface transition-colors text-mandi-muted hover:text-mandi-text"><X size={20} /></button>
          </div>
        </div>

        {/* Content */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
            <div className="w-20 h-20 bg-mandi-surface rounded-full flex items-center justify-center">
              <Package size={36} className="text-mandi-subtle" />
            </div>
            <div className="text-center">
              <p className="text-mandi-text font-semibold text-lg">Your cart is empty</p>
              <p className="text-mandi-muted text-sm mt-1">Add items from a store to get started</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="btn-primary">Browse Stores</button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              {/* Delivery badge */}
              <div className="mx-4 mt-3 flex items-center gap-2 bg-mandi-green-muted border border-mandi-green border-opacity-20 rounded-xl p-3">
                <Zap size={16} className="text-mandi-green" />
                <span className="text-mandi-green text-sm font-medium">Express Delivery in 15-20 mins</span>
              </div>

              {/* Items */}
              <div className="p-4 space-y-3">
                {items.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    <LazyImage src={item.image} alt={item.name} className="w-full h-full object-cover rounded-xl" containerClass="w-14 h-14 rounded-xl flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-mandi-text text-sm font-medium truncate">{item.name}</p>
                      <p className="text-mandi-muted text-xs">{item.unit}</p>
                      <p className="text-mandi-green font-semibold text-sm mt-0.5">₹{item.price}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 rounded-lg bg-mandi-surface border border-mandi-border flex items-center justify-center hover:border-mandi-green transition-colors">
                        {item.quantity === 1 ? <Trash2 size={14} className="text-red-400" /> : <Minus size={14} className="text-mandi-text" />}
                      </button>
                      <span className="w-6 text-center text-mandi-text font-bold text-sm">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 rounded-lg bg-mandi-green flex items-center justify-center hover:bg-mandi-green-dark transition-colors">
                        <Plus size={14} className="text-black" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="mx-4 mb-4">
                {coupon ? (
                  <div className="flex items-center justify-between bg-mandi-green-muted border border-mandi-green border-opacity-30 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-2"><Tag size={14} className="text-mandi-green" /><span className="text-mandi-green text-sm font-semibold">{coupon.code}</span><span className="text-mandi-muted text-xs">{coupon.label}</span></div>
                    <button onClick={removeCoupon} className="text-red-400 hover:text-red-300"><X size={14} /></button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1"><Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mandi-subtle" /><input placeholder="Enter coupon code" value={couponInput} onChange={e => setCouponInput(e.target.value.toUpperCase())} className="input-field pl-8 py-2 text-sm" /></div>
                    <button onClick={handleCoupon} disabled={couponLoading} className="btn-outline py-2 px-3 text-sm whitespace-nowrap">{couponLoading ? '...' : 'Apply'}</button>
                  </div>
                )}
                <p className="text-mandi-subtle text-xs mt-1">Try: MANDI10, FLAT50, NEWUSER</p>
              </div>

              {/* Bill Summary */}
              <div className="mx-4 mb-4 bg-mandi-surface rounded-xl p-4 space-y-2">
                <p className="text-mandi-text font-semibold text-sm mb-3">Bill Summary</p>
                <div className="flex justify-between text-sm"><span className="text-mandi-muted">Item Total</span><span className="text-mandi-text">₹{subtotal}</span></div>
                {discount > 0 && <div className="flex justify-between text-sm"><span className="text-mandi-muted">Coupon Discount</span><span className="text-mandi-green">- ₹{discount}</span></div>}
                <div className="flex justify-between text-sm"><span className="text-mandi-muted">Delivery Charge</span><span className={deliveryCharge === 0 ? 'text-mandi-green' : 'text-mandi-text'}>{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}</span></div>
                <div className="border-t border-mandi-border pt-2 flex justify-between font-bold"><span className="text-mandi-text">Total</span><span className="text-mandi-text">₹{total}</span></div>
              </div>
            </div>

            {/* Checkout Button */}
            <div className="p-4 border-t border-mandi-border">
              <button onClick={handleCheckout} className="btn-primary w-full flex items-center justify-between">
                <span>₹{total} to pay</span>
                <div className="flex items-center gap-1"><span>Proceed to Checkout</span><ArrowRight size={16} /></div>
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
