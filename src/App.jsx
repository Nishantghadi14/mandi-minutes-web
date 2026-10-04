import { lazy, Suspense, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

/** Smoothly scrolls to the top of the page on every route change */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
}
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { LocationProvider } from './context/LocationContext';
import { DataProvider } from './context/DataContext';
import { ToastProvider } from './components/common/Toast';
import { ThemeProvider } from './context/ThemeContext';

import Navbar from './components/common/Navbar';
import BottomNav from './components/common/BottomNav';
import Footer from './components/common/Footer';
import CartDrawer from './components/common/CartDrawer';
import FloatingCartBar from './components/common/FloatingCartBar';
import LocationModal from './components/common/LocationModal';
import AuthModal from './components/common/AuthModal';
import ErrorBoundary from './components/common/ErrorBoundary';
import { isNativeApp, isInAppMode } from './utils/platform';

// Lazy load pages for chunk splitting & mobile optimization
const HomePage = lazy(() => import('./pages/HomePage'));
const MobileAppHome = lazy(() => import('./pages/MobileAppHome'));
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
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

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

function AppContent() {
  const { pathname } = useLocation();
  const inAppMode = isInAppMode(pathname);
  const isNoBottomNav = !inAppMode && (['/checkout', '/admin', '/vendor', '/rider'].includes(pathname) || pathname.startsWith('/order-status'));
  const hideNavbar = inAppMode;

  const { user, loading, openAuthModal } = useAuth();
  const hasPromptedLoginRef = useRef(false);

  // Whenever the user opens the native app or /app and there is no account logged in, ask to login first
  useEffect(() => {
    if (inAppMode && (pathname === '/app' || isNativeApp()) && !loading && !user && !hasPromptedLoginRef.current) {
      hasPromptedLoginRef.current = true;
      const timer = setTimeout(() => {
        openAuthModal('login');
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [inAppMode, pathname, loading, user, openAuthModal]);

  return (
    <div className="min-h-screen flex flex-col bg-mandi-dark text-mandi-text selection:bg-mandi-green selection:text-black">
      {!hideNavbar && <Navbar />}
      <main className={`flex-1 ${inAppMode ? 'pb-24' : (isNoBottomNav ? 'pb-safe' : 'pb-24 md:pb-0')}`}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={isNativeApp() ? <MobileAppHome /> : <HomePage />} />
            <Route path="/app" element={<MobileAppHome />} />
            <Route path="/store/:storeId" element={<StorePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
            <Route path="/order-status/:orderId" element={<OrderStatusPage />} />
            <Route path="/orders" element={<OrderHistoryPage />} />
            <Route path="/profile" element={<ProfilePage />} />
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
      {!inAppMode && <Footer />}
      <FloatingCartBar />
      <BottomNav inAppMode={inAppMode} />
      <CartDrawer />
      <LocationModal />
      <AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
      <Router>
        <ScrollToTop />
        <ToastProvider>
          <AuthProvider>
            <DataProvider>
              <LocationProvider>
                <CartProvider>
                  <ErrorBoundary>
                    <AppContent />
                  </ErrorBoundary>
                </CartProvider>
              </LocationProvider>
            </DataProvider>
          </AuthProvider>
        </ToastProvider>
      </Router>
      </ThemeProvider>
    </HelmetProvider>
  );
}
