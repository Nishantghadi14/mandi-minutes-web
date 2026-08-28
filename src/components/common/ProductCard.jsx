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

  return (
    <div className="card group flex flex-col relative overflow-hidden">
      {/* Wishlist button */}
      <button onClick={handleWishlist} className="absolute top-2 right-2 z-10 w-8 h-8 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-opacity-70">
        <Heart size={14} className={isWishlisted ? 'fill-red-500 text-red-500' : 'text-white'} />
      </button>

      {/* Discount badge */}
      {discountPct > 0 && (
        <div className="absolute top-2 left-2 z-10 badge-green text-xs">{discountPct}% off</div>
      )}

      {/* Image */}
      <div className="relative h-36 overflow-hidden bg-mandi-surface flex-shrink-0">
        <LazyImage
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          containerClass="w-full h-full"
        />
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
            <span className="text-mandi-muted text-sm font-semibold">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1">
        <p className="text-mandi-muted text-xs mb-1">{product.brand}</p>
        <h3 className="text-mandi-text text-sm font-semibold leading-tight mb-1 line-clamp-2">{product.name}</h3>
        <p className="text-mandi-subtle text-xs mb-2">{product.unit}</p>

        {product.stock <= 5 && product.isAvailable && (
          <div className="flex items-center gap-1 mb-2">
            <Zap size={10} className="text-orange-400" />
            <span className="text-orange-400 text-xs">Only {product.stock} left</span>
          </div>
        )}

        <div className="mt-auto">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-mandi-text font-bold text-base">₹{product.price}</span>
            {product.mrp > product.price && (
              <span className="text-mandi-subtle text-xs line-through">₹{product.mrp}</span>
            )}
          </div>

          {!product.isAvailable ? (
            <button disabled className="w-full py-2 text-xs rounded-xl bg-mandi-surface text-mandi-subtle font-medium cursor-not-allowed">
              Out of Stock
            </button>
          ) : quantity === 0 ? (
            <button onClick={handleAdd} className="w-full py-2 text-sm rounded-xl bg-mandi-green text-black font-semibold hover:bg-mandi-green-dark transition-colors flex items-center justify-center gap-1.5">
              <Plus size={14} />
              Add
            </button>
          ) : (
            <div className="flex items-center justify-between bg-mandi-green rounded-xl overflow-hidden">
              <button onClick={() => updateQuantity(product.id, quantity - 1)} className="px-3 py-2 hover:bg-mandi-green-dark transition-colors">
                <Minus size={14} className="text-black" />
              </button>
              <span className="text-black font-bold text-sm">{quantity}</span>
              <button onClick={() => updateQuantity(product.id, quantity + 1)} className="px-3 py-2 hover:bg-mandi-green-dark transition-colors">
                <Plus size={14} className="text-black" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
