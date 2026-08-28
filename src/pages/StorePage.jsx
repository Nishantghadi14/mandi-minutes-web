import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
      {/* Network Alert */}
      {hasError && (
        <div className="mx-4 mt-4 p-3.5 rounded-xl bg-red-950 bg-opacity-40 border border-red-800 flex items-center justify-between text-red-200 text-xs">
          <div className="flex items-center gap-2">
            <WifiOff size={16} className="text-red-400" />
            <span>Connection dropped. Showing cached catalog products.</span>
          </div>
          <button onClick={() => retryFetch?.('products')} className="btn-primary text-xs py-1 px-2.5 bg-red-600">Retry</button>
        </div>
      )}

      {/* Store Header */}
      <div className="relative h-56 md:h-72 overflow-hidden">
        <LazyImage src={store.coverImage || store.image} alt={store.name} className="w-full h-full object-cover" containerClass="w-full h-full" width={1200} quality={70} />
        <div className="absolute inset-0 bg-gradient-to-t from-mandi-dark via-black via-opacity-30 to-transparent" />
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 w-9 h-9 bg-black bg-opacity-50 rounded-full flex items-center justify-center hover:bg-opacity-70 transition-colors z-20">
          <ArrowLeft size={18} className="text-white" />
        </button>
      </div>

      <div className="px-4">
        {/* Store info card */}
        <div className="card -mt-10 relative z-10 p-5 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-mandi-text font-black text-xl">{store.name}</h1>
                {!store.isOpen && <span className="badge-muted">Closed</span>}
              </div>
              <p className="text-mandi-muted text-xs flex items-center gap-1 mb-2">
                <MapPin size={12} className="text-mandi-green" />
                {store.address}, {store.city}
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="badge-green flex items-center gap-1 font-semibold">
                  <Star size={12} fill="currentColor" /> {store.rating || '4.8'} ({store.totalRatings || 10}+)
                </span>
                <span className="badge-green flex items-center gap-1 font-semibold">
                  <Zap size={12} /> {store.deliveryTime || '15-20 min'}
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
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${activeCategory === 'all' ? 'bg-mandi-green text-black' : 'bg-mandi-card border border-mandi-border text-mandi-muted hover:text-mandi-text'}`}
            >
              All Items ({allProducts.length})
            </button>
            {storeCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${activeCategory === cat.id ? 'bg-mandi-green text-black' : 'bg-mandi-card border border-mandi-border text-mandi-muted hover:text-mandi-text'}`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="card p-12 text-center">
            <ShoppingBag size={40} className="text-mandi-subtle mx-auto mb-3" />
            <h3 className="text-mandi-text font-bold text-base mb-1">No products found</h3>
            <p className="text-mandi-muted text-xs mb-4">Try adjusting your filters or search keywords</p>
            {search && <button onClick={() => setSearch('')} className="btn-primary text-xs py-1.5 px-4">Clear Search</button>}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
