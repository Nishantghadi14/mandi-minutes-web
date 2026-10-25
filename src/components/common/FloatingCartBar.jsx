import { ShoppingBag, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useLocation } from 'react-router-dom';

export default function FloatingCartBar() {
  const { itemCount, total, items, setIsOpen } = useCart();
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

  const totalSavings = items.reduce((sum, item) => {
    const mrp = Number(item.mrp) || Number(item.price) || 0;
    const price = Number(item.price) || 0;
    return sum + Math.max(0, (mrp - price) * (item.quantity || 1));
  }, 0);

  const freeDeliveryRemaining = Math.max(0, 199 - total);

  return (
    <aside
      aria-label="Floating cart summary"
      className="fixed bottom-[calc(6.25rem+env(safe-area-inset-bottom,0px))] left-0 right-0 max-w-md mx-auto px-3.5 z-40 pointer-events-none"
    >
      <button
        onClick={() => setIsOpen(true)}
        className="pointer-events-auto w-full bg-gradient-to-r from-emerald-500 via-mandi-green to-teal-400 text-black px-4 py-2.5 rounded-3xl clay-btn-green flex items-center justify-between font-bold border border-white/50 shadow-clay-floating active:scale-[0.98] transition-all animate-slide-in-up"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-black/15 border border-black/10 flex items-center justify-center relative shadow-inner">
            <ShoppingBag size={18} className="text-black stroke-[2.5]" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-black text-white text-[9px] font-black flex items-center justify-center">
              {itemCount}
            </span>
          </div>
          <div className="text-left leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-black">₹{total}</span>
              {totalSavings > 0 && (
                <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded-full bg-black/15 text-black">
                  Saved ₹{totalSavings}
                </span>
              )}
            </div>
            <div className="text-[10px] font-bold text-black/85 flex items-center gap-1 mt-0.5">
              {freeDeliveryRemaining === 0 ? (
                <span className="text-emerald-950 font-black flex items-center gap-0.5">
                  <CheckCircle2 size={10} className="fill-emerald-950 text-white" />
                  FREE Delivery Unlocked!
                </span>
              ) : (
                <span>Add ₹{freeDeliveryRemaining} for FREE Delivery</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-black text-white text-xs px-3.5 py-2 rounded-2xl font-black shadow-md hover:bg-neutral-900 group">
          <span>View Cart</span>
          <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
        </div>
      </button>
    </aside>
  );
}
