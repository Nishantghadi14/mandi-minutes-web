import { Home, Search, ShoppingCart, Package, User } from 'lucide-react';
import { Link, useLocation as useRouterLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export default function BottomNav() {
  const { itemCount, setIsOpen } = useCart();
  const { user, openAuthModal } = useAuth();
  const loc = useRouterLocation();

  const isActive = (path) => loc.pathname === path;

  const navItems = [
    { icon: Home, label: 'Home', path: '/', action: null },
    { icon: Search, label: 'Search', path: '/search', action: null },
    { icon: ShoppingCart, label: 'Cart', path: null, action: 'cart', badge: itemCount },
    { icon: Package, label: 'Orders', path: '/orders', action: null },
    { icon: User, label: 'Profile', path: null, action: 'profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-mandi-card border-t border-mandi-border z-30 px-2 py-2">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.path ? isActive(item.path) : false;

          if (item.action === 'cart') {
            return (
              <button key={item.label} onClick={() => setIsOpen(true)} className={`bottom-nav-item ${active ? 'text-mandi-green' : 'text-mandi-muted'} relative`}>
                <div className="relative">
                  <Icon size={22} />
                  {item.badge > 0 && (
                    <span className="absolute -top-2 -right-2 w-4 h-4 bg-mandi-green text-black text-xs font-bold rounded-full flex items-center justify-center">{item.badge > 9 ? '9+' : item.badge}</span>
                  )}
                </div>
                <span className="text-xs">{item.label}</span>
              </button>
            );
          }

          if (item.action === 'profile') {
            return (
              <button key={item.label} onClick={() => !user && openAuthModal('login')} className={`bottom-nav-item ${active ? 'text-mandi-green' : 'text-mandi-muted'}`}>
                {user ? (
                  <Link to={user.role === 'vendor' ? '/vendor' : user.role === 'admin' ? '/admin' : '/orders'} className="flex flex-col items-center gap-1">
                    <div className="w-6 h-6 bg-mandi-green rounded-full flex items-center justify-center text-xs font-bold text-black">{user.name[0]}</div>
                    <span className="text-xs text-mandi-muted">{user.name.split(' ')[0]}</span>
                  </Link>
                ) : (
                  <><Icon size={22} /><span className="text-xs">Login</span></>
                )}
              </button>
            );
          }

          return (
            <Link key={item.label} to={item.path} className={`bottom-nav-item ${active ? 'text-mandi-green' : 'text-mandi-muted'}`}>
              <Icon size={22} />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
