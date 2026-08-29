import { create } from 'zustand';

const CART_KEY = 'mandi_cart';

const getInitialItems = () => {
  try {
    const stored = localStorage.getItem(CART_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed.filter(item => item.storeId === 'store-mahalaxmi-1' || item.id?.startsWith('prod-'));
    }
    return [];
  } catch {
    return [];
  }
};

export const useCartStore = create((set, get) => ({
  items: getInitialItems(),
  isOpen: false,
  coupon: null,

  setIsOpen: (isOpen) => set({ isOpen }),
  toggleCart: () => set(state => ({ isOpen: !state.isOpen })),

  addItem: (product, quantity = 1) => {
    set(state => {
      const existing = state.items.find(i => i.id === product.id);
      let updated;
      if (existing) {
        updated = state.items.map(i => i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i);
      } else {
        updated = [...state.items, { ...product, quantity }];
      }
      localStorage.setItem(CART_KEY, JSON.stringify(updated));
      return { items: updated };
    });
  },

  removeItem: (productId) => {
    set(state => {
      const updated = state.items.filter(i => i.id !== productId);
      localStorage.setItem(CART_KEY, JSON.stringify(updated));
      return { items: updated };
    });
  },

  updateQuantity: (productId, quantity) => {
    set(state => {
      let updated;
      if (quantity <= 0) {
        updated = state.items.filter(i => i.id !== productId);
      } else {
        updated = state.items.map(i => i.id === productId ? { ...i, quantity } : i);
      }
      localStorage.setItem(CART_KEY, JSON.stringify(updated));
      return { items: updated };
    });
  },

  clearCart: () => {
    localStorage.removeItem(CART_KEY);
    set({ items: [], coupon: null });
  },

  applyCoupon: (code) => {
    const coupons = {
      'MANDI10': { discount: 10, type: 'percent', label: '10% off' },
      'FLAT50': { discount: 50, type: 'flat', label: '₹50 off' },
      'NEWUSER': { discount: 20, type: 'percent', label: '20% off for new users' },
      'REF50': { discount: 50, type: 'flat', label: '₹50 off with referral code' },
    };
    const found = coupons[code.toUpperCase()];
    if (found) {
      const couponObj = { code: code.toUpperCase(), ...found };
      set({ coupon: couponObj });
      return found;
    }
    throw new Error('Invalid coupon code');
  },

  removeCoupon: () => set({ coupon: null }),
}));

// Derived selectors for memory efficient re-renders
export const selectSubtotal = (state) => state.items.reduce((s, i) => s + i.price * i.quantity, 0);
export const selectDiscount = (state) => {
  const subtotal = selectSubtotal(state);
  if (!state.coupon) return 0;
  return state.coupon.type === 'percent' ? Math.round(subtotal * state.coupon.discount / 100) : state.coupon.discount;
};
export const selectDeliveryCharge = (state) => {
  const subtotal = selectSubtotal(state);
  return subtotal > 199 ? 0 : (state.items.length > 0 ? 20 : 0);
};
export const selectTotal = (state) => {
  const subtotal = selectSubtotal(state);
  const discount = selectDiscount(state);
  const deliveryCharge = selectDeliveryCharge(state);
  return subtotal - discount + deliveryCharge;
};
export const selectItemCount = (state) => state.items.reduce((s, i) => s + i.quantity, 0);
export const selectStoreId = (state) => state.items.length > 0 ? state.items[0].storeId : null;
