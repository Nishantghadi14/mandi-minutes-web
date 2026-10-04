import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useLocation } from 'react-router-dom';

export default function FloatingCartBar() {
  const { itemCount, total, setIsOpen } = useCart();
  const location = useLocation();

  // Hide on checkout, order status, or when cart is empty
  const hideOnPaths = ['/checkout', '/admin', '/vendor', '/rider'];
  if (
    itemCount === 0 || 
    hideOnPaths.includes(location.pathname) || 
    location.pathname.startsWith('/order-status')
  ) {
    return null;
  }

  return (
    <aside 
      aria-label="Floating cart summary"
      className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] left-0 right-0 max-w-md mx-auto px-3.5 z-40 pointer-events-none"
    >
      <button
        onClick={() => setIsOpen(true)}
        className="pointer-events-auto w-full bg-gradient-to-r from-emerald-500 via-mandi-green to-emerald-400 text-black px-4 py-3 rounded-2xl shadow-2xl shadow-emerald-950/60 flex items-center justify-between font-bold border border-white/20 active:scale-[0.98] transition-all glow-green-sm animate-slide-in-up"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-black/15 flex items-center justify-center">
            <ShoppingBag size={18} className="text-black" />
          </div>
          <div className="text-left leading-tight">
            <div className="text-xs font-black tracking-wide uppercase opacity-80">
              {itemCount} {itemCount === 1 ? 'Item' : 'Items'} • ₹{total}
            </div>
            <div className="text-[11px] font-semibold text-black/90">
              🚚 Next-Day Morning Delivery
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-black text-white text-xs px-3 py-1.5 rounded-xl font-black group">
          <span>View Cart</span>
          <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </div>
      </button>
    </aside>
  );
}
