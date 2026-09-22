import { useState, useEffect } from 'react';

/**
 * ARCHITECTURAL SEARCH MIGRATION PATH & THRESHOLD:
 * 
 * 1. Current State (Client-Side In-Memory Engine):
 *    - Tokenized substring matching over catalog items (name, brand, description).
 *    - Ideal for hyperlocal kirana catalogs (< 1,000 SKUs). Executes in < 2ms without network overhead,
 *      works seamlessly offline / under poor 2G/3G connectivity in Palghar/Virar.
 * 
 * 2. Scalability Threshold (When to migrate):
 *    - Threshold: ~500 to 1,000 active SKUs across multiple stores.
 *    - Once catalog JSON exceeds 200KB or multi-vendor catalog reaches thousands of items,
 *      downloading the entire catalog in client memory becomes inefficient for low-end mobile devices.
 * 
 * 3. Future Migration Path (Algolia / Typesense / MeiliSearch):
 *    - To upgrade, replace the internals of `searchProducts` (or wrap with an async search client)
 *      to query an Algolia/Typesense endpoint with typo-tolerance, facets, and geographical geo-radius ranking.
 *    - UI components (SearchPage, Navbar search) consume this exact signature, requiring zero UI refactors.
 */

/**
 * Filters and ranks products based on search query, category, store, and price criteria.
 */
export function searchProducts(products = [], options = {}) {
  const {
    query = '',
    category = 'all',
    storeId = 'all',
    maxPrice = Infinity,
    sortBy = 'default',
    stores = [],
  } = options;

  if (!Array.isArray(products)) return [];

  const cleanQuery = String(query || '').trim().toLowerCase();
  const tokens = cleanQuery.split(/\s+/).filter(Boolean);

  // Map of suspended store IDs for fast lookup
  const suspendedStoreIds = new Set(
    Array.isArray(stores) ? stores.filter(s => s.status === 'suspended').map(s => s.id) : []
  );

  const filtered = products.filter(product => {
    // 0. Exclude products from suspended stores
    if (product.storeId && suspendedStoreIds.has(product.storeId)) {
      return false;
    }

    // 1. Category filter
    if (category && category !== 'all' && product.category !== category) {
      return false;
    }

    // 2. Store filter
    if (storeId && storeId !== 'all' && product.storeId !== storeId) {
      return false;
    }

    // 3. Max price filter
    const price = Number(product.price);
    if (!isNaN(price) && price > maxPrice) {
      return false;
    }

    // 4. Query token matching (all tokens must match name, brand, or description)
    if (tokens.length > 0) {
      const name = String(product.name || '').toLowerCase();
      const brand = String(product.brand || '').toLowerCase();
      const desc = String(product.description || '').toLowerCase();
      const combined = `${name} ${brand} ${desc}`;

      const matchesAllTokens = tokens.every(token => combined.includes(token));
      if (!matchesAllTokens) return false;
    }

    return true;
  });

  // Sort results if requested
  if (sortBy === 'price-asc') {
    return [...filtered].sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
  }
  if (sortBy === 'price-desc') {
    return [...filtered].sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
  }
  if (sortBy === 'discount') {
    return [...filtered].sort((a, b) => (Number(b.discount) || 0) - (Number(a.discount) || 0));
  }

  return filtered;
}

/**
 * Filters stores by search query and category tags (excluding suspended stores).
 */
export function searchStores(stores = [], options = {}) {
  const { query = '', category = 'all', includeSuspended = false } = options;
  if (!Array.isArray(stores)) return [];

  const cleanQuery = String(query || '').trim().toLowerCase();

  return stores.filter(store => {
    // Exclude suspended stores unless explicitly requested (e.g. Admin view)
    if (!includeSuspended && store.status === 'suspended') {
      return false;
    }

    const nameMatch = String(store.name || '').toLowerCase().includes(cleanQuery);
    const cityMatch = String(store.city || '').toLowerCase().includes(cleanQuery);
    const descMatch = String(store.description || '').toLowerCase().includes(cleanQuery);
    const queryMatch = !cleanQuery || nameMatch || cityMatch || descMatch;

    const catMatch = !category || category === 'all' || store.categories?.includes(category);

    return queryMatch && catMatch;
  });
}

/**
 * Custom React hook for debouncing fast-changing inputs (e.g. search input).
 */
export function useDebounce(value, delay = 250) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

