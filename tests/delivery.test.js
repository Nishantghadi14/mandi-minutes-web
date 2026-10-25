import { describe, it, expect } from 'vitest';
import { createSecureOrder } from '../src/services/orderService';
import { SAME_DAY_SLOTS, SCHEDULED_SLOTS } from '../src/pages/CheckoutPage';
import { generateWhatsAppOrderMessage, generateCustomerShareMessage } from '../src/utils/whatsappFormatter';

describe('Same-Day and Scheduled Delivery Slots Configuration', () => {
  it('provides comprehensive same-day delivery slots including express instant', () => {
    expect(SAME_DAY_SLOTS.length).toBeGreaterThanOrEqual(3);
    const expressSlot = SAME_DAY_SLOTS.find(s => s.id === 'same-day-express');
    expect(expressSlot).toBeDefined();
    expect(expressSlot.date).toBe('Today');
    expect(expressSlot.timeWindow).toBe('15–30 Mins');
    expect(expressSlot.badge).toContain('Fastest');

    const eveSlot = SAME_DAY_SLOTS.find(s => s.id === 'same-day-eve');
    expect(eveSlot).toBeDefined();
    expect(eveSlot.date).toBe('Today');
  });

  it('provides comprehensive scheduled delivery slots for tomorrow and advance days without using word future', () => {
    expect(SCHEDULED_SLOTS.length).toBeGreaterThanOrEqual(3);
    const mornSlot = SCHEDULED_SLOTS.find(s => s.id === 'tom-morn');
    expect(mornSlot).toBeDefined();
    expect(mornSlot.date).toBe('Tomorrow');
    expect(mornSlot.timeWindow).toContain('07:00 AM');

    const advanceSlot = SCHEDULED_SLOTS.find(s => s.id === 'day-after-morn');
    expect(advanceSlot).toBeDefined();
    expect(advanceSlot.date).toBe('Day After Tomorrow');

    // Ensure none of the scheduled slots use the word "future"
    for (const slot of SCHEDULED_SLOTS) {
      expect(JSON.stringify(slot).toLowerCase()).not.toContain('future');
    }
  });
});

describe('Mandatory Address Validation for Checkout', () => {
  it('rejects address submission with empty line1', async () => {
    const { validateAddress } = await import('../src/utils/validators');
    const result = validateAddress({ label: 'Home', line1: '', city: 'Virar West', pincode: '401303' });
    expect(result.valid).toBe(false);
    expect(result.errors.line1).toBeDefined();
  });

  it('rejects address submission with empty city or invalid pincode', async () => {
    const { validateAddress } = await import('../src/utils/validators');
    const result = validateAddress({ label: 'Home', line1: 'Flat 101, Gokul Heights', city: '', pincode: '123' });
    expect(result.valid).toBe(false);
    expect(result.errors.city).toBeDefined();
    expect(result.errors.pincode).toBeDefined();
  });

  it('accepts complete and valid delivery address', async () => {
    const { validateAddress } = await import('../src/utils/validators');
    const result = validateAddress({ label: 'Home', line1: 'Flat 101, Gokul Heights', city: 'Virar West', pincode: '401303' });
    expect(result.valid).toBe(true);
    expect(result.sanitized.line1).toBe('Flat 101, Gokul Heights');
  });
});

