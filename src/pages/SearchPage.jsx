import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useData } from '../context/DataContext';
import ProductCard from '../components/common/ProductCard';
import StoreCard from '../components/common/StoreCard';
import { searchProducts, searchStores, useDebounce } from '../utils/searchProducts';
import { Search, SlidersHorizontal, Package, Store as StoreIcon, X, ArrowRight, ChevronDown, Check } from 'lucide-react';

export default function SearchPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, stores, categories } = useData();

  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || 'all';

  const [query, setQuery] = useState(initialQuery);
  const [selectedCat, setSelectedCat] = useState(initialCategory);
  const [selectedStore, setSelectedStore] = useState('all');
  const [maxPrice, setMaxPrice] = useState(1000);
  const initialTab = searchParams.get('tab') === 'stores' ? 'stores' : 'products';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const debouncedQuery = useDebounce(query, 150);

  // Sync state when URL parameters change from outside
  useEffect(() => {
    const urlQ = searchParams.get('q') || '';
    if (urlQ !== query) {
      setQuery(urlQ);
    }
    const urlTab = searchParams.get('tab');
    if (urlTab === 'stores' && activeTab !== 'stores') {
      setActiveTab('stores');
    } else if (urlTab === 'products' && activeTab !== 'products') {
      setActiveTab('products');
    }
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
      if (activeTab === 'stores') nextParams.tab = 'stores';
      setSearchParams(nextParams, { replace: true });
    }
  }, [debouncedQuery, selectedCat, activeTab]);

  const filteredProducts = useMemo(() => {
    return searchProducts(products, {
      query: debouncedQuery,
      category: selectedCat,
      storeId: selectedStore,
      maxPrice: maxPrice,
      stores: stores,
    });
  }, [products, debouncedQuery, selectedCat, selectedStore, maxPrice, stores]);

  const filteredStores = useMemo(() => {
    return searchStores(stores, {
      query: debouncedQuery,
      category: selectedCat,
    });
  }, [stores, debouncedQuery, selectedCat]);

  const handleClear = () => {
    setQuery('');
    setSearchParams(selectedCat !== 'all' ? { category: selectedCat } : {}, { replace: true });
  };

  const hasActiveFilters = selectedCat !== 'all' || selectedStore !== 'all' || maxPrice < 1000;

  const resetFilters = () => {
    setSelectedCat('all');
    setSelectedStore('all');
    setMaxPrice(1000);
  };

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-4 py-4 sm:py-6 pb-24 md:pb-6">
      <Helmet>
        <title>{debouncedQuery ? `Search: "${debouncedQuery}" | Mandi Minutes` : 'Search Groceries & Stores | Mandi Minutes'}</title>
        <meta name="description" content="Search local groceries, staples, snacks, and Kirana stores across Virar, Maharashtra on Mandi Minutes." />
        <meta property="og:title" content="Search Mandi Minutes Virar" />
        <meta property="og:description" content="Search and order groceries from neighborhood shops in Virar." />
      </Helmet>

      {/* Active Search Query Header (Navbar provides the primary search bar) */}
      {query && (
        <div className="flex items-center justify-between mb-4 bg-mandi-surface/80 border border-mandi-border rounded-2xl px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm min-w-0">
            <Search size={15} className="text-mandi-green flex-shrink-0" />
            <span className="text-mandi-muted text-xs sm:text-sm">{t('search.resultsFor', 'Results for')}:</span>
            <span className="text-mandi-text font-bold text-xs sm:text-sm truncate">"{query}"</span>
          </div>
          <button
            onClick={handleClear}
            className="text-xs text-mandi-muted hover:text-red-400 flex items-center gap-1 font-semibold ml-2 flex-shrink-0 transition-colors active:scale-95"
          >
            <X size={14} /> Clear
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex justify-center border-b border-mandi-border mb-4 sm:mb-6">
        <div className="flex gap-6 sm:gap-8">
          <button 
            onClick={() => {
              setActiveTab('products');
              const next = new URLSearchParams(searchParams);
              next.delete('tab');
              setSearchParams(next, { replace: true });
            }} 
            className={`pb-2.5 sm:pb-3 font-semibold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 border-b-2 transition-all ${
              activeTab === 'products' ? 'border-mandi-green text-mandi-green' : 'border-transparent text-mandi-muted'
            }`}
          >
            <Package size={16} />
            <span>{t('search.products')}</span>
            <span className="text-[11px] bg-mandi-surface px-1.5 py-0.2 rounded-full border border-mandi-border">
              {filteredProducts.length}
            </span>
          </button>
          <button 
            onClick={() => {
              setActiveTab('stores');
              const next = new URLSearchParams(searchParams);
              next.set('tab', 'stores');
              setSearchParams(next, { replace: true });
            }} 
            className={`pb-2.5 sm:pb-3 font-semibold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 border-b-2 transition-all ${
              activeTab === 'stores' ? 'border-mandi-green text-mandi-green' : 'border-transparent text-mandi-muted'
            }`}
          >
            <StoreIcon size={16} />
            <span>{t('search.stores')}</span>
            <span className="text-[11px] bg-mandi-surface px-1.5 py-0.2 rounded-full border border-mandi-border">
              {filteredStores.length}
            </span>
          </button>
        </div>
      </div>

      {/* ─── MOBILE QUICK CATEGORY HORIZONTAL STRIP (< lg) ─── */}
      <div className="lg:hidden mb-4 space-y-2.5">
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
          <button
            onClick={() => setSelectedCat('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 flex-shrink-0 ${
              selectedCat === 'all'
                ? 'bg-mandi-green text-black shadow-sm'
                : 'bg-mandi-surface border border-mandi-border text-mandi-muted hover:text-mandi-text'
            }`}
          >
            <span>{t('search.allCategories')}</span>
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCat(c.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 flex-shrink-0 ${
                selectedCat === c.id
                  ? 'bg-mandi-green text-black shadow-sm'
                  : 'bg-mandi-surface border border-mandi-border text-mandi-muted hover:text-mandi-text'
              }`}
            >
              <span>{c.icon}</span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>

        {/* Mobile Filter Toggle Button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="flex items-center gap-1.5 bg-mandi-surface border border-mandi-border px-3 py-1.5 rounded-xl text-xs font-semibold hover:border-mandi-green transition-colors active:scale-95 text-mandi-text"
          >
            <SlidersHorizontal size={13} className="text-mandi-green" />
            <span>{t('search.filters')}</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-mandi-green" />
            )}
            <ChevronDown size={13} className={`text-mandi-subtle transition-transform duration-200 ${showMobileFilters ? 'rotate-180' : ''}`} />
          </button>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-mandi-green hover:underline font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Mobile Filter Collapsible Sheet */}
        {showMobileFilters && (
          <div className="card p-4 space-y-3.5 animate-slide-in-up bg-mandi-card border border-mandi-border rounded-2xl shadow-lg">
            {activeTab === 'products' && (
              <div>
                <label className="block text-mandi-muted text-xs font-medium mb-1.5">{t('search.store')}</label>
                <select
                  value={selectedStore}
                  onChange={e => setSelectedStore(e.target.value)}
                  className="input-field text-xs py-2 w-full"
                >
                  <option value="all">{t('search.allStores')}</option>
                  {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}

            {activeTab === 'products' && (
              <div>
                <div className="flex justify-between text-xs text-mandi-muted mb-1.5">
                  <span>{t('search.maxPrice')}</span>
                  <span className="text-mandi-green font-bold">₹{maxPrice}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="1000"
                  step="10"
                  value={maxPrice}
                  onChange={e => setMaxPrice(Number(e.target.value))}
                  className="w-full cursor-pointer"
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Desktop Filters sidebar */}
        <div className="hidden lg:block lg:col-span-1 space-y-4">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-mandi-text font-bold flex items-center gap-2 text-sm">
                <SlidersHorizontal size={16} className="text-mandi-green" />
                {t('search.filters')}
              </h3>
              {hasActiveFilters && (
                <button onClick={resetFilters} className="text-xs text-mandi-green hover:underline">
                  Reset
                </button>
              )}
            </div>

            {/* Category filter */}
            <div className="mb-4">
              <label className="block text-mandi-muted text-xs font-medium mb-2">{t('search.category')}</label>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                <button
                  onClick={() => setSelectedCat('all')}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                    selectedCat === 'all' ? 'bg-mandi-green text-black font-semibold' : 'text-mandi-muted hover:bg-mandi-surface'
                  }`}
                >
                  <span>{t('search.allCategories')}</span>
                  {selectedCat === 'all' && <Check size={12} />}
                </button>
                {categories.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCat(c.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                      selectedCat === c.id ? 'bg-mandi-green text-black font-semibold' : 'text-mandi-muted hover:bg-mandi-surface'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>{c.icon}</span>
                      <span>{c.name}</span>
                    </span>
                    {selectedCat === c.id && <Check size={12} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Store filter */}
            {activeTab === 'products' && (
              <div className="mb-4">
                <label className="block text-mandi-muted text-xs font-medium mb-2">{t('search.store')}</label>
                <select value={selectedStore} onChange={e => setSelectedStore(e.target.value)} className="input-field text-xs py-2 w-full">
                  <option value="all">{t('search.allStores')}</option>
                  {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}

            {/* Max price filter */}
            {activeTab === 'products' && (
              <div>
                <div className="flex justify-between text-xs text-mandi-muted mb-1">
                  <span>{t('search.maxPrice')}</span>
                  <span className="text-mandi-green font-bold">₹{maxPrice}</span>
                </div>
                <input type="range" min="20" max="1000" step="10" value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} className="w-full cursor-pointer" />
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-3">
          {/* Cross-tab discovery callout */}
          {activeTab === 'products' && debouncedQuery && filteredStores.length > 0 && (
            <div className="mb-4 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-between">
              <span className="text-xs text-orange-600 dark:text-orange-300">
                Found <strong>{filteredStores.length} store(s)</strong> matching "{debouncedQuery}"
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('stores')}
                className="text-xs font-bold text-orange-500 hover:text-orange-400 flex items-center gap-1"
              >
                <span>View Stores</span>
                <ArrowRight size={12} />
              </button>
            </div>
          )}

          {activeTab === 'stores' && debouncedQuery && filteredProducts.length > 0 && (
            <div className="mb-4 p-3 rounded-xl bg-mandi-green/10 border border-mandi-green/20 flex items-center justify-between">
              <span className="text-xs text-mandi-text">
                Found <strong>{filteredProducts.length} product(s)</strong> matching "{debouncedQuery}"
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('products')}
                className="text-xs font-bold text-mandi-green hover:text-mandi-green-light flex items-center gap-1"
              >
                <span>View Products</span>
                <ArrowRight size={12} />
              </button>
            </div>
          )}

          {activeTab === 'products' ? (
            filteredProducts.length === 0 ? (
              <div className="text-center py-12 sm:py-16 card p-6 sm:p-8">
                <Package size={40} className="text-mandi-subtle mx-auto mb-3" />
                <p className="text-mandi-text font-semibold">{t('search.noProducts')}</p>
                <p className="text-mandi-muted text-xs sm:text-sm mt-1">{t('search.noProductsHint')}</p>
                {filteredStores.length > 0 && (
                  <button
                    onClick={() => setActiveTab('stores')}
                    className="btn-primary text-xs py-2 px-4 mt-4 inline-flex items-center gap-1.5"
                  >
                    <span>Browse matching stores ({filteredStores.length})</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
                {filteredProducts.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            )
          ) : (
            filteredStores.length === 0 ? (
              <div className="text-center py-12 sm:py-16 card p-6 sm:p-8">
                <StoreIcon size={40} className="text-mandi-subtle mx-auto mb-3" />
                <p className="text-mandi-text font-semibold">{t('search.noStores')}</p>
                <p className="text-mandi-muted text-xs sm:text-sm mt-1">{t('search.noStoresHint')}</p>
                {filteredProducts.length > 0 && (
                  <button
                    onClick={() => setActiveTab('products')}
                    className="btn-primary text-xs py-2 px-4 mt-4 inline-flex items-center gap-1.5"
                  >
                    <span>Browse matching products ({filteredProducts.length})</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                {filteredStores.map(s => <StoreCard key={s.id} store={s} />)}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
