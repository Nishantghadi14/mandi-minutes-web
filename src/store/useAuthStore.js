import { create } from 'zustand';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile, 
  onAuthStateChanged,
  signInWithPhoneNumber
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured, requestNotificationPermission } from '../config/firebase';

export const useAuthStore = create((set, get) => ({
  user: null,
  loading: true, // Start in loading state until onAuthStateChanged fires
  authModal: { open: false, mode: 'login' },
  unsubscribeAuth: null,

  openAuthModal: (mode = 'login') => set({ authModal: { open: true, mode } }),
  closeAuthModal: () => set({ authModal: { open: false, mode: 'login' } }),

  // Initialize Firebase Auth listener
  initAuth: () => {
    // If listener already active, don't recreate
    if (get().unsubscribeAuth) return get().unsubscribeAuth;

    if (!isFirebaseConfigured || !auth) {
      console.info('ℹ️ Running in local development mode — auth session maintained locally.');
      const localUser = localStorage.getItem('mandi_local_user');
      if (localUser) {
        try {
          set({ user: JSON.parse(localUser), loading: false });
        } catch {
          set({ user: null, loading: false });
        }
      } else {
        set({ user: null, loading: false });
      }
      return () => {};
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        set({ user: null, loading: false });
        return;
      }

      try {
        let userData = null;
        if (db) {
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
              role: 'customer', // Default role; cannot be self-elevated
              storeId: null,
              addresses: [],
              wishlist: [],
              referralCode: genReferral,
              avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(firebaseUser.displayName || firebaseUser.uid)}`,
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, userData, { merge: true });
          }
        }

        set({
          user: {
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            phone: firebaseUser.phoneNumber,
            displayName: firebaseUser.displayName,
            role: userData?.role || 'customer',
            storeId: userData?.storeId || null,
            addresses: userData?.addresses || [],
            wishlist: userData?.wishlist || [],
            avatar: userData?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(firebaseUser.uid)}`,
            name: userData?.name || firebaseUser.displayName || 'Customer',
            ...userData,
          },
          loading: false,
        });

        // Persist FCM token so Cloud Functions can send targeted push notifications
        try {
          const fcmToken = await requestNotificationPermission();
          if (fcmToken && db) {
            await updateDoc(doc(db, 'users', firebaseUser.uid), {
              fcmTokens: arrayUnion(fcmToken),
            });
          }
        } catch (fcmErr) {
          // Non-fatal: user may have denied notification permission
          console.info('FCM token not saved (permission denied or not supported):', fcmErr?.message);
        }
      } catch (err) {
        console.error('Error fetching user profile from Firestore:', err);
        set({
          user: {
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || 'Customer',
            role: 'customer',
            storeId: null,
            addresses: [],
            wishlist: [],
          },
          loading: false,
        });
      }
    });

    set({ unsubscribeAuth: unsubscribe });
    return unsubscribe;
  },

  // Real Email & Password Login
  login: async (email, password) => {
    set({ loading: true });
    if (!isFirebaseConfigured || !auth) {
      await new Promise(r => setTimeout(r, 300));
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
      return localUser;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Profile will be set by onAuthStateChanged listener
      return firebaseUser;
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
      set({ loading: true });
      await new Promise(r => setTimeout(r, 300));
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
        addresses: [],
        wishlist: [],
        referralCode: `MANDI-${uid.slice(0, 4).toUpperCase()}-${uid.slice(-4).toUpperCase()}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(phone)}`,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('mandi_local_user', JSON.stringify(localUser));
      set({ user: localUser, loading: false });
      return localUser;
    }

    set({ loading: true });
    try {
      const result = await confirmationResult.confirm(otp);
      return result.user;
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
    set({ loading: true });
    if (!isFirebaseConfigured || !auth) {
      await new Promise(r => setTimeout(r, 300));
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
        addresses: [],
        wishlist: [],
        referralCode: myReferralCode,
        ...(sanitizedReferral && sanitizedReferral !== myReferralCode ? { referredBy: sanitizedReferral } : {}),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || 'Customer')}`,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('mandi_local_user', JSON.stringify(localUser));
      set({ user: localUser, loading: false });
      return localUser;
    }

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
          role: 'customer', // Always customer on registration; admin/vendor assigned via backend or locked admin process
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

      return firebaseUser;
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
    set({ user: null, loading: false });
  },

  // Update profile attributes (addresses, wishlist, name)
  updateUser: async (updates) => {
    const currentUser = get().user;
    if (!currentUser?.uid && !currentUser?.id) return;

    // Filter out client attempts to self-escalate role or storeId
    const { role: _role, storeId: _storeId, uid: _uid, id: _id, ...safeUpdates } = updates;
    const updated = { ...currentUser, ...safeUpdates };

    set(state => ({
      user: state.user ? { ...state.user, ...safeUpdates } : null
    }));
    localStorage.setItem('mandi_local_user', JSON.stringify(updated));

    if (db && isFirebaseConfigured && currentUser.uid) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userDocRef, safeUpdates);
      } catch (err) {
        console.error('Failed to sync user updates to Firestore:', err);
      }
    }
  },
}));
