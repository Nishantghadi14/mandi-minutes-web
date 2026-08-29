import { useEffect } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useAuthStore } from '../store/useAuthStore';

export function DataProvider({ children }) {
  const user = useAuthStore(state => state.user);
  const initSubscriptions = useDataStore(state => state.initSubscriptions);

  // Track uid + role as stable primitive keys so we re-subscribe when role resolves
  const uid = user?.uid ?? null;
  const role = user?.role ?? null;

  useEffect(() => {
    const unsubscribe = initSubscriptions(user);
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, role, initSubscriptions]);

  return <>{children}</>;
}

export const useData = () => {
  const stores = useDataStore(state => state.stores);
  const products = useDataStore(state => state.products);
  const orders = useDataStore(state => state.orders);
  const banners = useDataStore(state => state.banners);
  const categories = useDataStore(state => state.categories);
  const tickets = useDataStore(state => state.tickets);
  
  const loadingStates = useDataStore(state => state.loadingStates);
  const errorStates = useDataStore(state => state.errorStates);
  const retryFetch = useDataStore(state => state.retryFetch);

  const getStoresByPincode = useDataStore(state => state.getStoresByPincode);
  const getProductsByStore = useDataStore(state => state.getProductsByStore);
  const getOrdersByCustomer = useDataStore(state => state.getOrdersByCustomer);
  const getOrdersByStore = useDataStore(state => state.getOrdersByStore);
  const addOrder = useDataStore(state => state.addOrder);
  const updateOrderStatus = useDataStore(state => state.updateOrderStatus);
  const addProduct = useDataStore(state => state.addProduct);
  const updateProduct = useDataStore(state => state.updateProduct);
  const deleteProduct = useDataStore(state => state.deleteProduct);
  const addStore = useDataStore(state => state.addStore);
  const updateStore = useDataStore(state => state.updateStore);
  const deleteStore = useDataStore(state => state.deleteStore);
  const addBanner = useDataStore(state => state.addBanner);
  const updateBanner = useDataStore(state => state.updateBanner);
  const deleteBanner = useDataStore(state => state.deleteBanner);
  const addTicket = useDataStore(state => state.addTicket);
  const resolveTicket = useDataStore(state => state.resolveTicket);
  const addStoreReview = useDataStore(state => state.addStoreReview);
  const submitVendorApplication = useDataStore(state => state.submitVendorApplication);

  return {
    stores,
    products,
    orders,
    banners,
    categories,
    tickets,
    loadingStates,
    errorStates,
    retryFetch,
    getStoresByPincode,
    getProductsByStore,
    getOrdersByCustomer,
    getOrdersByStore,
    addOrder,
    updateOrderStatus,
    addProduct,
    updateProduct,
    deleteProduct,
    addStore,
    updateStore,
    deleteStore,
    addBanner,
    updateBanner,
    deleteBanner,
    addTicket,
    resolveTicket,
    addStoreReview,
    submitVendorApplication,
  };
};
