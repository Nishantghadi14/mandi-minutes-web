import { describe, it, expect } from 'vitest';
import { useDataStore } from '../src/store/useDataStore';

describe('Local Sale (In-Store POS) and Real-Time Inventory Deduction', () => {
  it('records a local sale and automatically deducts stock from matching catalog products', async () => {
    const testStoreId = 'store-mahalaxmi-1';
    const testProdId = `prod-local-${Date.now()}`;

    // Seed test product with 50 units
    const testProduct = {
      id: testProdId,
      storeId: testStoreId,
      name: 'Test Basmati Rice',
      price: 120,
      mrp: 140,
      stock: 50,
      unit: '1 kg',
      isAvailable: true,
    };

    useDataStore.setState(state => ({
      products: [...state.products.filter(p => p.id !== testProdId), testProduct],
    }));

    // Record a local walk-in sale of 4 units
    const saleResult = await useDataStore.getState().recordLocalSale({
      storeId: testStoreId,
      storeName: 'Mahalaxmi Supermarket',
      customerName: 'Ramesh Patel',
      customerPhone: '9876543210',
      paymentMethod: 'Cash',
      items: [
        {
          productId: testProdId,
          name: 'Test Basmati Rice',
          price: 120,
          quantity: 4,
          unit: '1 kg',
        }
      ],
      discount: 20, // ₹20 off
      notes: 'Counter walk-in customer',
    });

    // 1. Verify sale order properties
    expect(saleResult).toBeDefined();
    expect(saleResult.isLocalSale).toBe(true);
    expect(saleResult.orderType).toBe('local_sale');
    expect(saleResult.status).toBe('delivered');
    expect(saleResult.paymentStatus).toBe('paid');
    expect(saleResult.paymentMethod).toBe('Cash');
    expect(saleResult.customerName).toBe('Ramesh Patel');
    expect(saleResult.subtotal).toBe(480); // 120 * 4
    expect(saleResult.discount).toBe(20);
    expect(saleResult.total).toBe(460); // 480 - 20
    expect(saleResult.deliveryCharge).toBe(0);

    // 2. Verify product stock in store was deducted (50 - 4 = 46)
    const updatedProduct = useDataStore.getState().products.find(p => p.id === testProdId);
    expect(updatedProduct).toBeDefined();
    expect(updatedProduct.stock).toBe(46);
    expect(updatedProduct.isAvailable).toBe(true);
  });

  it('marks product as unavailable when stock reaches 0 from local sale', async () => {
    const testStoreId = 'store-mahalaxmi-1';
    const testProdId = `prod-depleted-${Date.now()}`;

    // Seed product with only 2 units in stock
    const testProduct = {
      id: testProdId,
      storeId: testStoreId,
      name: 'Fresh Paneer',
      price: 90,
      stock: 2,
      unit: '200g',
      isAvailable: true,
    };

    useDataStore.setState(state => ({
      products: [...state.products.filter(p => p.id !== testProdId), testProduct],
    }));

    // Sell both 2 units
    await useDataStore.getState().recordLocalSale({
      storeId: testStoreId,
      items: [
        {
          productId: testProdId,
          name: 'Fresh Paneer',
          price: 90,
          quantity: 2,
          unit: '200g',
        }
      ],
      paymentMethod: 'UPI',
    });

    const updatedProduct = useDataStore.getState().products.find(p => p.id === testProdId);
    expect(updatedProduct.stock).toBe(0);
    expect(updatedProduct.isAvailable).toBe(false);
  });

  it('supports unlisted custom counter items without catalog errors', async () => {
    const testStoreId = 'store-mahalaxmi-1';

    const saleResult = await useDataStore.getState().recordLocalSale({
      storeId: testStoreId,
      customerName: 'Walk-in Guest',
      paymentMethod: 'Khata / Due',
      paymentStatus: 'pending',
      items: [
        {
          productId: null, // Custom item not in database
          name: 'Loose Jaggery (Gur)',
          price: 45,
          quantity: 2,
          unit: '500g',
        }
      ],
    });

    expect(saleResult.subtotal).toBe(90);
    expect(saleResult.total).toBe(90);
    expect(saleResult.paymentStatus).toBe('pending');
    expect(saleResult.items[0].name).toBe('Loose Jaggery (Gur)');
  });

  it('verifies VendorDashboard and LocalSaleModal code integration', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const dashboardCode = fs.readFileSync(path.resolve(__dirname, '../src/pages/VendorDashboard.jsx'), 'utf-8');
    const modalCode = fs.readFileSync(path.resolve(__dirname, '../src/components/vendor/LocalSaleModal.jsx'), 'utf-8');

    // VendorDashboard triggers
    expect(dashboardCode).toContain('LocalSaleModal');
    expect(dashboardCode).toContain('setShowLocalSaleModal');
    expect(dashboardCode).toContain('Create Local Sale (POS)');
    expect(dashboardCode).toContain('recordLocalSale');
    expect(dashboardCode).toContain('local_sale');
    expect(dashboardCode).toContain('In-Store Completed');

    // LocalSaleModal features
    expect(modalCode).toContain('Complete Sale & Deduct Stock');
    expect(modalCode).toContain('Print Receipt');
    expect(modalCode).toContain('WhatsApp Bill');
    expect(modalCode).toContain('Bill Next Customer');
    expect(modalCode).toContain('Custom Item');
  });
});
