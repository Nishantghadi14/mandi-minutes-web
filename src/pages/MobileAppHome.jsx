import { useState, useEffect, useMemo, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useLocation } from '../context/LocationContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/common/ProductCard';
import { 
  MapPin, Search, ChevronDown, Clock, ShieldCheck, Sparkles, 
  ArrowRight, Truck, Zap, User, Percent, Flame, CheckCircle2,
  ChevronRight, BadgePercent, Sparkle, Tag
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
    bgGradient: 'from-emerald-950 via-teal-950 to-slate-950',
    borderColor: 'border-emerald-500/30',
    emoji: '🚚',
  },
  {
    id: 'b2',
    badge: '🏷️ FLAT ₹50 OFF',
    badgeColor: 'bg-amber-400 text-black',
    title: 'Virar Bachat Kirana Days',
    subtitle: 'Use code MANDI50 at checkout on orders above ₹299.',
    tag: 'Up to 25% Off on Dals & Rice',
    bgGradient: 'from-amber-950 via-orange-950 to-stone-950',
    borderColor: 'border-amber-500/30',
    emoji: '💰',
  },
  {
    id: 'b3',
    badge: '✨ MANDI DIRECT',
    badgeColor: 'bg-sky-400 text-black',
    title: 'Direct Wholesale Rates',
    subtitle: 'Cleaned, graded staples without retail middleman inflation.',
    tag: 'Trusted by 2,500+ Virar Families',
    bgGradient: 'from-indigo-950 via-sky-950 to-slate-950',
    borderColor: 'border-sky-500/30',
    emoji: '🌾',
  },
];

const QUICK_CATEGORIES = [
  { id: 'cat-rice', name: 'Rice & Basmati', icon: '🍚', discount: 'Up to 20% Off', bg: 'from-amber-500/15 to-orange-500/10', border: 'border-amber-500/20' },
  { id: 'cat-daal', name: 'Dals & Pulses', icon: '🥣', discount: 'Direct Mill', bg: 'from-emerald-500/15 to-teal-500/10', border: 'border-emerald-500/20' },
  { id: 'cat-grains', name: 'Grains & Chana', icon: '🥜', discount: 'Poha & Peanuts', bg: 'from-yellow-500/15 to-amber-500/10', border: 'border-yellow-500/20' },
  { id: 'cat-3', name: 'Atta & Flours', icon: '🌾', discount: 'Freshly Ground', bg: 'from-stone-500/15 to-neutral-500/10', border: 'border-stone-500/20' },
  { id: 'cat-2', name: 'Dairy & Eggs', icon: '🥛', discount: 'Morning Fresh', bg: 'from-blue-500/15 to-sky-500/10', border: 'border-blue-500/20' },
  { id: 'cat-4', name: 'Snacks & Namkeen', icon: '🍪', discount: 'Tea Time', bg: 'from-red-500/15 to-rose-500/10', border: 'border-red-500/20' },
  { id: 'cat-5', name: 'Spices & Masalas', icon: '🌶️', discount: 'Pure & Fresh', bg: 'from-purple-500/15 to-fuchsia-500/10', border: 'border-purple-500/20' },
  { id: 'cat-6', name: 'Cleaning & Home', icon: '🧼', discount: 'Daily Care', bg: 'from-teal-500/15 to-cyan-500/10', border: 'border-teal-500/20' },
];

