import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useData } from '../context/DataContext';
import ProductCard from '../components/common/ProductCard';
import { searchProducts, useDebounce } from '../utils/searchProducts';
import { 
  Search, ArrowLeft, X, Flame, Sparkles, Package, ChevronRight, 
  Tag, Clock, Truck, TrendingUp 
} from 'lucide-react';

const TRENDING_KEYWORDS = [
  { term: 'Kolam Rice', emoji: '🍚', tag: 'Popular' },
  { term: 'Toor Dal', emoji: '🥣', tag: 'Staple' },
  { term: 'Shing Dana', emoji: '🥜', tag: 'Snack' },
  { term: 'Basmati Rice', emoji: '🌾', tag: 'Premium' },
  { term: 'Thick Poha', emoji: '🥣', tag: 'Breakfast' },
  { term: 'Sabudana', emoji: '✨', tag: 'Fast' },
  { term: 'Chana Dal', emoji: '🥣', tag: 'Protein' },
  { term: 'Masoor Daal', emoji: '🍲', tag: 'Daily' },
  { term: 'Safed Vatana', emoji: '🥗', tag: 'Ragda' },
  { term: 'Moong Dal', emoji: '🥣', tag: 'Healthy' },
];

const SEARCH_CATEGORIES = [
  { id: 'cat-rice', name: 'Rice & Basmati', icon: '🍚', color: 'from-amber-500/20 to-orange-500/10', border: 'border-amber-500/20' },
  { id: 'cat-daal', name: 'Dals & Pulses', icon: '🥣', color: 'from-emerald-500/20 to-teal-500/10', border: 'border-emerald-500/20' },
  { id: 'cat-grains', name: 'Grains & Poha', icon: '🥜', color: 'from-yellow-500/20 to-amber-500/10', border: 'border-yellow-500/20' },
  { id: 'cat-3', name: 'Atta & Flours', icon: '🌾', color: 'from-stone-500/20 to-neutral-500/10', border: 'border-stone-500/20' },
  { id: 'cat-2', name: 'Dairy & Eggs', icon: '🥛', color: 'from-blue-500/20 to-sky-500/10', border: 'border-blue-500/20' },
  { id: 'cat-4', name: 'Snacks & Munchies', icon: '🍪', color: 'from-red-500/20 to-rose-500/10', border: 'border-red-500/20' },
  { id: 'cat-5', name: 'Spices & Masala', icon: '🌶️', color: 'from-purple-500/20 to-fuchsia-500/10', border: 'border-purple-500/20' },
  { id: 'cat-6', name: 'Home & Cleaning', icon: '🧼', color: 'from-teal-500/20 to-cyan-500/10', border: 'border-teal-500/20' },
];

