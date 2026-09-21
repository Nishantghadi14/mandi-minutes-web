import { useState } from 'react';
import { ShoppingCart, MapPin, Search, ChevronDown, User, LogOut, Package, Store, Shield, Zap, Heart, Gift, Sun, Moon } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import { useTheme } from '../../context/ThemeContext';
import ReferralModal from './ReferralModal';
import LanguageSwitcher from './LanguageSwitcher';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Navbar() {
  const { itemCount, setIsOpen } = useCart();
  const { user, loading, logout, openAuthModal } = useAuth();
  const { location, setLocationModal } = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [referralModalOpen, setReferralModalOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const isAdmin = user && (
    user.role === 'admin' ||
    user.email?.toLowerCase() === 'admin@mandiminutes.com' ||
    user.email?.toLowerCase() === 'admin@mandi.in' ||
    user.email?.toLowerCase() === 'test3@gmail.com'
  );

  const isVendor = user && user.role === 'vendor';

  return (
    <header className="sticky top-0 z-30 glass-dark border-b border-mandi-border">
      <div className="max-w-7xl mx-auto">
        {/* Main bar */}
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="relative">
              <div className="w-9 h-9 bg-mandi-green rounded-xl flex items-center justify-center shadow-green glow-green-sm transition-all duration-300 group-hover:shadow-green-lg">
                <Zap size={20} className="text-black drop-shadow" fill="black" />
              </div>
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black text-gradient-green leading-none">Mandi</span>
                <span className="text-xl font-black text-mandi-text leading-none">Minutes</span>
                {/* Live indicator */}
                <div className="flex items-center gap-1 ml-1 bg-mandi-green bg-opacity-10 border border-mandi-green border-opacity-30 rounded-full px-1.5 py-0.5">
                  <div className="glow-dot" />
                  <span className="text-mandi-green text-[9px] font-bold tracking-wide uppercase">Live</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Location selector */}
          <button
            onClick={() => setLocationModal(true)}
            className="hidden sm:flex items-center gap-1.5 bg-mandi-surface border border-mandi-border px-3 py-2 rounded-xl hover:border-mandi-green hover:bg-mandi-card transition-all duration-200 min-w-0 max-w-[200px] group"
          >
            <MapPin size={13} className="text-mandi-green flex-shrink-0 group-hover:drop-shadow-[0_0_6px_rgba(0,200,81,0.8)]" />
            <span className="text-mandi-text text-sm font-medium truncate">{location ? location.area.split(',')[0] : t('nav.setLocation')}</span>
            <ChevronDown size={11} className="text-mandi-subtle flex-shrink-0" />
          </button>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mandi-subtle pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('common.search')}
                className="input-field pl-10 pr-4 py-2.5 text-sm w-full rounded-full !border-mandi-border bg-mandi-surface hover:bg-mandi-card hover:border-mandi-border-light transition-all"
              />
            </div>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Language switcher – desktop only */}
            <div className="hidden sm:flex">
              <LanguageSwitcher />
            </div>

            {/* Theme toggle */}
            <button
              id="theme-toggle-btn"
              onClick={toggleTheme}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2.5 rounded-xl border border-mandi-border bg-mandi-surface hover:border-mandi-green transition-all duration-300 active:scale-90 group relative overflow-hidden"
            >
              <div key={isDark ? 'sun' : 'moon'} className="transition-transform duration-300 transform group-hover:rotate-45 active:scale-75">
                {isDark
                  ? <Sun size={17} className="text-mandi-green group-hover:drop-shadow-[0_0_8px_rgba(0,200,81,0.8)] transition-all duration-200" />
                  : <Moon size={17} className="text-mandi-green group-hover:drop-shadow-[0_0_8px_rgba(0,200,81,0.8)] transition-all duration-200" />
                }
              </div>
            </button>

            {/* Cart button */}
            <button
              onClick={() => setIsOpen(true)}
              className="relative p-2.5 bg-mandi-green rounded-xl hover:bg-mandi-green-light active:scale-95 transition-all duration-200 btn-ripple glow-green-sm hover:glow-green"
            >
              <ShoppingCart size={18} className="text-black" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-mandi-dark text-mandi-green text-xs font-bold rounded-full flex items-center justify-center border border-mandi-green animate-scale-in">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </button>



            {/* User */}
            {loading ? (
              <div className="w-20 h-9 rounded-xl bg-mandi-surface border border-mandi-border animate-pulse" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 bg-mandi-surface border border-mandi-border px-3 py-2 rounded-xl hover:border-mandi-green transition-all duration-200"
                >
                  <div className="w-6 h-6 bg-mandi-green rounded-full flex items-center justify-center text-xs font-bold text-black ring-2 ring-mandi-green ring-opacity-30">
                    {(user.name || user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                  <span className="hidden sm:block text-mandi-text text-sm font-medium max-w-[90px] truncate">
                    {(user.name || user.displayName || user.email || 'User').split(' ')[0]}
                  </span>
                  <ChevronDown size={12} className={`text-mandi-muted transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 card-glass border border-mandi-border rounded-xl shadow-card-hover z-50 animate-scale-in">
                    <div className="p-3 border-b border-mandi-border">
                      <p className="text-mandi-text font-semibold text-sm truncate">{user.name || user.displayName || 'Customer'}</p>
                      <p className="text-mandi-muted text-xs truncate">{user.email || user.phone || ''}</p>
                      <span className="tag mt-1.5 inline-block capitalize">{isAdmin ? 'Admin' : (user.role || 'customer')}</span>
                    </div>
                    <div className="py-1">
                      {isAdmin && (
                        <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 bg-mandi-green bg-opacity-10 hover:bg-opacity-20 text-mandi-green font-semibold transition-colors rounded-lg mx-1">
                          <Shield size={16} className="text-mandi-green" />
                          <span className="text-sm">{t('nav.adminPanel')}</span>
                        </Link>
                      )}
                      {(isVendor || isAdmin) && (
                        <Link to="/vendor" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 bg-opacity-10 hover:bg-opacity-20 text-orange-400 font-semibold transition-colors rounded-lg mx-1">
                          <Store size={16} className="text-orange-400" />
                          <span className="text-sm">Vendor Dashboard</span>
                        </Link>
                      )}
                      {!isVendor && !isAdmin && (
                        <Link to="/vendor-onboarding" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 hover:bg-mandi-surface transition-colors rounded-lg mx-1 text-orange-300">
                          <Store size={16} className="text-orange-400" />
                          <span className="text-sm">Partner as Vendor</span>
                        </Link>
                      )}
                      <Link to="/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 hover:bg-mandi-surface transition-colors rounded-lg mx-1">
                        <Package size={16} className="text-mandi-muted" />
                        <span className="text-mandi-text text-sm">{t('nav.orders')}</span>
                      </Link>
                      <Link to="/wishlist" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 hover:bg-mandi-surface transition-colors rounded-lg mx-1">
                        <Heart size={16} className="text-mandi-muted" />
                        <span className="text-mandi-text text-sm">{t('nav.wishlist')}</span>
                      </Link>
                      <button
                        onClick={() => { setUserMenuOpen(false); setReferralModalOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2.5 w-full hover:bg-mandi-surface transition-colors rounded-lg mx-1 text-left"
                      >
                        <Gift size={16} className="text-mandi-green" />
                        <span className="text-mandi-text text-sm font-semibold">{t('nav.refer')}</span>
                      </button>
                      <div className="border-t border-mandi-border my-1" />
                      <button onClick={() => { logout(); setUserMenuOpen(false); navigate('/'); }} className="flex items-center gap-2 px-4 py-2.5 w-full hover:bg-red-950 hover:bg-opacity-40 transition-colors rounded-lg mx-1 text-left">
                        <LogOut size={16} className="text-red-400" />
                        <span className="text-red-400 text-sm">{t('nav.logout')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => openAuthModal('login')} className="btn-primary py-2 px-4 text-sm font-semibold">
                {t('nav.login')}
              </button>
            )}
          </div>
        </div>

        {/* Mobile location + language bar */}
        <div className="flex sm:hidden items-center justify-between px-4 pb-2.5">
          <button onClick={() => setLocationModal(true)} className="flex items-center gap-1.5 text-sm group">
            <MapPin size={12} className="text-mandi-green group-hover:drop-shadow-green" />
            <span className="text-mandi-muted truncate max-w-[160px]">{location ? location.area : t('nav.setLocation')}</span>
            <ChevronDown size={11} className="text-mandi-subtle" />
          </button>
          <LanguageSwitcher />
        </div>
      </div>

      <ReferralModal isOpen={referralModalOpen} onClose={() => setReferralModalOpen(false)} />
    </header>
  );
}
