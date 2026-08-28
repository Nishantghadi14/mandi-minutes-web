import { describe, it, expect } from 'vitest';
import { searchProducts, searchStores } from '../src/utils/searchProducts';

const sampleProducts = [
  { id: 'p1', name: 'Silky Rice', brand: 'Mahalaxmi', category: 'cat-rice', price: 48, storeId: 'store-1', discount: 10 },
  { id: 'p2', name: 'Kolam Rice', brand: 'Royal', category: 'cat-rice', price: 60, storeId: 'store-1', discount: 5 },
  { id: 'p3', name: 'Basmati Rice — Loose', brand: 'Kohinoor', category: 'cat-rice', price: 160, storeId: 'store-1', discount: 20 },
  { id: 'p4', name: 'Toore Daal (Premium)', brand: 'Tata Sampann', category: 'cat-daal', price: 140, storeId: 'store-2', discount: 0 },
  { id: 'p5', name: 'Moong Daal (Moonglow)', brand: 'Mahalaxmi', category: 'cat-daal', price: 120, storeId: 'store-2', discount: 15 },
  { id: 'p6', name: 'Whole Chana', brand: 'Farm Fresh', category: 'cat-grains', price: 100, storeId: 'store-1', discount: 0 },
];

const sampleStores = [
  { id: 'store-1', name: 'Mahalaxmi Kirana', city: 'Virar West', categories: ['cat-rice', 'cat-grains'] },
  { id: 'store-2', name: 'Ganesh Provision Store', city: 'Virar East', categories: ['cat-daal'] },
];

describe('Product Search Engine (searchProducts)', () => {
  it('returns all products when no query or filters are applied', () => {
    const results = searchProducts(sampleProducts);
    expect(results).toHaveLength(6);
  });

  it('filters by keyword query matching name or brand', () => {
    const riceResults = searchProducts(sampleProducts, { query: 'rice' });
    expect(riceResults).toHaveLength(3);

    const brandResults = searchProducts(sampleProducts, { query: 'tata' });
    expect(brandResults).toHaveLength(1);
    expect(brandResults[0].id).toBe('p4');
  });

  it('filters by category', () => {
    const daalResults = searchProducts(sampleProducts, { category: 'cat-daal' });
    expect(daalResults).toHaveLength(2);
    expect(daalResults.map(p => p.id)).toEqual(['p4', 'p5']);
  });

  it('filters by storeId', () => {
    const store2Results = searchProducts(sampleProducts, { storeId: 'store-2' });
    expect(store2Results).toHaveLength(2);
  });

  it('filters by max price', () => {
    const cheapResults = searchProducts(sampleProducts, { maxPrice: 100 });
    expect(cheapResults).toHaveLength(3); // 48, 60, 100
  });

  it('sorts results by price ascending and descending', () => {
    const ascResults = searchProducts(sampleProducts, { sortBy: 'price-asc' });
    expect(ascResults[0].price).toBe(48);
    expect(ascResults[ascResults.length - 1].price).toBe(160);

    const descResults = searchProducts(sampleProducts, { sortBy: 'price-desc' });
    expect(descResults[0].price).toBe(160);
    expect(descResults[descResults.length - 1].price).toBe(48);
  });
});

describe('Store Search Engine (searchStores)', () => {
  it('filters stores by name or city', () => {
    const westResults = searchStores(sampleStores, { query: 'west' });
    expect(westResults).toHaveLength(1);
    expect(westResults[0].name).toBe('Mahalaxmi Kirana');
  });

  it('filters stores by category capability', () => {
    const daalStores = searchStores(sampleStores, { category: 'cat-daal' });
    expect(daalStores).toHaveLength(1);
    expect(daalStores[0].id).toBe('store-2');
  });
});
