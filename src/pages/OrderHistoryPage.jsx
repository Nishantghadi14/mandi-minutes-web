import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../components/common/Toast';
import { Package, RefreshCw, ChevronRight, Store, Calendar, ArrowRight, WifiOff, Star, X } from 'lucide-react';
import { Link } from 'react-router-dom';

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
    <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4">
      <div className="card max-w-md w-full p-6 space-y-4 relative bg-mandi-card border-mandi-border">
        <button onClick={onClose} className="absolute top-4 right-4 text-mandi-muted hover:text-mandi-text">
          <X size={18} />
        </button>

        <div>
          <h2 className="text-lg font-bold text-mandi-text">Rate Your Experience</h2>
          <p className="text-mandi-muted text-xs mt-0.5">Order from {order.storeName}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star selector */}
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
                    className={`transition-colors ${(hoverRating || rating) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-mandi-subtle'}`}
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
              Feedback / Review (optional)
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was the packaging, item freshness, and delivery speed?"
              className="input-field text-xs w-full"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1 py-2 text-xs">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex-1 py-2 text-xs font-bold"
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
  const { getOrdersByCustomer, products, loadingStates, errorStates, retryFetch, addStoreReview } = useData();
  const { addItem, clearCart, setIsOpen, storeId: currentCartStoreId, items: cartItems } = useCart();
  const { addToast } = useToast();
  const [reviewingOrder, setReviewingOrder] = useState(null);
  const [cartConflictOrder, setCartConflictOrder] = useState(null);

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <Package size={48} className="text-mandi-subtle mx-auto mb-4" />
        <h2 className="text-mandi-text font-bold text-2xl mb-2">Login Required</h2>
        <p className="text-mandi-muted text-sm mb-6">Please log in to view your past orders</p>
        <button onClick={() => openAuthModal('login')} className="btn-primary">Login Now</button>
      </div>
    );
  }

  const isLoading = Boolean(loadingStates?.orders);
  const hasError = Boolean(errorStates?.orders);
  const userOrders = getOrdersByCustomer(user.id);

  const processReorder = (order) => {
    let addedCount = 0;

    order.items.forEach(item => {
      // Check live product catalog for stock availability
      const liveProduct = products.find(p => p.id === item.productId);

      if (!liveProduct || liveProduct.isAvailable === false || Number(liveProduct.stock) <= 0) {
        addToast(`${item.name} is currently out of stock at ${order.storeName}.`, 'warning');
        return;
      }

      const availableStock = Number(liveProduct.stock) || 99;
      const requestedQty = Number(item.quantity) || 1;

      if (availableStock < requestedQty) {
        addItem(
          {
            id: liveProduct.id,
            name: liveProduct.name,
            price: liveProduct.price,
            unit: liveProduct.unit,
            image: liveProduct.image,
            storeId: order.storeId,
          },
          availableStock
        );
        addToast(`Only ${availableStock} of ${liveProduct.name} available; added ${availableStock} to cart.`, 'info');
        addedCount += availableStock;
      } else {
        addItem(
          {
            id: liveProduct.id,
            name: liveProduct.name,
            price: liveProduct.price,
            unit: liveProduct.unit,
            image: liveProduct.image,
            storeId: order.storeId,
          },
          requestedQty
        );
        addedCount += requestedQty;
      }
    });

    if (addedCount > 0) {
      addToast(`Added ${addedCount} items from ${order.storeName} to cart!`, 'success');
      setIsOpen(true);
    }
  };

  const handleReorder = (order) => {
    // If cart has items from another store, show replacement confirmation modal
    if (cartItems.length > 0 && currentCartStoreId && currentCartStoreId !== order.storeId) {
      setCartConflictOrder(order);
      return;
    }

    processReorder(order);
  };

  const handleConfirmReplaceCart = () => {
    if (!cartConflictOrder) return;
    clearCart();
    processReorder(cartConflictOrder);
    setCartConflictOrder(null);
  };

  const handleReviewSubmit = async ({ storeId, orderId, rating, comment }) => {
    try {
      await addStoreReview({
        storeId,
        orderId,
        rating,
        comment,
        userId: user.id,
        userName: user.name || user.displayName || 'Customer',
      });
      addToast('Thank you for rating your order!', 'success');
    } catch {
      addToast('Could not submit review. Please try again.', 'error');
    }
  };

  if (isLoading && userOrders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-6 space-y-4 animate-pulse">
        <div className="h-8 bg-mandi-card rounded-xl w-40" />
        {[1, 2, 3].map(i => (
          <div key={i} className="card p-5 space-y-3">
            <div className="h-5 bg-mandi-surface rounded w-2/3" />
            <div className="h-4 bg-mandi-surface rounded w-1/3" />
            <div className="h-4 bg-mandi-surface rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <h1 className="text-mandi-text font-black text-2xl mb-6">My Orders</h1>

      {/* Error Recovery Banner */}
      {hasError && (
        <div className="mb-4 p-4 rounded-2xl bg-red-950 bg-opacity-40 border border-red-800 flex items-center justify-between gap-3 text-red-200">
          <div className="flex items-center gap-3">
            <WifiOff size={18} className="text-red-400 flex-shrink-0" />
            <p className="text-xs">
              <span className="font-semibold">Sync error:</span> Some orders may not be visible.
            </p>
          </div>
          <button
            onClick={() => retryFetch?.('orders')}
            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1 bg-red-600 hover:bg-red-500"
          >
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {userOrders.length === 0 ? (
        <div className="card p-12 text-center">
          <Package size={48} className="text-mandi-subtle mx-auto mb-4" />
          <h2 className="text-mandi-text font-bold text-xl mb-1">No orders yet</h2>
          <p className="text-mandi-muted text-sm mb-6">Start shopping from local kirana stores around you!</p>
          <Link to="/" className="btn-primary inline-flex items-center gap-2">Browse Stores <ArrowRight size={16} /></Link>
        </div>
      ) : (
        <div className="space-y-4">
          {userOrders.map(order => {
            const isDelivered = order.status === 'delivered';
            const isReviewed = Boolean(order.isReviewed || order.reviewRating);

            return (
              <div key={order.id} className="card p-5 hover:border-mandi-border-light transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-mandi-border gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-mandi-text font-bold text-base">#{order.id.toUpperCase()}</span>
                      <span className="badge-green text-xs capitalize">{order.status.replace(/_/g, ' ')}</span>
                      {isReviewed && (
                        <span className="bg-yellow-950 text-yellow-300 border border-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Star size={10} className="fill-yellow-400" /> Rated {order.reviewRating || 5}★
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-mandi-muted text-xs mt-1">
                      <Store size={12} className="text-mandi-green" />
                      <span>{order.storeName}</span>
                      <span>•</span>
                      <Calendar size={12} />
                      <span>{new Date(order.placedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:self-center">
                    <span className="text-mandi-text font-extrabold text-lg">₹{order.total}</span>
                    <Link to={`/order-status/${order.id}`} className="btn-ghost p-1.5"><ChevronRight size={18} /></Link>
                  </div>
                </div>

                {/* Items summary */}
                <div className="py-3 flex flex-wrap gap-2">
                  {order.items.map((item, i) => (
                    <span key={i} className="text-xs bg-mandi-surface border border-mandi-border rounded-lg px-2.5 py-1 text-mandi-muted">
                      {item.quantity}x {item.name}
                    </span>
                  ))}
                </div>

                {/* Footer actions */}
                <div className="flex items-center justify-between pt-3 border-t border-mandi-border text-xs">
                  <span className="text-mandi-subtle">{order.items.length} items • {order.paymentMethod}</span>
                  <div className="flex gap-2">
                    {isDelivered && !isReviewed && (
                      <button
                        onClick={() => setReviewingOrder(order)}
                        className="btn-outline py-1.5 px-3 text-xs flex items-center gap-1 text-yellow-400 border-yellow-500 hover:bg-yellow-500 hover:text-black font-semibold"
                      >
                        <Star size={12} className="fill-yellow-400" /> Rate Store
                      </button>
                    )}
                    <button onClick={() => handleReorder(order)} className="btn-outline py-1.5 px-3 text-xs flex items-center gap-1 hover:border-mandi-green font-semibold">
                      <RefreshCw size={12} />Buy Again
                    </button>
                    <Link to={`/order-status/${order.id}`} className="btn-ghost py-1.5 px-3 text-xs">Track</Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {reviewingOrder && (
        <ReviewModal
          order={reviewingOrder}
          onClose={() => setReviewingOrder(null)}
          onSubmit={handleReviewSubmit}
        />
      )}

      {/* Cart Store Conflict Confirmation Modal */}
      {cartConflictOrder && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-6 space-y-4 relative bg-mandi-card border-mandi-border">
            <button onClick={() => setCartConflictOrder(null)} className="absolute top-4 right-4 text-mandi-muted hover:text-mandi-text">
              <X size={18} />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-orange-950 bg-opacity-50 border border-orange-500 border-opacity-40 flex items-center justify-center text-orange-400">
              <Store size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-mandi-text">Replace items already in cart?</h3>
              <p className="text-mandi-muted text-xs mt-1 leading-relaxed">
                Your cart currently has items from another store. In Mandi Minutes, each order is fulfilled by a single local Kirana shop to guarantee 10-15 min express delivery.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCartConflictOrder(null)}
                className="btn-outline flex-1 py-2 text-xs"
              >
                Keep Current Cart
              </button>
              <button
                type="button"
                onClick={handleConfirmReplaceCart}
                className="btn-primary flex-1 py-2 text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white"
              >
                Replace & Buy Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
