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
      console.warn('Firebase Auth is not configured. Starting in unauthenticated state.');
      set({ user: null, loading: false });
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
    if (!auth) {
      set({ loading: false });
      throw new Error('Authentication service is not initialized.');
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
      } else if (err.message) {
        message = err.message;
      }
      throw new Error(message);
    }
  },

  // Real Phone Authentication with Recaptcha
  sendPhoneOtp: async (phoneNumber, appVerifier) => {
    if (!auth) throw new Error('Authentication service is not initialized.');
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
    if (!auth) {
      set({ loading: false });
      throw new Error('Authentication service is not initialized.');
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
      } else if (err.message) {
        message = err.message;
      }
      throw new Error(message);
    }
  },

  // Real Sign Out
  logout: async () => {
    set({ loading: true });
    if (auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error('Sign out error:', err);
      }
    }
    set({ user: null, loading: false });
  },

  // Update profile attributes (addresses, wishlist, name)
  updateUser: async (updates) => {
    const currentUser = get().user;
    if (!currentUser?.uid) return;

    // Filter out client attempts to self-escalate role or storeId
    const { role: _role, storeId: _storeId, uid: _uid, id: _id, ...safeUpdates } = updates;

    set(state => ({
      user: state.user ? { ...state.user, ...safeUpdates } : null
    }));

    if (db && currentUser.uid) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userDocRef, safeUpdates);
      } catch (err) {
        console.error('Failed to sync user updates to Firestore:', err);
      }
    }
  },
}));
