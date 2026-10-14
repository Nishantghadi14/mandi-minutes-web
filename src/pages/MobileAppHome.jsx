import { useState, useEffect, useMemo, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useLocation } from '../context/LocationContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import ProductCard from '../components/common/ProductCard';
import { 
  MapPin, Search, ChevronDown, Clock, ShieldCheck, Sparkles, 
  ArrowRight, Truck, Zap, User, Percent, Flame, CheckCircle2,
  ChevronRight, BadgePercent, Sparkle, Tag, Sun, Moon
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const SEARCH_PLACEHOLDERS = [
  'Search "Basmati Rice"...',
  'Search "Toore Daal"...',
  'Search "Shing Dana"...',
  'Search "Kolam Rice"...',
  'Search "Poha & Grains"...',
  'Search "Kala Chana"...',
];

const PROMO_BANNERS = [
  {
    id: 'b1',
    badge: '🌅 TOMORROW 7:00 AM',
    badgeColor: 'bg-emerald-400 text-black',
    title: 'Order Tonight, Fresh Tomorrow',
    subtitle: 'Daily staples delivered to your doorstep between 7 AM – 11 AM.',
    tag: 'FREE Delivery on ₹199+',
    bgDark: 'from-emerald-950/80 via-teal-900/60 to-slate-900/90',
    bgLight: 'from-emerald-100 via-teal-50 to-green-100/70',
    borderDark: 'border-emerald-500/30',
    borderLight: 'border-emerald-300/80',
    emoji: '🚚',
  },
  {
    id: 'b2',
    badge: '🏷️ FLAT ₹50 OFF',
    badgeColor: 'bg-amber-400 text-black',
    title: 'Virar Bachat Kirana Days',
    subtitle: 'Use code MANDI50 at checkout on orders above ₹299.',
    tag: 'Up to 25% Off on Dals & Rice',
    bgDark: 'from-amber-950/80 via-orange-900/60 to-stone-900/90',
    bgLight: 'from-amber-100 via-orange-50 to-yellow-100/70',
    borderDark: 'border-amber-500/30',
    borderLight: 'border-amber-300/80',
    emoji: '💰',
  },
  {
    id: 'b3',
    badge: '✨ MANDI DIRECT',
    badgeColor: 'bg-sky-400 text-black',
    title: 'Direct Wholesale Rates',
    subtitle: 'Cleaned, graded staples without retail middleman inflation.',
    tag: 'Trusted by 2,500+ Virar Families',
    bgDark: 'from-indigo-950/80 via-sky-900/60 to-slate-900/90',
    bgLight: 'from-sky-100 via-blue-50 to-indigo-100/70',
    borderDark: 'border-sky-500/30',
    borderLight: 'border-sky-300/80',
    emoji: '🌾',
  },
];

const QUICK_CATEGORIES = [
  { id: 'cat-rice', name: 'Rice & Basmati', icon: '🍚', bgDark: 'linear-gradient(145deg, rgba(245, 158, 11, 0.16), rgba(245, 158, 11, 0.05))', bgLight: 'linear-gradient(145deg, #FFF8ED, #FFEDD5)', discount: 'Up to 20% Off' },
  { id: 'cat-daal', name: 'Dals & Pulses', icon: '🥣', bgDark: 'linear-gradient(145deg, rgba(16, 185, 129, 0.16), rgba(16, 185, 129, 0.05))', bgLight: 'linear-gradient(145deg, #F0FDF4, #DCFCE7)', discount: 'Direct Mill' },
  { id: 'cat-grains', name: 'Grains & Chana', icon: '🥜', bgDark: 'linear-gradient(145deg, rgba(168, 85, 247, 0.16), rgba(168, 85, 247, 0.05))', bgLight: 'linear-gradient(145deg, #FAF5FF, #F3E8FF)', discount: 'Poha & Peanuts' },
  { id: 'cat-3', name: 'Atta & Flours', icon: '🌾', bgDark: 'linear-gradient(145deg, rgba(249, 115, 22, 0.16), rgba(249, 115, 22, 0.05))', bgLight: 'linear-gradient(145deg, #FFF7ED, #FFEDD5)', discount: 'Freshly Ground' },
  { id: 'cat-2', name: 'Dairy & Eggs', icon: '🥛', bgDark: 'linear-gradient(145deg, rgba(59, 130, 246, 0.16), rgba(59, 130, 246, 0.05))', bgLight: 'linear-gradient(145deg, #EFF6FF, #DBEAFE)', discount: 'Morning Fresh' },
  { id: 'cat-4', name: 'Snacks & Namkeen', icon: '🍪', bgDark: 'linear-gradient(145deg, rgba(234, 179, 8, 0.16), rgba(234, 179, 8, 0.05))', bgLight: 'linear-gradient(145deg, #FEFCE8, #FEF08A)', discount: 'Tea Time' },
  { id: 'cat-5', name: 'Spices & Masalas', icon: '🌶️', bgDark: 'linear-gradient(145deg, rgba(236, 72, 153, 0.16), rgba(236, 72, 153, 0.05))', bgLight: 'linear-gradient(145deg, #FDF2F8, #FCE7F3)', discount: 'Pure & Fresh' },
  { id: 'cat-6', name: 'Cleaning & Home', icon: '🧼', bgDark: 'linear-gradient(145deg, rgba(6, 182, 212, 0.16), rgba(6, 182, 212, 0.05))', bgLight: 'linear-gradient(145deg, #ECFEFF, #CFFAFE)', discount: 'Daily Care' },
];

export default function MobileAppHome() {
  const { t } = useTranslation();
  const { isDark, toggleTheme } = useTheme();
  const { location, setLocationModal } = useLocation();
  const { user, openAuthModal } = useAuth();
  const { products: allProducts } = useData();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState('all');
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const bannerScrollRef = useRef(null);

  // Rotating search bar placeholder (Zepto / Blinkit style)
  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIdx(prev => (prev + 1) % SEARCH_PLACEHOLDERS.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const getNavPath = (path) => {
    if (typeof window !== 'undefined' && window.location.search.includes('mode=app')) {
      return path.includes('?') ? `${path}&mode=app` : `${path}?mode=app`;
    }
    return path;
  };

  // Filter available products
  const availableProducts = useMemo(() => {
    if (!allProducts || allProducts.length === 0) return [];
    return allProducts.filter(p => p.isAvailable !== false);
  }, [allProducts]);

  // Steal Deals (highest discounts)
  const stealDeals = useMemo(() => {
    return [...availableProducts]
      .sort((a, b) => (b.discount || 0) - (a.discount || 0))
      .slice(0, 8);
  }, [availableProducts]);

  // Rice aisle
  const riceItems = useMemo(() => {
    return availableProducts.filter(p => p.category === 'cat-rice').slice(0, 6);
  }, [availableProducts]);

  // Dals aisle
  const dalItems = useMemo(() => {
    return availableProducts.filter(p => p.category === 'cat-daal').slice(0, 6);
  }, [availableProducts]);

  // Grains & Dry items aisle
  const grainItems = useMemo(() => {
    return availableProducts.filter(p => p.category === 'cat-grains' || p.category === 'cat-3').slice(0, 6);
  }, [availableProducts]);

  // Active category filtered items
  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') return availableProducts;
    return availableProducts.filter(p => p.category === activeCategory);
  }, [availableProducts, activeCategory]);

  const handleBannerScroll = (e) => {
    const width = e.target.offsetWidth;
    const scrollLeft = e.target.scrollLeft;
    const newIdx = Math.round(scrollLeft / width);
    if (newIdx !== activeBannerIdx) {
      setActiveBannerIdx(newIdx);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-mandi-dark pb-32 text-mandi-text select-none">
      <Helmet>
        <title>Mandi Minutes — Grocery & Kirana App</title>
        <meta name="description" content="Order fresh grocery staples, rice, dals, and essentials with guaranteed Next Day Morning Delivery." />
      </Helmet>

      {/* ── Native App Header ── */}
      <header className="sticky top-0 z-30 bg-mandi-dark/95 backdrop-blur-md border-b border-mandi-border px-3.5 pt-2.5 pb-2.5 shadow-clay-nav rounded-b-3xl">
        {/* Top Row: Brand identity + Theme Toggle + Profile Avatar */}
        <div className="flex items-center justify-between gap-2.5 mb-2.5">
          {/* Logo & Express delivery badge */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-400 flex items-center justify-center text-black font-black text-xs shadow-clay-btn">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-tight text-mandi-text">
                  MANDI MINUTES
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-mandi-green/20 text-mandi-green border border-mandi-green/40 shadow-clay-badge">
                  10-15m
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Icons: Theme toggle + Profile Avatar */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-full bg-mandi-surface border border-mandi-border flex items-center justify-center text-mandi-text flex-shrink-0 active:scale-90 transition-transform shadow-clay-pill hover:border-mandi-green/50"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun size={15} className="text-amber-400 animate-spin-slow" /> : <Moon size={15} className="text-indigo-600" />}
            </button>

            <button
              onClick={() => (user ? navigate(getNavPath('/profile')) : openAuthModal('login'))}
              className="w-8 h-8 rounded-full bg-mandi-surface border border-mandi-border flex items-center justify-center text-mandi-text flex-shrink-0 active:scale-90 transition-transform shadow-clay-pill hover:border-mandi-green/50"
              aria-label="User Account"
            >
              {user ? (
                <span className="text-xs font-black text-mandi-green">
                  {(user.name || user.displayName || user.email || 'U')[0].toUpperCase()}
                </span>
              ) : (
                <User size={15} className="text-mandi-muted" />
              )}
            </button>
          </div>
        </div>

        {/* Location Selector Row */}
        <div className="mb-2.5">
          <button
            onClick={() => setLocationModal(true)}
            className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-2xl bg-mandi-surface border border-mandi-border hover:border-mandi-green/40 active:scale-[0.99] transition-all shadow-clay-pill text-left"
            aria-label="Select delivery address"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-6 h-6 rounded-full bg-mandi-green/15 flex items-center justify-center flex-shrink-0 border border-mandi-green/30 text-mandi-green shadow-clay-badge">
                <MapPin size={13} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-mandi-text truncate leading-tight">
                  {location ? location.area.split(',')[0] : 'Virar West, Mumbai'}
                </p>
                <p className="text-[10px] text-mandi-muted font-medium truncate leading-tight">
                  {location ? (location.area.split(',').slice(1).join(', ') || 'Delivering to your doorstep') : 'Tap to select delivery location'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0 bg-mandi-green/15 text-mandi-green border border-mandi-green/30 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-clay-badge">
              <Truck size={10} />
              <span>Morning 7 AM</span>
              <ChevronDown size={10} />
            </div>
          </button>
        </div>

        {/* Live Search Bar Capsule with Rotating Placeholder */}
        <div 
          onClick={() => navigate(getNavPath('/search'))}
          className="relative flex items-center bg-mandi-surface border border-mandi-border hover:border-mandi-green/50 rounded-2xl h-11 px-3.5 cursor-pointer shadow-clay-inset active:scale-[0.99] transition-all group"
        >
          <Search size={16} className="text-mandi-green flex-shrink-0 mr-2.5 group-hover:scale-110 transition-transform" />
          <div className="flex-1 overflow-hidden h-6 relative flex items-center">
            <span key={placeholderIdx} className="text-xs text-mandi-muted font-semibold truncate block transition-all duration-300">
              {SEARCH_PLACEHOLDERS[placeholderIdx]}
            </span>
          </div>
          <div className="flex items-center gap-1 bg-mandi-card/80 border border-mandi-border px-2 py-0.5 rounded-full text-[10px] font-bold text-mandi-muted shadow-clay-badge">
            <Sparkles size={11} className="text-amber-400" />
            <span>Fast</span>
          </div>
        </div>
      </header>

      {/* ── Main Feed (Pure Grocery Quick Commerce) ── */}
      <main className="px-3.5 pt-3 space-y-5">

        {/* ── Zepto-style Promotional Swipeable Banners ── */}
        <section className="relative">
          <div 
            ref={bannerScrollRef}
            onScroll={handleBannerScroll}
            className="flex gap-2.5 overflow-x-auto snap-x snap-mandatory scrollbar-none no-scrollbar -mx-3.5 px-3.5"
          >
            {PROMO_BANNERS.map((banner) => (
              <div 
                key={banner.id}
                className={`snap-center flex-shrink-0 w-full rounded-3xl bg-gradient-to-r ${isDark ? banner.bgDark : banner.bgLight} border ${isDark ? banner.borderDark : banner.borderLight} p-4 relative overflow-hidden shadow-clay-card transition-all`}
              >
                <div className="relative z-10 pr-12">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-1.5 shadow-clay-badge ${banner.badgeColor}`}>
                    {banner.badge}
                  </span>
                  <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight drop-shadow-sm">
                    {banner.title}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-emerald-200/90 mt-1 line-clamp-1 font-medium">
                    {banner.subtitle}
                  </p>
                  <div className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 size={13} />
                    <span>{banner.tag}</span>
                  </div>
                </div>
                <div className="absolute right-3 bottom-2 text-4xl select-none opacity-90 animate-float pointer-events-none">
                  {banner.emoji}
                </div>
              </div>
            ))}
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-1.5 mt-2">
            {PROMO_BANNERS.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeBannerIdx === i ? 'w-5 bg-mandi-green shadow-clay-badge' : 'w-1.5 bg-mandi-border'
                }`} 
              />
            ))}
          </div>
        </section>

        {/* ── Category Grid (8 Top Aisles) ── */}
        <section>
          <div className="flex items-center justify-between mb-2.5 px-0.5">
            <h3 className="text-xs font-black text-mandi-text uppercase tracking-wider flex items-center gap-1.5">
              <span>⚡</span> Explore by Category
            </h3>
            {activeCategory !== 'all' && (
              <button 
                onClick={() => setActiveCategory('all')} 
                className="text-[11px] font-bold text-mandi-green hover:underline"
              >
                Clear Filter
              </button>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2.5">
            {QUICK_CATEGORIES.map(cat => {
              const isSelected = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(isSelected ? 'all' : cat.id)}
                  className={`category-card flex flex-col items-center justify-between p-2 rounded-2xl text-center transition-all duration-200 active:scale-95 ${
                    isSelected 
                      ? 'ring-2 ring-mandi-green shadow-clay-card-hover' 
                      : ''
                  }`}
                  style={{ background: isDark ? cat.bgDark : cat.bgLight }}
                >
                  <div className="category-icon-bubble">
                    <span className="text-2xl select-none filter drop-shadow-sm">{cat.icon}</span>
                  </div>
                  <span className="text-[11px] font-extrabold text-mandi-text leading-tight line-clamp-1 w-full mt-1.5">
                    {cat.name.split(' ')[0]}
                  </span>
                  <span className="text-[9px] font-bold text-mandi-green line-clamp-1 w-full bg-mandi-green/10 px-1 py-0.5 rounded-md mt-0.5">
                    {cat.discount}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Category Selected Feed (When a Category is Tapped) ── */}
        {activeCategory !== 'all' && (
          <section className="animate-fade-in pt-1">
            <div className="flex items-center justify-between mb-3 px-0.5">
              <div>
                <h3 className="text-sm font-black text-mandi-text flex items-center gap-1.5">
                  <span>{QUICK_CATEGORIES.find(c => c.id === activeCategory)?.icon}</span>
                  <span>{QUICK_CATEGORIES.find(c => c.id === activeCategory)?.name}</span>
                </h3>
                <p className="text-[11px] text-mandi-muted">
                  {filteredProducts.length} items available for next-day morning delivery
                </p>
              </div>
              <button 
                onClick={() => setActiveCategory('all')} 
                className="text-xs font-bold text-mandi-green bg-mandi-green/10 border border-mandi-green/20 px-2.5 py-1 rounded-lg"
              >
                View All
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {filteredProducts.map(p => (
                <ProductCard key={p.id} product={p} showStore={false} />
              ))}
            </div>
          </section>
        )}

        {/* ── Default Home Feed (When "All" is active) ── */}
        {activeCategory === 'all' && (
          <>
            {/* ── Shelf 1: ⚡ Flash Steal Deals ── */}
            {stealDeals.length > 0 && (
              <section className="pt-1">
                <div className="flex items-center justify-between mb-3 px-0.5">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full tracking-wider uppercase shadow-clay-badge flex items-center gap-1">
                        <Flame size={11} />
                        STEAL DEALS
                      </span>
                      <h3 className="text-sm font-black text-mandi-text">Up to 25% Off</h3>
                    </div>
                    <p className="text-[11px] text-mandi-muted mt-0.5">Lowest guaranteed rates in Virar</p>
                  </div>
                  <Link 
                    to={getNavPath('/search')} 
                    className="text-xs font-bold text-mandi-green flex items-center hover:underline"
                  >
                    See all <ChevronRight size={13} />
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {stealDeals.slice(0, 4).map(product => (
                    <ProductCard key={product.id} product={product} showStore={false} />
                  ))}
                </div>
              </section>
            )}

            {/* ── Shelf 2: 🍚 Rice & Basmati Aisle (Bestsellers) ── */}
            {riceItems.length > 0 && (
              <section className="pt-2">
                <div className="flex items-center justify-between mb-3 px-0.5">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="bg-amber-500/15 text-amber-500 border border-amber-500/30 text-[9px] font-black px-2 py-0.5 rounded-full tracking-wider uppercase shadow-clay-badge">
                        RICE AISLE
                      </span>
                      <h3 className="text-sm font-black text-mandi-text">Rice, Kolam & Basmati</h3>
                    </div>
                    <p className="text-[11px] text-mandi-muted mt-0.5">Silky, Kolam, Wada & fragrant long grains</p>
                  </div>
                  <Link 
                    to={getNavPath('/search?category=cat-rice')} 
                    className="text-xs font-bold text-mandi-green flex items-center hover:underline"
                  >
                    All <ChevronRight size={13} />
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {riceItems.map(product => (
                    <ProductCard key={product.id} product={product} showStore={false} />
                  ))}
                </div>
              </section>
            )}

            {/* ── Shelf 3: 🥣 Dals & Protein Pulses ── */}
            {dalItems.length > 0 && (
              <section className="pt-2">
                <div className="flex items-center justify-between mb-3 px-0.5">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-[9px] font-black px-2 py-0.5 rounded-full tracking-wider uppercase shadow-clay-badge">
                        PULSES
                      </span>
                      <h3 className="text-sm font-black text-mandi-text">Daily Cooking Dals</h3>
                    </div>
                    <p className="text-[11px] text-mandi-muted mt-0.5">Grade-A cleaned Toor, Moong, Masoor & Chana</p>
                  </div>
                  <Link 
                    to={getNavPath('/search?category=cat-daal')} 
                    className="text-xs font-bold text-mandi-green flex items-center hover:underline"
                  >
                    All <ChevronRight size={13} />
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {dalItems.map(product => (
                    <ProductCard key={product.id} product={product} showStore={false} />
                  ))}
                </div>
              </section>
            )}

            {/* ── Shelf 4: 🥜 Grains, Poha, Peanuts & Dry Goods ── */}
            {grainItems.length > 0 && (
              <section className="pt-2">
                <div className="flex items-center justify-between mb-3 px-0.5">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="bg-purple-500/15 text-purple-400 border border-purple-500/30 text-[9px] font-black px-2 py-0.5 rounded-full tracking-wider uppercase shadow-clay-badge">
                        KIRANA STAPLES
                      </span>
                      <h3 className="text-sm font-black text-mandi-text">Poha, Peanuts & Grains</h3>
                    </div>
                    <p className="text-[11px] text-mandi-muted mt-0.5">Thick Poha, Shing Dana, Vatana & Kala Chana</p>
                  </div>
                  <Link 
                    to={getNavPath('/search?category=cat-grains')} 
                    className="text-xs font-bold text-mandi-green flex items-center hover:underline"
                  >
                    All <ChevronRight size={13} />
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {grainItems.map(product => (
                    <ProductCard key={product.id} product={product} showStore={false} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* ── Trust & Delivery Strip ── */}
        <section className="pt-3 pb-4">
          <div className="grid grid-cols-3 gap-2 p-3.5 rounded-3xl bg-mandi-card border border-mandi-border shadow-clay-card">
            <div className="text-center space-y-1.5">
              <div className="w-9 h-9 mx-auto rounded-2xl bg-mandi-green/15 border border-mandi-green/30 flex items-center justify-center text-mandi-green shadow-clay-badge">
                <Clock size={18} />
              </div>
              <p className="text-[11px] font-black text-mandi-text leading-tight">7 AM Morning</p>
              <p className="text-[9px] text-mandi-muted leading-tight">Prompt next-day drop</p>
            </div>

            <div className="text-center space-y-1.5 border-x border-mandi-border px-1">
              <div className="w-9 h-9 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-clay-badge">
                <BadgePercent size={18} />
              </div>
              <p className="text-[11px] font-black text-mandi-text leading-tight">Mandi Pricing</p>
              <p className="text-[9px] text-mandi-muted leading-tight">Wholesale rates</p>
            </div>

            <div className="text-center space-y-1.5">
              <div className="w-9 h-9 mx-auto rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-500 shadow-clay-badge">
                <ShieldCheck size={18} />
              </div>
              <p className="text-[11px] font-black text-mandi-text leading-tight">100% Quality</p>
              <p className="text-[9px] text-mandi-muted leading-tight">Packed with care</p>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
