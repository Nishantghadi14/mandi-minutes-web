import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useData } from '../context/DataContext';
import ProductCard from '../components/common/ProductCard';
import LazyImage from '../components/common/LazyImage';
import { ArrowLeft, Search, Star, ShoppingBag, Zap, MapPin, Package, RefreshCw, WifiOff } from 'lucide-react';

export default function StorePage() {
  const { storeId } = useParams();
  const { stores, products, getProductsByStore, categories, loadingStates, errorStates, retryFetch } = useData();
  const navigate = useNavigate();

  const store = stores.find(s => s.id === storeId);
  const allProducts = useMemo(() => getProductsByStore(storeId), [storeId, products, getProductsByStore]);

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('default');

  const storeCategories = useMemo(() => {
    if (!store) return [];
    return categories.filter(c => store.categories?.includes(c.id));
  }, [categories, store]);

  const filteredProducts = useMemo(() => {
    let p = allProducts;
    if (activeCategory !== 'all') p = p.filter(prod => prod.category === activeCategory);
    if (search.trim()) p = p.filter(prod => prod.name.toLowerCase().includes(search.toLowerCase()) || prod.brand?.toLowerCase().includes(search.toLowerCase()));
    if (sortBy === 'price-asc') p = [...p].sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') p = [...p].sort((a, b) => b.price - a.price);
    if (sortBy === 'discount') p = [...p].sort((a, b) => (b.discount || 0) - (a.discount || 0));
    return p;
  }, [allProducts, activeCategory, search, sortBy]);

  const isLoading = Boolean(loadingStates?.stores || loadingStates?.products);
  const hasError = Boolean(errorStates?.products || errorStates?.stores);

  if (isLoading && !store) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="h-56 bg-mandi-card border border-mandi-border rounded-3xl w-full" />
        <div className="h-24 bg-mandi-card border border-mandi-border rounded-2xl w-full" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card p-4 h-48 space-y-3">
              <div className="h-24 bg-mandi-surface rounded-xl w-full" />
              <div className="h-4 bg-mandi-surface rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <Package size={48} className="text-mandi-subtle mx-auto mb-4" />
        <h2 className="text-mandi-text font-bold text-2xl mb-2">Store not found</h2>
        <p className="text-mandi-muted text-sm mb-6">The requested store might have been removed or is pending approval.</p>
        <div className="flex justify-center gap-3">
          <button onClick={() => retryFetch?.('stores')} className="btn-outline flex items-center gap-1.5">
            <RefreshCw size={14} /> Retry Sync
          </button>
          <button onClick={() => navigate('/')} className="btn-primary">Browse All Stores</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-24 md:pb-6">
      <Helmet>
        <title>{store ? `${store.name} — Virar Kirana Delivery | Mandi Minutes` : 'Store | Mandi Minutes'}</title>
        <meta name="description" content={store?.description || `Order fresh groceries, rice, daal, and essentials directly from ${store?.name || 'local kirana store'} in Virar.`} />
        <meta property="og:title" content={`${store?.name || 'Local Store'} | Mandi Minutes`} />
        <meta property="og:description" content={store?.description || 'Hyperlocal grocery delivery in Virar.'} />
        <meta property="og:image" content={store?.image || '/favicon.svg'} />
        <meta property="og:type" content="business.business" />
      </Helmet>

      {/* Network Alert */}
      {hasError && (
        <div className="mx-4 mt-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between text-red-600 dark:text-red-200 text-xs">
          <div className="flex items-center gap-2">
            <WifiOff size={16} className="text-red-500 dark:text-red-400" />
            <span>Connection dropped. Showing cached catalog products.</span>
          </div>
          <button onClick={() => retryFetch?.('products')} className="btn-primary text-xs py-1 px-2.5 bg-red-600 text-white">Retry</button>
        </div>
      )}

      {/* Store Header */}
      <div className="relative h-44 sm:h-56 md:h-72 overflow-hidden bg-mandi-surface">
        <LazyImage src={store.coverImage} alt={`${store.name} cover`} className="w-full h-full object-cover" containerClass="w-full h-full" width={1200} quality={70} />
        <div className="absolute inset-0 bg-gradient-to-t from-mandi-dark via-mandi-dark/30 to-transparent pointer-events-none" />
        <button onClick={() => navigate(-1)} className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 w-9 h-9 bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full flex items-center justify-center transition-all z-20 shadow-md text-white active:scale-90">
          <ArrowLeft size={18} className="text-white" />
        </button>
      </div>

      <div className="px-3.5 sm:px-4">
        {/* Store info card */}
        <div className="card -mt-8 sm:-mt-10 relative z-10 p-4 sm:p-5 mb-4 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            {/* Store's Picture Avatar */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-mandi-card bg-mandi-surface shadow-md flex-shrink-0 -mt-8 sm:-mt-12">
              <LazyImage
                src={store.image}
                alt={store.name}
                className="w-full h-full object-cover"
                containerClass="w-full h-full"
                fallbackText="Image not available"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-mandi-text font-black text-lg sm:text-xl">{store.name}</h1>
                {store.status === 'suspended' ? (
                  <span className="text-[11px] bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-bold uppercase">Suspended</span>
                ) : (store.isOpen === false || store.status === 'closed') && (
                  <span className="badge-muted text-[11px] bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full font-bold">Currently Closed</span>
                )}
              </div>
              <p className="text-mandi-muted text-xs flex items-center gap-1 mb-2">
                <MapPin size={12} className="text-mandi-green flex-shrink-0" />
                <span className="truncate">{store.address}, {store.city}</span>
              </p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
                {store.totalRatings > 0 && store.rating > 0 ? (
                  <span className="badge-green flex items-center gap-1 font-semibold">
                    <Star size={11} fill="currentColor" /> {Number(store.rating).toFixed(1)} ({store.totalRatings}+ reviews)
                  </span>
                ) : (
                  <span className="bg-mandi-surface text-mandi-muted px-2.5 py-0.5 rounded-full border border-mandi-border flex items-center gap-1.5 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-mandi-green animate-pulse" />
                    <span className="text-mandi-text font-semibold">New Store</span>
                    <span>• No ratings yet</span>
                  </span>
                )}
                <span className="badge-green flex items-center gap-1 font-semibold">
                  <Zap size={11} /> {store.deliveryTime || '15-20 min'}
                </span>
                <span className="bg-mandi-surface text-mandi-muted px-2.5 py-0.5 rounded-full border border-mandi-border">
                  Min ₹{store.minOrder || 99}
                </span>
                <span className="bg-mandi-surface text-mandi-muted px-2.5 py-0.5 rounded-full border border-mandi-border">
                  {store.deliveryCharge === 0 ? 'Free Delivery' : `₹${store.deliveryCharge} Delivery`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Suspended Notice Banner */}
        {store.status === 'suspended' && (
          <div className="card p-6 mb-6 border-red-500/30 bg-red-500/10 text-center space-y-2">
            <span className="text-3xl">🚫</span>
            <h3 className="text-red-600 dark:text-red-200 font-bold text-lg">Store Suspended</h3>
            <p className="text-red-600/80 dark:text-red-300/80 text-xs max-w-md mx-auto">
              This store is currently suspended by Mandi Minutes administration. All products from this store are hidden until reactivated.
            </p>
          </div>
        )}

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mandi-subtle" />
            <input
              type="text"
              placeholder={`Search in ${store.name}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-9 py-2 text-sm w-full"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="input-field py-2 text-sm cursor-pointer"
            >
              <option value="default">Sort by: Default</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="discount">Highest Discount</option>
            </select>
          </div>
        </div>

        {/* Categories Bar */}
        {storeCategories.length > 0 && (
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all active:scale-95 flex-shrink-0 ${activeCategory === 'all' ? 'bg-mandi-green text-black shadow-sm' : 'bg-mandi-card border border-mandi-border text-mandi-muted hover:text-mandi-text'}`}
            >
              All Items ({allProducts.length})
            </button>
            {storeCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 active:scale-95 flex-shrink-0 ${activeCategory === cat.id ? 'bg-mandi-green text-black shadow-sm' : 'bg-mandi-card border border-mandi-border text-mandi-muted hover:text-mandi-text'}`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="card p-8 sm:p-12 text-center">
            <ShoppingBag size={40} className="text-mandi-subtle mx-auto mb-3" />
            <h3 className="text-mandi-text font-bold text-base mb-1">No products found</h3>
            <p className="text-mandi-muted text-xs mb-4">Try adjusting your filters or search keywords</p>
            {search && <button onClick={() => setSearch('')} className="btn-primary text-xs py-1.5 px-4">Clear Search</button>}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
            {filteredProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
