import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useData } from '../context/DataContext';
import ProductCard from '../components/common/ProductCard';
import StoreCard from '../components/common/StoreCard';
import { searchProducts, searchStores, useDebounce } from '../utils/searchProducts';
import { Search, SlidersHorizontal, Package, Store as StoreIcon, X } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState('products');

  const debouncedQuery = useDebounce(query, 250);

  useEffect(() => {
    setQuery(searchParams.get('q') || '');
    setSelectedCat(searchParams.get('category') || 'all');
  }, [searchParams]);

  const filteredProducts = useMemo(() => {
    return searchProducts(products, {
      query: debouncedQuery,
      category: selectedCat,
      storeId: selectedStore,
      maxPrice: maxPrice,
    });
  }, [products, debouncedQuery, selectedCat, selectedStore, maxPrice]);

  const filteredStores = useMemo(() => {
    return searchStores(stores, {
      query: debouncedQuery,
      category: selectedCat,
    });
  }, [stores, debouncedQuery, selectedCat]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <Helmet>
        <title>{debouncedQuery ? `Search: "${debouncedQuery}" | Mandi Minutes` : 'Search Groceries & Stores | Mandi Minutes'}</title>
        <meta name="description" content="Search local groceries, staples, snacks, and Kirana stores across Virar, Maharashtra on Mandi Minutes." />
        <meta property="og:title" content="Search Mandi Minutes Virar" />
        <meta property="og:description" content="Search and order groceries from neighborhood shops in Virar." />
      </Helmet>

      {/* Search Header */}
      <div className="mb-6">
        <div className="relative max-w-2xl mx-auto">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-mandi-subtle" />
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSearchParams({ q: e.target.value, category: selectedCat }); }}
            placeholder={t('common.search')}
            className="input-field pl-11 pr-10 py-3 text-base w-full shadow-card"
          />
          {query && (
            <button onClick={() => { setQuery(''); setSearchParams({}); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-mandi-subtle hover:text-mandi-text"><X size={16} /></button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center border-b border-mandi-border mb-6">
        <div className="flex gap-8">
          <button onClick={() => setActiveTab('products')} className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${activeTab === 'products' ? 'border-mandi-green text-mandi-green' : 'border-transparent text-mandi-muted'}`}>
            <Package size={16} />{t('search.products')} ({filteredProducts.length})
          </button>
          <button onClick={() => setActiveTab('stores')} className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${activeTab === 'stores' ? 'border-mandi-green text-mandi-green' : 'border-transparent text-mandi-muted'}`}>
            <StoreIcon size={16} />{t('search.stores')} ({filteredStores.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-4">
            <h3 className="text-mandi-text font-bold mb-3 flex items-center gap-2 text-sm"><SlidersHorizontal size={16} className="text-mandi-green" />{t('search.filters')}</h3>

            {/* Category filter */}
            <div className="mb-4">
              <label className="block text-mandi-muted text-xs font-medium mb-2">{t('search.category')}</label>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                <button onClick={() => setSelectedCat('all')} className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${selectedCat === 'all' ? 'bg-mandi-green text-black font-semibold' : 'text-mandi-muted hover:bg-mandi-surface'}`}>
                  {t('search.allCategories')}
                </button>
                {categories.map(c => (
                  <button key={c.id} onClick={() => setSelectedCat(c.id)} className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 ${selectedCat === c.id ? 'bg-mandi-green text-black font-semibold' : 'text-mandi-muted hover:bg-mandi-surface'}`}>
                    <span>{c.icon}</span><span>{c.name}</span>
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
          {activeTab === 'products' ? (
            filteredProducts.length === 0 ? (
              <div className="text-center py-16 card p-8">
                <Package size={40} className="text-mandi-subtle mx-auto mb-3" />
                <p className="text-mandi-text font-semibold">{t('search.noProducts')}</p>
                <p className="text-mandi-muted text-sm mt-1">{t('search.noProductsHint')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredProducts.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            )
          ) : (
            filteredStores.length === 0 ? (
              <div className="text-center py-16 card p-8">
                <StoreIcon size={40} className="text-mandi-subtle mx-auto mb-3" />
                <p className="text-mandi-text font-semibold">{t('search.noStores')}</p>
                <p className="text-mandi-muted text-sm mt-1">{t('search.noStoresHint')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredStores.map(s => <StoreCard key={s.id} store={s} />)}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
