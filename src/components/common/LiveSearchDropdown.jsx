import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Store as StoreIcon,
  Star,
  Zap,
  ArrowRight,
  Plus,
  Minus,
  TrendingUp,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useCart } from '../../context/CartContext';
import { useToast } from './Toast';
import LazyImage from './LazyImage';
import { searchProducts, searchStores } from '../../utils/searchProducts';

const TRENDING_SUGGESTIONS = [
  { label: 'Milk', icon: '🥛' },
  { label: 'Atta & Flours', icon: '🌾' },
  { label: 'Rice', icon: '🍚' },
  { label: 'Amul Butter', icon: '🧈' },
  { label: 'Edible Oil', icon: '🛢️' },
  { label: 'Biscuits & Snacks', icon: '🍪' },
];

/**
 * Highlights parts of text matching the search query
 */
function HighlightMatch({ text = '', query = '' }) {
  if (!query.trim() || !text) return <span>{text}</span>;

  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tokens = escaped.split(/\s+/).filter(Boolean);
  if (!tokens.length) return <span>{text}</span>;

  const regex = new RegExp(`(${tokens.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <span key={i} className="text-mandi-green font-bold bg-mandi-green/10 rounded px-0.5">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </span>
  );
}

export default function LiveSearchDropdown({
  query = '',
  isOpen = false,
  onClose,
  onSelectQuery,
}) {
  const navigate = useNavigate();
  const { products, stores } = useData();
  const { items, addItem, updateQuantity, storeId: cartStoreId } = useCart();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'products' | 'stores'

  const cleanQuery = query.trim();

  // Matched products & stores
  const matchedProducts = useMemo(() => {
    if (!cleanQuery) return [];
    return searchProducts(products, { query: cleanQuery, stores });
  }, [products, stores, cleanQuery]);

  const matchedStores = useMemo(() => {
    if (!cleanQuery) return [];
    return searchStores(stores, { query: cleanQuery });
  }, [stores, cleanQuery]);

  const totalResults = matchedProducts.length + matchedStores.length;

  if (!isOpen) return null;

  const handleAddProduct = (e, product) => {
    e.stopPropagation();
    if (cartStoreId && cartStoreId !== product.storeId) {
      addToast('Clear cart to add items from a different store', 'warning');
      return;
    }
    addItem(product);
    addToast(`${product.name} added to cart`, 'success');
  };

  const handleUpdateQty = (e, product, delta) => {
    e.stopPropagation();
    const cartItem = items.find(i => i.id === product.id);
    if (!cartItem) return;
    updateQuantity(product.id, cartItem.quantity + delta);
  };

  const handleProductClick = (product) => {
    onClose?.();
    navigate(`/search?q=${encodeURIComponent(product.name)}`);
  };

  const handleStoreClick = (store) => {
    onClose?.();
    navigate(`/store/${store.id}`);
  };

  const handleViewAll = () => {
    onClose?.();
    navigate(`/search?q=${encodeURIComponent(cleanQuery)}`);
  };

  const handleSuggestionClick = (term) => {
    if (onSelectQuery) {
      onSelectQuery(term);
    } else {
      navigate(`/search?q=${encodeURIComponent(term)}`);
      onClose?.();
    }
  };

  return (
    <div
      id="live-search-dropdown"
      className="absolute top-full left-0 right-0 mt-2 bg-mandi-card/95 dark:bg-[#121815]/95 backdrop-blur-xl border border-mandi-border rounded-2xl shadow-2xl overflow-hidden z-50 animate-scale-in"
      style={{
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 200, 81, 0.1)',
      }}
      role="listbox"
      aria-label="Live search suggestions"
    >
      {/* ── EMPTY QUERY: Trending & Suggestions ── */}
      {!cleanQuery ? (
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-mandi-subtle uppercase tracking-wider mb-2.5">
              <TrendingUp size={13} className="text-mandi-green" />
              <span>Trending Searches</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {TRENDING_SUGGESTIONS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleSuggestionClick(item.label)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-mandi-surface hover:bg-mandi-green/10 hover:border-mandi-green border border-mandi-border rounded-full text-xs font-medium text-mandi-text transition-all group"
                >
                  <span>{item.icon}</span>
                  <span className="group-hover:text-mandi-green transition-colors">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {stores?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-mandi-subtle uppercase tracking-wider mb-2.5">
                <StoreIcon size={13} className="text-mandi-green" />
                <span>Featured Stores in Virar</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {stores.slice(0, 4).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleStoreClick(s)}
                    className="flex items-center gap-3 p-2 rounded-xl bg-mandi-surface hover:bg-mandi-green/10 border border-mandi-border hover:border-mandi-green transition-all text-left group"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-mandi-card flex-shrink-0">
                      <LazyImage
                        src={s.coverImage || s.image}
                        alt={s.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-mandi-text truncate group-hover:text-mandi-green transition-colors">
                        {s.name}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-mandi-muted mt-0.5">
                        <span className="flex items-center gap-0.5 text-mandi-amber font-bold">
                          <Star size={10} fill="currentColor" /> {s.rating || '4.8'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <Zap size={10} className="text-mandi-green" /> {s.deliveryTime || '15 min'}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : totalResults === 0 ? (
        /* ── ZERO RESULTS ── */
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-mandi-surface border border-mandi-border mx-auto mb-3 flex items-center justify-center text-mandi-subtle">
            <Package size={22} />
          </div>
          <p className="text-sm font-semibold text-mandi-text mb-1">
            No items found matching "{cleanQuery}"
          </p>
          <p className="text-xs text-mandi-muted mb-4">
            Try checking for spelling errors, or search for broader categories like "Milk", "Rice", or "Oil".
          </p>
          <button
            type="button"
            onClick={handleViewAll}
            className="btn-outline text-xs py-2 px-4 inline-flex items-center gap-1.5"
          >
            <span>Open Catalog Search</span>
            <ArrowRight size={13} />
          </button>
        </div>
      ) : (
        /* ── RESULTS VIEW ── */
        <div>
          {/* Header tabs */}
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-mandi-border bg-mandi-surface/50">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  activeTab === 'all'
                    ? 'bg-mandi-green text-black shadow-sm'
                    : 'text-mandi-muted hover:text-mandi-text'
                }`}
              >
                All ({totalResults})
              </button>
              {matchedProducts.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('products')}
                  className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                    activeTab === 'products'
                      ? 'bg-mandi-green text-black shadow-sm'
                      : 'text-mandi-muted hover:text-mandi-text'
                  }`}
                >
                  <Package size={12} />
                  <span>Products ({matchedProducts.length})</span>
                </button>
              )}
              {matchedStores.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('stores')}
                  className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                    activeTab === 'stores'
                      ? 'bg-mandi-green text-black shadow-sm'
                      : 'text-mandi-muted hover:text-mandi-text'
                  }`}
                >
                  <StoreIcon size={12} />
                  <span>Stores ({matchedStores.length})</span>
                </button>
              )}
            </div>

            <span className="text-[11px] text-mandi-subtle hidden sm:inline">
              Live matching items
            </span>
          </div>

          {/* Results list */}
          <div className="max-h-[60vh] overflow-y-auto divide-y divide-mandi-border/60">
            {/* Stores Section (shown if 'all' or 'stores') */}
            {(activeTab === 'all' || activeTab === 'stores') && matchedStores.length > 0 && (
              <div className="p-2 space-y-1.5 bg-mandi-surface/20">
                <div className="px-2 py-1 flex items-center gap-1 text-[11px] font-bold text-mandi-muted uppercase tracking-wider">
                  <StoreIcon size={12} className="text-orange-400" />
                  <span>Matching Stores</span>
                </div>
                {matchedStores.slice(0, activeTab === 'stores' ? 6 : 2).map((s) => (
                  <div
                    key={s.id}
                    onClick={() => handleStoreClick(s)}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-mandi-surface transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-mandi-surface border border-mandi-border flex-shrink-0">
                        <LazyImage
                          src={s.coverImage || s.image}
                          alt={s.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-mandi-text truncate group-hover:text-mandi-green transition-colors">
                          <HighlightMatch text={s.name} query={cleanQuery} />
                        </p>
                        <div className="flex items-center gap-2 text-xs text-mandi-muted">
                          <span className="flex items-center gap-0.5 text-mandi-amber font-bold">
                            <Star size={11} fill="currentColor" /> {s.rating || '4.8'}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5">
                            <Zap size={11} className="text-mandi-green" /> {s.deliveryTime || '15 min'}
                          </span>
                          {s.city && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[120px]">{s.city}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStoreClick(s);
                      }}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg text-mandi-green bg-mandi-green/10 hover:bg-mandi-green hover:text-black transition-colors flex items-center gap-1 flex-shrink-0"
                    >
                      <span>Visit</span>
                      <ArrowRight size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Products Section (shown if 'all' or 'products') */}
            {(activeTab === 'all' || activeTab === 'products') && matchedProducts.length > 0 && (
              <div className="p-2 space-y-1.5">
                {activeTab === 'all' && matchedStores.length > 0 && (
                  <div className="px-2 py-1 flex items-center gap-1 text-[11px] font-bold text-mandi-muted uppercase tracking-wider">
                    <Package size={12} className="text-mandi-green" />
                    <span>Matching Products</span>
                  </div>
                )}
                {matchedProducts.slice(0, activeTab === 'products' ? 12 : 5).map((p) => {
                  const cartItem = items.find((i) => i.id === p.id);
                  const qty = cartItem ? cartItem.quantity : 0;
                  const isOOS = !p.isAvailable;
                  const storeObj = stores.find((s) => s.id === p.storeId);

                  return (
                    <div
                      key={p.id}
                      onClick={() => handleProductClick(p)}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-mandi-surface transition-colors cursor-pointer group gap-3"
                    >
                      {/* Product Thumbnail & Details */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-mandi-surface border border-mandi-border flex-shrink-0">
                          <LazyImage
                            src={p.image}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          {p.discount > 0 && (
                            <span className="absolute top-0.5 left-0.5 bg-mandi-green text-black text-[9px] font-bold px-1 rounded-sm leading-tight">
                              {p.discount}%
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            {p.brand && (
                              <span className="text-[10px] uppercase font-bold text-mandi-subtle truncate">
                                {p.brand}
                              </span>
                            )}
                            {storeObj && (
                              <span className="text-[10px] text-mandi-muted bg-mandi-surface px-1.5 py-0.2 rounded border border-mandi-border truncate max-w-[130px]">
                                🏪 {storeObj.name}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-mandi-text truncate group-hover:text-mandi-green transition-colors">
                            <HighlightMatch text={p.name} query={cleanQuery} />
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-sm font-bold text-mandi-text">
                              ₹{p.price}
                            </span>
                            {p.mrp > p.price && (
                              <span className="text-xs text-mandi-subtle line-through">
                                ₹{p.mrp}
                              </span>
                            )}
                            {p.unit && (
                              <span className="text-[11px] text-mandi-muted">
                                ({p.unit})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Add to Cart / Qty Stepper */}
                      <div className="flex-shrink-0">
                        {isOOS ? (
                          <span className="text-[11px] text-mandi-subtle px-2 py-1 rounded bg-mandi-surface border border-mandi-border">
                            Out of stock
                          </span>
                        ) : qty > 0 ? (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 bg-mandi-green rounded-lg px-2 py-1 text-black font-bold text-xs"
                          >
                            <button
                              type="button"
                              onClick={(e) => handleUpdateQty(e, p, -1)}
                              className="hover:scale-125 transition-transform"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-4 text-center">{qty}</span>
                            <button
                              type="button"
                              onClick={(e) => handleUpdateQty(e, p, 1)}
                              className="hover:scale-125 transition-transform"
                              aria-label="Increase quantity"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleAddProduct(e, p)}
                            className="px-3 py-1.5 bg-mandi-green hover:bg-mandi-green-light text-black text-xs font-bold rounded-xl transition-all flex items-center gap-1 shadow-sm active:scale-95"
                          >
                            <Plus size={13} />
                            <span>Add</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer view-all action */}
          <div className="p-2.5 border-t border-mandi-border bg-mandi-surface/70 flex items-center justify-between">
            <span className="text-xs text-mandi-muted">
              Showing top matches for <strong className="text-mandi-text">"{cleanQuery}"</strong>
            </span>
            <button
              type="button"
              onClick={handleViewAll}
              className="text-xs font-bold text-mandi-green hover:text-mandi-green-light transition-colors flex items-center gap-1"
            >
              <span>View all {totalResults} results</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
