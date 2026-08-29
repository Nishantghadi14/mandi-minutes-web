import { create } from 'zustand';

const GUEST_CART_KEY = 'mandi_cart_guest';
const LEGACY_CART_KEY = 'mandi_cart';

const getCartKey = (userId) => {
  return userId ? `mandi_cart_${userId}` : GUEST_CART_KEY;
};

const loadCartFromStorage = (key) => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(key);
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

const getInitialItems = () => {
  if (typeof window === 'undefined') return [];
  // Migrate legacy mandi_cart to mandi_cart_guest if needed
  try {
    const guestStored = localStorage.getItem(GUEST_CART_KEY);
    if (!guestStored) {
      const legacy = localStorage.getItem(LEGACY_CART_KEY);
      if (legacy) {
        localStorage.setItem(GUEST_CART_KEY, legacy);
        localStorage.removeItem(LEGACY_CART_KEY);
      }
    }
  } catch {
    // ignore
  }
  return loadCartFromStorage(GUEST_CART_KEY);
};

export const useCartStore = create((set, get) => ({
  items: getInitialItems(),
  currentUserId: null,
  isOpen: false,
  coupon: null,

  setIsOpen: (isOpen) => set({ isOpen }),
  toggleCart: () => set(state => ({ isOpen: !state.isOpen })),

  switchUser: (newUserId) => {
    const prevUserId = get().currentUserId;
    if (prevUserId === newUserId) return;

    const currentItems = get().items;
    const prevKey = getCartKey(prevUserId);
    const newKey = getCartKey(newUserId);

    // Save current items to previous user's key before switching if needed
    if (currentItems.length > 0) {
      try {
        localStorage.setItem(prevKey, JSON.stringify(currentItems));
      } catch {
        // ignore
      }
    }

    if (newUserId) {
      // User is logging in
      const userSavedItems = loadCartFromStorage(newKey);
      if (userSavedItems.length > 0) {
        // User already has their own saved cart
        set({ currentUserId: newUserId, items: userSavedItems });
      } else if (currentItems.length > 0 && prevUserId === null) {
        // Guest cart migrates into the newly logged-in user's cart
        try {
          localStorage.setItem(newKey, JSON.stringify(currentItems));
          localStorage.removeItem(GUEST_CART_KEY);
        } catch {
          // ignore
        }
        set({ currentUserId: newUserId, items: currentItems });
      } else {
        set({ currentUserId: newUserId, items: [] });
      }
    } else {
      // User logged out -> switch to clean guest cart
      const guestItems = loadCartFromStorage(GUEST_CART_KEY);
      set({ currentUserId: null, items: guestItems, coupon: null });
    }
  },

  addItem: (product, quantity = 1) => {
    set(state => {
      const existing = state.items.find(i => i.id === product.id);
      let updated;
      if (existing) {
        updated = state.items.map(i => i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i);
      } else {
        updated = [...state.items, { ...product, quantity }];
      }
      try {
        localStorage.setItem(getCartKey(state.currentUserId), JSON.stringify(updated));
      } catch {
        // ignore
      }
      return { items: updated };
    });
  },

  removeItem: (productId) => {
    set(state => {
      const updated = state.items.filter(i => i.id !== productId);
      try {
        localStorage.setItem(getCartKey(state.currentUserId), JSON.stringify(updated));
      } catch {
        // ignore
      }
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
      try {
        localStorage.setItem(getCartKey(state.currentUserId), JSON.stringify(updated));
      } catch {
        // ignore
      }
      return { items: updated };
    });
  },

  clearCart: () => {
    const key = getCartKey(get().currentUserId);
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
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
