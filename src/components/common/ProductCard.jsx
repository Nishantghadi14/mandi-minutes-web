import { Plus, Minus, Heart, Zap, Store } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from './Toast';
import LazyImage from './LazyImage';

export default function ProductCard({ product, showStore = false, compact = false, priority = false }) {
  const { items, addItem, updateQuantity, storeId } = useCart();
  const { user, updateUser } = useAuth();
  const { stores } = useData();
  const { addToast } = useToast();

  const store = stores?.find(s => s.id === product.storeId);
  const storeName = store?.name;

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
    <div
      className={`card group flex flex-col relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover rounded-3xl ${compact
          ? 'w-[150px] sm:w-[168px] flex-shrink-0 p-2'
          : 'p-2 sm:p-2.5 w-full'
        } ${isOOS ? 'product-oos' : ''}`}
    >
      {/* Wishlist button */}
      <button
        onClick={handleWishlist}
        className={`absolute z-10 bg-white/90 dark:bg-[#161c27]/90 backdrop-blur-md rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-90 shadow-clay-pill border border-white/40 dark:border-white/10 ${compact
            ? 'top-2.5 right-2.5 w-7 h-7'
            : 'top-3 right-3 w-8 h-8 opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
          }`}
        aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Heart size={compact ? 12 : 14} className={isWishlisted ? 'fill-red-500 text-red-500' : 'text-slate-700 dark:text-white'} />
      </button>

      {/* Discount badge */}
      {discountPct > 0 && !isOOS && (
        <div className={`absolute left-2.5 z-10 text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full text-black shadow-clay-badge border border-white/50 bg-gradient-to-r from-emerald-400 to-mandi-green ${compact ? 'top-2' : 'top-3'
          }`}>
          {discountPct}% off
        </div>
      )}

      {/* Image with recessed clay frame */}
      <div className={`relative overflow-hidden bg-mandi-surface flex-shrink-0 clay-image-frame rounded-2xl ${compact ? 'h-28 sm:h-32' : 'h-32 sm:h-40'
        }`}>
        <LazyImage
          src={product.image}
          alt={product.name}
          category={product.category}
          priority={priority}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          containerClass="w-full h-full"
        />
        {/* Delivery Time Badge overlay */}
        <div className="absolute bottom-1.5 left-1.5 bg-black/75 backdrop-blur-sm text-emerald-400 text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5 border border-white/10">
          <Zap size={8} className="fill-emerald-400 text-emerald-400" />
          <span>10-15m</span>
        </div>

        {isOOS && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[1px]">
            <span className="text-white/90 text-xs sm:text-sm font-bold tracking-wide">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-1.5 sm:p-2 flex flex-col flex-1">
        <div className="flex items-center justify-between gap-1 mb-0.5 min-w-0">
          <p className="text-mandi-subtle text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider truncate">
            {product.brand || 'Mandi Direct'}
          </p>
          {showStore && storeName && !compact && (
            <span className="text-[10px] text-mandi-green bg-mandi-green/10 border border-mandi-green/20 px-1.5 py-0.5 rounded-lg font-bold flex items-center gap-0.5 truncate max-w-[100px] flex-shrink-0 shadow-clay-badge" title={`Sold by ${storeName}`}>
              <Store size={9} className="flex-shrink-0" />
              <span className="truncate">{storeName}</span>
            </span>
          )}
        </div>

        <h3 className={`text-mandi-text font-bold leading-snug mb-1 line-clamp-2 group-hover:text-mandi-green transition-colors ${compact ? 'text-xs min-h-[1.9rem]' : 'text-xs sm:text-sm min-h-[2.1rem]'
          }`}>
          {product.name}
        </h3>

        <div className="flex items-center justify-between mb-1">
          <span className="text-mandi-subtle text-[10px] sm:text-[11px] font-medium bg-mandi-surface px-1.5 py-0.5 rounded-md border border-transparent">
            {product.unit}
          </span>
          {product.stock <= 5 && product.isAvailable && !compact && (
            <span className="text-orange-400 text-[9px] font-bold flex items-center gap-0.5">
              <Zap size={8} className="fill-orange-400" />
              {product.stock} left
            </span>
          )}
        </div>

        <div className="mt-auto pt-1">
          <div className="flex items-baseline gap-1.5 mb-2">
            <span className={`text-mandi-text font-black ${compact ? 'text-sm' : 'text-sm sm:text-base'}`}>
              ₹{product.price}
            </span>
            {product.mrp > product.price && (
              <span className="text-mandi-subtle text-[10px] sm:text-xs line-through font-semibold">
                ₹{product.mrp}
              </span>
            )}
          </div>

          {isOOS ? (
            <button disabled className="w-full py-1.5 text-xs rounded-2xl bg-mandi-surface text-mandi-subtle font-bold cursor-not-allowed border border-mandi-border">
              Out of Stock
            </button>
          ) : quantity === 0 ? (
            <button
              onClick={handleAdd}
              className={`w-full text-xs font-black rounded-2xl bg-mandi-green text-black active:scale-95 transition-all duration-200 flex items-center justify-center gap-1 clay-btn-green ${compact ? 'py-1.5 min-h-[32px]' : 'py-2 sm:py-2.5 min-h-[36px] sm:min-h-[38px]'
                }`}
            >
              <Plus size={14} strokeWidth={2.8} />
              Add
            </button>
          ) : (
            <div className={`flex items-center justify-between bg-mandi-green rounded-2xl overflow-hidden clay-counter ${compact ? 'min-h-[32px]' : 'min-h-[36px] sm:min-h-[38px]'
              }`}>
              <button
                onClick={() => updateQuantity(product.id, quantity - 1)}
                className="px-2.5 py-1.5 h-full flex items-center justify-center hover:bg-black/10 active:scale-90 transition-all duration-150"
                aria-label="Decrease quantity"
              >
                <Minus size={13} className="text-black stroke-[3]" />
              </button>
              <span className="text-black font-black text-xs sm:text-sm select-none">{quantity}</span>
              <button
                onClick={() => updateQuantity(product.id, quantity + 1)}
                className="px-2.5 py-1.5 h-full flex items-center justify-center hover:bg-black/10 active:scale-90 transition-all duration-150"
                aria-label="Increase quantity"
              >
                <Plus size={13} className="text-black stroke-[3]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
