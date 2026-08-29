import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAuthStore } from '../../store/useAuthStore';
import { Store } from 'lucide-react';

/**
 * Reads the saved local user directly from localStorage.
 * Used as an instant fallback when Zustand hasn't propagated yet.
 */
function readLocalUser() {
  try {
    const raw = localStorage.getItem('mandi_local_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * ProtectedRoute guards routes based on authentication status and user roles.
 * Uses both Zustand state AND a direct localStorage read as a fallback to
 * prevent race conditions where navigation happens before Zustand re-renders.
 */
export default function ProtectedRoute({ children, allowedRoles, requireStore = false }) {
  const { user: zustandUser, loading } = useAuth();
  const location = useLocation();

  // Use Zustand user if available; otherwise fall back to localStorage directly.
  // This eliminates the race condition where navigate('/checkout') fires before
  // the Zustand subscription has propagated to this component's render.
  const user = zustandUser || readLocalUser();

  // If Zustand says loading, stay in loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center animate-pulse">
        <div className="w-12 h-12 bg-mandi-surface rounded-full mx-auto mb-4" />
        <div className="h-6 bg-mandi-surface rounded w-48 mx-auto mb-2" />
        <div className="h-4 bg-mandi-surface rounded w-32 mx-auto" />
      </div>
    );
  }

  // Not authenticated → redirect to home, preserving intended destination
  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  const roles = allowedRoles
    ? Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
    : null;

  // Role check → redirect
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
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