describe('Order Creation with Same-Day & Scheduled Delivery', () => {
  const dummyItems = [
    { productId: 'p1', name: 'Kolam Rice', price: 65, quantity: 2, unit: 'kg' },
  ];
  const dummyAddress = {
    label: 'Home',
    line1: 'Near Station, Virar West',
    city: 'Virar',
    pincode: '401303',
  };

  it('creates an order with Same-Day delivery and retains chosen slot', async () => {
    const chosenSlot = SAME_DAY_SLOTS[0];
    const order = await createSecureOrder({
      items: dummyItems,
      storeId: 'store-1',
      storeName: 'Virar Kirana',
      address: dummyAddress,
      deliveryType: 'same-day',
      scheduledSlot: chosenSlot,
      paymentMethod: 'Cash on Delivery',
    });

    expect(order.deliveryType).toBe('same-day');
    expect(order.scheduledSlot).toBeDefined();
    expect(order.scheduledSlot.label).toBe(chosenSlot.label);
    expect(order.total).toBe(130 + 20); // 130 + 20 delivery charge for orders < 199
  });

  it('creates an order with Scheduled delivery and retains chosen scheduled slot', async () => {
    const chosenSlot = SCHEDULED_SLOTS[0];
    const order = await createSecureOrder({
      items: dummyItems,
      storeId: 'store-1',
      storeName: 'Virar Kirana',
      address: dummyAddress,
      deliveryType: 'scheduled',
      scheduledSlot: chosenSlot,
      paymentMethod: 'Cash on Delivery',
    });

    expect(order.deliveryType).toBe('scheduled');
    expect(order.scheduledSlot).toBeDefined();
    expect(order.scheduledSlot.date).toBe('Tomorrow');
    expect(order.scheduledSlot.label).toContain('Tomorrow Morning');
  });
});

describe('WhatsApp Message Formatting with Delivery Types', () => {
  it('formats Kirana bill message with Same-Day delivery slot', () => {
    const order = {
      id: 'ord_123',
      storeName: 'Krishna Kirana',
      total: 250,
      paymentMethod: 'Cash on Delivery',
      deliveryType: 'same-day',
      scheduledSlot: { label: 'Express Instant (15-30 Mins)' },
      items: [{ name: 'Rice', quantity: 1, unit: 'kg', price: 60 }],
      address: { label: 'Home', line1: 'Virar West', city: 'Virar', pincode: '401303' },
    };
    const store = { ownerPhone: '9920941603', name: 'Krishna Kirana' };
    const { message } = generateWhatsAppOrderMessage(order, store);

    expect(message).toContain('Express Instant (15-30 Mins)');
  });

  it('formats customer share receipt with Scheduled delivery slot', () => {
    const order = {
      id: 'ord_456',
      storeName: 'Krishna Kirana',
      total: 350,
      paymentMethod: 'UPI / Online Gateway',
      deliveryType: 'scheduled',
      scheduledSlot: { label: 'Tomorrow Morning (7AM–11AM)' },
      items: [{ name: 'Wheat', quantity: 2, unit: 'kg', price: 40 }],
      status: 'placed',
    };
    const { message } = generateCustomerShareMessage(order);

    expect(message).toContain('Tomorrow Morning (7AM–11AM)');
  });
});

describe('Cash on Delivery and UPI Mode Order Execution', () => {
  const dummyItems = [
    { productId: 'p1', name: 'Alphonso Mango', price: 150, quantity: 1, unit: 'box' },
  ];
  const dummyAddress = {
    label: 'Home',
    line1: 'B-201, Shanti Park, Viva College Road',
    city: 'Virar West',
    pincode: '401303',
  };

  it('successfully places Cash on Delivery order with cod_pending status and delivery charge', async () => {
    const codOrder = await createSecureOrder({
      items: dummyItems,
      storeId: 'store-mahalaxmi-1',
      storeName: 'Mahalaxmi Kirana',
      address: dummyAddress,
      deliveryType: 'same-day',
      scheduledSlot: SAME_DAY_SLOTS[0],
      paymentMethod: 'Cash on Delivery',
    });

    expect(codOrder).toBeDefined();
    expect(codOrder.id).toMatch(/^ord_/);
    expect(codOrder.paymentMethod).toBe('Cash on Delivery');
    expect(codOrder.paymentStatus).toBe('cod_pending');
    expect(codOrder.status).toBe('placed');
    expect(codOrder.total).toBe(150 + 20); // 150 + 20 (< 199 delivery charge)
  });

  it('successfully creates UPI / Online Gateway order with pending status for modal payment', async () => {
    const upiOrder = await createSecureOrder({
      items: dummyItems,
      storeId: 'store-mahalaxmi-1',
      storeName: 'Mahalaxmi Kirana',
      address: dummyAddress,
      deliveryType: 'scheduled',
      scheduledSlot: SCHEDULED_SLOTS[0],
      paymentMethod: 'UPI / Online Gateway',
    });

    expect(upiOrder).toBeDefined();
    expect(upiOrder.id).toMatch(/^ord_/);
    expect(upiOrder.paymentMethod).toBe('UPI / Online Gateway');
    expect(upiOrder.paymentStatus).toBe('pending');
    expect(upiOrder.status).toBe('placed');
  });

  it('generates safe idempotency keys without throwing on Unicode or missing storeId', async () => {
    const { generateIdempotencyKey } = await import('../src/services/orderService');
    const unicodeItems = [{ productId: 'धनिया-p1', quantity: 2 }];
    const key = generateIdempotencyKey('user-1', null, unicodeItems);
    expect(key).toBeDefined();
    expect(key).toContain('idem_');
  });
});

