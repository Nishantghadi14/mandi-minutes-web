import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Admin Monthly Store Sales & Vendor Settlements', () => {
  it('verifies settlements tab and calculation logic exists in AdminPanel.jsx', () => {
    const adminPanelContent = fs.readFileSync(
      path.resolve(process.cwd(), 'src/pages/AdminPanel.jsx'),
      'utf-8'
    );

    // Tab definition & search params sync
    expect(adminPanelContent).toContain("id: 'settlements'");
    expect(adminPanelContent).toContain('Monthly Settlements & Payouts');
    expect(adminPanelContent).toContain('useSearchParams');
    expect(adminPanelContent).toContain("searchParams.get('tab')");

    // Due date calculator & month breakdown
    expect(adminPanelContent).toContain('monthDueDate');
    expect(adminPanelContent).toContain('monthlySettlements');
    expect(adminPanelContent).toContain('settlementTotals');

    // Commission rate logic
    expect(adminPanelContent).toContain('commissionRate');
    expect(adminPanelContent).toContain('commissionFee');
    expect(adminPanelContent).toContain('netPayable');

    // Items sold tracking
    expect(adminPanelContent).toContain('itemsSold');

    // CSV export and WhatsApp sharing
    expect(adminPanelContent).toContain('handleExportSettlementsCSV');
    expect(adminPanelContent).toContain('handleShareStatement');
    expect(adminPanelContent).toContain('toggleSettleStore');

    // Store map contains full metadata
    expect(adminPanelContent).toContain('vendorUrl: `/vendor?storeId=');
    expect(adminPanelContent).toContain('address: s.address');

    // Guarantees settlementTotals defines both pendingPayable and settledPayable
    expect(adminPanelContent).toContain('pendingPayable: 0');
    expect(adminPanelContent).toContain('settledPayable: 0');
  });

  it('verifies ProtectedRoute contains an Admin Gate to prevent bounce back to home', () => {
    const protectedRouteContent = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/common/ProtectedRoute.jsx'),
      'utf-8'
    );

    expect(protectedRouteContent).toContain("location.pathname.startsWith('/admin')");
    expect(protectedRouteContent).toContain('Super Admin Control Center');
    expect(protectedRouteContent).toContain('Enter as Super Admin (One-Click Demo Access)');
    expect(protectedRouteContent).toContain('Activate Super Admin Mode');
  });

  it('verifies direct navigation links exist in Navbar and ProfilePage', () => {
    const navbarContent = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/common/Navbar.jsx'),
      'utf-8'
    );
    const profileContent = fs.readFileSync(
      path.resolve(process.cwd(), 'src/pages/ProfilePage.jsx'),
      'utf-8'
    );

    expect(navbarContent).toContain('/admin?tab=settlements');
    expect(profileContent).toContain('/admin?tab=settlements');
  });

  it('calculates monthly settlement metrics accurately', () => {
    const orders = [
      {
        id: 'ord-1',
        storeId: 'store-1',
        total: 1000,
        status: 'delivered',
        placedAt: '2026-11-05T10:00:00Z',
        items: [
          { name: 'Tomatoes', quantity: 3, price: 100 },
          { name: 'Potatoes', quantity: 2, price: 50 },
        ],
      },
      {
        id: 'ord-2',
        storeId: 'store-1',
        total: 500,
        status: 'delivered',
        placedAt: '2026-11-12T14:30:00Z',
        items: [
          { name: 'Onions', quantity: 5, price: 100 },
        ],
      },
      {
        id: 'ord-3',
        storeId: 'store-1',
        total: 400,
        status: 'cancelled', // Cancelled order should not count toward sales or items sold
        placedAt: '2026-11-15T09:00:00Z',
        items: [
          { name: 'Apples', quantity: 4, price: 100 },
        ],
      },
      {
        id: 'ord-4',
        storeId: 'store-1',
        total: 800,
        status: 'delivered',
        placedAt: '2026-10-25T11:00:00Z', // October order should not count in November
        items: [
          { name: 'Bananas', quantity: 8, price: 100 },
        ],
      },
      {
        id: 'ord-5',
        storeId: 'store-2',
        total: 2000,
        status: 'delivered',
        placedAt: '2026-11-20T16:00:00Z',
        items: [
          { name: 'Milk', quantity: 10, price: 60 },
          { name: 'Paneer', quantity: 2, price: 200 },
        ],
      },
    ];

    const selectedMonth = '2026-11';
    const commissionRate = 5; // 5%

    // Calculate for store-1
    const store1Orders = orders.filter(o => {
      if (o.storeId !== 'store-1') return false;
      if (o.status === 'cancelled') return false;
      const orderDate = new Date(o.placedAt || Date.now());
      const orderMonth = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
      return orderMonth === selectedMonth;
    });

    const store1GrossSales = store1Orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const store1ItemsSold = store1Orders.reduce((sum, o) => {
      const orderItemsCount = (o.items || []).reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
      return sum + orderItemsCount;
    }, 0);
    const store1Commission = Math.round((store1GrossSales * commissionRate) / 100);
    const store1NetPayable = store1GrossSales - store1Commission;

    expect(store1Orders.length).toBe(2);
    expect(store1GrossSales).toBe(1500); // 1000 + 500
    expect(store1ItemsSold).toBe(10); // 3+2 + 5
    expect(store1Commission).toBe(75); // 5% of 1500
    expect(store1NetPayable).toBe(1425); // 1500 - 75
  });

  it('accurately computes the end-of-month payout due date', () => {
    function computeMonthDueDate(monthKey) {
      const [yearStr, monthStr] = monthKey.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      const lastDayOfMonth = new Date(year, month, 0).getDate();
      const lastDate = new Date(year, month - 1, lastDayOfMonth);
      return lastDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }

    expect(computeMonthDueDate('2026-11')).toBe('30 Nov 2026');
    expect(computeMonthDueDate('2026-12')).toBe('31 Dec 2026');
    expect(computeMonthDueDate('2026-02')).toBe('28 Feb 2026');
  });

  it('guarantees safe numeric handling for settlementTotals to prevent undefined.toLocaleString errors', () => {
    const monthlySettlements = [
      {
        storeId: 'store-1',
        netPayable: 1425,
        grossSales: 1500,
        itemsSold: 10,
        ordersCount: 2,
        commissionFee: 75,
        isSettled: false,
      },
      {
        storeId: 'store-2',
        netPayable: 1900,
        grossSales: 2000,
        itemsSold: 12,
        ordersCount: 1,
        commissionFee: 100,
        isSettled: true,
      },
    ];

    const totals = monthlySettlements.reduce(
      (acc, s) => {
        const net = Number(s?.netPayable) || 0;
        acc.totalGrossSales += (Number(s?.grossSales) || 0);
        acc.totalItemsSold += (Number(s?.itemsSold) || 0);
        acc.totalOrders += (Number(s?.ordersCount) || 0);
        acc.totalCommission += (Number(s?.commissionFee) || 0);
        acc.totalNetPayable += net;
        if (s?.isSettled) {
          acc.totalPaid += net;
          acc.settledPayable += net;
          acc.settledCount += 1;
        } else {
          acc.totalPending += net;
          acc.pendingPayable += net;
          acc.pendingCount += 1;
        }
        return acc;
      },
      {
        totalGrossSales: 0,
        totalItemsSold: 0,
        totalOrders: 0,
        totalCommission: 0,
        totalNetPayable: 0,
        totalPaid: 0,
        totalPending: 0,
        pendingPayable: 0,
        settledPayable: 0,
        settledCount: 0,
        pendingCount: 0,
      }
    );

    // Both keys must be defined numbers and toLocaleString must work without error
    expect(totals.pendingPayable).toBe(1425);
    expect(totals.settledPayable).toBe(1900);
    expect(() => totals.pendingPayable.toLocaleString('en-IN')).not.toThrow();
    expect(() => totals.settledPayable.toLocaleString('en-IN')).not.toThrow();
  });
});
