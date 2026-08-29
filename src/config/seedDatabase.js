import { db, isFirebaseConfigured } from './firebase';
import { doc, setDoc, getDocs, collection, query, limit } from 'firebase/firestore';
import { initialStores } from '../data/initialStores';
import { initialProducts } from '../data/initialProducts';
import { initialCategories } from '../data/initialCategories';

const defaultBanners = [
  { id: 'b1', title: '🎉 Flat 20% off on first order!', subtitle: 'Use code NEWUSER at checkout', color: 'from-green-900 to-mandi-dark', active: true },
  { id: 'b2', title: '⚡ Express Delivery in 10 min', subtitle: 'Available in select pincodes', color: 'from-yellow-900 to-mandi-dark', active: true },
  { id: 'b3', title: '🛒 Free delivery above ₹199', subtitle: 'On all orders from local stores', color: 'from-blue-900 to-mandi-dark', active: true },
];

export async function seedVirarDatabase(force = false) {
  if (!isFirebaseConfigured || !db) {
    console.info('Firebase not configured. Operating in in-memory mode.');
    return { success: false, message: 'Firebase credentials missing' };
  }

  try {
    console.log('🔥 Initializing Firestore collections sync...');

    // Check if stores collection is populated
    const storesQuery = query(collection(db, 'stores'), limit(1));
    const storesSnapshot = await getDocs(storesQuery);

    if (!storesSnapshot.empty && !force) {
      console.log('Firestore already contains catalog. Skipping auto-seed.');
      return { success: true, message: 'Database already populated' };
    }

    // 1. Seed stores
    for (const store of initialStores) {
      await setDoc(doc(db, 'stores', store.id), store, { merge: true });
    }

    // 2. Seed products
    for (const product of initialProducts) {
      await setDoc(doc(db, 'products', product.id), product, { merge: true });
    }

    // 3. Seed banners
    for (const banner of defaultBanners) {
      await setDoc(doc(db, 'banners', banner.id), banner, { merge: true });
    }

    // 4. Seed categories
    for (const cat of initialCategories) {
      await setDoc(doc(db, 'categories', cat.id), cat, { merge: true });
    }

    console.log('✅ Firestore catalog synchronized successfully.');
    return { 
      success: true, 
      mode: 'firebase', 
      message: `Catalog synchronized: ${initialStores.length} stores, ${initialProducts.length} products.` 
    };
  } catch (err) {
    console.error('Database seeding failed:', err);
    throw err;
  }
}
