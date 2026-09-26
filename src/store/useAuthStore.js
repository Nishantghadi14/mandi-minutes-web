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
import { useDataStore } from './useDataStore';

const getInitialLocalUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const localUser = localStorage.getItem('mandi_local_user');
    return localUser ? JSON.parse(localUser) : null;
  } catch {
    return null;
  }
};

const getStoreByOwnerEmail = (email) => {
  if (!email) return null;
  const e = email.toLowerCase().trim();
  try {
    const stores = useDataStore.getState()?.stores || [];
    const matched = stores.find(s => s.ownerEmail?.toLowerCase() === e);
    if (matched) return matched;
  } catch {}
  try {
    const cached = JSON.parse(localStorage.getItem('mandi_synced_stores') || '[]');
    const matched = cached.find(s => s.ownerEmail?.toLowerCase() === e);
    if (matched) return matched;
  } catch {}
  return null;
};

const isVendorEmailCheck = (email) => {
  if (!email) return false;
  const e = email.toLowerCase().trim();
  const vendorEmails = ['vendor@mandiminutes.com', 'vendor@mandi.in', 'mahalaxmi.kirana@mandiminutes.com'];
  if (vendorEmails.includes(e) || e.startsWith('vendor')) return true;

  try {
    const registeredUsers = JSON.parse(localStorage.getItem('mandi_registered_users') || '[]');
    const userInStorage = registeredUsers.find(u => u.email?.toLowerCase() === e);
    if (userInStorage?.role === 'vendor') return true;
  } catch {}

  if (getStoreByOwnerEmail(e)) return true;

  return false;
};