export default function MobileAppHome() {
  const { t } = useTranslation();
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
        {/* Top Row: Next-Day Delivery Badge + Location + Profile Avatar */}
        <div className="flex items-center justify-between gap-2.5 mb-2.5">
          {/* Location button */}
          <button
            onClick={() => setLocationModal(true)}
            className="flex items-center gap-2 flex-1 min-w-0 text-left active:scale-[0.98] transition-transform"
            aria-label="Select delivery address"
          >
            <div className="w-8 h-8 rounded-full bg-mandi-green/15 flex items-center justify-center flex-shrink-0 border border-mandi-green/30 shadow-clay-badge">
              <MapPin size={16} className="text-mandi-green" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[11px] font-black text-mandi-green uppercase tracking-wider">
                <Truck size={12} />
                <span>Next Day 7:00 AM</span>
                <ChevronDown size={11} className="text-mandi-green/80" />
              </div>
              <p className="text-xs font-bold text-mandi-text truncate leading-tight">
                {location ? location.area.split(',')[0] : 'Virar West, Mumbai'}
              </p>
            </div>
          </button>


          {/* Profile Button */}
          <button
            onClick={() => (user ? navigate(getNavPath('/profile')) : openAuthModal('login'))}
            className="w-8 h-8 rounded-full bg-mandi-surface border border-mandi-border flex items-center justify-center text-mandi-text flex-shrink-0 active:scale-90 transition-transform shadow-clay-pill"
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

        {/* Live Search Bar Capsule with Rotating Placeholder */}
        <div 
          onClick={() => navigate(getNavPath('/search'))}
          className="relative flex items-center bg-mandi-surface border border-mandi-border hover:border-mandi-green/50 rounded-2xl h-12 px-3.5 cursor-pointer shadow-clay-inset active:scale-[0.99] transition-all group"
        >
          <Search size={18} className="text-mandi-green flex-shrink-0 mr-2.5 group-hover:scale-105 transition-transform" />
          <div className="flex-1 overflow-hidden h-6 relative flex items-center">
            <span key={placeholderIdx} className="text-sm text-mandi-muted font-medium truncate block transition-all duration-300">
              {SEARCH_PLACEHOLDERS[placeholderIdx]}
            </span>
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
                className={`snap-center flex-shrink-0 w-full rounded-3xl bg-gradient-to-r ${banner.bgGradient} border ${banner.borderColor} p-4 relative overflow-hidden shadow-clay-card`}
              >
                <div className="relative z-10 pr-12">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-1.5 shadow-clay-badge ${banner.badgeColor}`}>
                    {banner.badge}
                  </span>
                  <h2 className="text-sm font-black text-mandi-text leading-tight">
                    {banner.title}
                  </h2>
                  <p className="text-[11px] text-mandi-muted mt-1 line-clamp-1 font-medium">
                    {banner.subtitle}
                  </p>
                  <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-bold text-mandi-green">
                    <CheckCircle2 size={12} />
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

          <div className="grid grid-cols-4 gap-2">
            {QUICK_CATEGORIES.map(cat => {
              const isSelected = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(isSelected ? 'all' : cat.id)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition-all duration-200 active:scale-95 shadow-clay-card ${
                    isSelected 
                      ? 'bg-mandi-green/20 border-mandi-green ring-2 ring-mandi-green/50' 
                      : 'bg-mandi-card border-mandi-border hover:border-mandi-border-light'
                  }`}
                >
                  <div className="text-2xl mb-1 filter drop-shadow-sm">{cat.icon}</div>
                  <span className="text-[10px] font-bold text-mandi-text leading-tight line-clamp-1 w-full">
                    {cat.name.split(' ')[0]}
                  </span>
                  <span className="text-[8px] font-semibold text-mandi-green mt-0.5 line-clamp-1 w-full opacity-90">
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
                <div className="flex items-center justify-between mb-2.5 px-0.5">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded tracking-wider uppercase animate-pulse">
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
                <div className="flex items-center justify-between mb-2.5 px-0.5">
                  <div>
                    <h3 className="text-sm font-black text-mandi-text flex items-center gap-1.5">
                      <span>🍚</span> Rice, Kolam & Basmati
                    </h3>
                    <p className="text-[11px] text-mandi-muted">Silky, Kolam, Wada & fragrant long grains</p>
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
                <div className="flex items-center justify-between mb-2.5 px-0.5">
                  <div>
                    <h3 className="text-sm font-black text-mandi-text flex items-center gap-1.5">
                      <span>🥣</span> Daily Cooking Dals
                    </h3>
                    <p className="text-[11px] text-mandi-muted">Grade-A cleaned Toor, Moong, Masoor & Chana</p>
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
                <div className="flex items-center justify-between mb-2.5 px-0.5">
                  <div>
                    <h3 className="text-sm font-black text-mandi-text flex items-center gap-1.5">
                      <span>🥜</span> Poha, Peanuts & Grains
                    </h3>
                    <p className="text-[11px] text-mandi-muted">Thick Poha, Shing Dana, Vatana & Kala Chana</p>
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
        <section className="pt-3 pb-2">
          <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-mandi-card border border-mandi-border">
            <div className="text-center space-y-1">
              <div className="w-8 h-8 mx-auto rounded-full bg-mandi-green/10 flex items-center justify-center text-mandi-green">
                <Clock size={16} />
              </div>
              <p className="text-[10px] font-black text-mandi-text leading-tight">7 AM Morning</p>
              <p className="text-[9px] text-mandi-muted leading-tight">Prompt next-day drop</p>
            </div>

            <div className="text-center space-y-1 border-x border-mandi-border">
              <div className="w-8 h-8 mx-auto rounded-full bg-mandi-green/10 flex items-center justify-center text-mandi-green">
                <BadgePercent size={16} />
              </div>
              <p className="text-[10px] font-black text-mandi-text leading-tight">Mandi Pricing</p>
              <p className="text-[9px] text-mandi-muted leading-tight">Wholesale rates</p>
            </div>

            <div className="text-center space-y-1">
              <div className="w-8 h-8 mx-auto rounded-full bg-mandi-green/10 flex items-center justify-center text-mandi-green">
                <ShieldCheck size={16} />
              </div>
              <p className="text-[10px] font-black text-mandi-text leading-tight">100% Quality</p>
              <p className="text-[9px] text-mandi-muted leading-tight">Packed with care</p>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
