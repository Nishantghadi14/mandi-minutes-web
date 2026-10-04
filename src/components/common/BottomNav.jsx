import { Home, Search, ShoppingCart, Package, User } from 'lucide-react';
import { Link, useLocation as useRouterLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { isInAppMode } from '../../utils/platform';

export default function BottomNav({ inAppMode: propInAppMode }) {
  const { itemCount, setIsOpen } = useCart();
  const { user } = useAuth();
  const loc = useRouterLocation();
  const { t } = useTranslation();

  const isApp = propInAppMode ?? isInAppMode();

  const isActive = (path) => path === '/' ? (loc.pathname === '/' || loc.pathname === '/app') : loc.pathname === path;

  // In standard web mode, hide BottomNav on focused workflow pages where it obstructs content.
  // In app view, the bottom navigation bar is always visible!
  const HIDE_BOTTOM_NAV_ROUTES = ['/checkout', '/admin', '/vendor', '/rider'];
  if (!isApp && (HIDE_BOTTOM_NAV_ROUTES.includes(loc.pathname) || loc.pathname.startsWith('/order-status'))) {
    return null;
  }

  const homePath = isApp ? '/app' : '/';

  return (
    <nav 
      aria-label="Mobile navigation" 
      className={`fixed bottom-0 left-0 right-0 ${isApp ? 'block' : 'md:hidden'} glass-dark border-t border-mandi-border z-40 px-2 pt-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] shadow-[0_-4px_24px_rgba(0,0,0,0.35)] select-none`}
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* 1. Home */}
        <Link
          to={homePath}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all duration-150 active:scale-90 ${
            isActive('/') ? 'text-mandi-green' : 'text-mandi-muted hover:text-mandi-text'
          }`}
          aria-label={t('nav.home')}
        >
          <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive('/') ? 'bg-mandi-green/15 text-mandi-green' : ''}`}>
            <Home size={20} className={isActive('/') ? 'drop-shadow-green stroke-[2.3]' : 'stroke-[1.8]'} />
          </div>
          <span className={`text-[10px] font-medium leading-none ${isActive('/') ? 'text-mandi-green font-bold' : ''}`}>
            {t('nav.home')}
          </span>
        </Link>

        {/* 2. Search */}
        <Link
          to="/search"
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all duration-150 active:scale-90 ${
            isActive('/search') ? 'text-mandi-green' : 'text-mandi-muted hover:text-mandi-text'
          }`}
          aria-label={t('nav.search')}
        >
          <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive('/search') ? 'bg-mandi-green/15 text-mandi-green' : ''}`}>
            <Search size={20} className={isActive('/search') ? 'drop-shadow-green stroke-[2.3]' : 'stroke-[1.8]'} />
          </div>
          <span className={`text-[10px] font-medium leading-none ${isActive('/search') ? 'text-mandi-green font-bold' : ''}`}>
            {t('nav.search')}
          </span>
        </Link>

        {/* 3. Cart - Center Floating Action Button */}
        <button
          onClick={() => setIsOpen(true)}
          className="flex flex-col items-center -mt-6 relative group transition-transform active:scale-90"
          aria-label="Open cart"
        >
          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-mandi-green flex items-center justify-center shadow-lg shadow-mandi-green/30 border-2 border-mandi-dark active:scale-95 transition-all duration-200 glow-green-sm">
            <ShoppingCart size={22} className="text-black stroke-[2.4]" />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-mandi-card shadow-sm animate-scale-in">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 font-semibold text-mandi-text leading-none">
            {t('nav.cart')}
          </span>
        </button>

        {/* 4. Orders */}
        <Link
          to="/orders"
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all duration-150 active:scale-90 ${
            isActive('/orders') ? 'text-mandi-green' : 'text-mandi-muted hover:text-mandi-text'
          }`}
          aria-label={t('nav.orders')}
        >
          <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive('/orders') ? 'bg-mandi-green/15 text-mandi-green' : ''}`}>
            <Package size={20} className={isActive('/orders') ? 'drop-shadow-green stroke-[2.3]' : 'stroke-[1.8]'} />
          </div>
          <span className={`text-[10px] font-medium leading-none ${isActive('/orders') ? 'text-mandi-green font-bold' : ''}`}>
            {t('nav.orders')}
          </span>
        </Link>

        {/* 5. Profile / Account */}
        <Link
          to="/profile"
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all duration-150 active:scale-90 ${
            isActive('/profile') ? 'text-mandi-green' : 'text-mandi-muted hover:text-mandi-text'
          }`}
          aria-label={t('nav.profile')}
        >
          <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive('/profile') ? 'bg-mandi-green/15 text-mandi-green' : ''}`}>
            {user ? (
              <div className={`w-5 h-5 bg-mandi-green rounded-full flex items-center justify-center text-[10px] font-bold text-black ${
                isActive('/profile') ? 'ring-2 ring-mandi-green ring-offset-1 ring-offset-mandi-dark' : ''
              }`}>
                {(user.name || user.displayName || user.email || 'U')[0].toUpperCase()}
              </div>
            ) : (
              <User size={20} className={isActive('/profile') ? 'drop-shadow-green stroke-[2.3]' : 'stroke-[1.8]'} />
            )}
          </div>
          <span className={`text-[10px] font-medium leading-none max-w-[55px] truncate ${
            isActive('/profile') ? 'text-mandi-green font-bold' : ''
          }`}>
            {user ? (user.name || user.displayName || 'Profile').split(' ')[0] : t('nav.profile')}
          </span>
        </Link>
      </div>
    </nav>
  );
}
