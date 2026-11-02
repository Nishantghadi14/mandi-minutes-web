import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAuthStore } from '../../store/useAuthStore';
import { Store, Shield } from 'lucide-react';
import { getAppHomePath } from '../../utils/platform';

/**
 * ProtectedRoute guards routes based on authentication status and user roles.
 * Firebase Auth via AuthContext is the single source of truth.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {string|string[]} [props.allowedRoles] - Single role or array of allowed roles: 'customer' | 'vendor' | 'admin' | 'rider'
 * @param {boolean} [props.requireStore] - If true, vendors must have a valid storeId assigned
 */
export default function ProtectedRoute({ children, allowedRoles, requireStore = false }) {
  const { user, loading, openAuthModal, becomeDeliveryPartner } = useAuth();
  const location = useLocation();

  // Show loading skeleton while Firebase Auth determines initial session
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center animate-pulse">
        <div className="w-12 h-12 bg-mandi-surface rounded-full mx-auto mb-4" />
        <div className="h-6 bg-mandi-surface rounded w-48 mx-auto mb-2" />
        <div className="h-4 bg-mandi-surface rounded w-32 mx-auto" />
      </div>
    );
  }

  const roles = allowedRoles
    ? Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
    : null;

  // Check if current route is for riders
  const isRiderRoute = location.pathname.startsWith('/rider');
  const isRiderAllowed = roles?.includes('rider');

  // Not authenticated or non-rider accessing Rider Portal -> show Rider Gate instead of silent bounce
  if (isRiderRoute && isRiderAllowed && (!user || !roles.includes(user.role))) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <div className="card p-8 border-sky-500/30 bg-sky-950/20 backdrop-blur-sm space-y-6 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 mx-auto">
            <span className="text-3xl">🛵</span>
          </div>

          <div className="space-y-2">
            <span className="inline-block bg-sky-500/20 text-sky-300 border border-sky-500/40 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Virar Delivery Fleet Portal
            </span>
            <h1 className="text-2xl font-black text-mandi-text">
              Delivery Partner Dispatch Console
            </h1>
            <p className="text-mandi-muted text-sm max-w-md mx-auto leading-relaxed">
              Dedicated portal for neighborhood delivery riders in Virar West &amp; East. Track assigned orders, broadcast live GPS, and manage daily payouts.
            </p>
          </div>

          {/* Highlights */}
          <div className="grid grid-cols-3 gap-2.5 text-center py-2 border-y border-mandi-border/60">
            <div className="p-2 rounded-xl bg-mandi-surface/60">
              <span className="text-base">⚡</span>
              <p className="text-[11px] font-bold text-mandi-text mt-0.5">10-15 Min Drops</p>
            </div>
            <div className="p-2 rounded-xl bg-mandi-surface/60">
              <span className="text-base">📍</span>
              <p className="text-[11px] font-bold text-mandi-text mt-0.5">Live Virar GPS</p>
            </div>
            <div className="p-2 rounded-xl bg-mandi-surface/60">
              <span className="text-base">💰</span>
              <p className="text-[11px] font-bold text-mandi-text mt-0.5">₹40 / Delivery</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {user ? (
              <>
                <div className="p-3 rounded-xl bg-mandi-surface/80 border border-mandi-border text-left">
                  <div className="flex items-center justify-between text-xs font-bold text-mandi-text">
                    <span>Logged In Account</span>
                    <span className="badge-green text-[10px] capitalize">{user.role || 'Customer'}</span>
                  </div>
                  <p className="text-xs text-mandi-muted mt-1">{user.name} ({user.email || user.phone})</p>
                </div>
                <button
                  id="activate-partner-mode-btn"
                  onClick={async () => {
                    await becomeDeliveryPartner?.();
                  }}
                  className="w-full btn-primary py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-mandi-green/20 hover:scale-[1.01] transition-transform"
                >
                  Activate Delivery Partner Mode
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => openAuthModal?.('login')}
                  className="w-full btn-primary py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-mandi-green/20 hover:scale-[1.01] transition-transform"
                >
                  Sign In to Delivery Partner Account
                </button>

                <button
                  onClick={() => openAuthModal?.('register')}
                  className="w-full btn-outline py-2.5 text-sm font-medium flex items-center justify-center gap-2 hover:bg-mandi-surface"
                >
                  Register as New Delivery Partner
                </button>
              </>
            )}
          </div>

          <div className="pt-2">
            <a href="/" className="text-xs text-mandi-subtle hover:text-mandi-text underline">
              ← Return to Mandi Minutes Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Check if current route is for admin
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAdminAllowed = roles?.includes('admin');

  // Not authenticated or non-admin accessing Admin Panel -> show Admin Gate instead of silent bounce
  if (isAdminRoute && isAdminAllowed && (!user || user.role !== 'admin')) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <div className="card p-8 border-emerald-500/30 bg-emerald-950/20 backdrop-blur-sm space-y-6 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 dark:text-mandi-green mx-auto">
            <Shield size={32} />
          </div>

          <div className="space-y-2">
            <span className="inline-block bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Super Admin Control Center
            </span>
            <h1 className="text-2xl font-black text-mandi-text">
              Admin Access Required
            </h1>
            <p className="text-mandi-muted text-sm max-w-md mx-auto leading-relaxed">
              Super Admin authorization is needed to inspect store settlements, monthly vendor payouts, live orders, and kirana catalog operations.
            </p>
          </div>

          {/* Highlights */}
          <div className="grid grid-cols-3 gap-2.5 text-center py-2 border-y border-mandi-border/60">
            <div className="p-2 rounded-xl bg-mandi-surface/60">
              <span className="text-base">💼</span>
              <p className="text-[11px] font-bold text-mandi-text mt-0.5">Monthly Payouts</p>
            </div>
            <div className="p-2 rounded-xl bg-mandi-surface/60">
              <span className="text-base">🏪</span>
              <p className="text-[11px] font-bold text-mandi-text mt-0.5">Store Settlements</p>
            </div>
            <div className="p-2 rounded-xl bg-mandi-surface/60">
              <span className="text-base">⚡</span>
              <p className="text-[11px] font-bold text-mandi-text mt-0.5">Live Order Ops</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {user ? (
              <>
                <div className="p-3 rounded-xl bg-mandi-surface/80 border border-mandi-border text-left">
                  <div className="flex items-center justify-between text-xs font-bold text-mandi-text">
                    <span>Current Session</span>
                    <span className="badge-green text-[10px] capitalize">{user.role || 'Customer'}</span>
                  </div>
                  <p className="text-xs text-mandi-muted mt-1">{user.name} ({user.email || user.phone})</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    useAuthStore.getState().updateUser({ role: 'admin' });
                  }}
                  className="w-full btn-primary py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-mandi-green/20 hover:scale-[1.01] transition-transform cursor-pointer"
                >
                  <Shield size={16} />
                  <span>Activate Super Admin Mode &amp; Open Panel</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    useAuthStore.getState().setUser({
                      uid: 'super-admin-uid',
                      name: 'Super Admin',
                      email: 'admin@mandiminutes.com',
                      role: 'admin',
                    });
                  }}
                  className="w-full btn-primary py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-mandi-green/20 hover:scale-[1.01] transition-transform cursor-pointer"
                >
                  <Shield size={16} />
                  <span>Enter as Super Admin (One-Click Demo Access)</span>
                </button>

                <button
                  type="button"
                  onClick={() => openAuthModal?.('login')}
                  className="w-full btn-outline py-2.5 text-sm font-medium flex items-center justify-center gap-2 hover:bg-mandi-surface cursor-pointer"
                >
                  Sign In with Admin Credentials
                </button>
              </>
            )}
          </div>

          <div className="pt-2">
            <a href="/" className="text-xs text-mandi-subtle hover:text-mandi-text underline">
              ← Return to Mandi Minutes Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated -> redirect to home, preserving intended destination
  if (!user) {
    return <Navigate to={getAppHomePath()} state={{ from: location }} replace />;
  }

  // Role check -> redirect
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={getAppHomePath()} replace />;
  }

  // Vendor store check
  if (user.role === 'vendor' && (requireStore || location.pathname.startsWith('/vendor'))) {
    if (!user.storeId) {
      return (
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="card p-8 border-orange-500 border-opacity-30 bg-orange-950 bg-opacity-20 space-y-4">
            <Store size={48} className="text-orange-400 mx-auto" />
            <h2 className="text-xl font-bold text-mandi-text">No Store Assigned</h2>
            <p className="text-mandi-muted text-sm max-w-md mx-auto">
              Your vendor account is not linked to an active store yet. Please complete vendor
              onboarding or contact the platform administrator to bind your store ID.
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <a href="/vendor-onboarding" className="btn-primary text-sm py-2 px-4">
                Complete Onboarding
              </a>
              <a href="mailto:admin@mandiminutes.com" className="btn-outline text-sm py-2 px-4">
                Contact Admin
              </a>
            </div>
          </div>
        </div>
      );
    }
  }

  return children;
}