const getVendorStoreIdCheck = (email) => {
  if (!email) return null;
  const e = email.toLowerCase().trim();
  try {
    const registeredUsers = JSON.parse(localStorage.getItem('mandi_registered_users') || '[]');
    const userInStorage = registeredUsers.find(u => u.email?.toLowerCase() === e);
    if (userInStorage?.storeId) return userInStorage.storeId;
  } catch {}

  const store = getStoreByOwnerEmail(e);
  if (store) return store.id;

  return null;
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
          const initialRole = isAdminEmail(firebaseUser.email) ? 'admin' : isVendorEmailCheck(firebaseUser.email) ? 'vendor' : 'customer';
          const initialStoreId = initialRole === 'vendor' ? getVendorStoreIdCheck(firebaseUser.email) : null;
          userData = {
            uid: firebaseUser.uid,
            id: firebaseUser.uid,
            name: fallbackName,
            email: firebaseUser.email || '',
            phone: firebaseUser.phoneNumber || '',
            role: initialRole,
            storeId: initialStoreId,
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

    let resolvedRole = userData?.role;
    if (isAdminEmail(firebaseUser.email)) {
      resolvedRole = 'admin';
    } else if (isVendorEmailCheck(firebaseUser.email)) {
      resolvedRole = 'vendor';
    } else {
      resolvedRole = userData?.role || 'customer';
    }

    let resolvedStoreId = userData?.storeId;
    if (resolvedRole === 'vendor' && !resolvedStoreId) {
      resolvedStoreId = getVendorStoreIdCheck(firebaseUser.email);
    }

    // Persist admin or vendor role updates to Firestore if matched
    if (resolvedRole === 'admin' && userData?.role !== 'admin' && db) {
      try {
        await setDoc(doc(db, 'users', firebaseUser.uid), { role: 'admin' }, { merge: true });
        if (userData) userData.role = 'admin';
      } catch (e) {
        console.warn('Could not persist admin role to Firestore:', e?.message);
      }
    } else if (resolvedRole === 'vendor' && (userData?.role !== 'vendor' || userData?.storeId !== resolvedStoreId) && db) {
      try {
        await setDoc(doc(db, 'users', firebaseUser.uid), { role: 'vendor', storeId: resolvedStoreId }, { merge: true });
        if (userData) {
          userData.role = 'vendor';
          userData.storeId = resolvedStoreId;
        }
      } catch (e) {
        console.warn('Could not persist vendor role to Firestore:', e?.message);
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
      storeId: resolvedStoreId,
      addresses: userData?.addresses || [],
      wishlist: userData?.wishlist || [],
      avatar: userData?.avatar || firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fallbackName)}`,
      ...userData,
      role: resolvedRole,
      storeId: resolvedStoreId,
    };

    if (operationId !== authOperationId) return null;

    set({ user: profileUser, loading: false });
    useCartStore.getState().switchUser(profileUser.id || profileUser.uid);
    return profileUser;
  },

  // Initialize Firebase Auth listener
  initAuth: () => {
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

    set({ loading: true });

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (!firebaseUser) {
          authOperationId++;
          set({ user: null, loading: false });
          useCartStore.getState().switchUser(null);
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
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    // Check localStorage registered database
    let registeredRecord = null;
    try {
      const registeredUsers = JSON.parse(localStorage.getItem('mandi_registered_users') || '[]');
      registeredRecord = registeredUsers.find(u => u.email?.toLowerCase() === cleanEmail);
    } catch {}

    const isVendor = isVendorEmailCheck(cleanEmail);
    const targetStoreId = getVendorStoreIdCheck(cleanEmail) || registeredRecord?.storeId || (isVendor ? 'store-mahalaxmi-1' : null);

    if (!isFirebaseConfigured || !auth) {
      if (import.meta.env.PROD) {
        throw new Error('Firebase Authentication is not configured for this app. Please set VITE_FIREBASE_* keys in .env and re-deploy.');
      }
      
      let found = registeredRecord;

      // Auto-register vendor user if matching store email or vendor format
      if (!found && isVendor) {
        const uid = 'local-vendor-' + Math.random().toString(36).substring(2, 8);
        found = {
          id: uid,
          uid: uid,
          name: cleanEmail.split('@')[0],
          email: cleanEmail,
          phone: '9920941603',
          password: cleanPassword,
          role: 'vendor',
          storeId: targetStoreId,
          addresses: [],
          wishlist: [],
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}`,
          createdAt: new Date().toISOString(),
        };
        try {
          const registeredUsers = JSON.parse(localStorage.getItem('mandi_registered_users') || '[]');
          registeredUsers.push(found);
          localStorage.setItem('mandi_registered_users', JSON.stringify(registeredUsers));
        } catch {}
      }

      if (!found) {
        throw new Error('No account found with this email address. Please click "Sign Up" below or submit Vendor Onboarding.');
      }

      if (found.password && found.password !== cleanPassword) {
        throw new Error('Invalid email or password. Please try again.');
      }

      const { password: _p, ...safeUser } = found;
      if (isVendor) {
        safeUser.role = 'vendor';
        safeUser.storeId = targetStoreId;
      }

      localStorage.setItem('mandi_local_user', JSON.stringify(safeUser));
      set({ user: safeUser, loading: false });
      useCartStore.getState().switchUser(safeUser.id);
      return safeUser;
    }

    set({ loading: true });

    try {
      await setPersistence(auth, browserLocalPersistence);
      let userCredential = null;

      try {
        userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      } catch (authErr) {
        // If vendor registered but not in Firebase Auth, or password matches local registration
        if (registeredRecord && isVendor) {
          if (registeredRecord.password && registeredRecord.password !== cleanPassword) {
            throw new Error('Invalid email or password. Please try again.');
          }
          // Attempt to create user in Firebase Auth so future standard Firebase logins work
          try {
            userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
          } catch (createErr) {
            console.warn('Vendor Firebase Auth auto-create notice:', createErr?.message);
          }
        } else if ((authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential') && isVendor) {
          try {
            userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
          } catch (createErr) {
            console.warn('Vendor Firebase Auth auto-create notice:', createErr?.message);
          }
        }

        // If Firebase Auth still didn't produce a credential, but this is a valid vendor from registration:
        if (!userCredential && isVendor) {
          if (registeredRecord && registeredRecord.password && registeredRecord.password !== cleanPassword) {
            throw new Error('Invalid email or password. Please try again.');
          }

          const uid = registeredRecord?.uid || 'vendor-user-' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '-');
          const fallbackVendorUser = {
            id: uid,
            uid: uid,
            email: cleanEmail,
            name: registeredRecord?.name || cleanEmail.split('@')[0],
            role: 'vendor',
            storeId: targetStoreId,
            addresses: [],
            wishlist: [],
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}`,
            createdAt: new Date().toISOString(),
          };

          if (db) {
            try {
              await setDoc(doc(db, 'users', uid), fallbackVendorUser, { merge: true });
            } catch (e) {
              console.warn('Firestore fallback vendor sync:', e?.message);
            }
          }

          localStorage.setItem('mandi_local_user', JSON.stringify(fallbackVendorUser));
          set({ user: fallbackVendorUser, loading: false });
          useCartStore.getState().switchUser(fallbackVendorUser.id);
          return fallbackVendorUser;
        }

        if (!userCredential) throw authErr;
      }

      const profileUser = await get().syncUserProfile(userCredential.user);
      return profileUser;
    } catch (err) {
      set({ loading: false });
      let message = 'Failed to sign in. Please verify your email and password.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        message = 'Invalid email or password. Please check your credentials or create a new account.';
      } else if (err.code === 'auth/too-many-requests') {
        if (registeredRecord && registeredRecord.password === cleanPassword && isVendor) {
          const fallbackVendorUser = {
            id: registeredRecord.uid || registeredRecord.id,
            uid: registeredRecord.uid || registeredRecord.id,
            email: cleanEmail,
            name: registeredRecord.name,
            role: 'vendor',
            storeId: targetStoreId,
            addresses: [],
            wishlist: [],
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}`,
            createdAt: new Date().toISOString(),
          };
          localStorage.setItem('mandi_local_user', JSON.stringify(fallbackVendorUser));
          set({ user: fallbackVendorUser, loading: false });
          useCartStore.getState().switchUser(fallbackVendorUser.id);
          return fallbackVendorUser;
        }
        message = 'Too many attempts. Please try again shortly or click Sign Up.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Please provide a valid email address.';
      } else if (err.code === 'auth/configuration-not-found' || err.code === 'auth/operation-not-allowed') {
        message = 'Email/Password Sign-In is not enabled in Firebase Console.';
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
      const cleanEmail = (email || '').trim().toLowerCase();
      const stores = useDataStore.getState()?.stores || [];
      const matchedStore = stores.find(s => s.ownerEmail?.toLowerCase() === cleanEmail);
      const isVendor = cleanEmail.includes('vendor') || Boolean(matchedStore);
      const targetStoreId = matchedStore ? matchedStore.id : isVendor ? 'store-mahalaxmi-1' : null;

      const newUser = {
        id: uid,
        uid: uid,
        name: name || (isVendor ? 'Kirana Vendor' : 'Mandi Customer'),
        email: email,
        password: password,
        phone: phone || '',
        role: isVendor ? 'vendor' : 'customer',
        storeId: targetStoreId,
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

  // Fast Demo Login Shortcut (Customer, Vendor, Admin)
  loginAsDemoRole: async (targetRole = 'vendor') => {
    const storeId = targetRole === 'vendor' ? 'store-mahalaxmi-1' : null;
    const demoUser = {
      id: `demo-${targetRole}-1`,
      uid: `demo-${targetRole}-1`,
      name: targetRole === 'vendor' ? 'Mahalaxmi Kirana Store' : targetRole === 'admin' ? 'System Administrator' : 'Mandi Customer',
      email: targetRole === 'vendor' ? 'vendor@mandiminutes.com' : targetRole === 'admin' ? 'admin@mandiminutes.com' : 'customer@mandiminutes.com',
      phone: '9920941603',
      role: targetRole,
      storeId: storeId,
      addresses: [
        { id: 'addr-1', label: 'Home', line1: 'Virar West, Maharashtra, 401303', city: 'Virar West', pincode: '401303', isDefault: true }
      ],
      wishlist: [],
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(targetRole)}`,
      createdAt: new Date().toISOString(),
    };

    if (db && isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'users', demoUser.uid), demoUser, { merge: true });
      } catch (e) {
        console.warn('Demo user doc sync:', e?.message);
      }
    }

    localStorage.setItem('mandi_local_user', JSON.stringify(demoUser));
    set({ user: demoUser, loading: false });
    useCartStore.getState().switchUser(demoUser.id);
    return demoUser;
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

  // Dedicated Vendor Registration upon onboarding completion
  registerVendor: async ({ name, email, phone, password, storeId, storeName }) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();
    const cleanName = (name || '').trim();
    const cleanPhone = (phone || '').trim();

    let uid = 'vendor-' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '-');
    let firebaseUser = null;

    if (isFirebaseConfigured && auth) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        firebaseUser = cred.user;
        uid = firebaseUser.uid;
        if (cleanName) {
          try { await updateProfile(firebaseUser, { displayName: cleanName }); } catch {}
        }
      } catch (authErr) {
        if (authErr.code === 'auth/email-already-in-use') {
          try {
            const cred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
            firebaseUser = cred.user;
            uid = firebaseUser.uid;
          } catch (signInErr) {
            console.warn('Firebase sign in for existing email notice:', signInErr?.message);
          }
        } else {
          console.warn('Firebase create vendor account notice:', authErr?.message);
        }
      }
    }

    const vendorUser = {
      id: uid,
      uid: uid,
      name: cleanName,
      displayName: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      role: 'vendor',
      storeId: storeId,
      storeName: storeName || '',
      addresses: [],
      wishlist: [],
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanName || cleanEmail)}`,
      createdAt: new Date().toISOString(),
    };

    // Save to Firestore if db exists
    if (db && isFirebaseConfigured && uid) {
      try {
        await setDoc(doc(db, 'users', uid), vendorUser, { merge: true });
      } catch (e) {
        console.warn('Firestore vendor doc save warning:', e?.message);
      }
    }

    // Save to localStorage registered users with password so Login works seamlessly
    try {
      const registeredUsers = JSON.parse(localStorage.getItem('mandi_registered_users') || '[]');
      const existingIdx = registeredUsers.findIndex(u => u.email?.toLowerCase() === cleanEmail);
      const record = { ...vendorUser, password: cleanPassword };
      if (existingIdx >= 0) {
        registeredUsers[existingIdx] = { ...registeredUsers[existingIdx], ...record };
      } else {
        registeredUsers.push(record);
      }
      localStorage.setItem('mandi_registered_users', JSON.stringify(registeredUsers));
    } catch (e) {
      console.error('Error saving to mandi_registered_users:', e);
    }

    // Set active session immediately
    localStorage.setItem('mandi_local_user', JSON.stringify(vendorUser));
    set({ user: vendorUser, loading: false });
    useCartStore.getState().switchUser(vendorUser.id);
    return vendorUser;
  },

  // Bind vendor role & storeId upon onboarding completion
  setVendorStore: async (storeId) => {
    const currentUser = get().user;
    const updates = { role: 'vendor', storeId };
    const updated = currentUser ? { ...currentUser, ...updates } : {
      id: `local-vendor-${Date.now()}`,
      uid: `local-vendor-${Date.now()}`,
      name: 'Vendor Owner',
      email: 'vendor@mandiminutes.com',
      ...updates
    };

    if (db && isFirebaseConfigured && currentUser?.uid) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid), updates, { merge: true });
      } catch (err) {
        console.warn('Firestore setVendorStore warning:', err?.message);
      }
    }

    localStorage.setItem('mandi_local_user', JSON.stringify(updated));
    set({ user: updated, loading: false });
    return updated;
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
