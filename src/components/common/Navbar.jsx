import { useState } from 'react';
import { ShoppingCart, MapPin, Search, ChevronDown, User, LogOut, Package, Store, Shield, Zap, Heart, Gift } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import ReferralModal from './ReferralModal';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { itemCount, setIsOpen } = useCart();
  const { user, logout, openAuthModal } = useAuth();
  const { location, setLocationModal } = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [referralModalOpen, setReferralModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const roleLinks = {
    vendor: { href: '/vendor', label: 'Dashboard', icon: Store },
    admin: { href: '/admin', label: 'Admin Panel', icon: Shield },
  };

  const roleLink = user && roleLinks[user.role];

  return (
    <header className="sticky top-0 z-30 bg-mandi-card border-b border-mandi-border">
      <div className="max-w-7xl mx-auto">
        {/* Main bar */}
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="relative">
              <div className="w-9 h-9 bg-mandi-green rounded-xl flex items-center justify-center">
                <Zap size={20} className="text-black" fill="black" />
              </div>
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-black text-gradient-green leading-none">Mandi</span>
              <span className="text-xl font-black text-mandi-text leading-none"> Minutes</span>
            </div>
          </Link>

          {/* Location selector */}
          <button onClick={() => setLocationModal(true)} className="hidden sm:flex items-center gap-1.5 bg-mandi-surface border border-mandi-border px-3 py-2 rounded-xl hover:border-mandi-green transition-colors min-w-0 max-w-[180px]">
            <MapPin size={14} className="text-mandi-green flex-shrink-0" />
            <span className="text-mandi-text text-sm font-medium truncate">{location ? location.area.split(',')[0] : 'Set Location'}</span>
            <ChevronDown size={12} className="text-mandi-muted flex-shrink-0" />
          </button>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mandi-subtle" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search products, stores..."
                className="input-field pl-9 py-2.5 text-sm w-full"
              />
            </div>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Cart button */}
            <button onClick={() => setIsOpen(true)} className="relative p-2.5 bg-mandi-green rounded-xl hover:bg-mandi-green-dark transition-colors">
              <ShoppingCart size={18} className="text-black" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-mandi-dark text-mandi-green text-xs font-bold rounded-full flex items-center justify-center border border-mandi-green">{itemCount > 9 ? '9+' : itemCount}</span>
              )}
            </button>

            {/* User */}
            {user ? (
              <div className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 bg-mandi-surface border border-mandi-border px-3 py-2 rounded-xl hover:border-mandi-green transition-colors">
                  <div className="w-6 h-6 bg-mandi-green rounded-full flex items-center justify-center text-xs font-bold text-black">{user.name[0]}</div>
                  <span className="hidden sm:block text-mandi-text text-sm font-medium max-w-[80px] truncate">{user.name.split(' ')[0]}</span>
                  <ChevronDown size={12} className="text-mandi-muted" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-mandi-card border border-mandi-border rounded-xl shadow-card-hover z-50">
                    <div className="p-3 border-b border-mandi-border">
                      <p className="text-mandi-text font-semibold text-sm">{user.name}</p>
                      <p className="text-mandi-muted text-xs">{user.email}</p>
                      <span className="tag mt-1 inline-block capitalize">{user.role}</span>
                    </div>
                    <div className="py-1">
                      {roleLink && (
                        <Link to={roleLink.href} onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 hover:bg-mandi-surface transition-colors">
                          <roleLink.icon size={16} className="text-mandi-green" />
                          <span className="text-mandi-text text-sm">{roleLink.label}</span>
                        </Link>
                      )}
                      {user.role === 'customer' && (
                        <>
                          <Link to="/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 hover:bg-mandi-surface transition-colors">
                            <Package size={16} className="text-mandi-muted" />
                            <span className="text-mandi-text text-sm">My Orders</span>
                          </Link>
                          <Link to="/wishlist" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 hover:bg-mandi-surface transition-colors">
                            <Heart size={16} className="text-mandi-muted" />
                            <span className="text-mandi-text text-sm">Wishlist</span>
                          </Link>
                          <button
                            onClick={() => { setUserMenuOpen(false); setReferralModalOpen(true); }}
                            className="flex items-center gap-2 px-4 py-2.5 w-full hover:bg-mandi-surface transition-colors text-left"
                          >
                            <Gift size={16} className="text-mandi-green" />
                            <span className="text-mandi-text text-sm font-semibold">Refer & Earn ₹50</span>
                          </button>
                        </>
                      )}
                      <button onClick={() => { logout(); setUserMenuOpen(false); navigate('/'); }} className="flex items-center gap-2 px-4 py-2.5 w-full hover:bg-mandi-surface transition-colors text-left">
                        <LogOut size={16} className="text-red-400" />
                        <span className="text-red-400 text-sm">Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => openAuthModal('login')} className="btn-primary py-2 px-4 text-sm">
                Login
              </button>
            )}
          </div>
        </div>

        {/* Mobile location bar */}
        <div className="flex sm:hidden items-center gap-2 px-4 pb-2">
          <button onClick={() => setLocationModal(true)} className="flex items-center gap-1.5 text-sm">
            <MapPin size={13} className="text-mandi-green" />
            <span className="text-mandi-muted">{location ? location.area : 'Set Location'}</span>
            <ChevronDown size={12} className="text-mandi-muted" />
          </button>
        </div>
      </div>

      <ReferralModal isOpen={referralModalOpen} onClose={() => setReferralModalOpen(false)} />
    </header>
  );
}
