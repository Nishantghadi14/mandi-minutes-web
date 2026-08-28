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
  arrayUnion 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import { initialStores } from '../data/initialStores';
import { initialProducts } from '../data/initialProducts';
import { initialCategories } from '../data/initialCategories';
import { seedVirarDatabase } from '../config/seedDatabase';

const defaultBanners = [
  { id: 'b1', title: '🎉 Flat 20% off on first order!', subtitle: 'Use code NEWUSER at checkout', color: 'from-green-900 to-mandi-dark', active: true },
  { id: 'b2', title: '⚡ Express Delivery in 10 min', subtitle: 'Available in select pincodes', color: 'from-yellow-900 to-mandi-dark', active: true },
  { id: 'b3', title: '🛒 Free delivery above ₹199', subtitle: 'On all orders from local stores', color: 'from-blue-900 to-mandi-dark', active: true },
];

export const useDataStore = create((set, get) => ({
  stores: initialStores,
  products: initialProducts,
  orders: [],
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

    // Auto seed check
    seedVirarDatabase().catch(err => console.warn('Auto seed check:', err));

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
        collection(db, 'stores'), 
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
        if (user.role === 'admin' || user.role === 'rider') {
          ordersQuery = query(collection(db, 'orders'), orderBy('placedAt', 'desc'));
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
            set({ orders: list });
            markSuccess('orders');
          }, 
          (err) => markError('orders', err)
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

  retryFetch: (key) => {
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

  // Add Order directly to Firestore
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

    set(state => ({
      orders: [newOrder, ...state.orders.filter(o => o.id !== orderId)]
    }));

    if (db) {
      try {
        await setDoc(doc(db, 'orders', orderId), newOrder);
      } catch (err) {
        console.error('Error saving order to Firestore:', err);
        throw err;
      }
    }

    return newOrder;
  },

  // Update order status with audit log
  updateOrderStatus: async (orderId, status, note = '') => {
    const historyEntry = { 
      status, 
      time: new Date().toISOString(), 
      note: note || `Order status updated to ${status.replace(/_/g, ' ')}` 
    };

    set(state => ({
      orders: state.orders.map(o => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          status,
          statusHistory: [...(o.statusHistory || []), historyEntry]
        };
      })
    }));

    if (db) {
      try {
        await updateDoc(doc(db, 'orders', orderId), {
          status,
          statusHistory: arrayUnion(historyEntry)
        });
      } catch (err) {
        console.error('Error updating order status in Firestore:', err);
      }
    }
  },

  // Products CRUD
  addProduct: async (product) => {
    const id = product.id || `p-${Date.now()}`;
    const newProduct = { ...product, id, createdAt: new Date().toISOString() };

    set(state => ({ products: [...state.products, newProduct] }));

    if (db) {
      try {
        await setDoc(doc(db, 'products', id), newProduct);
      } catch (err) {
        console.error('Error adding product to Firestore:', err);
      }
    }
    return newProduct;
  },

  updateProduct: async (productId, updates) => {
    set(state => ({
      products: state.products.map(p => p.id === productId ? { ...p, ...updates } : p)
    }));

    if (db) {
      try {
        await updateDoc(doc(db, 'products', productId), updates);
      } catch (err) {
        console.error('Error updating product in Firestore:', err);
      }
    }
  },

  deleteProduct: async (productId) => {
    set(state => ({
      products: state.products.filter(p => p.id !== productId)
    }));

    if (db) {
      try {
        await deleteDoc(doc(db, 'products', productId));
      } catch (err) {
        console.error('Error deleting product from Firestore:', err);
      }
    }
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

    set(state => ({ stores: [...state.stores, newStore] }));

    if (db) {
      try {
        await setDoc(doc(db, 'stores', id), newStore);
      } catch (err) {
        console.error('Error adding store to Firestore:', err);
      }
    }
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

    set(state => ({ tickets: [...state.tickets, newTicket] }));

    if (db) {
      try {
        await setDoc(doc(db, 'tickets', id), newTicket);
      } catch (err) {
        console.error('Error adding ticket to Firestore:', err);
      }
    }
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

    // 1. Update local state
    set(state => ({
      orders: state.orders.map(o => o.id === orderId ? { ...o, isReviewed: true, review: reviewPayload } : o),
      stores: state.stores.map(s => {
        if (s.id !== storeId) return s;
        const currentCount = Number(s.totalRatings) || 0;
        const currentAvg = Number(s.rating) || 4.5;
        const newCount = currentCount + 1;
        const newAvg = Number(((currentAvg * currentCount + Number(rating)) / newCount).toFixed(1));
        return { ...s, rating: newAvg, totalRatings: newCount };
      })
    }));

    // 2. Persist to Firestore
    if (db) {
      try {
        await setDoc(doc(db, 'stores', storeId, 'reviews', reviewId), reviewPayload);
        await updateDoc(doc(db, 'orders', orderId), {
          isReviewed: true,
          reviewRating: Number(rating),
        });

        const storeRef = doc(db, 'stores', storeId);
        const storeSnap = await getDoc(storeRef);
        if (storeSnap.exists()) {
          const storeData = storeSnap.data();
          const currentCount = Number(storeData.totalRatings) || 0;
          const currentAvg = Number(storeData.rating) || 4.5;
          const newCount = currentCount + 1;
          const newAvg = Number(((currentAvg * currentCount + Number(rating)) / newCount).toFixed(1));

          await updateDoc(storeRef, {
            rating: newAvg,
            totalRatings: newCount,
          });
        }
      } catch (err) {
        console.error('Error adding store review to Firestore:', err);
      }
    }

    return reviewPayload;
  },
}));
