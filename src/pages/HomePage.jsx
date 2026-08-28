import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from '../context/LocationContext';
import { useData } from '../context/DataContext';
import StoreCard from '../components/common/StoreCard';
import { MapPin, Zap, ChevronRight, Star, Package, ArrowRight, Store, RefreshCw, WifiOff, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

function PromoBanner({ banners }) {
  const [idx, setIdx] = useState(0);
  const active = banners.filter(b => b.active);

  useEffect(() => {
    if (active.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % active.length), 4000);
    return () => clearInterval(t);
  }, [active.length]);

  if (!active.length) return null;
  const b = active[idx];

  return (
    <div className="relative overflow-hidden">
      <div className={`bg-gradient-to-r ${b.color || 'from-green-900 to-mandi-dark'} border border-mandi-border rounded-2xl p-6 transition-all duration-500`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-mandi-text font-bold text-xl mb-1">{b.title}</h2>
            <p className="text-mandi-muted text-sm">{b.subtitle}</p>
          </div>
          <div className="text-4xl">🛒</div>
        </div>
      </div>
      {active.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {active.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)} className={`w-2 h-2 rounded-full transition-all ${i === idx ? 'bg-mandi-green w-4' : 'bg-mandi-border'}`} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const { location, setLocationModal } = useLocation();
  const { getStoresByPincode, categories, banners, loadingStates, errorStates, retryFetch } = useData();
  const [stores, setStores] = useState([]);

  useEffect(() => {
    if (location?.pincode) {
      setStores(getStoresByPincode(location.pincode));
    }
  }, [location, getStoresByPincode]);

  const stats = [
    { label: 'Kirana Stores', value: '500+', icon: Store },
    { label: 'Products Listed', value: '10K+', icon: Package },
    { label: 'Orders Delivered', value: '50K+', icon: Zap },
    { label: 'Avg Rating', value: '4.7★', icon: Star },
  ];

  const hasStoreError = Boolean(errorStates?.stores);
  const isStoresLoading = Boolean(loadingStates?.stores);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <Helmet>
        <title>Mandi Minutes — Hyperlocal Kirana Delivery in Virar (10-15 Mins)</title>
        <meta name="description" content="Get fresh groceries, daily staples, Gokul milk, and household essentials from your neighborhood Kirana stores in Virar West & East in 10-15 minutes." />
        <meta property="og:title" content="Mandi Minutes — Hyperlocal Kirana Delivery Virar" />
        <meta property="og:description" content="Virar's local Kirana stores delivered to your doorstep in 10-15 minutes." />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* Network / Connection Error Warning Banner */}
      {hasStoreError && (
        <div className="mb-6 p-4 rounded-2xl bg-red-950 bg-opacity-40 border border-red-800 flex items-center justify-between gap-3 text-red-200">
          <div className="flex items-center gap-3">
            <WifiOff size={20} className="text-red-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold">Network connection issue</p>
              <p className="text-xs text-red-300">Could not sync latest store listings. Showing cached catalog.</p>
            </div>
          </div>
          <button 
            onClick={() => retryFetch?.('stores')} 
            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1 bg-red-600 hover:bg-red-500"
          >
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {/* Hero */}
      <section className="mb-8">
        <div className="bg-gradient-to-br from-mandi-card via-[#0a1f0a] to-mandi-dark border border-mandi-border rounded-3xl p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-mandi-green opacity-5 rounded-full translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-mandi-green opacity-5 rounded-full -translate-x-1/2 translate-y-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="badge-green text-xs flex items-center gap-1"><Zap size={10} />Virar (Palghar Dist) Express Delivery</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-mandi-text mb-3 leading-tight">
              Virar's <span className="text-gradient-green">Local Kirana Stores</span><br />Delivered in 10-15 Mins
            </h1>
            <p className="text-mandi-muted text-base md:text-lg mb-6 max-w-lg">Fresh groceries, Gokul milk, Modak flour, fruits, and daily staples from Kirana shops across Virar West & Virar East.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => setLocationModal(true)} className="flex items-center gap-2 bg-mandi-surface border border-mandi-border px-5 py-3 rounded-xl hover:border-mandi-green transition-colors max-w-xs">
                <MapPin size={18} className="text-mandi-green" />
                <span className="text-mandi-text text-sm font-medium truncate">{location ? `📍 ${location.area}` : 'Set your delivery location'}</span>
              </button>
              <Link to="/search" className="btn-primary flex items-center gap-2 max-w-xs justify-center">
                <span>Shop Now</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Promo Banners */}
      <section className="mb-8">
        <PromoBanner banners={banners} />
      </section>

      {/* Stats */}
      <section className="mb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="card p-4 flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 bg-mandi-green-muted rounded-full flex items-center justify-center"><Icon size={18} className="text-mandi-green" /></div>
                <div className="text-xl font-black text-mandi-green">{stat.value}</div>
                <div className="text-mandi-muted text-xs">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Shop by Category */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">Shop by Category</h2>
          <Link to="/search" className="flex items-center gap-1 text-mandi-green text-sm font-medium hover:underline">View all <ChevronRight size={16} /></Link>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {categories.map(cat => (
            <Link key={cat.id} to={`/search?category=${cat.id}`} className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-mandi-border hover:border-mandi-green transition-all duration-200 group" style={{ background: cat.color }}>
              <span className="text-2xl group-hover:scale-110 transition-transform">{cat.icon}</span>
              <span className="text-mandi-text text-xs font-medium text-center leading-tight">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Stores near you */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">
            {location ? `Stores in ${location.area.split(',')[0]}` : 'Featured Stores'}
          </h2>
          {location && stores.length > 0 && (
            <span className="text-mandi-muted text-sm">{stores.length} store{stores.length !== 1 ? 's' : ''} nearby</span>
          )}
        </div>

        {isStoresLoading && stores.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-4 h-56 space-y-3">
                <div className="h-32 bg-mandi-surface rounded-xl w-full" />
                <div className="h-4 bg-mandi-surface rounded w-3/4" />
                <div className="h-3 bg-mandi-surface rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : !location ? (
          <div className="card p-8 text-center">
            <MapPin size={40} className="text-mandi-subtle mx-auto mb-3" />
            <p className="text-mandi-text font-semibold mb-1">Set your location</p>
            <p className="text-mandi-muted text-sm mb-4">Enter your pincode to see stores near you</p>
            <button onClick={() => setLocationModal(true)} className="btn-primary">Set Location</button>
          </div>
        ) : stores.length === 0 ? (
          <div className="card p-8 text-center">
            <Store size={40} className="text-mandi-subtle mx-auto mb-3" />
            <p className="text-mandi-text font-semibold mb-1">No stores found</p>
            <p className="text-mandi-muted text-sm mb-4">No stores currently serve pincode {location.pincode}</p>
            <button onClick={() => setLocationModal(true)} className="btn-outline">Try Another Pincode</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stores.map(store => <StoreCard key={store.id} store={store} />)}
          </div>
        )}
      </section>

      {/* Why Mandi Minutes */}
      <section className="mb-10">
        <h2 className="section-title">Why Mandi Minutes?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { emoji: '⚡', title: 'Ultra-Fast Delivery', desc: 'Get groceries delivered in 10-30 minutes from nearby kirana stores.' },
            { emoji: '🏪', title: 'Support Local Stores', desc: 'Every order helps local kirana store owners grow their business digitally.' },
            { emoji: '💚', title: 'Fresh & Authentic', desc: 'Products sourced fresh daily — no cold chain delays, no stale goods.' },
          ].map(item => (
            <div key={item.title} className="card p-5">
              <div className="text-3xl mb-3">{item.emoji}</div>
              <h3 className="text-mandi-text font-semibold mb-2">{item.title}</h3>
              <p className="text-mandi-muted text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Vendor CTA */}
      <section>
        <div className="bg-gradient-to-r from-mandi-green-dark to-[#005522] border border-mandi-green border-opacity-30 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-mandi-text font-black text-2xl mb-2">Own a Kirana Store?</h2>
            <p className="text-green-200 text-sm">Partner with Mandi Minutes and reach thousands of customers in your area. Free registration, instant onboarding.</p>
          </div>
          <Link to="/vendor-onboarding" className="flex-shrink-0 bg-mandi-text text-mandi-dark font-bold px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-2">
            <Store size={18} />
            Become a Vendor
          </Link>
        </div>
      </section>
    </div>
  );
}
