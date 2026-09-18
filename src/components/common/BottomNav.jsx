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

  const navItems = [
    { icon: Home,         label: t('nav.home'),   path: '/',        action: null },
    { icon: Search,       label: t('nav.search'), path: '/search',  action: null },
    { icon: ShoppingCart, label: t('nav.cart'),   path: null,       action: 'cart', badge: itemCount },
    { icon: Package,      label: t('nav.orders'), path: '/orders',  action: null },
    { icon: User,         label: t('nav.profile'),path: null,       action: 'profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden glass-dark border-t border-mandi-border z-30 px-3 pt-2 pb-3">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.path ? isActive(item.path) : false;

          // Cart — special floating action button in center
          if (item.action === 'cart') {
            return (
              <button
                key={item.label}
                onClick={() => setIsOpen(true)}
                className="flex flex-col items-center -mt-5 relative"
                aria-label="Open cart"
              >
                <div className="relative w-14 h-14 rounded-2xl bg-mandi-green flex items-center justify-center shadow-green active:scale-95 transition-all duration-200 glow-green-sm hover:glow-green">
                  <Icon size={24} className="text-black" />
                  {item.badge > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-mandi-dark text-mandi-green text-xs font-bold rounded-full flex items-center justify-center border-2 border-mandi-card">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-1 font-medium text-mandi-muted">{item.label}</span>
              </button>
            );
          }

          if (item.action === 'profile') {
            return (
              <button
                key={item.label}
                onClick={() => !user && openAuthModal('login')}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-200 ${active ? 'text-mandi-green' : 'text-mandi-muted hover:text-mandi-text'}`}
              >
                {user ? (
                  <Link to={user.role === 'vendor' ? '/vendor' : user.role === 'admin' ? '/admin' : '/orders'} className="flex flex-col items-center gap-1">
                    <div className={`w-7 h-7 bg-mandi-green rounded-full flex items-center justify-center text-xs font-bold text-black ${active ? 'ring-2 ring-mandi-green ring-offset-1 ring-offset-mandi-dark' : ''}`}>
                      {(user.name || user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                    <span className="text-[10px] font-medium text-mandi-muted">
                      {(user.name || user.displayName || user.email || 'User').split(' ')[0]}
                    </span>
                  </Link>
                ) : (
                  <>
                    <div className={`p-1 rounded-xl ${active ? 'bg-mandi-green bg-opacity-15' : ''}`}>
                      <Icon size={22} />
                    </div>
                    <span className="text-[10px] font-medium">{t('nav.login')}</span>
                  </>
                )}
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-200 ${active ? 'text-mandi-green' : 'text-mandi-muted hover:text-mandi-text'}`}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-200 ${active ? 'bg-mandi-green bg-opacity-15' : ''}`}>
                <Icon size={20} className={active ? 'drop-shadow-green' : ''} />
              </div>
              <span className={`text-[10px] font-medium ${active ? 'text-mandi-green' : ''}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
