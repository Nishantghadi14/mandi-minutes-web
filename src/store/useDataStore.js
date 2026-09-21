import { create } from 'zustand';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
} from 'firebase/firestore';
import { db, functions, isFirebaseConfigured } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';
import { initialStores } from '../data/initialStores';
import { initialProducts } from '../data/initialProducts';
import { initialCategories } from '../data/initialCategories';
import { seedVirarDatabase } from '../config/seedDatabase';

const defaultBanners = [
  { id: 'b1', title: '🎉 Flat 20% off on first order!', subtitle: 'Use code NEWUSER at checkout', colorDark: 'from-green-900 to-emerald-950', colorLight: 'from-green-50 to-emerald-100', active: true },
  { id: 'b2', title: '⚡ Express Delivery in 10 min', subtitle: 'Available in select pincodes', colorDark: 'from-yellow-900 to-amber-950', colorLight: 'from-amber-50 to-yellow-100', active: true },
  { id: 'b3', title: '🛒 Free delivery above ₹199', subtitle: 'On all orders from local stores', colorDark: 'from-blue-900 to-indigo-950', colorLight: 'from-blue-50 to-indigo-100', active: true },
];

const getInitialOrders = () => {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('mandi_synced_orders') || '[]');
  } catch {
    return [];
  }
};

