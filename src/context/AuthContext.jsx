import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export function AuthProvider({ children }) {
  const initAuth = useAuthStore(state => state.initAuth);

  useEffect(() => {
    const unsubscribe = initAuth();
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [initAuth]);

  return <>{children}</>;
}

export const useAuth = () => {
  const user = useAuthStore(state => state.user);
  const loading = useAuthStore(state => state.loading);
  const authModal = useAuthStore(state => state.authModal);
  const login = useAuthStore(state => state.login);
  const register = useAuthStore(state => state.register);
  const sendPhoneOtp = useAuthStore(state => state.sendPhoneOtp);
  const confirmPhoneOtp = useAuthStore(state => state.confirmPhoneOtp);
  const logout = useAuthStore(state => state.logout);
  const updateUser = useAuthStore(state => state.updateUser);
  const openAuthModal = useAuthStore(state => state.openAuthModal);
  const closeAuthModal = useAuthStore(state => state.closeAuthModal);

  const registerVendor = useAuthStore(state => state.registerVendor);
  const setVendorStore = useAuthStore(state => state.setVendorStore);

  return {
    user,
    loading,
    authModal,
    login,
    register,
    registerVendor,
    setVendorStore,
    sendPhoneOtp,
    confirmPhoneOtp,
    logout,
    updateUser,
    openAuthModal,
    closeAuthModal,
  };
};
