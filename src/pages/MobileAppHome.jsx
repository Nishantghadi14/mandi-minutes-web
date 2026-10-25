import { useState, useEffect, useMemo, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from '../context/LocationContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/common/Toast';
import ProductCard from '../components/common/ProductCard';
import {
  MapPin, Search, ChevronDown, Clock, ShieldCheck, Sparkles,
  Truck, User, Flame, CheckCircle2,
  ChevronRight, BadgePercent, Tag, ArrowUpDown,
  Copy, Check, Zap, Moon, Sun
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const SEARCH_PLACEHOLDERS = [
  'Search "Kolam Rice"...',
  'Search "Toore Daal"...',
  'Search "Shing Dana"...',
  'Search "Thick Poha"...',
  'Search "Basmati Rice"...',
  'Search "Kala Chana"...',
  'Search "Safed Vatana"...',
];

const PROMO_BANNERS = [
  {
    id: 'b1',
    badge: '🌅 TOMORROW 7:00 AM',
    badgeColor: 'bg-emerald-400 text-black',
    title: 'Order Tonight, Fresh Tomorrow',
    subtitle: 'Daily staples delivered to your doorstep between 7 AM – 11 AM.',
    tag: 'FREE Delivery on ₹199+',
    code: 'FREESHIP',
    bgDark: 'from-emerald-950/90 via-teal-900/70 to-slate-900/90',
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
    tag: 'Tap to copy code MANDI50',
    code: 'MANDI50',
    bgDark: 'from-amber-950/90 via-orange-900/70 to-stone-900/90',
    bgLight: 'from-amber-100 via-orange-50 to-yellow-100/70',
    borderDark: 'border-amber-500/30',
    borderLight: 'border-amber-300/80',
    emoji: '💰',
  },
  {
    id: 'b3',
    badge: '⚡ UNDER ₹99 CORNER',
    badgeColor: 'bg-rose-400 text-black',
    title: 'Daily Pocket-Friendly Staples',
    subtitle: 'Poha, Peanuts, Kolam Rice & Dals starting at just ₹48.',
    tag: 'Lowest verified rates in Virar',
    code: null,
    bgDark: 'from-rose-950/90 via-pink-900/70 to-stone-900/90',
    bgLight: 'from-rose-100 via-pink-50 to-orange-100/70',
    borderDark: 'border-rose-500/30',
    borderLight: 'border-rose-300/80',
    emoji: '🛍️',
  },
  {
    id: 'b4',
    badge: '✨ MANDI DIRECT',
    badgeColor: 'bg-sky-400 text-black',
    title: 'Wholesale Mandi Rates',
    subtitle: 'Cleaned, graded staples directly from APMC yards.',
    tag: 'Trusted by 2,500+ Virar Families',
    code: null,
    bgDark: 'from-indigo-950/90 via-sky-900/70 to-slate-900/90',
    bgLight: 'from-sky-100 via-blue-50 to-indigo-100/70',
    borderDark: 'border-sky-500/30',
    borderLight: 'border-sky-300/80',
    emoji: '🌾',
  },
];

const QUICK_CATEGORIES = [
  { id: 'cat-rice', name: 'Rice & Basmati', icon: '🍚', bgDark: 'linear-gradient(145deg, rgba(245, 158, 11, 0.18), rgba(245, 158, 11, 0.05))', bgLight: 'linear-gradient(145deg, #FFF8ED, #FFEDD5)', discount: 'Up to 20% Off' },
  { id: 'cat-daal', name: 'Dals & Pulses', icon: '🥣', bgDark: 'linear-gradient(145deg, rgba(16, 185, 129, 0.18), rgba(16, 185, 129, 0.05))', bgLight: 'linear-gradient(145deg, #F0FDF4, #DCFCE7)', discount: 'Direct Mill' },
  { id: 'cat-grains', name: 'Grains & Chana', icon: '🥜', bgDark: 'linear-gradient(145deg, rgba(168, 85, 247, 0.18), rgba(168, 85, 247, 0.05))', bgLight: 'linear-gradient(145deg, #FAF5FF, #F3E8FF)', discount: 'Poha & Peanuts' },
  { id: 'cat-3', name: 'Atta & Flours', icon: '🌾', bgDark: 'linear-gradient(145deg, rgba(249, 115, 22, 0.18), rgba(249, 115, 22, 0.05))', bgLight: 'linear-gradient(145deg, #FFF7ED, #FFEDD5)', discount: 'Freshly Ground' },
  { id: 'cat-2', name: 'Dairy & Eggs', icon: '🥛', bgDark: 'linear-gradient(145deg, rgba(59, 130, 246, 0.18), rgba(59, 130, 246, 0.05))', bgLight: 'linear-gradient(145deg, #EFF6FF, #DBEAFE)', discount: 'Morning Fresh' },
  { id: 'cat-4', name: 'Snacks & Namkeen', icon: '🍪', bgDark: 'linear-gradient(145deg, rgba(234, 179, 8, 0.18), rgba(234, 179, 8, 0.05))', bgLight: 'linear-gradient(145deg, #FEFCE8, #FEF08A)', discount: 'Tea Time' },
  { id: 'cat-5', name: 'Spices & Masalas', icon: '🌶️', bgDark: 'linear-gradient(145deg, rgba(236, 72, 153, 0.18), rgba(236, 72, 153, 0.05))', bgLight: 'linear-gradient(145deg, #FDF2F8, #FCE7F3)', discount: 'Pure & Fragrant' },
  { id: 'cat-6', name: 'Cleaning & Home', icon: '🧼', bgDark: 'linear-gradient(145deg, rgba(6, 182, 212, 0.18), rgba(6, 182, 212, 0.05))', bgLight: 'linear-gradient(145deg, #ECFEFF, #CFFAFE)', discount: 'Daily Care' },
];

export default function MobileAppHome() {
  const { isDark, toggleTheme } = useTheme();
  const { location, setLocationModal } = useLocation();
  const { user, openAuthModal } = useAuth();
  const { products: allProducts } = useData();
  const { total } = useCart();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'steal', 'under99', 'rice', 'daal', 'grains'
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [copiedCode, setCopiedCode] = useState(null);
  const [sortBy, setSortBy] = useState('recommended'); // 'recommended', 'price-low', 'discount'
  const bannerScrollRef = useRef(null);

  // Rotating search bar placeholder
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

  // Under ₹99 Budget Corner
  const under99Items = useMemo(() => {
    return availableProducts.filter(p => p.price <= 100).slice(0, 8);
  }, [availableProducts]);

  // Rice aisle
  const riceItems = useMemo(() => {
    return availableProducts.filter(p => p.category === 'cat-rice').slice(0, 8);
  }, [availableProducts]);

  // Dals aisle
  const dalItems = useMemo(() => {
    return availableProducts.filter(p => p.category === 'cat-daal').slice(0, 8);
  }, [availableProducts]);

  // Grains & Dry items aisle
  const grainItems = useMemo(() => {
    return availableProducts.filter(p => p.category === 'cat-grains' || p.category === 'cat-3').slice(0, 8);
  }, [availableProducts]);

  // Filtered and sorted products for the main catalog feed
  const sortedCatalogProducts = useMemo(() => {
    let list = [...availableProducts];
    if (activeCategory !== 'all') {
      list = list.filter(p => p.category === activeCategory);
    }
    if (sortBy === 'price-low') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'discount') {
      list.sort((a, b) => (b.discount || 0) - (a.discount || 0));
    }
    return list;
  }, [availableProducts, activeCategory, sortBy]);

  const handleBannerScroll = (e) => {
    const width = e.target.offsetWidth;
    const scrollLeft = e.target.scrollLeft;
    const newIdx = Math.round(scrollLeft / width);
    if (newIdx !== activeBannerIdx) {
      setActiveBannerIdx(newIdx);
    }
  };

  const handleCopyCode = (code) => {
    if (!code) return;
    try {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      addToast(`Coupon code ${code} copied!`, 'success');
      setTimeout(() => setCopiedCode(null), 3000);
    } catch {
      addToast(`Use code: ${code}`, 'info');
    }
  };

  // Free delivery threshold computation
  const freeDeliveryThreshold = 199;
  const freeDeliveryRemaining = Math.max(0, freeDeliveryThreshold - total);
  const freeDeliveryProgress = Math.min(100, Math.round((total / freeDeliveryThreshold) * 100));

  return (
    <div className="w-full min-h-screen bg-mandi-dark text-mandi-text select-none pb-32">
      <Helmet>
        <title>Mandi Minutes — Grocery & Kirana Shopping App</title>
        <meta name="description" content="Shop groceries, staples, rice, dals, and essentials with guaranteed Next Day Morning Delivery." />
      </Helmet>

      {/* App Canvas Wrapper */}
      <div className="max-w-md mx-auto min-h-screen bg-mandi-dark relative">

        {/* ── Native Shopping App Header ── */}
        <header className="sticky top-0 z-30 bg-mandi-dark/95 backdrop-blur-md border-b border-mandi-border px-3.5 pt-2.5 pb-2.5 shadow-clay-nav rounded-b-3xl">

          {/* Top Row: Brand & Delivery Promise Badge + Controls */}
          <div className="flex items-center justify-between gap-2 mb-2">
            {/* Express Delivery Badge */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-emerald-500 via-mandi-green to-teal-400 flex items-center justify-center text-black font-black text-xs shadow-clay-btn animate-pulse">
                ⚡
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black tracking-tight text-mandi-text">
                    MANDI MINUTES
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-clay-badge flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    10-15m
                  </span>
                </div>
              </div>
            </div>

            {/* Right Action Icons: Theme Toggle & Profile Avatar */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleTheme}
                className="w-8 h-8 rounded-full bg-mandi-surface border border-mandi-border flex items-center justify-center text-mandi-green flex-shrink-0 active:scale-90 transition-all shadow-clay-pill hover:border-mandi-green/50"
                aria-label="Toggle Dark / Light Mode"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
              </button>

              {/* Profile Avatar */}
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
                  <User size={14} className="text-mandi-muted" />
                )}
              </button>
            </div>
          </div>

          {/* Location Selector Pill */}
          <div className="mb-2">
            <button
              onClick={() => setLocationModal(true)}
              className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-2xl bg-mandi-surface border border-mandi-border hover:border-mandi-green/40 active:scale-[0.99] transition-all shadow-clay-pill text-left"
              aria-label="Select delivery address"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="w-6 h-6 rounded-full bg-mandi-green/15 flex items-center justify-center flex-shrink-0 border border-mandi-green/30 text-mandi-green shadow-clay-badge">
                  <MapPin size={12} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-mandi-text truncate leading-tight">
                    {location ? location.area.split(',')[0] : 'Virar East (Manvelpada)'}
                  </p>
                  <p className="text-[10px] text-mandi-muted font-medium truncate leading-tight">
                    {location ? (location.area.split(',').slice(1).join(', ') || 'Delivering to your doorstep') : 'Tap to change delivery location'}
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

          {/* Interactive Free Delivery Progress Meter (Zepto / Blinkit Signature UX) */}
          <div className="mb-2.5 px-1">
            <div className="flex items-center justify-between text-[10px] font-bold mb-1">
              {total >= freeDeliveryThreshold ? (
                <span className="text-emerald-400 font-black flex items-center gap-1">
                  <CheckCircle2 size={11} className="fill-emerald-400 text-black" />
                  FREE Delivery unlocked on this order!
                </span>
              ) : (
                <span className="text-mandi-muted flex items-center gap-1">
                  <Truck size={11} className="text-mandi-green" />
                  {total === 0 ? (
                    <span>FREE Delivery on orders above ₹199</span>
                  ) : (
                    <span>Add <strong className="text-mandi-green">₹{freeDeliveryRemaining}</strong> for <strong className="text-white">FREE Delivery</strong></span>
                  )}
                </span>
              )}
              <span className="text-[9px] font-black text-mandi-green uppercase tracking-wide">
                ₹{total}/₹{freeDeliveryThreshold}
              </span>
            </div>
            <div className="w-full h-1.5 bg-mandi-surface rounded-full overflow-hidden border border-mandi-border/60">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-mandi-green to-teal-400 transition-all duration-500 rounded-full"
                style={{ width: `${Math.max(8, freeDeliveryProgress)}%` }}
              />
            </div>
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

          {/* Horizontal Quick Aisle Pill Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2 no-scrollbar scrollbar-none -mx-1 px-1">
            <button
              onClick={() => { setActiveCategory('all'); setActiveFilter('all'); }}
              className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1 flex-shrink-0 active:scale-95 ${activeCategory === 'all' && activeFilter === 'all'
                  ? 'bg-mandi-green text-black shadow-md shadow-mandi-green/20 font-black'
                  : 'bg-mandi-surface border border-mandi-border text-mandi-muted hover:text-mandi-text'
                }`}
            >
              <span>⚡ All</span>
            </button>
            <button
              onClick={() => { setActiveFilter('steal'); setActiveCategory('all'); }}
              className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1 flex-shrink-0 active:scale-95 ${activeFilter === 'steal'
                  ? 'bg-red-500 text-white shadow-md font-black'
                  : 'bg-mandi-surface border border-mandi-border text-mandi-muted hover:text-mandi-text'
                }`}
            >
              <span>🔥 Steal Deals</span>
            </button>
            <button
              onClick={() => { setActiveFilter('under99'); setActiveCategory('all'); }}
              className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1 flex-shrink-0 active:scale-95 ${activeFilter === 'under99'
                  ? 'bg-amber-400 text-black shadow-md font-black'
                  : 'bg-mandi-surface border border-mandi-border text-mandi-muted hover:text-mandi-text'
                }`}
            >
              <span>💸 Under ₹99</span>
            </button>
            {QUICK_CATEGORIES.map(cat => {
              const isSelected = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategory(isSelected ? 'all' : cat.id); setActiveFilter(isSelected ? 'all' : cat.id); }}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1 flex-shrink-0 active:scale-95 ${isSelected
                      ? 'bg-mandi-green text-black shadow-md shadow-mandi-green/20 font-black'
                      : 'bg-mandi-surface border border-mandi-border text-mandi-muted hover:text-mandi-text'
                    }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

        </header>

        {/* ── Main Shopping Feed ── */}
        <main className="px-3.5 pt-3 space-y-5">

          {/* ── Interactive Promo Hero Banners ── */}
          <section className="relative">
            <div
              ref={bannerScrollRef}
              onScroll={handleBannerScroll}
              className="flex gap-2.5 overflow-x-auto snap-x snap-mandatory scrollbar-none no-scrollbar -mx-3.5 px-3.5"
            >
              {PROMO_BANNERS.map((banner) => (
                <div
                  key={banner.id}
                  onClick={() => banner.code && handleCopyCode(banner.code)}
                  className={`snap-center flex-shrink-0 w-full rounded-3xl bg-gradient-to-r ${isDark ? banner.bgDark : banner.bgLight} border ${isDark ? banner.borderDark : banner.borderLight} p-4 relative overflow-hidden shadow-clay-card cursor-pointer transition-transform active:scale-[0.99]`}
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

                    <div className="mt-2.5 flex items-center gap-2">
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 size={13} />
                        <span>{banner.tag}</span>
                      </div>
                      {banner.code && (
                        <span className="text-[10px] font-black uppercase bg-black text-white px-2 py-0.5 rounded-md flex items-center gap-1 border border-white/20">
                          {copiedCode === banner.code ? <Check size={11} className="text-emerald-400" /> : <Copy size={10} />}
                          <span>{copiedCode === banner.code ? 'COPIED' : banner.code}</span>
                        </span>
                      )}
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
                  className={`h-1.5 rounded-full transition-all duration-300 ${activeBannerIdx === i ? 'w-5 bg-mandi-green shadow-clay-badge' : 'w-1.5 bg-mandi-border'
                    }`}
                />
              ))}
            </div>
          </section>

          {/* ── Category Grid (8 Top Aisles) ── */}
          <section>
            <div className="flex items-center justify-between mb-2 px-0.5">
              <h3 className="text-xs font-black text-mandi-text uppercase tracking-wider flex items-center gap-1.5">
                <span>⚡</span> Shop by Category
              </h3>
              {activeCategory !== 'all' && (
                <button
                  onClick={() => setActiveCategory('all')}
                  className="text-[11px] font-bold text-mandi-green hover:underline"
                >
                  Show All Aisles
                </button>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2">
              {QUICK_CATEGORIES.map(cat => {
                const isSelected = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(isSelected ? 'all' : cat.id)}
                    className={`category-card flex flex-col items-center justify-between p-2 rounded-2xl text-center transition-all duration-200 active:scale-95 border ${isSelected
                        ? 'ring-2 ring-mandi-green border-mandi-green shadow-clay-card-hover'
                        : 'border-mandi-border/40 hover:border-mandi-green/30'
                      }`}
                    style={{ background: isDark ? cat.bgDark : cat.bgLight }}
                  >
                    <div className="category-icon-bubble">
                      <span className="text-2xl select-none filter drop-shadow-sm">{cat.icon}</span>
                    </div>
                    <span className="text-[11px] font-extrabold text-mandi-text leading-tight line-clamp-1 w-full mt-1">
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

          {/* ── Focused Category View (When a single category is tapped) ── */}
          {activeCategory !== 'all' && (
            <section className="animate-fade-in pt-1">
              <div className="flex items-center justify-between mb-3 px-0.5">
                <div>
                  <h3 className="text-sm font-black text-mandi-text flex items-center gap-1.5">
                    <span>{QUICK_CATEGORIES.find(c => c.id === activeCategory)?.icon}</span>
                    <span>{QUICK_CATEGORIES.find(c => c.id === activeCategory)?.name}</span>
                  </h3>
                  <p className="text-[11px] text-mandi-muted">
                    {sortedCatalogProducts.length} items available for same-day & scheduled delivery
                  </p>
                </div>
                <button
                  onClick={() => setActiveCategory('all')}
                  className="text-xs font-bold text-mandi-green bg-mandi-green/10 border border-mandi-green/20 px-2.5 py-1 rounded-lg"
                >
                  View All
                </button>
              </div>

              {/* Sort selector for focused category */}
              <div className="flex items-center gap-1.5 mb-3 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setSortBy('recommended')}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-xl transition-all ${sortBy === 'recommended' ? 'bg-mandi-green text-black font-black' : 'bg-mandi-surface text-mandi-muted border border-mandi-border'
                    }`}
                >
                  Recommended
                </button>
                <button
                  onClick={() => setSortBy('price-low')}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-xl transition-all ${sortBy === 'price-low' ? 'bg-mandi-green text-black font-black' : 'bg-mandi-surface text-mandi-muted border border-mandi-border'
                    }`}
                >
                  Price: Low to High
                </button>
                <button
                  onClick={() => setSortBy('discount')}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-xl transition-all ${sortBy === 'discount' ? 'bg-mandi-green text-black font-black' : 'bg-mandi-surface text-mandi-muted border border-mandi-border'
                    }`}
                >
                  Top Discounts
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {sortedCatalogProducts.map(p => (
                  <ProductCard key={p.id} product={p} priority />
                ))}
              </div>
            </section>
          )}

          {/* ── Multi-Shelf Shopping Feed (Real Quick Commerce Shopping App Experience) ── */}
          {activeCategory === 'all' && (
            <>
              {/* ── Shelf 1: 🔥 Steal Deals (Flash Offers — Horizontal Carousel) ── */}
              {stealDeals.length > 0 && (
                <section className="pt-1">
                  <div className="flex items-center justify-between mb-2 px-0.5">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full tracking-wider uppercase shadow-clay-badge flex items-center gap-1">
                          <Flame size={10} className="fill-white" />
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

                  {/* Horizontal Scroll Shelf */}
                  <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-3.5 px-3.5 no-scrollbar scrollbar-none snap-x snap-mandatory">
                    {stealDeals.map(product => (
                      <ProductCard key={product.id} product={product} compact priority />
                    ))}
                  </div>
                </section>
              )}

              {/* ── Shelf 2: 💸 Under ₹99 Budget Corner (Horizontal Carousel) ── */}
              {under99Items.length > 0 && (
                <section className="pt-2">
                  <div className="flex items-center justify-between mb-2 px-0.5">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[9px] font-black px-2 py-0.5 rounded-full tracking-wider uppercase shadow-clay-badge flex items-center gap-1">
                          <Tag size={10} />
                          UNDER ₹99
                        </span>
                        <h3 className="text-sm font-black text-mandi-text">Budget Kirana Store</h3>
                      </div>
                      <p className="text-[11px] text-mandi-muted mt-0.5">Pocket-friendly daily kitchen essentials</p>
                    </div>
                    <Link
                      to={getNavPath('/search?maxPrice=100')}
                      className="text-xs font-bold text-mandi-green flex items-center hover:underline"
                    >
                      All <ChevronRight size={13} />
                    </Link>
                  </div>

                  {/* Horizontal Scroll Shelf */}
                  <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-3.5 px-3.5 no-scrollbar scrollbar-none snap-x snap-mandatory">
                    {under99Items.map(product => (
                      <ProductCard key={product.id} product={product} compact priority />
                    ))}
                  </div>
                </section>
              )}

              {/* ── Shelf 3: 🍚 Rice & Basmati Aisle (Horizontal Carousel) ── */}
              {riceItems.length > 0 && (
                <section className="pt-2">
                  <div className="flex items-center justify-between mb-2 px-0.5">
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

                  <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-3.5 px-3.5 no-scrollbar scrollbar-none snap-x snap-mandatory">
                    {riceItems.map(product => (
                      <ProductCard key={product.id} product={product} compact priority />
                    ))}
                  </div>
                </section>
              )}

              {/* ── Shelf 4: 🥣 Direct-Mill Dals & Protein Pulses (Horizontal Carousel) ── */}
              {dalItems.length > 0 && (
                <section className="pt-2">
                  <div className="flex items-center justify-between mb-2 px-0.5">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-[9px] font-black px-2 py-0.5 rounded-full tracking-wider uppercase shadow-clay-badge">
                          PULSES
                        </span>
                        <h3 className="text-sm font-black text-mandi-text">Daily Cooking Dals</h3>
                      </div>
                      <p className="text-[11px] text-mandi-muted mt-0.5">Cleaned Toor, Moong, Masoor, Urad & Chana</p>
                    </div>
                    <Link
                      to={getNavPath('/search?category=cat-daal')}
                      className="text-xs font-bold text-mandi-green flex items-center hover:underline"
                    >
                      All <ChevronRight size={13} />
                    </Link>
                  </div>

                  <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-3.5 px-3.5 no-scrollbar scrollbar-none snap-x snap-mandatory">
                    {dalItems.map(product => (
                      <ProductCard key={product.id} product={product} compact priority />
                    ))}
                  </div>
                </section>
              )}

              {/* ── Shelf 5: 🥜 Poha, Peanuts & Evening Snacks (Horizontal Carousel) ── */}
              {grainItems.length > 0 && (
                <section className="pt-2">
                  <div className="flex items-center justify-between mb-2 px-0.5">
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

                  <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-3.5 px-3.5 no-scrollbar scrollbar-none snap-x snap-mandatory">
                    {grainItems.map(product => (
                      <ProductCard key={product.id} product={product} compact priority />
                    ))}
                  </div>
                </section>
              )}

              {/* ── Explore All Staples (Organized 2-Column Grid) ── */}
              <section className="pt-3">
                <div className="flex items-center justify-between mb-2.5 px-0.5">
                  <div>
                    <h3 className="text-sm font-black text-mandi-text flex items-center gap-1.5">
                      <span>🛍️</span> Explore All Staples
                    </h3>
                    <p className="text-[11px] text-mandi-muted mt-0.5">Full wholesale catalog for Virar homes</p>
                  </div>

                  {/* Sort selector */}
                  <div className="flex items-center gap-1 bg-mandi-surface border border-mandi-border px-2 py-1 rounded-xl text-[10px] font-bold text-mandi-muted">
                    <ArrowUpDown size={11} className="text-mandi-green" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-transparent text-mandi-text font-bold outline-none cursor-pointer"
                    >
                      <option value="recommended" className="bg-mandi-card text-mandi-text">Recommended</option>
                      <option value="price-low" className="bg-mandi-card text-mandi-text">Price: Low to High</option>
                      <option value="discount" className="bg-mandi-card text-mandi-text">Top Discounts</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {sortedCatalogProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            </>
          )}

          {/* ── Trust & Delivery Strip ── */}
          <section className="pt-3 pb-2">
            <div className="grid grid-cols-3 gap-2 p-3.5 rounded-3xl bg-mandi-card border border-mandi-border shadow-clay-card">
              <div className="text-center space-y-1.5">
                <div className="w-9 h-9 mx-auto rounded-2xl bg-mandi-green/15 border border-mandi-green/30 flex items-center justify-center text-mandi-green shadow-clay-badge">
                  <Zap size={17} />
                </div>
                <p className="text-[11px] font-black text-mandi-text leading-tight">Same-Day Drop</p>
                <p className="text-[9px] text-mandi-muted leading-tight">Today or scheduled</p>
              </div>

              <div className="text-center space-y-1.5 border-x border-mandi-border px-1">
                <div className="w-9 h-9 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-clay-badge">
                  <BadgePercent size={17} />
                </div>
                <p className="text-[11px] font-black text-mandi-text leading-tight">Mandi Pricing</p>
                <p className="text-[9px] text-mandi-muted leading-tight">Wholesale rates</p>
              </div>

              <div className="text-center space-y-1.5">
                <div className="w-9 h-9 mx-auto rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-500 shadow-clay-badge">
                  <ShieldCheck size={17} />
                </div>
                <p className="text-[11px] font-black text-mandi-text leading-tight">100% Quality</p>
                <p className="text-[9px] text-mandi-muted leading-tight">Packed with care</p>
              </div>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}
