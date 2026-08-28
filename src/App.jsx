import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { LocationProvider } from './context/LocationContext';
import { DataProvider } from './context/DataContext';
import { ToastProvider } from './components/common/Toast';

import Navbar from './components/common/Navbar';
import BottomNav from './components/common/BottomNav';
import Footer from './components/common/Footer';
import CartDrawer from './components/common/CartDrawer';
import LocationModal from './components/common/LocationModal';
import AuthModal from './components/common/AuthModal';

// Lazy load pages for chunk splitting & mobile optimization
const HomePage = lazy(() => import('./pages/HomePage'));
const StorePage = lazy(() => import('./pages/StorePage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderStatusPage = lazy(() => import('./pages/OrderStatusPage'));
const OrderHistoryPage = lazy(() => import('./pages/OrderHistoryPage'));
const VendorDashboard = lazy(() => import('./pages/VendorDashboard'));
const VendorOnboarding = lazy(() => import('./pages/VendorOnboarding'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const RiderPortal = lazy(() => import('./pages/RiderPortal'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));

import ProtectedRoute from './components/common/ProtectedRoute';

// Lazy load policy pages separately
const PrivacyPage = lazy(() => import('./pages/PolicyPages').then(module => ({ default: module.PrivacyPage })));
const TermsPage = lazy(() => import('./pages/PolicyPages').then(module => ({ default: module.TermsPage })));

// Lightweight skeleton loader fallback for low-end mobile devices
function PageLoader() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-pulse">
      <div className="h-48 bg-mandi-card border border-mandi-border rounded-3xl w-full" />
      <div className="flex gap-4 overflow-x-auto pb-2">
        <div className="h-10 bg-mandi-card border border-mandi-border rounded-xl w-24 flex-shrink-0" />
        <div className="h-10 bg-mandi-card border border-mandi-border rounded-xl w-32 flex-shrink-0" />
        <div className="h-10 bg-mandi-card border border-mandi-border rounded-xl w-28 flex-shrink-0" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 4, 5].map(i => (
          <div key={i} className="card p-4 h-48 space-y-3">
            <div className="h-24 bg-mandi-surface rounded-xl w-full" />
            <div className="h-4 bg-mandi-surface rounded w-3/4" />
            <div className="h-4 bg-mandi-surface rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <DataProvider>
            <LocationProvider>
              <CartProvider>
                <div className="min-h-screen flex flex-col bg-mandi-dark text-mandi-text selection:bg-mandi-green selection:text-black">
                  <Navbar />
                  <main className="flex-1">
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/store/:storeId" element={<StorePage />} />
                        <Route path="/search" element={<SearchPage />} />
                        <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
                        <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
                        <Route path="/order-status/:orderId" element={<OrderStatusPage />} />
                        <Route path="/orders" element={<ProtectedRoute><OrderHistoryPage /></ProtectedRoute>} />
                        <Route path="/vendor" element={<ProtectedRoute allowedRoles={['vendor', 'admin']} requireStore={true}><VendorDashboard /></ProtectedRoute>} />
                        <Route path="/vendor-onboarding" element={<VendorOnboarding />} />
                        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminPanel /></ProtectedRoute>} />
                        <Route path="/rider" element={<ProtectedRoute allowedRoles={['rider', 'admin']}><RiderPortal /></ProtectedRoute>} />
                        <Route path="/about" element={<AboutPage />} />
                        <Route path="/contact" element={<ContactPage />} />
                        <Route path="/privacy" element={<PrivacyPage />} />
                        <Route path="/terms" element={<TermsPage />} />
                      </Routes>
                    </Suspense>
                  </main>
                  <Footer />
                  <BottomNav />
                  <CartDrawer />
                  <LocationModal />
                  <AuthModal />
                </div>
              </CartProvider>
            </LocationProvider>
          </DataProvider>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}
