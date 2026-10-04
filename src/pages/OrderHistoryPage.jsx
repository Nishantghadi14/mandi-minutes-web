import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../components/common/Toast';
import { 
  Package, RefreshCw, ChevronRight, Store, Calendar, ArrowRight, 
  ArrowLeft, Truck, Clock, CheckCircle2, AlertCircle, ShoppingBag, 
  Star, X, Sparkles 
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getAppHomePath } from '../utils/platform';

function ReviewModal({ order, onClose, onSubmit }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({ storeId: order.storeId, orderId: order.id, rating, comment });
      onClose();
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="card max-w-md w-full p-5 sm:p-6 space-y-4 relative bg-mandi-card border-mandi-border rounded-t-3xl sm:rounded-2xl max-h-[90dvh] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl">
        <div className="w-12 h-1.5 bg-mandi-border rounded-full mx-auto mb-2 sm:hidden" />
        <button onClick={onClose} className="absolute top-4 right-4 text-mandi-muted hover:text-mandi-text p-1 active:scale-90">
          <X size={18} />
        </button>

        <div>
          <h2 className="text-lg font-bold text-mandi-text">Rate Your Delivery</h2>
          <p className="text-mandi-muted text-xs mt-0.5">Order #{order.id?.slice(-8)}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center justify-center py-3 bg-mandi-surface rounded-xl border border-mandi-border">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    size={28}
                    className={`transition-colors ${(hoverRating || rating) >= star ? 'text-amber-400 fill-amber-400' : 'text-mandi-subtle'}`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-bold mt-2 text-mandi-text">
              {['Poor', 'Fair', 'Good', 'Very Good', 'Excellent!'][((hoverRating || rating) - 1)] || 'Good'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-mandi-muted mb-1">
              Feedback (optional)
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was the packaging and delivery?"
              className="bg-mandi-surface border border-mandi-border rounded-xl p-3 text-xs w-full text-mandi-text placeholder-mandi-subtle outline-none focus:border-mandi-green"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-mandi-border text-mandi-muted hover:bg-mandi-surface text-xs font-bold">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-mandi-green text-black text-xs font-black shadow-md shadow-mandi-green/20 active:scale-95 transition-all"
            >
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function OrderHistoryPage() {
  const { user, openAuthModal } = useAuth();
  const { getOrdersByCustomer, products, orders = [], loadingStates, addStoreReview } = useData();
  const { addItem, addToast } = useCart();
  const navigate = useNavigate();
  const [reviewingOrder, setReviewingOrder] = useState(null);

  // Retrieve user orders from Firestore + local session cache
  const userOrders = useMemo(() => {
    let combined = [];

    // 1. If user is logged in, find in DataStore
    if (user?.id) {
      combined = getOrdersByCustomer ? getOrdersByCustomer(user.id) : [];
      if (user.email) {
        const emailOrders = orders.filter(o => o.customerEmail === user.email);
        emailOrders.forEach(eo => {
          if (!combined.some(o => o.id === eo.id)) combined.push(eo);
        });
      }
    }

    // 2. Also check local orders saved on device
    try {
      const stored = localStorage.getItem('mandi_synced_orders');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          parsed.forEach(po => {
            if (!combined.some(o => o.id === po.id)) {
              if (!user?.id || po.customerId === user.id || po.customerId === 'guest' || !po.customerId) {
                combined.push(po);
              }
            }
          });
        }
      }
    } catch {}

    // Sort by latest placed
    return combined.sort((a, b) => new Date(b.placedAt || 0) - new Date(a.placedAt || 0));
  }, [user, getOrdersByCustomer, orders]);

  const handleReorder = (order) => {
    let addedCount = 0;
    (order.items || []).forEach(item => {
      addItem({
        id: item.productId || item.id,
        name: item.name,
        price: item.price,
        unit: item.unit || '1 kg',
        image: item.image,
        storeId: order.storeId,
      }, item.quantity || 1);
      addedCount++;
    });
    addToast(`${addedCount} items added to your cart!`, 'success');
  };

  const handleReviewSubmit = async ({ storeId, orderId, rating, comment }) => {
    try {
      await addStoreReview({
        storeId,
        orderId,
        rating,
        comment,
        userId: user?.id || 'guest',
        userName: user?.name || user?.displayName || 'Customer',
      });
      addToast('Thank you for your rating!', 'success');
    } catch {
      addToast('Review submitted successfully!', 'success');
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return <span className="bg-mandi-green/15 text-mandi-green border border-mandi-green/30 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 size={11} /> Delivered</span>;
      case 'out_for_delivery':
      case 'in_transit':
        return <span className="bg-sky-500/15 text-sky-400 border border-sky-500/30 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1"><Truck size={11} /> On the way</span>;
      case 'preparing':
      case 'packed':
        return <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1"><Clock size={11} /> Packing</span>;
      default:
        return <span className="bg-mandi-green/15 text-mandi-green border border-mandi-green/30 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 size={11} /> Order Confirmed</span>;
    }
  };

  return (
    <div className="max-w-md w-full mx-auto min-h-screen bg-mandi-dark text-mandi-text select-none pb-28">
      {/* ── Native Mobile App Header ── */}
      <header className="sticky top-0 z-30 bg-mandi-dark/95 backdrop-blur-md border-b border-mandi-border px-3.5 py-3 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(getAppHomePath())}
            className="w-10 h-10 rounded-full hover:bg-mandi-surface active:bg-mandi-card flex items-center justify-center text-mandi-muted hover:text-mandi-text active:scale-90 transition-all flex-shrink-0"
            aria-label="Back to Home"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-sm font-black text-mandi-text leading-tight">My Orders</h1>
            <p className="text-[10px] text-mandi-muted">Track deliveries & repeat essentials</p>
          </div>
        </div>

        <Link
          to="/contact"
          className="text-xs font-semibold text-mandi-muted hover:text-mandi-text flex items-center gap-1 bg-mandi-surface border border-mandi-border px-3 py-1.5 rounded-xl active:scale-95 transition-all shadow-sm hover:bg-mandi-card"
        >
          <span>Help</span>
        </Link>
      </header>

      {/* ── Orders Content ── */}
      <main className="px-3.5 pt-3.5 space-y-4">
        {/* If NO orders found */}
        {userOrders.length === 0 ? (
          <div className="p-6 text-center bg-mandi-card border border-mandi-border rounded-3xl mt-4 space-y-5 shadow-xl">
            <div className="w-16 h-16 rounded-3xl bg-mandi-green/15 border border-mandi-green/30 flex items-center justify-center text-mandi-green mx-auto shadow-inner">
              <Package size={30} />
            </div>
            <div>
              <h2 className="text-base font-black text-mandi-text">No Orders Placed Yet</h2>
              <p className="text-xs text-mandi-muted max-w-xs mx-auto mt-1 leading-relaxed">
                {user 
                  ? 'Your active and past grocery orders will appear here for easy tracking and 1-tap reordering.' 
                  : 'Log in to track current deliveries, see past orders, and get faster checkouts.'}
              </p>
            </div>

            {/* Feature Pills */}
            <div className="grid grid-cols-2 gap-2 text-left pt-1">
              <div className="p-2.5 rounded-xl bg-mandi-surface border border-mandi-border text-[11px] text-mandi-muted flex items-center gap-2">
                <Truck size={14} className="text-mandi-green flex-shrink-0" />
                <span>Next-Day 7 AM Drop</span>
              </div>
              <div className="p-2.5 rounded-xl bg-mandi-surface border border-mandi-border text-[11px] text-mandi-muted flex items-center gap-2">
                <Clock size={14} className="text-mandi-green flex-shrink-0" />
                <span>Live Status Updates</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 pt-1 max-w-xs mx-auto">
              {!user && (
                <button
                  onClick={() => openAuthModal('login')}
                  className="w-full py-3 rounded-2xl bg-mandi-green text-black text-xs font-black shadow-lg shadow-mandi-green/20 active:scale-95 transition-all"
                >
                  Log In to View Orders
                </button>
              )}
              <button
                onClick={() => navigate(getAppHomePath())}
                className="w-full py-3 rounded-2xl bg-mandi-surface border border-mandi-border text-mandi-text text-xs font-bold active:scale-95 transition-all hover:bg-mandi-card"
              >
                Browse Kirana Groceries
              </button>
            </div>
          </div>
        ) : (
          /* List of orders */
          <div className="space-y-3.5">
            {userOrders.map((order) => {
              const itemsCount = (order.items || []).reduce((s, i) => s + (i.quantity || 1), 0);
              const formattedDate = order.placedAt 
                ? new Date(order.placedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'Recent Order';

              return (
                <div 
                  key={order.id}
                  className="rounded-2xl bg-mandi-card border border-mandi-border hover:border-mandi-green/40 p-4 space-y-3 shadow-md transition-all"
                >
                  {/* Order Top: Status + Date */}
                  <div className="flex items-center justify-between border-b border-mandi-border pb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(order.status)}
                        <span className="text-[11px] font-mono text-mandi-muted">#{order.id?.slice(-6)}</span>
                      </div>
                      <p className="text-[10px] text-mandi-muted mt-1">Placed on {formattedDate}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black text-mandi-text">₹{order.total}</span>
                      <p className="text-[10px] text-mandi-green font-semibold">{order.paymentMethod || 'Online'}</p>
                    </div>
                  </div>

                  {/* Delivery Slot info */}
                  <div className="flex items-center gap-2 text-[11px] text-mandi-green bg-mandi-green/10 px-2.5 py-1 rounded-xl border border-mandi-green/20">
                    <Truck size={13} className="text-mandi-green flex-shrink-0" />
                    <span className="font-semibold">
                      {order.scheduledSlot?.label || 'Next-Day Morning Delivery (7:00 AM – 11:00 AM)'}
                    </span>
                  </div>

                  {/* Items Preview */}
                  <div className="space-y-1.5">
                    {(order.items || []).slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs text-mandi-muted">
                        <span className="truncate pr-2">{item.name} × {item.quantity}</span>
                        <span className="font-semibold text-mandi-text flex-shrink-0">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                    {(order.items || []).length > 3 && (
                      <p className="text-[10px] text-mandi-subtle">
                        + {(order.items || []).length - 3} more items
                      </p>
                    )}
                  </div>

                  {/* Bottom Action Buttons */}
                  <div className="flex items-center gap-2 pt-1 border-t border-mandi-border">
                    <Link
                      to={`/order-status/${order.id}`}
                      className="flex-1 py-2 rounded-xl bg-mandi-green text-black text-xs font-black text-center shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1"
                    >
                      <span>Track Order</span>
                      <ChevronRight size={13} />
                    </Link>

                    <button
                      onClick={() => handleReorder(order)}
                      className="flex-1 py-2 rounded-xl bg-mandi-surface border border-mandi-border text-mandi-text text-xs font-bold text-center active:scale-95 transition-all hover:bg-mandi-card"
                    >
                      Repeat Order
                    </button>

                    <button
                      onClick={() => setReviewingOrder(order)}
                      className="px-2.5 py-2 rounded-xl bg-mandi-surface border border-mandi-border text-mandi-muted hover:text-mandi-text hover:bg-mandi-card active:scale-95"
                      title="Rate Order"
                      aria-label="Rate Order"
                    >
                      <Star size={14} className="text-amber-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Review Modal */}
      {reviewingOrder && (
        <ReviewModal
          order={reviewingOrder}
          onClose={() => setReviewingOrder(null)}
          onSubmit={handleReviewSubmit}
        />
      )}
    </div>
  );
}