describe('Vendor Dashboard Order Lifecycle and Delivery Boy Handoff', () => {
  it('guarantees Vendor Dashboard does not offer mark delivered option to vendors', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const vendorDashboardContent = fs.readFileSync(path.resolve(__dirname, '../src/pages/VendorDashboard.jsx'), 'utf-8');
    
    // Vendor must be able to Accept Order, Start Packing, and Hand to Delivery Partner
    expect(vendorDashboardContent).toContain("handleStatusChange(order.id, 'accepted')");
    expect(vendorDashboardContent).toContain("handleStatusChange(order.id, 'preparing')");
    expect(vendorDashboardContent).toContain("handleStatusChange(order.id, 'out_for_delivery')");

    // Vendor MUST NOT have the mark delivered button
    expect(vendorDashboardContent).not.toContain("handleStatusChange(order.id, 'delivered')");
    expect(vendorDashboardContent).not.toContain('>Mark Delivered<');

    // Status badges for out_for_delivery and delivered should be displayed
    expect(vendorDashboardContent).toContain('With Delivery Partner');
    expect(vendorDashboardContent).toContain('Delivered by Partner');
  });

  it('updates order status sequentially in the store', async () => {
    const { useDataStore } = await import('../src/store/useDataStore');
    
    const testOrderId = `test_ord_${Date.now()}`;
    const initialOrder = {
      id: testOrderId,
      status: 'placed',
      storeId: 'store-mahalaxmi-1',
      items: [{ name: 'Milk', price: 30, quantity: 1 }],
      statusHistory: [{ status: 'placed', time: new Date().toISOString() }],
    };

    useDataStore.setState(state => ({
      orders: [initialOrder, ...state.orders],
    }));

    // Vendor accepts order
    await useDataStore.getState().updateOrderStatus(testOrderId, 'accepted', 'Store accepted the order');
    let currentOrder = useDataStore.getState().orders.find(o => o.id === testOrderId);
    expect(currentOrder.status).toBe('accepted');

    // Vendor starts packing
    await useDataStore.getState().updateOrderStatus(testOrderId, 'preparing', 'Store is actively packing');
    currentOrder = useDataStore.getState().orders.find(o => o.id === testOrderId);
    expect(currentOrder.status).toBe('preparing');

    // Vendor hands off to delivery partner
    await useDataStore.getState().updateOrderStatus(testOrderId, 'out_for_delivery', 'Ready for delivery partner');
    currentOrder = useDataStore.getState().orders.find(o => o.id === testOrderId);
    expect(currentOrder.status).toBe('out_for_delivery');

    // Delivery boy / rider marks delivered upon arrival
    await useDataStore.getState().updateOrderStatus(testOrderId, 'delivered', 'Order delivered to doorstep by rider');
    currentOrder = useDataStore.getState().orders.find(o => o.id === testOrderId);
    expect(currentOrder.status).toBe('delivered');
    expect(currentOrder.statusHistory.length).toBeGreaterThanOrEqual(4);
  });
});

