import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// ─── Translation Resources ────────────────────────────────────────────────────
const resources = {
  en: {
    translation: {
      // Navigation
      nav: {
        home: 'Home',
        search: 'Search',
        orders: 'My Orders',
        wishlist: 'Wishlist',
        refer: 'Refer & Earn ₹50',
        login: 'Login',
        logout: 'Logout',
      },
      // Categories
      categories: {
        vegetables: 'Vegetables',
        fruits: 'Fruits',
        dairy: 'Dairy & Eggs',
        grains: 'Grains & Rice',
        pulses: 'Pulses & Dal',
        snacks: 'Snacks',
        beverages: 'Beverages',
        oil: 'Oil & Ghee',
        masala: 'Masala & Spices',
        household: 'Household',
      },
      // Checkout
      checkout: {
        title: 'Checkout',
        delivery: 'Delivery Address',
        payment: 'Payment Method',
        summary: 'Order Summary',
        subtotal: 'Subtotal',
        deliveryCharge: 'Delivery Charge',
        discount: 'Discount',
        total: 'Total',
        placeOrder: 'Place Order',
        couponPlaceholder: 'Enter coupon code',
        applyCoupon: 'Apply',
        expressDelivery: 'Express (10-15 mins)',
        scheduled: 'Scheduled Slot',
        cod: 'Cash on Delivery',
        upi: 'UPI Payment',
        online: 'Online Payment',
        free: 'FREE',
      },
      // Order status
      orderStatus: {
        placed: 'Order Placed',
        accepted: 'Accepted by Store',
        preparing: 'Packing Your Order',
        out_for_delivery: 'Out for Delivery',
        delivered: 'Delivered',
        cancelled: 'Cancelled',
      },
      // Error states
      errors: {
        loadFailed: 'Failed to load. Please try again.',
        networkError: 'Network error. Check your connection.',
        outOfStock: 'This item is out of stock.',
        minOrder: 'Minimum order amount is ₹49.',
        invalidCoupon: 'Invalid coupon code.',
      },
      // Common
      common: {
        addToCart: 'Add to Cart',
        viewAll: 'View All',
        search: 'Search products, stores...',
        noResults: 'No results found',
        loading: 'Loading...',
        back: 'Back',
        continue: 'Continue',
        confirm: 'Confirm',
        cancel: 'Cancel',
        save: 'Save',
        delete: 'Delete',
        edit: 'Edit',
        close: 'Close',
        virar: 'Virar, Palghar',
        express: '10-15 min delivery',
      },
    },
  },

  hi: {
    translation: {
      // Navigation
      nav: {
        home: 'होम',
        search: 'खोजें',
        orders: 'मेरे ऑर्डर',
        wishlist: 'विशलिस्ट',
        refer: 'रेफर करें & ₹50 पाएं',
        login: 'लॉग इन',
        logout: 'लॉग आउट',
      },
      // Categories
      categories: {
        vegetables: 'सब्जियां',
        fruits: 'फल',
        dairy: 'डेयरी & अंडे',
        grains: 'अनाज & चावल',
        pulses: 'दालें',
        snacks: 'स्नैक्स',
        beverages: 'पेय पदार्थ',
        oil: 'तेल & घी',
        masala: 'मसाले',
        household: 'घरेलू सामान',
      },
      // Checkout
      checkout: {
        title: 'चेकआउट',
        delivery: 'डिलीवरी पता',
        payment: 'भुगतान का तरीका',
        summary: 'ऑर्डर सारांश',
        subtotal: 'उप-कुल',
        deliveryCharge: 'डिलीवरी शुल्क',
        discount: 'छूट',
        total: 'कुल',
        placeOrder: 'ऑर्डर करें',
        couponPlaceholder: 'कूपन कोड दर्ज करें',
        applyCoupon: 'लागू करें',
        expressDelivery: 'एक्सप्रेस (10-15 मिनट)',
        scheduled: 'निर्धारित समय',
        cod: 'नकद भुगतान (COD)',
        upi: 'UPI भुगतान',
        online: 'ऑनलाइन भुगतान',
        free: 'मुफ्त',
      },
      // Order status
      orderStatus: {
        placed: 'ऑर्डर दर्ज हुआ',
        accepted: 'दुकान ने स्वीकार किया',
        preparing: 'पैकिंग हो रही है',
        out_for_delivery: 'डिलीवरी पर निकला',
        delivered: 'डिलीवर हो गया',
        cancelled: 'रद्द किया गया',
      },
      // Error states
      errors: {
        loadFailed: 'लोड करने में विफल। पुनः प्रयास करें।',
        networkError: 'नेटवर्क त्रुटि। कनेक्शन जांचें।',
        outOfStock: 'यह उत्पाद स्टॉक में नहीं है।',
        minOrder: 'न्यूनतम ऑर्डर राशि ₹49 है।',
        invalidCoupon: 'अमान्य कूपन कोड।',
      },
      // Common
      common: {
        addToCart: 'कार्ट में जोड़ें',
        viewAll: 'सब देखें',
        search: 'उत्पाद, दुकानें खोजें...',
        noResults: 'कोई परिणाम नहीं मिला',
        loading: 'लोड हो रहा है...',
        back: 'वापस',
        continue: 'जारी रखें',
        confirm: 'पुष्टि करें',
        cancel: 'रद्द करें',
        save: 'सहेजें',
        delete: 'हटाएं',
        edit: 'संपादित करें',
        close: 'बंद करें',
        virar: 'विरार, पालघर',
        express: '10-15 मिनट डिलीवरी',
      },
    },
  },

  mr: {
    translation: {
      // Navigation
      nav: {
        home: 'मुखपृष्ठ',
        search: 'शोधा',
        orders: 'माझे ऑर्डर',
        wishlist: 'इच्छासूची',
        refer: 'रेफर करा & ₹50 मिळवा',
        login: 'लॉग इन',
        logout: 'लॉग आउट',
      },
      // Categories
      categories: {
        vegetables: 'भाज्या',
        fruits: 'फळे',
        dairy: 'दुग्धजन्य & अंडी',
        grains: 'धान्य & तांदूळ',
        pulses: 'डाळी',
        snacks: 'स्नॅक्स',
        beverages: 'पेये',
        oil: 'तेल & तूप',
        masala: 'मसाले',
        household: 'घरगुती वस्तू',
      },
      // Checkout
      checkout: {
        title: 'चेकआउट',
        delivery: 'डिलिव्हरी पत्ता',
        payment: 'पेमेंट पद्धत',
        summary: 'ऑर्डर सारांश',
        subtotal: 'उप-एकूण',
        deliveryCharge: 'डिलिव्हरी शुल्क',
        discount: 'सूट',
        total: 'एकूण',
        placeOrder: 'ऑर्डर द्या',
        couponPlaceholder: 'कूपन कोड टाका',
        applyCoupon: 'लागू करा',
        expressDelivery: 'एक्सप्रेस (10-15 मिनिटे)',
        scheduled: 'ठरवलेली वेळ',
        cod: 'रोख पैसे (COD)',
        upi: 'UPI पेमेंट',
        online: 'ऑनलाइन पेमेंट',
        free: 'मोफत',
      },
      // Order status
      orderStatus: {
        placed: 'ऑर्डर नोंदवला',
        accepted: 'दुकानाने स्वीकारले',
        preparing: 'पॅकिंग होत आहे',
        out_for_delivery: 'डिलिव्हरीसाठी निघाले',
        delivered: 'डिलिव्हर झाले',
        cancelled: 'रद्द केले',
      },
      // Error states
      errors: {
        loadFailed: 'लोड करणे अयशस्वी. पुन्हा प्रयत्न करा.',
        networkError: 'नेटवर्क त्रुटी. कनेक्शन तपासा.',
        outOfStock: 'हा उत्पाद स्टॉकमध्ये नाही.',
        minOrder: 'किमान ऑर्डर रक्कम ₹49 आहे.',
        invalidCoupon: 'अवैध कूपन कोड.',
      },
      // Common
      common: {
        addToCart: 'कार्टमध्ये जोडा',
        viewAll: 'सर्व पहा',
        search: 'उत्पादने, दुकाने शोधा...',
        noResults: 'कोणतेही परिणाम आढळले नाहीत',
        loading: 'लोड होत आहे...',
        back: 'मागे',
        continue: 'पुढे जा',
        confirm: 'पुष्टी करा',
        cancel: 'रद्द करा',
        save: 'जतन करा',
        delete: 'हटवा',
        edit: 'संपादित करा',
        close: 'बंद करा',
        virar: 'विरार, पालघर',
        express: '10-15 मिनिट डिलिव्हरी',
      },
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('mandi-lang') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes
    },
  });

export default i18n;
