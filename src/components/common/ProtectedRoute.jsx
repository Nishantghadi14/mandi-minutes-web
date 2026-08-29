import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Store } from 'lucide-react';

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
  const { user, loading } = useAuth();
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

  // Not authenticated -> redirect to home, preserving intended destination
  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  const roles = allowedRoles
    ? Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
    : null;

  // Role check -> redirect
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