export default function SearchPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, stores } = useData();
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || 'all';

  const [query, setQuery] = useState(initialQuery);
  const [selectedCat, setSelectedCat] = useState(initialCategory);

  const debouncedQuery = useDebounce(query, 150);

  // Auto-focus the search bar
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Sync state when URL parameters change from outside
  useEffect(() => {
    const urlQ = searchParams.get('q') || '';
    if (urlQ !== query) setQuery(urlQ);
    const urlCat = searchParams.get('category') || 'all';
    if (urlCat !== selectedCat) setSelectedCat(urlCat);
  }, [searchParams]);

  // Sync debouncedQuery and selectedCat to URL without history spam
  useEffect(() => {
    const currentQ = searchParams.get('q') || '';
    const currentCat = searchParams.get('category') || 'all';
    const nextQ = debouncedQuery.trim();
    const nextCat = selectedCat || 'all';

    if (currentQ !== nextQ || currentCat !== nextCat) {
      const nextParams = {};
      if (nextQ) nextParams.q = nextQ;
      if (nextCat !== 'all') nextParams.category = nextCat;
      setSearchParams(nextParams, { replace: true });
    }
  }, [debouncedQuery, selectedCat]);

  const filteredProducts = useMemo(() => {
    return searchProducts(products, {
      query: debouncedQuery,
      category: selectedCat,
      storeId: 'all',
      maxPrice: 2000,
      stores: stores,
    });
  }, [products, debouncedQuery, selectedCat, stores]);

  const handleClear = () => {
    setQuery('');
    setSelectedCat('all');
    setSearchParams({}, { replace: true });
    if (inputRef.current) inputRef.current.focus();
  };

  const handleSelectKeyword = (keyword) => {
    setQuery(keyword);
    setSelectedCat('all');
  };

  const handleSelectCategory = (catId) => {
    setSelectedCat(prev => prev === catId ? 'all' : catId);
  };

  const hasSearchFilter = Boolean(query.trim() || selectedCat !== 'all');

  return (
    <div className="max-w-md w-full mx-auto min-h-screen bg-mandi-dark text-mandi-text select-none pb-28">
      <Helmet>
        <title>{debouncedQuery ? `Search: "${debouncedQuery}" | Mandi Minutes` : 'Search Kirana Groceries | Mandi Minutes'}</title>
        <meta name="description" content="Search local groceries, staples, rice, dals and snacks across Virar on Mandi Minutes." />
      </Helmet>

      {/* ── Native Zepto / Blinkit App Search Header ── */}
      <header className="sticky top-0 z-30 bg-mandi-dark/95 backdrop-blur-md border-b border-mandi-border px-3.5 pt-3 pb-2.5 shadow-md">
        {/* Row 1: Borderless Modern Back Button + Refined Search Bar Capsule */}
        <div className="flex items-center gap-2">
          {/* Circular modern back button */}
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-mandi-surface border border-mandi-border hover:bg-mandi-card active:scale-90 flex items-center justify-center text-mandi-text transition-all flex-shrink-0"
            aria-label="Back"
          >
            <ArrowLeft size={19} />
          </button>

          {/* Search Input Box Capsule (Single border, zero inner borders) */}
          <div className="flex-1 relative flex items-center bg-mandi-surface border border-mandi-border focus-within:border-mandi-green focus-within:ring-2 focus-within:ring-mandi-green/20 focus-within:shadow-[0_4px_16px_rgba(0,200,81,0.12)] rounded-2xl h-12 px-3.5 transition-all">
            <Search size={18} className="text-mandi-green mr-2.5 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search rice, atta, dal, oil, snacks..."
              className="search-input-bare input-bare w-full bg-transparent text-sm text-mandi-text placeholder-mandi-subtle font-medium outline-none border-0 shadow-none ring-0 focus:ring-0 focus:outline-none focus:border-0"
              style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
              autoComplete="off"
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="w-6 h-6 rounded-full bg-mandi-card hover:bg-mandi-border active:scale-90 flex items-center justify-center text-mandi-muted hover:text-mandi-text transition-all ml-1.5 flex-shrink-0"
                aria-label="Clear input"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-2.5 no-scrollbar scrollbar-none -mx-3.5 px-3.5">
          <button
            onClick={() => setSelectedCat('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 flex-shrink-0 active:scale-95 ${
              selectedCat === 'all'
                ? 'bg-mandi-green text-black shadow-md shadow-mandi-green/25 ring-1 ring-mandi-green'
                : 'bg-mandi-surface border border-mandi-border text-mandi-muted hover:border-mandi-green/30 hover:text-mandi-text'
            }`}
          >
            <span>⚡ All Staples</span>
          </button>
          {SEARCH_CATEGORIES.map((c) => {
            const isSelected = selectedCat === c.id;
            return (
              <button
                key={c.id}
                onClick={() => handleSelectCategory(c.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 flex-shrink-0 active:scale-95 ${
                  isSelected
                    ? 'bg-mandi-green text-black shadow-md shadow-mandi-green/25 ring-1 ring-mandi-green'
                    : 'bg-mandi-surface border border-mandi-border text-mandi-muted hover:border-mandi-green/30 hover:text-mandi-text'
                }`}
              >
                <span>{c.icon}</span>
                <span>{c.name}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* ── Search Main Body ── */}
      <main className="px-3.5 pt-3.5 space-y-5">
        {/* 1. When NO query is entered and NO category is selected: Show Trending & Aisles */}
        {!hasSearchFilter && (
          <div className="space-y-5 pt-0.5">
            {/* Trending Searches in Virar */}
            <section>
              <div className="flex items-center justify-between mb-2.5 px-0.5">
                <div className="flex items-center gap-1.5 text-xs font-black text-mandi-text uppercase tracking-wider">
                  <Flame size={15} className="text-amber-400 fill-amber-400" />
                  <span>Trending Searches</span>
                </div>
                <span className="text-[10px] font-bold text-mandi-green bg-mandi-green/10 px-2 py-0.5 rounded-full border border-mandi-green/20">
                  Virar Direct
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {TRENDING_KEYWORDS.map((item) => (
                  <button
                    key={item.term}
                    onClick={() => handleSelectKeyword(item.term)}
                    className="px-3.5 py-2 rounded-xl bg-mandi-surface border border-mandi-border hover:border-mandi-green/40 hover:bg-mandi-card text-xs font-semibold text-mandi-text flex items-center gap-2 active:scale-95 transition-all shadow-sm"
                  >
                    <span className="text-sm">{item.emoji}</span>
                    <span>{item.term}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Popular Aisles Grid */}
            <section>
              <div className="flex items-center gap-1.5 text-xs font-black text-mandi-text uppercase tracking-wider mb-2.5 px-0.5">
                <Sparkles size={14} className="text-mandi-green" />
                <span>Shop by Grocery Aisle</span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {SEARCH_CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCategory(c.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl bg-gradient-to-b ${c.color} ${c.border} border hover:border-mandi-green/30 text-center active:scale-95 transition-all shadow-sm group`}
                  >
                    <span className="text-2xl mb-1.5 transform group-hover:scale-110 transition-transform filter drop-shadow-sm">{c.icon}</span>
                    <span className="text-[11px] font-bold text-mandi-text line-clamp-1 w-full leading-tight">
                      {c.name.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* Next-Day Delivery Guarantee Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-mandi-card via-mandi-surface to-mandi-card border border-mandi-green/30 flex items-center gap-3.5 shadow-md">
              <div className="w-11 h-11 rounded-2xl bg-mandi-green/15 border border-mandi-green/30 flex items-center justify-center text-mandi-green flex-shrink-0">
                <Truck size={22} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-mandi-text">Next-Day 7 AM Drop</p>
                  <span className="text-[10px] font-bold text-mandi-green bg-mandi-green/15 px-2 py-0.5 rounded-full border border-mandi-green/20">FREE on ₹199+</span>
                </div>
                <p className="text-[11px] text-mandi-muted mt-0.5">
                  Order staples tonight, delivered fresh to your doorstep tomorrow morning.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. When search query is entered OR category is active: Show Product Results */}
        {hasSearchFilter && (
          <div>
            {/* Results Header Status */}
            <div className="flex items-center justify-between mb-3 px-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs text-mandi-muted">Results:</span>
                <span className="text-xs font-black text-mandi-text bg-mandi-surface px-2.5 py-0.5 rounded-full border border-mandi-border">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
                </span>
                {query && (
                  <span className="text-xs text-mandi-green font-bold truncate max-w-[140px]">
                    "{query}"
                  </span>
                )}
              </div>
              <button
                onClick={handleClear}
                className="text-xs font-bold text-mandi-green hover:brightness-110 flex items-center gap-1 active:scale-95 transition-all"
              >
                <span>Clear</span>
                <X size={13} />
              </button>
            </div>

            {/* Results Grid */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-2.5">
                {filteredProducts.map((p) => (
                  <ProductCard key={p.id} product={p} showStore={false} />
                ))}
              </div>
            ) : (
              /* Enhanced Empty State */
              <div className="p-8 text-center bg-mandi-card border border-mandi-border rounded-3xl mt-4 space-y-4 shadow-xl">
                <div className="w-14 h-14 rounded-full bg-mandi-green/10 border border-mandi-green/20 flex items-center justify-center text-mandi-green mx-auto">
                  <Search size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-mandi-text">No groceries found for "{query}"</h3>
                  <p className="text-xs text-mandi-muted mt-1 max-w-xs mx-auto">
                    Try searching for popular staples like "Rice", "Daal", "Shing Dana", or "Poha".
                  </p>
                </div>
                <div className="pt-1 flex flex-wrap justify-center gap-2">
                  {['Kolam Rice', 'Toor Dal', 'Poha', 'Sabudana'].map((item) => (
                    <button
                      key={item}
                      onClick={() => handleSelectKeyword(item)}
                      className="px-3 py-1 rounded-full bg-mandi-surface border border-mandi-border text-xs font-medium text-mandi-text hover:border-mandi-green transition-all active:scale-95"
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <div className="pt-2">
                  <button
                    onClick={handleClear}
                    className="px-5 py-2 rounded-xl bg-mandi-green text-black text-xs font-black active:scale-95 transition-all shadow-md shadow-mandi-green/20"
                  >
                    View All Items
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
