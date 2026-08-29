import { create } from 'zustand';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile, 
  onAuthStateChanged,
  signInWithPhoneNumber,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured, requestNotificationPermission } from '../config/firebase';
import { useCartStore } from './useCartStore';

const getInitialLocalUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const localUser = localStorage.getItem('mandi_local_user');
    return localUser ? JSON.parse(localUser) : null;
  } catch {
    return null;
  }
};

let authOperationId = 0;

export const useAuthStore = create((set, get) => ({
  // When Firebase is configured, user is null initially until Firebase Auth verifies session.
  // In local development fallback mode, read local user.
  user: isFirebaseConfigured ? null : getInitialLocalUser(),
  // In Firebase mode, loading starts as TRUE until onAuthStateChanged resolves.
  loading: Boolean(isFirebaseConfigured),
  authModal: { open: false, mode: 'login' },
  unsubscribeAuth: null,

  openAuthModal: (mode = 'login') => set({ authModal: { open: true, mode } }),
  closeAuthModal: () => set({ authModal: { open: false, mode: 'login' } }),

  // Helper to fetch or create user profile from Firestore and immediately sync Zustand state
  syncUserProfile: async (firebaseUser) => {
  const operationId = ++authOperationId;

  if (!firebaseUser) {
    set({ user: null, loading: false });
    useCartStore.getState().switchUser(null);
    return null;
  }

    let userData = null;
    if (db) {
      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
          userData = docSnap.data();
        } else {
          // Initialize new user profile document in Firestore
          const genReferral = `MANDI-${firebaseUser.uid.slice(0, 4).toUpperCase()}-${firebaseUser.uid.slice(-4).toUpperCase()}`;
          userData = {
            uid: firebaseUser.uid,
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'Mandi Customer',
            email: firebaseUser.email || '',
            phone: firebaseUser.phoneNumber || '',
            role: 'customer',
            storeId: null,
            addresses: [],
            wishlist: [],
            referralCode: genReferral,
            avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(firebaseUser.displayName || firebaseUser.uid)}`,
            createdAt: new Date().toISOString(),
          };
          await setDoc(userDocRef, userData, { merge: true });
        }
      } catch (err) {
        console.error('Error fetching user profile from Firestore:', err);
        // A Firebase identity without a readable profile is not a customer profile.
        // Keep the session unresolved so guards never grant customer access by default.
        if (operationId === authOperationId) {
          set({ user: null, loading: false });
        }
        throw new Error('Your account profile could not be loaded. Please try again or contact support.');
      }
    }

    const isAdminEmail = (email) => {
      if (!email) return false;
      const configuredAdmins = (import.meta.env.VITE_ADMIN_EMAILS || 'admin@mandiminutes.com,admin@mandi.in')
        .toLowerCase()
        .split(',')
        .map(e => e.trim());
      return configuredAdmins.includes(email.toLowerCase()) || email.toLowerCase().startsWith('admin@');
    };

    const resolvedRole = userData?.role === 'admin' || isAdminEmail(firebaseUser.email) 
      ? 'admin' 
      : (userData?.role || 'customer');

    const profileUser = {
      id: firebaseUser.uid,
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      phone: firebaseUser.phoneNumber,
      displayName: firebaseUser.displayName,
      role: resolvedRole,
      storeId: userData?.storeId || null,
      addresses: userData?.addresses || [],
      wishlist: userData?.wishlist || [],
      avatar: userData?.avatar || firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(firebaseUser.uid)}`,
      name: userData?.name || firebaseUser.displayName || 'Customer',
      ...userData,
      role: resolvedRole,
    };

    if (operationId !== authOperationId) {return null;}
  set({user: profileUser,loading: false,});

  useCartStore
  .getState()
  .switchUser(profileUser.id || profileUser.uid);

    // Notification setup is optional and deliberately runs only after auth/profile sync.
    try {
      const fcmToken = await requestNotificationPermission();
      if (fcmToken && db) {
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          fcmTokens: arrayUnion(fcmToken),
        });
      }
    } catch (err) {
      console.warn('Notification registration was skipped:', err?.message);
    }

    return profileUser;
  },

  // Initialize Firebase Auth listener
  initAuth: () => {
    // If listener already active, return the existing cleanup function
    const existing = get().unsubscribeAuth;
    if (existing) return existing;

    if (!isFirebaseConfigured || !auth) {
      console.info('ℹ️ Running in local development mode — auth session maintained locally.');
      const localUser = getInitialLocalUser();
      set({ user: localUser, loading: false });
      if (localUser) {
        useCartStore.getState().switchUser(localUser.id || localUser.uid);
      }
      return () => {};
    }

    // Set loading while determining initial Firebase auth state
    set({ loading: true });

    const unsubscribe = onAuthStateChanged(
  auth,
  async (firebaseUser) => {
    if (!firebaseUser) {
      authOperationId++;

      set({
        user: null,
        loading: false,
      });

      useCartStore
        .getState()
        .switchUser(null);

      return;
    }

    await get().syncUserProfile(firebaseUser);
  }
);

    const cleanup = () => {
      unsubscribe();
      set({ unsubscribeAuth: null });
    };

    set({ unsubscribeAuth: cleanup });
    return cleanup;
  },

  // Real Email & Password Login
  login: async (email, password) => {
    if (!isFirebaseConfigured || !auth) {
      const uid = 'local-' + (Math.random().toString(36).substring(2, 10));
      const name = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const role = import.meta.env.PROD
        ? 'customer'
        : (email.toLowerCase().includes('admin') ? 'admin' : (email.toLowerCase().includes('vendor') ? 'vendor' : 'customer'));
      const localUser = {
        id: uid,
        uid: uid,
        name: name,
        email: email,
        phone: '9820098200',
        role: role,
        storeId: role === 'vendor' ? 'store-mahalaxmi-1' : null,
        addresses: [
          { id: 'addr-1', label: 'Home', line1: 'Shop 4, Agashi Road, Near Station', city: 'Virar West, Palghar', pincode: '401305', isDefault: true }
        ],
        wishlist: [],
        referralCode: `MANDI-${uid.slice(0, 4).toUpperCase()}-${uid.slice(-4).toUpperCase()}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('mandi_local_user', JSON.stringify(localUser));
      set({ user: localUser, loading: false });
      useCartStore.getState().switchUser(localUser.id);
      return localUser;
    }

    set({ loading: true });

try {
  await setPersistence(
    auth, browserLocalPersistence);

  const userCredential =
    await signInWithEmailAndPassword(
      auth, email, password);
      const profileUser = await get().syncUserProfile(userCredential.user);
      return profileUser;
    } catch (err) {
      set({ loading: false });
      let message = 'Failed to sign in. Please check your credentials.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = 'Invalid email or password.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Please provide a valid email address.';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Access temporarily disabled due to too many failed attempts. Please try again later.';
      } else if (err.code === 'auth/configuration-not-found') {
        message = 'Firebase Auth is not enabled in your Firebase console. Please enable Email/Password in Authentication settings.';
      } else if (err.message) {
        message = err.message;
      }
      throw new Error(message);
    }
  },

  // Real Phone Authentication with Recaptcha
  sendPhoneOtp: async (phoneNumber, appVerifier) => {
    if (!isFirebaseConfigured || !auth) {
      return { verificationId: 'mock-session-id', phone: phoneNumber };
    }
    try {
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      return confirmationResult;
    } catch (err) {
      let message = 'Could not send verification code. Please check the mobile number.';
      if (err.code === 'auth/invalid-phone-number') {
        message = 'Invalid phone number format.';
      } else if (err.code === 'auth/quota-exceeded') {
        message = 'SMS quota exceeded. Please try again later.';
      } else if (err.message) {
        message = err.message;
      }
      throw new Error(message);
    }
  },

  confirmPhoneOtp: async (confirmationResult, otp) => {
    if (!isFirebaseConfigured || !auth) {
      const phone = confirmationResult?.phone || '9820098200';
      const uid = 'local-phone-' + phone.slice(-6);
      const localUser = {
        id: uid,
        uid: uid,
        name: `Customer ${phone.slice(-4)}`,
        email: `${phone.slice(-6)}@mandi.in`,
        phone: phone,
        role: 'customer',
        storeId: null,
        addresses: [
          { id: 'addr-1', label: 'Home', line1: 'Shop 4, Agashi Road, Near Station', city: 'Virar West, Palghar', pincode: '401305', isDefault: true }
        ],
        wishlist: [],
        referralCode: `MANDI-${uid.slice(0, 4).toUpperCase()}-${uid.slice(-4).toUpperCase()}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(phone)}`,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('mandi_local_user', JSON.stringify(localUser));
      set({ user: localUser, loading: false });
      useCartStore.getState().switchUser(localUser.id);
      return localUser;
    }

    set({ loading: true });
    try {
      const result = await confirmationResult.confirm(otp);
      const profileUser = await get().syncUserProfile(result.user);
      return profileUser;
    } catch (err) {
      set({ loading: false });
      let message = 'Invalid or expired OTP code.';
      if (err.code === 'auth/invalid-verification-code') {
        message = 'Invalid OTP code. Please enter the correct code.';
      } else if (err.code === 'auth/code-expired') {
        message = 'OTP has expired. Please request a new one.';
      } else if (err.message) {
        message = err.message;
      }
      throw new Error(message);
    }
  },

  // Real Email & Password Registration
  register: async (name, email, phone, password, referralCode = '') => {
    if (!isFirebaseConfigured || !auth) {
      const uid = 'local-' + (Math.random().toString(36).substring(2, 10));
      const myReferralCode = `MANDI-${uid.slice(0, 4).toUpperCase()}-${uid.slice(-4).toUpperCase()}`;
      const sanitizedReferral = referralCode.trim().toUpperCase();
      const localUser = {
        id: uid,
        uid: uid,
        name: name || 'Mandi Customer',
        email: email,
        phone: phone || '',
        role: 'customer',
        storeId: null,
        addresses: [
          { id: 'addr-1', label: 'Home', line1: 'Shop 4, Agashi Road, Near Station', city: 'Virar West, Palghar', pincode: '401305', isDefault: true }
        ],
        wishlist: [],
        referralCode: myReferralCode,
        ...(sanitizedReferral && sanitizedReferral !== myReferralCode ? { referredBy: sanitizedReferral } : {}),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || 'Customer')}`,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('mandi_local_user', JSON.stringify(localUser));
      set({ user: localUser, loading: false });
      useCartStore.getState().switchUser(localUser.id);
      return localUser;
    }

    set({ loading: true });
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update auth profile display name
      if (name) {
        await updateProfile(firebaseUser, { displayName: name });
      }

      // Store initial user profile in Firestore
      if (db) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const myReferralCode = `MANDI-${firebaseUser.uid.slice(0, 4).toUpperCase()}-${firebaseUser.uid.slice(-4).toUpperCase()}`;
        const sanitizedReferral = referralCode.trim().toUpperCase();

        const userData = {
          uid: firebaseUser.uid,
          id: firebaseUser.uid,
          name,
          email,
          phone: phone || '',
          role: 'customer',
          storeId: null,
          addresses: [],
          wishlist: [],
          referralCode: myReferralCode,
          ...(sanitizedReferral && sanitizedReferral !== myReferralCode ? { referredBy: sanitizedReferral } : {}),
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
          createdAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, userData);
      }

      const profileUser = await get().syncUserProfile(firebaseUser);
      return profileUser;
    } catch (err) {
      set({ loading: false });
      let message = 'Failed to create account.';
      if (err.code === 'auth/email-already-in-use') {
        message = 'An account with this email already exists. Please log in.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Password is too weak. Please use at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Please provide a valid email address.';
      } else if (err.code === 'auth/configuration-not-found') {
        message = 'Firebase Auth is not enabled in your Firebase console. Please enable Email/Password in Authentication settings.';
      } else if (err.message) {
        message = err.message;
      }
      throw new Error(message);
    }
  },

  // Real Sign Out
  logout: async () => {
    set({ loading: true });
    if (auth && isFirebaseConfigured) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error('Sign out error:', err);
      }
    }
    localStorage.removeItem('mandi_local_user');
    useCartStore.getState().switchUser(null);
    set({ user: null, loading: false });
  },

  // Update profile attributes (addresses, wishlist, name)
  updateUser: async (updates) => {
    const currentUser = get().user;
    if (!currentUser?.uid && !currentUser?.id) return;

    // Filter out client attempts to self-escalate role or storeId
    const { role: _role, storeId: _storeId, uid: _uid, id: _id, ...safeUpdates } = updates;
    if (!isFirebaseConfigured) {
      const updated = { ...currentUser, ...safeUpdates };
      localStorage.setItem('mandi_local_user', JSON.stringify(updated));
      set({ user: updated });
      return updated;
    }

    if (db && isFirebaseConfigured && currentUser.uid) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userDocRef, safeUpdates);
        set(state => ({ user: state.user ? { ...state.user, ...safeUpdates } : null }));
        return { ...currentUser, ...safeUpdates };
      } catch (err) {
        console.error('Failed to sync user updates to Firestore:', err);
        throw new Error('Could not save your profile changes. Please try again.');
      }
    }
  },
}));