export const useDataStore = create((set, get) => ({
  stores: initialStores,
  products: initialProducts,
  orders: getInitialOrders(),
  banners: defaultBanners,
  categories: initialCategories,
  tickets: [],
  
  // Granular loading & error states for mobile network resilience
  loadingStates: {
    stores: true,
    products: true,
    orders: false,
    banners: true,
    tickets: false,
  },
  errorStates: {
    stores: null,
    products: null,
    orders: null,
    banners: null,
    tickets: null,
  },
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  subscriptions: {},

  setLoadingState: (key, isLoading) => {
    set(state => ({
      loadingStates: { ...state.loadingStates, [key]: isLoading }
    }));
  },

  setErrorState: (key, error) => {
    set(state => ({
      errorStates: { ...state.errorStates, [key]: error }
    }));
  },

  // Setup Real-time Firestore Listeners with Error Recovery
  initSubscriptions: (user) => {
    if (!isFirebaseConfigured || !db) {
      set({ 
        loadingStates: { stores: false, products: false, orders: false, banners: false, tickets: false } 
      });
      return () => {};
    }

    // Auto seed check: Only run when authenticated as admin to prevent unauthorized client writes
    if (user?.role === 'admin') {
      seedVirarDatabase().catch(err => console.warn('Auto seed check:', err));
    }

    const unsubscribers = [];

    // Helper to update loading and error
    const markSuccess = (key) => {
      set(state => ({
        loadingStates: { ...state.loadingStates, [key]: false },
        errorStates: { ...state.errorStates, [key]: null },
      }));
    };

    const markError = (key, err) => {
      console.error(`Firestore ${key} subscription error:`, err);
      set(state => ({
        loadingStates: { ...state.loadingStates, [key]: false },
        errorStates: { ...state.errorStates, [key]: err.message || `Failed to load ${key}` },
      }));
    };

    try {
      // 1. Live Stores listener
      set(state => ({ loadingStates: { ...state.loadingStates, stores: true } }));
      const storesUnsub = onSnapshot(
        query(collection(db, 'stores'), where('status', '==', 'approved')), 
        (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            set({ stores: list });
          }
          markSuccess('stores');
        }, 
        (err) => markError('stores', err)
      );
      unsubscribers.push(storesUnsub);

      // 2. Live Products listener
      set(state => ({ loadingStates: { ...state.loadingStates, products: true } }));
      const productsUnsub = onSnapshot(
        collection(db, 'products'), 
        (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            set({ products: list });
          }
          markSuccess('products');
        }, 
        (err) => markError('products', err)
      );
      unsubscribers.push(productsUnsub);

      // 3. Live Banners listener
      set(state => ({ loadingStates: { ...state.loadingStates, banners: true } }));
      const bannersUnsub = onSnapshot(
        collection(db, 'banners'), 
        (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            set({ banners: list });
          }
          markSuccess('banners');
        }, 
        (err) => markError('banners', err)
      );
      unsubscribers.push(bannersUnsub);

      // 4. Live Tickets listener
      if (user?.uid) {
        set(state => ({ loadingStates: { ...state.loadingStates, tickets: true } }));
        let ticketsQuery;
        if (user.role === 'admin') {
          ticketsQuery = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
        } else {
          ticketsQuery = query(collection(db, 'tickets'), where('customerId', '==', user.uid));
        }

        const ticketsUnsub = onSnapshot(
          ticketsQuery, 
          (snapshot) => {
            const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            set({ tickets: list });
            markSuccess('tickets');
          }, 
          (err) => markError('tickets', err)
        );
        unsubscribers.push(ticketsUnsub);
      }

      // 5. Live Orders listener based on RBAC
      if (get().subscriptions.orders) {
        get().subscriptions.orders();
      }

      if (user?.uid) {
        set(state => ({ loadingStates: { ...state.loadingStates, orders: true } }));
        let ordersQuery;
        if (user.role === 'admin') {
          ordersQuery = collection(db, 'orders');
        } else if (user.role === 'rider') {
          ordersQuery = query(collection(db, 'orders'), where('riderId', '==', user.uid));
        } else if (user.role === 'vendor' && user.storeId) {
          ordersQuery = query(collection(db, 'orders'), where('storeId', '==', user.storeId));
        } else {
          ordersQuery = query(collection(db, 'orders'), where('customerId', '==', user.uid));
        }

        const ordersUnsub = onSnapshot(
          ordersQuery, 
          (snapshot) => {
            const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            list.sort((a, b) => new Date(b.placedAt || 0) - new Date(a.placedAt || 0));
            try {
              localStorage.setItem('mandi_synced_orders', JSON.stringify(list));
            } catch {}
            set({ orders: list });
            markSuccess('orders');
          }, 
          (err) => {
            console.error('Firestore orders subscription error:', err);
            try {
              const cached = JSON.parse(localStorage.getItem('mandi_synced_orders') || '[]');
              if (cached.length > 0) set({ orders: cached });
            } catch {}
            markError('orders', err);
          }
        );

        unsubscribers.push(ordersUnsub);
        set(state => ({ subscriptions: { ...state.subscriptions, orders: ordersUnsub } }));
      } else {
        set({ orders: [], loadingStates: { ...get().loadingStates, orders: false } });
      }
    } catch (err) {
      console.error('Subscription setup failed:', err);
    }

    return () => {
      unsubscribers.forEach(unsub => {
        if (typeof unsub === 'function') unsub();
      });
    };
  },

  retryFetch: (_key) => {
    // Allows UI components to trigger a reconnect / retry
    const user = get().user;
    get().initSubscriptions(user);
  },

  getStoresByPincode: (pincode) => {
    return get().stores.filter(s => s.status === 'approved' && (s.pincodes?.includes(pincode) || s.pincodes?.includes(String(pincode))));
  },

  getProductsByStore: (storeId) => {
    return get().products.filter(p => p.storeId === storeId);
  },

  getOrdersByCustomer: (customerId) => {
    return get().orders.filter(o => o.customerId === customerId).sort((a, b) => new Date(b.placedAt || 0) - new Date(a.placedAt || 0));
  },

  getOrdersByStore: (storeId) => {
    return get().orders.filter(o => o.storeId === storeId).sort((a, b) => new Date(b.placedAt || 0) - new Date(a.placedAt || 0));
  },

  addOrder: async (order) => {
    const orderId = order.id || `ord-${Date.now()}`;
    const placedAt = order.placedAt || new Date().toISOString();
    const newOrder = {
      ...order,
      id: orderId,
      placedAt,
      status: order.status || 'placed',
      paymentStatus: order.paymentStatus || (order.paymentMethod === 'Cash on Delivery' ? 'cod_pending' : 'pending'),
      statusHistory: order.statusHistory || [
        { status: 'placed', time: placedAt, note: 'Order placed successfully' }
      ],
    };

    if (db && isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'orders', orderId), newOrder);
      } catch (err) {
        console.warn('Direct order write:', err.message);
      }
    }
    set(state => ({ orders: [newOrder, ...state.orders.filter(o => o.id !== orderId)] }));
    return newOrder;
  },

  // Update order status with audit log
  updateOrderStatus: async (orderId, status, note = '') => {
    const historyEntry = { 
      status, 
      time: new Date().toISOString(), 
      note: note || `Order status updated to ${status.replace(/_/g, ' ')}` 
    };

    if (db && isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'orders', orderId), {
          status,
          statusHistory: arrayUnion(historyEntry),
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Firestore updateOrderStatus notice:', err.message);
      }
    }
    set(state => ({ orders: state.orders.map(o => o.id === orderId ? { ...o, status, statusHistory: [...(o.statusHistory || []), historyEntry] } : o) }));
  },

  // Products CRUD
  addProduct: async (product) => {
    const id = product.id || `p-${Date.now()}`;
    const newProduct = { ...product, id, createdAt: new Date().toISOString() };

    if (db) {
      try {
        await setDoc(doc(db, 'products', id), newProduct);
      } catch (err) {
        console.error('Error adding product to Firestore:', err);
        throw new Error('Could not add product. Please try again.');
      }
    }
    set(state => ({ products: [...state.products, newProduct] }));
    return newProduct;
  },

  updateProduct: async (productId, updates) => {
    if (db) {
      try {
        await updateDoc(doc(db, 'products', productId), updates);
      } catch (err) {
        console.error('Error updating product in Firestore:', err);
        throw new Error('Could not update product. Please try again.');
      }
    }
    set(state => ({ products: state.products.map(p => p.id === productId ? { ...p, ...updates } : p) }));
  },

  deleteProduct: async (productId) => {
    if (db) {
      try {
        await deleteDoc(doc(db, 'products', productId));
      } catch (err) {
        console.error('Error deleting product from Firestore:', err);
        throw new Error('Could not delete product. Please try again.');
      }
    }
    set(state => ({ products: state.products.filter(p => p.id !== productId) }));
  },

  // Stores CRUD
  addStore: async (storeData) => {
    const id = storeData.id || `store-${Date.now()}`;
    const newStore = {
      id,
      status: 'approved',
      rating: 4.8,
      totalRatings: 10,
      deliveryTime: '15-20 min',
      minOrder: 99,
      deliveryCharge: 0,
      image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&q=80',
      categories: ['cat-1', 'cat-2', 'cat-3', 'cat-4'],
      ...storeData,
    };

    if (db) {
      try {
        await setDoc(doc(db, 'stores', id), newStore);
      } catch (err) {
        console.error('Error adding store to Firestore:', err);
        throw new Error('Could not create store. Please try again.');
      }
    }
    set(state => ({ stores: [...state.stores, newStore] }));
    return newStore;
  },

  submitVendorApplication: async (application) => {
    const id = application.id || `store-${Date.now()}`;
    const newStore = {
      id,
      status: 'approved',
      rating: 4.9,
      totalRatings: 1,
      deliveryTime: '10-15 min',
      minOrder: 99,
      deliveryCharge: 0,
      image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&q=80',
      coverImage: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=1200&q=80',
      categories: ['cat-1', 'cat-2', 'cat-3', 'cat-4'],
      createdAt: new Date().toISOString(),
      ...application,
      id,
    };

    if (isFirebaseConfigured && functions) {
      try {
        const result = await httpsCallable(functions, 'submitVendorApplication')({ application: newStore });
        if (result?.data?.application) {
          const appRes = result.data.application;
          set(state => ({ stores: [...state.stores.filter(s => s.id !== appRes.id), appRes] }));
          return appRes;
        }
      } catch (cloudErr) {
        console.warn('Cloud function submitVendorApplication notice, using direct store creation fallback:', cloudErr?.message);
      }
    }

    if (db && isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'stores', id), newStore, { merge: true });
      } catch (err) {
        console.error('Error saving store application to Firestore:', err);
      }
    }

    set(state => ({ stores: [...state.stores.filter(s => s.id !== id), newStore] }));
    return newStore;
  },

  updateStore: async (storeId, updates) => {
    set(state => ({
      stores: state.stores.map(s => s.id === storeId ? { ...s, ...updates } : s)
    }));

    if (db) {
      try {
        await updateDoc(doc(db, 'stores', storeId), updates);
      } catch (err) {
        console.error('Error updating store in Firestore:', err);
      }
    }
  },

  deleteStore: async (storeId) => {
    set(state => ({
      stores: state.stores.filter(s => s.id !== storeId)
    }));

    if (db) {
      try {
        await deleteDoc(doc(db, 'stores', storeId));
      } catch (err) {
        console.error('Error deleting store from Firestore:', err);
      }
    }
  },

  // Banners CRUD
  addBanner: async (banner) => {
    const id = banner.id || `b-${Date.now()}`;
    const newBanner = { ...banner, id, active: true };

    set(state => ({ banners: [...state.banners, newBanner] }));

    if (db) {
      try {
        await setDoc(doc(db, 'banners', id), newBanner);
      } catch (err) {
        console.error('Error adding banner to Firestore:', err);
      }
    }
    return newBanner;
  },

  updateBanner: async (id, updates) => {
    set(state => ({
      banners: state.banners.map(b => b.id === id ? { ...b, ...updates } : b)
    }));

    if (db) {
      try {
        await updateDoc(doc(db, 'banners', id), updates);
      } catch (err) {
        console.error('Error updating banner in Firestore:', err);
      }
    }
  },

  deleteBanner: async (id) => {
    set(state => ({
      banners: state.banners.filter(b => b.id !== id)
    }));

    if (db) {
      try {
        await deleteDoc(doc(db, 'banners', id));
      } catch (err) {
        console.error('Error deleting banner from Firestore:', err);
      }
    }
  },

  // Tickets CRUD
  addTicket: async (ticket) => {
    const id = ticket.id || `tk-${Date.now()}`;
    const newTicket = { 
      ...ticket, 
      id, 
      status: 'open', 
      createdAt: new Date().toISOString(), 
      reply: '' 
    };

    if (db) {
      try {
        await setDoc(doc(db, 'tickets', id), newTicket);
      } catch (err) {
        console.error('Error adding ticket to Firestore:', err);
        throw new Error('Could not create support ticket. Please try again.');
      }
    }
    set(state => ({ tickets: [...state.tickets, newTicket] }));
    return newTicket;
  },

  resolveTicket: async (id, reply) => {
    const updates = { status: 'resolved', reply, resolvedAt: new Date().toISOString() };

    set(state => ({
      tickets: state.tickets.map(t => t.id === id ? { ...t, ...updates } : t)
    }));

    if (db) {
      try {
        await updateDoc(doc(db, 'tickets', id), updates);
      } catch (err) {
        console.error('Error resolving ticket in Firestore:', err);
      }
    }
  },

  // Store Reviews
  addStoreReview: async ({ storeId, orderId, rating, comment, userId, userName }) => {
    const reviewId = `rev-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const reviewPayload = {
      id: reviewId,
      userId,
      userName: userName || 'Verified Customer',
      rating: Number(rating) || 5,
      comment: comment || '',
      orderId,
      createdAt,
    };

    if (isFirebaseConfigured) {
      const result = await httpsCallable(functions, 'submitStoreReview')({ storeId, orderId, rating, comment });
      return result.data.review;
    }
    set(state => ({ orders: state.orders.map(o => o.id === orderId ? { ...o, isReviewed: true, review: reviewPayload } : o) }));
    return reviewPayload;
  },
}));
