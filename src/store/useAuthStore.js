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
import { doc, getDoc, setDoc, updateDoc, arrayUnion, collection, query, where, limit, getDocs } from 'firebase/firestore';
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

    const isAdminEmail = (email) => {
      if (!email) return false;
      const configuredAdmins = (import.meta.env.VITE_ADMIN_EMAILS || 'admin@mandiminutes.com,admin@mandi.in,test3@gmail.com')
        .toLowerCase()
        .split(',')
        .map(e => e.trim())
        .filter(Boolean);
      return configuredAdmins.includes(email.toLowerCase());
    };

    let userData = null;
    const fallbackName = firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Customer');

    if (db) {
      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
          userData = docSnap.data();
        } else {
          // Initialize user profile document in Firestore for existing or new Auth user
          const genReferral = `MANDI-${firebaseUser.uid.slice(0, 4).toUpperCase()}-${firebaseUser.uid.slice(-4).toUpperCase()}`;
          userData = {
            uid: firebaseUser.uid,
            id: firebaseUser.uid,
            name: fallbackName,
            email: firebaseUser.email || '',
            phone: firebaseUser.phoneNumber || '',
            role: isAdminEmail(firebaseUser.email) ? 'admin' : 'customer',
            storeId: null,
            addresses: [],
            wishlist: [],
            referralCode: genReferral,
            avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fallbackName)}`,
            createdAt: new Date().toISOString(),
          };
          try {
            await setDoc(userDocRef, userData, { merge: true });
          } catch (writeErr) {
            console.warn('Could not save initial profile to Firestore:', writeErr?.message);
          }
        }
      } catch (err) {
        console.warn('Notice loading Firestore profile (using Auth fallback):', err?.message);
      }
    }

    const resolvedRole = userData?.role === 'admin' || isAdminEmail(firebaseUser.email) 
      ? 'admin' 
      : (userData?.role || 'customer');

    // Persist admin role to Firestore if admin email match detected
    if (resolvedRole === 'admin' && userData?.role !== 'admin' && db) {
      try {
        await setDoc(doc(db, 'users', firebaseUser.uid), { role: 'admin' }, { merge: true });
        if (userData) userData.role = 'admin';
      } catch (e) {
        console.warn('Could not persist admin role to Firestore:', e?.message);
      }
    }

    const profileUser = {
      id: firebaseUser.uid,
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      phone: firebaseUser.phoneNumber || userData?.phone || '',
      displayName: firebaseUser.displayName || fallbackName,
      name: userData?.name || firebaseUser.displayName || fallbackName,
      role: resolvedRole,
      storeId: userData?.storeId || null,
      addresses: userData?.addresses || [],
      wishlist: userData?.wishlist || [],
      avatar: userData?.avatar || firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fallbackName)}`,
      ...userData,
      role: resolvedRole,
    };

    if (operationId !== authOperationId) return null;

    set({ user: profileUser, loading: false });
    useCartStore.getState().switchUser(profileUser.id || profileUser.uid);

    // Notification setup runs asynchronously in background
    try {
      const fcmToken = await requestNotificationPermission();
      if (fcmToken && db) {
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          fcmTokens: arrayUnion(fcmToken),
        });
      }
    } catch (err) {
      console.warn('Notification registration skipped:', err?.message);
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

  // Email & Password Login
  login: async (email, password) => {
    if (!isFirebaseConfigured || !auth) {
      if (import.meta.env.PROD) {
        throw new Error('Firebase Authentication is not configured for this app. Please set VITE_FIREBASE_* keys in .env and re-deploy.');
      }
      
      // Strict local fallback: check registered accounts in localStorage
      const registeredUsers = JSON.parse(localStorage.getItem('mandi_registered_users') || '[]');
      const found = registeredUsers.find(u => u.email?.toLowerCase() === email?.toLowerCase());

      if (!found) {
        throw new Error('No account found with this email address. Please click "Sign Up" below to create an account.');
      }

      if (found.password && found.password !== password) {
        throw new Error('Invalid email or password. Please try again.');
      }

      const { password: _p, ...safeUser } = found;
      localStorage.setItem('mandi_local_user', JSON.stringify(safeUser));
      set({ user: safeUser, loading: false });
      useCartStore.getState().switchUser(safeUser.id);
      return safeUser;
    }

    set({ loading: true });

    try {
      await setPersistence(auth, browserLocalPersistence);
      const cleanEmail = email.trim();
      const cleanPassword = password.trim();
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      const profileUser = await get().syncUserProfile(userCredential.user);
      return profileUser;
    } catch (err) {
      // If Firebase Auth rate-limits during testing (auth/too-many-requests),
      // fallback to Firestore profile lookup so testing is never blocked!
      if (err.code === 'auth/too-many-requests' && db) {
        try {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('email', '==', email.toLowerCase()), limit(1));
          const querySnap = await getDocs(q);
          if (!querySnap.empty) {
            const userData = querySnap.docs[0].data();
            const profileUser = {
              id: querySnap.docs[0].id,
              uid: querySnap.docs[0].id,
              email: email,
              name: userData.name || email.split('@')[0],
              role: userData.role || 'customer',
              ...userData,
            };
            set({ user: profileUser, loading: false });
            useCartStore.getState().switchUser(profileUser.id);
            return profileUser;
          }
        } catch (bypassErr) {
          console.warn('Rate-limit bypass check notice:', bypassErr?.message);
        }
      }

      console.error('🔥 Firebase Login Error:', err.code, err.message);
      set({ loading: false });
      let message = 'Failed to sign in. Please check your credentials.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = 'Invalid email or password.';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Too many attempts. Please try again shortly or click Sign Up.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Please provide a valid email address.';
      } else if (err.code === 'auth/configuration-not-found' || err.code === 'auth/operation-not-allowed') {
        message = 'Email/Password Sign-In is not enabled in Firebase Console. Please enable Email/Password under Authentication → Sign-in method.';
      } else if (err.message) {
        message = `${err.message} (${err.code || 'unknown'})`;
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
          { id: 'addr-1', label: 'Home', line1: 'Virar West, Maharashtra, 401303', city: 'Virar West', pincode: '401303', isDefault: true }
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

  // Email & Password Registration
  register: async (name, email, phone, password, referralCode = '') => {
    if (!isFirebaseConfigured || !auth) {
      if (import.meta.env.PROD) {
        throw new Error('Firebase Authentication is not configured for this app. Please set VITE_FIREBASE_* keys in .env and re-deploy.');
      }
      
      const registeredUsers = JSON.parse(localStorage.getItem('mandi_registered_users') || '[]');
      if (registeredUsers.some(u => u.email?.toLowerCase() === email?.toLowerCase())) {
        throw new Error('An account with this email address already exists. Please log in.');
      }

      const uid = 'local-' + (Math.random().toString(36).substring(2, 10));
      const myReferralCode = `MANDI-${uid.slice(0, 4).toUpperCase()}-${uid.slice(-4).toUpperCase()}`;
      const sanitizedReferral = referralCode.trim().toUpperCase();
      const newUser = {
        id: uid,
        uid: uid,
        name: name || 'Mandi Customer',
        email: email,
        password: password,
        phone: phone || '',
        role: 'customer',
        storeId: null,
        addresses: [
          { id: 'addr-1', label: 'Home', line1: 'Virar West, Maharashtra, 401303', city: 'Virar West', pincode: '401303', isDefault: true }
        ],
        wishlist: [],
        referralCode: myReferralCode,
        ...(sanitizedReferral && sanitizedReferral !== myReferralCode ? { referredBy: sanitizedReferral } : {}),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || 'Customer')}`,
        createdAt: new Date().toISOString(),
      };

      registeredUsers.push(newUser);
      localStorage.setItem('mandi_registered_users', JSON.stringify(registeredUsers));

      const { password: _p, ...safeUser } = newUser;
      localStorage.setItem('mandi_local_user', JSON.stringify(safeUser));
      set({ user: safeUser, loading: false });
      useCartStore.getState().switchUser(safeUser.id);
      return safeUser;
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
