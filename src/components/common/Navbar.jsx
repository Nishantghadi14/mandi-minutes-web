import { useState, useRef, useEffect } from 'react';
import { ShoppingCart, MapPin, Search, ChevronDown, LogOut, Package, Store, Shield, Zap, Heart, Gift, Sun, Moon, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import { useTheme } from '../../context/ThemeContext';
import ReferralModal from './ReferralModal';
import LanguageSwitcher from './LanguageSwitcher';
import LiveSearchDropdown from './LiveSearchDropdown';
import { Link, useNavigate, useLocation as useRouteLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDebounce } from '../../utils/searchProducts';

export default function Navbar() {
  const { itemCount, setIsOpen } = useCart();
  const { user, loading, logout, openAuthModal } = useAuth();
  const { location, setLocationModal } = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [tabletUserMenuOpen, setTabletUserMenuOpen] = useState(false);
  const [referralModalOpen, setReferralModalOpen] = useState(false);
  const searchContainerRef = useRef(null);
  const mobileSearchContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const mobileSearchInputRef = useRef(null);
  const navigate = useNavigate();
  const routeLocation = useRouteLocation();
  const { t } = useTranslation();

  const debouncedSearch = useDebounce(searchQuery, 150);

  // Sync searchQuery with URL query if currently on /search
  useEffect(() => {
    if (routeLocation.pathname === '/search') {
      const params = new URLSearchParams(routeLocation.search);
      const q = params.get('q');
      if (q !== null && q !== searchQuery) {
        setSearchQuery(q);
      }
    }
  }, [routeLocation.pathname, routeLocation.search]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedDesktop = searchContainerRef.current && searchContainerRef.current.contains(event.target);
      const clickedMobile = mobileSearchContainerRef.current && mobileSearchContainerRef.current.contains(event.target);
      if (!clickedDesktop && !clickedMobile) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleSearch = (e) => {
    e?.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchFocused(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleClearSearch = (e) => {
    e.stopPropagation();
    setSearchQuery('');
    if (routeLocation.pathname === '/search') {
      navigate('/search');
    }
    searchInputRef.current?.focus();
    mobileSearchInputRef.current?.focus();
  };

  const handleSelectQuery = (term) => {
    setSearchQuery(term);
    setIsSearchFocused(false);
    navigate(`/search?q=${encodeURIComponent(term)}`);
  };

  const isAdmin = user && (
    user.role === 'admin' ||
    user.email?.toLowerCase() === 'admin@mandiminutes.com' ||
    user.email?.toLowerCase() === 'admin@mandi.in' ||
    user.email?.toLowerCase() === 'test3@gmail.com'
  );

  const isVendor = user && user.role === 'vendor';

  const userDropdownMenu = (closeMenu) => (
    <div className="p-3 border-b border-mandi-border">
      <p className="text-mandi-text font-semibold text-sm truncate">{user.name || user.displayName || 'Customer'}</p>
      <p className="text-mandi-muted text-xs truncate">{user.email || user.phone || ''}</p>
      <span className="tag mt-1.5 inline-block capitalize">{isAdmin ? 'Admin' : (user.role || 'customer')}</span>
      <div className="py-1 mt-2 space-y-0.5">
        {isAdmin && (
          <Link to="/admin" onClick={closeMenu} className="flex items-center gap-2 px-3 py-2 bg-mandi-green bg-opacity-10 hover:bg-opacity-20 text-mandi-green font-semibold transition-colors rounded-lg">
            <Shield size={16} className="text-mandi-green" />
            <span className="text-sm">{t('nav.adminPanel')}</span>
          </Link>
        )}
        {(isVendor || isAdmin) && (
          <Link to="/vendor" onClick={closeMenu} className="flex items-center gap-2 px-3 py-2 bg-orange-500 bg-opacity-10 hover:bg-opacity-20 text-orange-400 font-semibold transition-colors rounded-lg">
            <Store size={16} className="text-orange-400" />
            <span className="text-sm">Vendor Dashboard</span>
          </Link>
        )}
        {!isVendor && !isAdmin && (
          <Link to="/vendor-onboarding" onClick={closeMenu} className="flex items-center gap-2 px-3 py-2 hover:bg-mandi-surface transition-colors rounded-lg text-orange-600 dark:text-orange-300">
            <Store size={16} className="text-orange-500 dark:text-orange-400" />
            <span className="text-sm">Partner as Vendor</span>
          </Link>
        )}
        <Link to="/orders" onClick={closeMenu} className="flex items-center gap-2 px-3 py-2 hover:bg-mandi-surface transition-colors rounded-lg">
          <Package size={16} className="text-mandi-muted" />
          <span className="text-mandi-text text-sm">{t('nav.orders')}</span>
        </Link>
        <Link to="/wishlist" onClick={closeMenu} className="flex items-center gap-2 px-3 py-2 hover:bg-mandi-surface transition-colors rounded-lg">
          <Heart size={16} className="text-mandi-muted" />
          <span className="text-mandi-text text-sm">{t('nav.wishlist')}</span>
        </Link>
        <button
          onClick={() => { closeMenu(); setReferralModalOpen(true); }}
          className="flex items-center gap-2 px-3 py-2 w-full hover:bg-mandi-surface transition-colors rounded-lg text-left"
        >
          <Gift size={16} className="text-mandi-green" />
          <span className="text-mandi-text text-sm font-semibold">{t('nav.refer')}</span>
        </button>
        <div className="border-t border-mandi-border my-1" />
        <button onClick={() => { logout(); closeMenu(); navigate('/'); }} className="flex items-center gap-2 px-3 py-2 w-full hover:bg-red-500/10 transition-colors rounded-lg text-left">
          <LogOut size={16} className="text-red-500 dark:text-red-400" />
          <span className="text-red-500 dark:text-red-400 text-sm">{t('nav.logout')}</span>
        </button>
      </div>
    </div>
  );

  return (
    <header className="sticky top-0 z-30 glass-dark border-b border-mandi-border pt-safe">
      <div className="max-w-7xl mx-auto">
        {/* ─── MOBILE & TABLET TOP BAR (< lg: 0px to 1023px) ─── */}
        <div className="lg:hidden">
          {/* Row 1: Brand & Location on Left, Language, Theme, Cart & Profile on Right */}
          <div className="flex items-center justify-between px-3.5 sm:px-5 pt-2.5 sm:pt-3 pb-1.5 gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Link to="/" className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 group" aria-label="Mandi Minutes Home">
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-mandi-green rounded-xl flex items-center justify-center shadow-green glow-green-sm">
                  <Zap size={18} className="text-black drop-shadow" fill="black" />
                </div>
                <div className="flex items-center leading-none">
                  <span className="text-base sm:text-lg font-black text-gradient-green">Mandi</span>
                  <span className="text-base sm:text-lg font-black text-mandi-text ml-0.5">Minutes</span>
                  <div className="hidden sm:flex items-center gap-1 ml-1.5 bg-mandi-green bg-opacity-10 border border-mandi-green border-opacity-30 rounded-full px-1.5 py-0.5">
                    <div className="glow-dot" />
                    <span className="text-mandi-green text-[9px] font-bold tracking-wide uppercase">Live</span>
                  </div>
                </div>
              </Link>

              {/* Location Selector Button */}
              <button
                onClick={() => setLocationModal(true)}
                className="flex items-center gap-1 bg-mandi-surface/90 border border-mandi-border px-2 sm:px-2.5 py-1 rounded-xl text-xs hover:border-mandi-green transition-all min-w-0 max-w-[130px] sm:max-w-[180px] active:scale-95"
                aria-label="Select Delivery Location"
              >
                <MapPin size={11} className="text-mandi-green flex-shrink-0" />
                <span className="text-mandi-text font-medium text-[11px] sm:text-xs truncate">
                  {location ? location.area.split(',')[0] : t('nav.setLocation')}
                </span>
                <ChevronDown size={10} className="text-mandi-subtle flex-shrink-0" />
              </button>
            </div>

            {/* Right Controls: Language, Theme, and on Tablet (sm+) Cart & Profile */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <LanguageSwitcher />

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                className="p-1.5 sm:p-2 rounded-xl border border-mandi-border bg-mandi-surface hover:border-mandi-green text-mandi-green transition-all active:scale-90"
                aria-label="Toggle Theme"
              >
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
              </button>

              {/* Cart Button — visible on Tablet (sm:flex), on Phone it's in BottomNav */}
              <button
                onClick={() => setIsOpen(true)}
                className="hidden sm:flex relative p-2 bg-mandi-green rounded-xl hover:bg-mandi-green-light active:scale-95 transition-all duration-200 btn-ripple glow-green-sm"
                aria-label="Shopping Cart"
              >
                <ShoppingCart size={17} className="text-black" />
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-mandi-dark text-mandi-green text-[10px] font-bold rounded-full flex items-center justify-center border border-mandi-green">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </button>

              {/* User Profile — visible on Tablet (sm:flex), on Phone it's in BottomNav */}
              <div className="hidden sm:block relative">
                {loading ? (
                  <div className="w-8 h-8 rounded-xl bg-mandi-surface border border-mandi-border animate-pulse" />
                ) : user ? (
                  <>
                    <button
                      onClick={() => setTabletUserMenuOpen(!tabletUserMenuOpen)}
                      className="flex items-center gap-1.5 bg-mandi-surface border border-mandi-border px-2.5 py-1.5 rounded-xl hover:border-mandi-green transition-all"
                      aria-label="User Account"
                    >
                      <div className="w-5 h-5 bg-mandi-green rounded-full flex items-center justify-center text-[10px] font-bold text-black ring-1 ring-mandi-green ring-opacity-30">
                        {(user.name || user.displayName || user.email || 'U')[0].toUpperCase()}
                      </div>
                      <span className="text-mandi-text text-xs font-medium max-w-[70px] truncate">
                        {(user.name || user.displayName || user.email || 'User').split(' ')[0]}
                      </span>
                      <ChevronDown size={11} className={`text-mandi-muted transition-transform duration-200 ${tabletUserMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {tabletUserMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-56 card-glass border border-mandi-border rounded-xl shadow-card-hover z-50 animate-scale-in">
                        {userDropdownMenu(() => setTabletUserMenuOpen(false))}
                      </div>
                    )}
                  </>
                ) : (
                  <button onClick={() => openAuthModal('login')} className="btn-primary py-1.5 px-3 text-xs font-semibold">
                    {t('nav.login')}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Full-Width Spacious Search Bar for Mobile & Tablet */}
          <div ref={mobileSearchContainerRef} className="px-3.5 sm:px-5 pb-2.5 sm:pb-3 pt-0.5 relative">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <Search size={16} className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-mandi-subtle pointer-events-none" />
                <input
                  ref={mobileSearchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    if (!isSearchFocused) setIsSearchFocused(true);
                  }}
                  onFocus={() => setIsSearchFocused(true)}
                  onKeyDown={e => {
                    if (e.key === 'Escape') setIsSearchFocused(false);
                  }}
                  placeholder="Search milk, veggies, atta, snacks, kirana..."
                  className="input-field pl-10 sm:pl-11 pr-9 py-2 sm:py-2.5 text-sm w-full rounded-full !border-mandi-border bg-mandi-surface hover:bg-mandi-card hover:border-mandi-border-light focus:border-mandi-green transition-all shadow-sm"
                  autoComplete="off"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-3.5 sm:right-4 top-1/2 -translate-y-1/2 text-mandi-subtle hover:text-mandi-text p-0.5 rounded-full hover:bg-mandi-border transition-colors"
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </form>

            {/* Live Search Dropdown for Mobile & Tablet */}
            <LiveSearchDropdown
              query={debouncedSearch}
              isOpen={isSearchFocused}
              onClose={() => setIsSearchFocused(false)}
              onSelectQuery={handleSelectQuery}
            />
          </div>
        </div>

        {/* ─── DESKTOP SINGLE ROW BAR (>= lg: 1024px+) ─── */}
        <div className="hidden lg:flex items-center gap-3 px-6 py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="relative">
              <div className="w-9 h-9 bg-mandi-green rounded-xl flex items-center justify-center shadow-green glow-green-sm transition-all duration-300 group-hover:shadow-green-lg">
                <Zap size={20} className="text-black drop-shadow" fill="black" />
              </div>
            </div>
            <div className="flex flex-col leading-none">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black text-gradient-green leading-none">Mandi</span>
                <span className="text-xl font-black text-mandi-text leading-none">Minutes</span>
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
            className="flex items-center gap-1.5 bg-mandi-surface border border-mandi-border px-3 py-2 rounded-xl hover:border-mandi-green hover:bg-mandi-card transition-all duration-200 min-w-0 max-w-[200px] group"
          >
            <MapPin size={13} className="text-mandi-green flex-shrink-0 group-hover:drop-shadow-[0_0_6px_rgba(0,200,81,0.8)]" />
            <span className="text-mandi-text text-sm font-medium truncate">{location ? location.area.split(',')[0] : t('nav.setLocation')}</span>
            <ChevronDown size={11} className="text-mandi-subtle flex-shrink-0" />
          </button>

          {/* Live Search (Desktop center: wide and flexible) */}
          <div ref={searchContainerRef} className="relative flex-1 max-w-2xl mx-auto">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mandi-subtle pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    if (!isSearchFocused) setIsSearchFocused(true);
                  }}
                  onFocus={() => setIsSearchFocused(true)}
                  onKeyDown={e => {
                    if (e.key === 'Escape') setIsSearchFocused(false);
                  }}
                  placeholder={t('common.search')}
                  className="input-field pl-10 pr-9 py-2.5 text-sm w-full rounded-full !border-mandi-border bg-mandi-surface hover:bg-mandi-card hover:border-mandi-border-light focus:border-mandi-green transition-all"
                  autoComplete="off"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-mandi-subtle hover:text-mandi-text p-0.5 rounded-full hover:bg-mandi-border transition-colors"
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </form>

            {/* Instant Live Search Dropdown for Desktop */}
            <LiveSearchDropdown
              query={debouncedSearch}
              isOpen={isSearchFocused}
              onClose={() => setIsSearchFocused(false)}
              onSelectQuery={handleSelectQuery}
            />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher />

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
              aria-label="Shopping Cart"
            >
              <ShoppingCart size={18} className="text-black" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-mandi-dark text-mandi-green text-xs font-bold rounded-full flex items-center justify-center border border-mandi-green animate-scale-in">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </button>

            {/* User Dropdown */}
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
                  <span className="text-mandi-text text-sm font-medium max-w-[90px] truncate">
                    {(user.name || user.displayName || user.email || 'User').split(' ')[0]}
                  </span>
                  <ChevronDown size={12} className={`text-mandi-muted transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 card-glass border border-mandi-border rounded-xl shadow-card-hover z-50 animate-scale-in">
                    {userDropdownMenu(() => setUserMenuOpen(false))}
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
      </div>

      <ReferralModal isOpen={referralModalOpen} onClose={() => setReferralModalOpen(false)} />
    </header>
  );
}
