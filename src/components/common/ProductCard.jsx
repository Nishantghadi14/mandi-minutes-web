import { Plus, Minus, Heart, Zap } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from './Toast';
import LazyImage from './LazyImage';

export default function ProductCard({ product }) {
  const { items, addItem, updateQuantity, storeId } = useCart();
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();

  const cartItem = items.find(i => i.id === product.id);
  const quantity = cartItem ? cartItem.quantity : 0;
  const isWishlisted = user?.wishlist?.includes(product.id);

  const handleAdd = () => {
    if (storeId && storeId !== product.storeId) {
      addToast('Clear cart to add items from a different store', 'warning');
      return;
    }
    addItem(product);
    addToast(`${product.name} added to cart`, 'success');
  };

  const handleWishlist = (e) => {
    e.stopPropagation();
    if (!user) { addToast('Login to save favourites', 'info'); return; }
    const current = user.wishlist || [];
    const updated = isWishlisted ? current.filter(id => id !== product.id) : [...current, product.id];
    updateUser({ wishlist: updated });
    addToast(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist', 'success');
  };

  const discountPct = product.discount || (product.mrp > product.price ? Math.round((product.mrp - product.price) / product.mrp * 100) : 0);
  const isOOS = !product.isAvailable;

  return (
    <div className={`card group flex flex-col relative overflow-hidden transition-all duration-250 hover:-translate-y-1 hover:shadow-card-hover hover:border-mandi-green/50 ${isOOS ? 'product-oos' : ''}`}>
      {/* Wishlist button — visible on mobile, hover on desktop */}
      <button
        onClick={handleWishlist}
        className="absolute top-2 right-2 z-10 w-8 h-8 bg-white/90 dark:bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all hover:scale-110 active:scale-90 shadow-sm"
        aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Heart size={14} className={isWishlisted ? 'fill-red-500 text-red-500' : 'text-slate-700 dark:text-white'} />
      </button>

      {/* Discount badge */}
      {discountPct > 0 && !isOOS && (
        <div className="absolute top-2 left-2 z-10 text-[10px] font-bold px-2 py-0.5 rounded-full text-black shadow-sm"
          style={{ background: 'linear-gradient(135deg, #00C851, #00E65C)' }}>
          {discountPct}% off
        </div>
      )}

      {/* Image */}
      <div className="relative h-32 sm:h-40 overflow-hidden bg-mandi-surface flex-shrink-0">
        <LazyImage
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400 ease-out"
          containerClass="w-full h-full"
        />
        {isOOS && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white/80 text-xs sm:text-sm font-bold tracking-wide">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-2.5 sm:p-3 flex flex-col flex-1">
        <p className="text-mandi-subtle text-[10px] sm:text-[11px] font-medium mb-0.5 uppercase tracking-wide truncate">{product.brand}</p>
        <h3 className="text-mandi-text text-xs sm:text-sm font-semibold leading-snug mb-1 line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem]">{product.name}</h3>
        <p className="text-mandi-subtle text-[11px] sm:text-xs mb-1.5">{product.unit}</p>

        {product.stock <= 5 && product.isAvailable && (
          <div className="flex items-center gap-1 mb-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg px-1.5 py-0.5 w-fit">
            <Zap size={9} className="text-orange-400" />
            <span className="text-orange-400 text-[9px] sm:text-[10px] font-semibold">Only {product.stock} left</span>
          </div>
        )}

        <div className="mt-auto pt-1">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-mandi-text font-bold text-sm sm:text-base">₹{product.price}</span>
            {product.mrp > product.price && (
              <span className="text-mandi-subtle text-[10px] sm:text-xs line-through">₹{product.mrp}</span>
            )}
          </div>

          {isOOS ? (
            <button disabled className="w-full py-2 text-xs rounded-xl bg-mandi-surface text-mandi-subtle font-medium cursor-not-allowed border border-mandi-border">
              Out of Stock
            </button>
          ) : quantity === 0 ? (
            <button
              onClick={handleAdd}
              className="w-full py-2 sm:py-2.5 min-h-[36px] sm:min-h-[38px] text-xs sm:text-sm rounded-xl bg-mandi-green text-black font-bold hover:bg-mandi-green-light active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5 btn-ripple shadow-sm"
              style={{ boxShadow: '0 2px 12px rgba(0,200,81,0.25)' }}
            >
              <Plus size={14} />
              Add
            </button>
          ) : (
            <div className="flex items-center justify-between bg-mandi-green rounded-xl overflow-hidden min-h-[36px] sm:min-h-[38px]" style={{ boxShadow: '0 2px 12px rgba(0,200,81,0.3)' }}>
              <button
                onClick={() => updateQuantity(product.id, quantity - 1)}
                className="px-3 py-2 h-full flex items-center justify-center hover:bg-mandi-green-dark active:scale-95 transition-all duration-150"
                aria-label="Decrease quantity"
              >
                <Minus size={14} className="text-black" />
              </button>
              <span className="text-black font-black text-xs sm:text-sm">{quantity}</span>
              <button
                onClick={() => updateQuantity(product.id, quantity + 1)}
                className="px-3 py-2 h-full flex items-center justify-center hover:bg-mandi-green-dark active:scale-95 transition-all duration-150"
                aria-label="Increase quantity"
              >
                <Plus size={14} className="text-black" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
