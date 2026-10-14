import { Plus, Minus, Heart, Zap, Store } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from './Toast';
import LazyImage from './LazyImage';

export default function ProductCard({ product, showStore = false }) {
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
    <div className={`card group flex flex-col relative overflow-hidden p-2 sm:p-2.5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover rounded-3xl ${isOOS ? 'product-oos' : ''}`}>
      {/* Wishlist button */}
      <button
        onClick={handleWishlist}
        className="absolute top-3.5 right-3.5 z-10 w-8 h-8 bg-white/90 dark:bg-[#161c27]/90 backdrop-blur-md rounded-full flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all hover:scale-110 active:scale-90 shadow-clay-pill border border-white/40 dark:border-white/10"
        aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Heart size={14} className={isWishlisted ? 'fill-red-500 text-red-500' : 'text-slate-700 dark:text-white'} />
      </button>

      {/* Discount badge */}
      {discountPct > 0 && !isOOS && (
        <div className="absolute top-3.5 left-3.5 z-10 text-[10px] font-black px-2.5 py-0.5 rounded-full text-black shadow-clay-badge border border-white/50 bg-gradient-to-r from-emerald-400 to-mandi-green">
          {discountPct}% off
        </div>
      )}

      {/* Image with recessed clay frame */}
      <div className="relative h-32 sm:h-40 overflow-hidden bg-mandi-surface flex-shrink-0 clay-image-frame">
        <LazyImage
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          containerClass="w-full h-full"
        />
        {isOOS && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[1px]">
            <span className="text-white/90 text-xs sm:text-sm font-bold tracking-wide">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-2 sm:p-2.5 flex flex-col flex-1">
        <div className="flex items-center justify-between gap-1 mb-0.5 min-w-0">
          <p className="text-mandi-subtle text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide truncate">{product.brand}</p>
          {showStore && storeName && (
            <span className="text-[10px] text-mandi-green bg-mandi-green/10 border border-mandi-green/20 px-1.5 py-0.5 rounded-lg font-bold flex items-center gap-0.5 truncate max-w-[110px] flex-shrink-0 shadow-clay-badge" title={`Sold by ${storeName}`}>
              <Store size={9} className="flex-shrink-0" />
              <span className="truncate">{storeName}</span>
            </span>
          )}
        </div>
        <h3 className="text-mandi-text text-xs sm:text-sm font-bold leading-snug mb-1 line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] group-hover:text-mandi-green transition-colors">{product.name}</h3>
        <p className="text-mandi-subtle text-[11px] sm:text-xs mb-1.5 font-medium">{product.unit}</p>

        {product.stock <= 5 && product.isAvailable && (
          <div className="flex items-center gap-1 mb-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg px-2 py-0.5 w-fit shadow-clay-badge">
            <Zap size={9} className="text-orange-400 fill-orange-400" />
            <span className="text-orange-400 text-[9px] sm:text-[10px] font-bold">Only {product.stock} left</span>
          </div>
        )}

        <div className="mt-auto pt-1.5">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-mandi-text font-black text-sm sm:text-base">₹{product.price}</span>
            {product.mrp > product.price && (
              <span className="text-mandi-subtle text-[10px] sm:text-xs line-through font-semibold">₹{product.mrp}</span>
            )}
          </div>

          {isOOS ? (
            <button disabled className="w-full py-2 text-xs rounded-2xl bg-mandi-surface text-mandi-subtle font-bold cursor-not-allowed border border-mandi-border">
              Out of Stock
            </button>
          ) : quantity === 0 ? (
            <button
              onClick={handleAdd}
              className="w-full py-2 sm:py-2.5 min-h-[36px] sm:min-h-[38px] text-xs sm:text-sm rounded-2xl bg-mandi-green text-black font-black active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5 clay-btn-green"
            >
              <Plus size={15} strokeWidth={2.8} />
              Add
            </button>
          ) : (
            <div className="flex items-center justify-between bg-mandi-green rounded-2xl overflow-hidden min-h-[36px] sm:min-h-[38px] clay-counter border border-white/20">
              <button
                onClick={() => updateQuantity(product.id, quantity - 1)}
                className="px-3 py-2 h-full flex items-center justify-center hover:bg-black/10 active:scale-90 transition-all duration-150"
                aria-label="Decrease quantity"
              >
                <Minus size={14} className="text-black stroke-[3]" />
              </button>
              <span className="text-black font-black text-xs sm:text-sm select-none">{quantity}</span>
              <button
                onClick={() => updateQuantity(product.id, quantity + 1)}
                className="px-3 py-2 h-full flex items-center justify-center hover:bg-black/10 active:scale-90 transition-all duration-150"
                aria-label="Increase quantity"
              >
                <Plus size={14} className="text-black stroke-[3]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
