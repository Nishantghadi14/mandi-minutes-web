import { Home, Search, ShoppingCart, Package, User } from 'lucide-react';
import { Link, useLocation as useRouterLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function BottomNav() {
  const { itemCount, setIsOpen } = useCart();
  const { user, openAuthModal } = useAuth();
  const loc = useRouterLocation();
  const { t } = useTranslation();

  const isActive = (path) => loc.pathname === path;

  const profilePath = user
    ? user.role === 'vendor'
      ? '/vendor'
      : user.role === 'admin'
      ? '/admin'
      : '/orders'
    : null;

  return (
    <nav 
      aria-label="Mobile navigation" 
      className="fixed bottom-0 left-0 right-0 sm:hidden glass-dark border-t border-mandi-border z-40 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] shadow-[0_-4px_20px_rgba(0,0,0,0.25)] select-none"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {/* 1. Home */}
        <Link
          to="/"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-150 active:scale-90 ${
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
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-150 active:scale-90 ${
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
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-150 active:scale-90 ${
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

        {/* 5. Profile / User */}
        {user ? (
          <Link
            to={profilePath}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-150 active:scale-90 ${
              isActive(profilePath) ? 'text-mandi-green' : 'text-mandi-muted hover:text-mandi-text'
            }`}
            aria-label="Profile"
          >
            <div className={`w-7 h-7 bg-mandi-green rounded-full flex items-center justify-center text-xs font-bold text-black ${
              isActive(profilePath) ? 'ring-2 ring-mandi-green ring-offset-1 ring-offset-mandi-dark' : ''
            }`}>
              {(user.name || user.displayName || user.email || 'U')[0].toUpperCase()}
            </div>
            <span className={`text-[10px] font-medium leading-none max-w-[50px] truncate ${
              isActive(profilePath) ? 'text-mandi-green font-bold' : 'text-mandi-muted'
            }`}>
              {(user.name || user.displayName || user.email || 'User').split(' ')[0]}
            </span>
          </Link>
        ) : (
          <button
            onClick={() => openAuthModal('login')}
            className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-150 active:scale-90 text-mandi-muted hover:text-mandi-text"
            aria-label={t('nav.login')}
          >
            <div className="p-1.5 rounded-xl">
              <User size={20} className="stroke-[1.8]" />
            </div>
            <span className="text-[10px] font-medium leading-none">
              {t('nav.login')}
            </span>
          </button>
        )}
      </div>
    </nav>
  );
}
