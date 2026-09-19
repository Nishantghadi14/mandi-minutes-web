import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useLocation } from '../context/LocationContext';
import { useData } from '../context/DataContext';
import StoreCard from '../components/common/StoreCard';
import { MapPin, Zap, ChevronRight, Star, Package, ArrowRight, Store, RefreshCw, WifiOff, Clock, ShieldCheck } from 'lucide-react';
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
    <div className="relative overflow-hidden rounded-2xl">
      <div className={`bg-gradient-to-br ${b.color || 'from-green-950 via-[#0a2010] to-mandi-dark'} border border-mandi-border rounded-2xl p-5 transition-all duration-500`}
        style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-mandi-text font-black text-lg mb-1">{b.title}</h2>
            <p className="text-mandi-muted text-sm">{b.subtitle}</p>
          </div>
          <div className="text-5xl animate-float">{b.emoji || '🛒'}</div>
        </div>
      </div>
      {active.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2.5">
          {active.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? 'bg-mandi-green w-5' : 'bg-mandi-border w-1.5'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ stat, delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const Icon = stat.icon;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="stat-card"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms, box-shadow 0.3s ease, border-color 0.3s ease, transform 0.3s ease`,
      }}
    >
      <div className="icon-circle">
        <Icon size={20} className="text-mandi-green drop-shadow-green" />
      </div>
      <div className="text-2xl font-black text-gradient-green">{stat.value}</div>
      <div className="text-mandi-muted text-xs font-medium">{stat.label}</div>
    </div>
  );
}

export default function HomePage() {
  const { t } = useTranslation();
  const { location, setLocationModal } = useLocation();
  const { getStoresByPincode, categories, banners, loadingStates, errorStates, retryFetch } = useData();
  const [stores, setStores] = useState([]);

  useEffect(() => {
    if (location?.pincode) {
      setStores(getStoresByPincode(location.pincode));
    }
  }, [location, getStoresByPincode]);



  const hasStoreError = Boolean(errorStates?.stores);
  const isStoresLoading = Boolean(loadingStates?.stores);

  const whyItems = [
    {
      emoji: '⚡',
      gradient: 'from-yellow-500/20 to-orange-500/10',
      border: 'border-yellow-500/20',
      iconColor: 'text-yellow-400',
      title: t('why.fastTitle'),
      desc: t('why.fastDesc'),
    },
    {
      emoji: '🏪',
      gradient: 'from-mandi-green/20 to-emerald-600/10',
      border: 'border-mandi-green/20',
      iconColor: 'text-mandi-green',
      title: t('why.localTitle'),
      desc: t('why.localDesc'),
    },
    {
      emoji: '💚',
      gradient: 'from-emerald-500/20 to-teal-500/10',
      border: 'border-emerald-500/20',
      iconColor: 'text-emerald-400',
      title: t('why.freshTitle'),
      desc: t('why.freshDesc'),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-28 md:pb-8">
      <Helmet>
        <title>Mandi Minutes — Hyperlocal Kirana Delivery in Virar (10-15 Mins)</title>
        <meta name="description" content="Get fresh groceries, daily staples, Gokul milk, and household essentials from your neighborhood Kirana stores in Virar West & East in 10-15 minutes." />
        <meta property="og:title" content="Mandi Minutes — Hyperlocal Kirana Delivery Virar" />
        <meta property="og:description" content="Virar's local Kirana stores delivered to your doorstep in 10-15 minutes." />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* Network Error Banner */}
      {hasStoreError && (
        <div className="mb-6 p-4 rounded-2xl bg-red-950/40 border border-red-800/60 flex items-center justify-between gap-3 text-red-200 animate-slide-up-fade">
          <div className="flex items-center gap-3">
            <WifiOff size={18} className="text-red-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold">{t('errors.networkIssue')}</p>
              <p className="text-xs text-red-300/80">{t('errors.cachedCatalog')}</p>
            </div>
          </div>
          <button
            onClick={() => retryFetch?.('stores')}
            className="text-xs py-1.5 px-3 flex items-center gap-1.5 bg-red-600 hover:bg-red-500 active:scale-95 rounded-lg font-semibold transition-all"
          >
            <RefreshCw size={11} /> {t('common.retry')}
          </button>
        </div>
      )}

      {/* ── Hero ── */}
      <section className="mb-8">
        <div className="relative overflow-hidden rounded-3xl border border-mandi-border bg-mandi-card">
          {/* Mesh background */}
          <div className="absolute inset-0 bg-hero-mesh" />
          {/* Decorative orbs */}
          <div className="hero-orb absolute top-0 right-0 w-72 h-72 bg-mandi-green opacity-[0.07] translate-x-1/3 -translate-y-1/3" />
          <div className="hero-orb absolute bottom-0 left-0 w-56 h-56 bg-mandi-green opacity-[0.05] -translate-x-1/3 translate-y-1/3" />

          <div className="relative z-10 p-8 md:p-12">
            <div className="flex flex-col md:flex-row md:items-center gap-8">
              <div className="flex-1">
                {/* Pills row */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="flex items-center gap-1.5 bg-mandi-green text-black text-xs font-bold px-3 py-1.5 rounded-full">
                    <Zap size={11} fill="black" /> {t('hero.badge')}
                  </span>
                  <span className="flex items-center gap-1.5 bg-mandi-surface border border-mandi-border text-mandi-muted text-xs font-medium px-3 py-1.5 rounded-full">
                    <Clock size={11} className="text-mandi-green" /> 10-15 mins
                  </span>
                  <span className="flex items-center gap-1.5 bg-mandi-surface border border-mandi-border text-mandi-muted text-xs font-medium px-3 py-1.5 rounded-full">
                    <ShieldCheck size={11} className="text-mandi-green" /> {t('hero.trustedKiranas')}
                  </span>
                </div>

                <h1 className="text-3xl md:text-5xl font-black text-mandi-text mb-3 leading-tight">
                  {t('hero.headline')}
                </h1>
                <p className="text-mandi-muted text-base md:text-lg mb-7 max-w-lg leading-relaxed">
                  {t('hero.subheadline')}
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setLocationModal(true)}
                    className="flex items-center gap-2 bg-mandi-surface border border-mandi-border px-5 py-3 rounded-xl hover:border-mandi-green hover:bg-mandi-card transition-all duration-200 max-w-xs group"
                  >
                    <MapPin size={17} className="text-mandi-green group-hover:drop-shadow-green" />
                    <span className="text-mandi-text text-sm font-medium truncate">
                      {location ? `📍 ${location.area}` : t('hero.setLocation')}
                    </span>
                  </button>
                  <Link
                    to="/search"
                    className="btn-primary flex items-center gap-2 max-w-xs justify-center group"
                  >
                    <span>{t('hero.shopNow')}</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" />
                  </Link>
                </div>
              </div>

              {/* Hero illustration */}
              <div className="hidden md:flex items-center justify-center w-48 flex-shrink-0">
                <div className="relative">
                  <div className="w-44 h-44 rounded-3xl bg-mandi-green/10 border border-mandi-green/20 flex items-center justify-center animate-float">
                    <span className="text-8xl">🛒</span>
                  </div>
                  {/* Floating chips */}
                  <div className="absolute -top-3 -right-4 bg-mandi-card border border-mandi-border rounded-xl px-3 py-1.5 flex items-center gap-1.5 shadow-card animate-float" style={{ animationDelay: '1s' }}>
                    <Zap size={12} className="text-mandi-green" />
                    <span className="text-xs font-bold text-mandi-text">10 mins</span>
                  </div>
                  <div className="absolute -bottom-3 -left-4 bg-mandi-card border border-mandi-border rounded-xl px-3 py-1.5 flex items-center gap-1.5 shadow-card animate-float" style={{ animationDelay: '2s' }}>
                    <Star size={12} className="text-mandi-amber fill-mandi-amber" />
                    <span className="text-xs font-bold text-mandi-text">4.7 rating</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Promo Banners ── */}
      <section className="mb-8">
        <PromoBanner banners={banners} />
      </section>



      {/* ── Shop by Category ── */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-title mb-0">{t('sections.shopByCategory')}</h2>
          <Link to="/search" className="flex items-center gap-1 text-mandi-green text-sm font-semibold hover:text-mandi-green-light transition-colors">
            {t('common.viewAll')} <ChevronRight size={15} />
          </Link>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {categories.map(cat => (
            <Link
              key={cat.id}
              to={`/search?category=${cat.id}`}
              className="category-card flex flex-col items-center gap-2 p-3 rounded-2xl border border-mandi-border transition-all duration-250 group"
              style={{ background: cat.color }}
            >
              <span className="text-2xl group-hover:scale-125 transition-transform duration-200 ease-out">{cat.icon}</span>
              <span className="text-mandi-text text-xs font-semibold text-center leading-tight">{t(`categories.${cat.id}`, cat.name)}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Stores near you ── */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-title mb-0">
            {location ? `${t('sections.storesIn')} ${location.area.split(',')[0]}` : t('sections.featuredStores')}
          </h2>
          {location && stores.length > 0 && (
            <span className="flex items-center gap-1.5 text-mandi-muted text-sm bg-mandi-surface border border-mandi-border px-3 py-1 rounded-full">
              <Store size={13} className="text-mandi-green" />
              {stores.length} {t('sections.nearby')}
            </span>
          )}
        </div>

        {isStoresLoading && stores.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-4 h-64 space-y-3">
                <div className="h-44 bg-mandi-surface rounded-xl w-full" />
                <div className="h-4 bg-mandi-surface rounded w-3/4" />
                <div className="h-3 bg-mandi-surface rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : !location ? (
          <div className="card p-10 text-center gradient-border">
            <div className="icon-circle mx-auto mb-4">
              <MapPin size={24} className="text-mandi-green" />
            </div>
            <p className="text-mandi-text font-bold mb-1">{t('location.setTitle')}</p>
            <p className="text-mandi-muted text-sm mb-5">{t('location.setPincode')}</p>
            <button onClick={() => setLocationModal(true)} className="btn-primary">{t('location.setBtn')}</button>
          </div>
        ) : stores.length === 0 ? (
          <div className="card p-10 text-center">
            <div className="icon-circle mx-auto mb-4">
              <Store size={24} className="text-mandi-green" />
            </div>
            <p className="text-mandi-text font-bold mb-1">{t('location.noStores')}</p>
            <p className="text-mandi-muted text-sm mb-5">{t('location.noStoresPincode')} {location.pincode}</p>
            <button onClick={() => setLocationModal(true)} className="btn-outline">{t('location.tryAnother')}</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stores.map(store => <StoreCard key={store.id} store={store} />)}
          </div>
        )}
      </section>

      {/* ── Why Mandi Minutes ── */}
      <section className="mb-10">
        <h2 className="section-title">{t('sections.whyMandi')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {whyItems.map(item => (
            <div
              key={item.title}
              className={`card p-6 transition-all duration-300 hover:-translate-y-1.5 bg-gradient-to-br ${item.gradient} border ${item.border}`}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.4)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
            >
              <div className="text-4xl mb-4 animate-float inline-block">{item.emoji}</div>
              <h3 className={`font-bold text-base mb-2 ${item.iconColor}`}>{item.title}</h3>
              <p className="text-mandi-muted text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Vendor CTA ── */}
      <section>
        <div className="relative overflow-hidden rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 bg-vendor-mesh border border-mandi-green/20">
          {/* Decorative orb */}
          <div className="hero-orb absolute top-0 right-0 w-64 h-64 bg-mandi-green opacity-10 translate-x-1/3 -translate-y-1/3" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-white/10 border border-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full">🤝 {t('sections.partnership')}</span>
            </div>
            <h2 className="text-white font-black text-2xl md:text-3xl mb-2">{t('sections.ownAStore')}</h2>
            <p className="text-green-200/80 text-sm md:text-base max-w-md">
              {t('sections.vendorSubheadline')}
            </p>
          </div>
          <Link
            to="/vendor-onboarding"
            className="relative z-10 flex-shrink-0 bg-white text-mandi-dark font-black px-7 py-3.5 rounded-xl hover:bg-green-50 active:scale-95 transition-all duration-200 flex items-center gap-2 group shadow-lg"
          >
            <Store size={18} />
            {t('sections.becomeVendor')}
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
        </div>
      </section>
    </div>
  );
}
