import { useCartStore, selectSubtotal, selectDiscount, selectDeliveryCharge, selectTotal, selectItemCount, selectStoreId } from '../store/useCartStore';

export function CartProvider({ children }) {
  return <>{children}</>;
}

export const useCart = () => {
  const items = useCartStore(state => state.items);
  const isOpen = useCartStore(state => state.isOpen);
  const coupon = useCartStore(state => state.coupon);
  const addItem = useCartStore(state => state.addItem);
  const removeItem = useCartStore(state => state.removeItem);
  const updateQuantity = useCartStore(state => state.updateQuantity);
  const clearCart = useCartStore(state => state.clearCart);
  const applyCoupon = useCartStore(state => state.applyCoupon);
  const removeCoupon = useCartStore(state => state.removeCoupon);
  const setIsOpen = useCartStore(state => state.setIsOpen);
  const toggleCart = useCartStore(state => state.toggleCart);

  // Derived state with atomic selectors
  const subtotal = useCartStore(selectSubtotal);
  const discount = useCartStore(selectDiscount);
  const deliveryCharge = useCartStore(selectDeliveryCharge);
  const total = useCartStore(selectTotal);
  const itemCount = useCartStore(selectItemCount);
  const storeId = useCartStore(selectStoreId);

  return {
    items,
    isOpen,
    coupon,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    applyCoupon,
    removeCoupon,
    setIsOpen,
    toggleCart,
    subtotal,
    discount,
    deliveryCharge,
    total,
    itemCount,
    storeId,
  };
};