describe('Admin Inspection of Specific Vendor Dashboard', () => {
  it('guarantees AdminPanel includes direct vendor dashboard links and quick switcher', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const adminPanelContent = fs.readFileSync(path.resolve(__dirname, '../src/pages/AdminPanel.jsx'), 'utf-8');

    // Header switcher and store list links
    expect(adminPanelContent).toContain('/vendor?storeId=');
    expect(adminPanelContent).toContain('Check Vendor Dashboard...');
    expect(adminPanelContent).toContain('Open Dashboard');
  });

  it('guarantees VendorDashboard provides admin vendor inspection banner and switcher', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const vendorDashboardContent = fs.readFileSync(path.resolve(__dirname, '../src/pages/VendorDashboard.jsx'), 'utf-8');

    // Admin vendor inspection mode components
    expect(vendorDashboardContent).toContain('Super Admin Inspection Mode');
    expect(vendorDashboardContent).toContain('Switch Vendor:');
    expect(vendorDashboardContent).toContain('Back to Admin Panel');
    expect(vendorDashboardContent).toContain('useSearchParams');
    expect(vendorDashboardContent).toContain('requestedStoreId');
  });

  it('verifies App routes support both /vendor and /vendor/:storeId for admin access', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const appContent = fs.readFileSync(path.resolve(__dirname, '../src/App.jsx'), 'utf-8');

    expect(appContent).toContain('path="/vendor"');
    expect(appContent).toContain('path="/vendor/:storeId"');
  });
});

describe('Enhanced Dark Mode Architecture & Tokens', () => {
  it('guarantees zero-flicker dark mode bootstrap in index.html', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const indexHtml = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf-8');

    expect(indexHtml).toContain('data-theme="dark"');
    expect(indexHtml).toContain('class="dark"');
    expect(indexHtml).toContain('name="theme-color" content="#0a0e17"');
    expect(indexHtml).toContain('savedTheme');
  });

  it('guarantees rich obsidian dark mode design tokens in index.css', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const indexCss = fs.readFileSync(path.resolve(__dirname, '../src/index.css'), 'utf-8');

    // Deep obsidian and elevated clay surfaces
    expect(indexCss).toContain('--color-dark:         #0a0e17;');
    expect(indexCss).toContain('--color-card:         #131B28;');
    expect(indexCss).toContain('--color-surface:      #192333;');
    expect(indexCss).toContain('--color-text:         #F8FAFC;');
    expect(indexCss).toContain('--color-muted:        #94A3B8;');
    expect(indexCss).toContain('--color-subtle:       #64748B;');
    expect(indexCss).toContain('--clay-card-shadow:');
  });

  it('guarantees mobile and app headers provide accessible theme toggles', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const navbarContent = fs.readFileSync(path.resolve(__dirname, '../src/components/common/Navbar.jsx'), 'utf-8');
    const appHomeContent = fs.readFileSync(path.resolve(__dirname, '../src/pages/MobileAppHome.jsx'), 'utf-8');

    expect(navbarContent).toContain('toggleTheme');
    expect(navbarContent).toContain('lg:hidden'); // Mobile/tablet quick theme button
    expect(appHomeContent).toContain('toggleTheme');
    expect(appHomeContent).toContain('Toggle Dark / Light Mode');
  });

  it('guarantees product quantity pill and counter have no white outlines in dark mode', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const productCardContent = fs.readFileSync(path.resolve(__dirname, '../src/components/common/ProductCard.jsx'), 'utf-8');
    const indexCss = fs.readFileSync(path.resolve(__dirname, '../src/index.css'), 'utf-8');

    // Unit pill should not have broken opacity border classes that fall back to white
    expect(productCardContent).not.toContain('border-mandi-border/50');
    // Quantity counter capsule should not have white border classes
    expect(productCardContent).not.toContain('clay-counter border border-white/20');
    // CSS should override clay-counter and clay-btn-green borders in dark mode
    expect(indexCss).toContain('.dark .clay-counter');
  });
});


