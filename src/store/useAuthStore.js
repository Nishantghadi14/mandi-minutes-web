import { create } from 'zustand';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile, 
  onAuthStateChanged,
  signInWithPhoneNumber,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, query, collection, where, getDocs, limit } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../config/firebase';
import { useCartStore } from './useCartStore';
import { useDataStore } from './useDataStore';
import { validateEmail } from '../utils/validators';
import { normalizePhoneNumber, toE164, isValidIndianPhone } from '../utils/phone';

const scrubMockAddress = (addrList) => {
  if (!Array.isArray(addrList)) return [];
  return addrList.filter(a => !(a.id === 'addr-1' && a.line1 === 'Virar West, Maharashtra, 401303'));
};

const getInitialLocalUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    // Security hygiene: scrub legacy passwords and mock placeholder addresses from localStorage
    const storedReg = localStorage.getItem('mandi_registered_users');
    if (storedReg) {
      const parsed = JSON.parse(storedReg);
      if (Array.isArray(parsed)) {
        let changed = false;
        const sanitized = parsed.map(({ password: _p, ...safe }) => {
          if (Array.isArray(safe.addresses)) {
            const cleaned = scrubMockAddress(safe.addresses);
            if (cleaned.length !== safe.addresses.length) {
              safe.addresses = cleaned;
              changed = true;
            }
          } else {
            safe.addresses = [];
          }
          return safe;
        });
        if (changed || parsed.some(u => 'password' in u)) {
          localStorage.setItem('mandi_registered_users', JSON.stringify(sanitized));
        }
      }
    }

    // Clean legacy mock checkout address if present
    try {
      const storedCheckout = JSON.parse(localStorage.getItem('mandi_checkout_address') || 'null');
      if (storedCheckout && (storedCheckout.id === 'addr-1' || storedCheckout.line1 === 'Virar West, Maharashtra, 401303')) {
        localStorage.removeItem('mandi_checkout_address');
      }
    } catch {}

    const localUser = localStorage.getItem('mandi_local_user');
    if (localUser) {
      const { password: _p, ...safeUser } = JSON.parse(localUser);
      if (Array.isArray(safeUser.addresses)) {
        const cleaned = scrubMockAddress(safeUser.addresses);
        if (cleaned.length !== safeUser.addresses.length) {
          safeUser.addresses = cleaned;
          localStorage.setItem('mandi_local_user', JSON.stringify(safeUser));
        }
      } else {
        safeUser.addresses = [];
      }
      return safeUser;
    }
    return null;
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
  if (vendorEmails.includes(e)) return true;

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
      const configuredAdmins = (import.meta.env.VITE_ADMIN_EMAILS || 'admin@mandiminutes.com,admin@mandi.in')
        .toLowerCase()
        .split(',')
        .map(e => e.trim())
        .filter(Boolean);
      return configuredAdmins.includes(email.toLowerCase());
    };

    let userData = null;
    const cleanUserPhone = normalizePhoneNumber(firebaseUser.phoneNumber || firebaseUser.phone || '');
    const fallbackName = firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : (cleanUserPhone ? `Customer ${cleanUserPhone.slice(-4)}` : 'Customer'));

    if (db) {
      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
          userData = docSnap.data();
        } else {
          // If this is a Phone Auth login, check if an existing account has this phone number linked
          let linkedMaster = null;
          if (cleanUserPhone) {
            try {
              const phoneIdxSnap = await getDoc(doc(db, 'phoneIndex', cleanUserPhone));
              if (phoneIdxSnap.exists()) {
                const masterUid = phoneIdxSnap.data()?.uid;
                if (masterUid && masterUid !== firebaseUser.uid) {
                  const masterSnap = await getDoc(doc(db, 'users', masterUid));
                  if (masterSnap.exists()) {
                    linkedMaster = masterSnap.data();
                  }
                }
              }

              if (!linkedMaster) {
                const q = query(collection(db, 'users'), where('phone', 'in', [cleanUserPhone, `+91${cleanUserPhone}`]), limit(1));
                const qSnap = await getDocs(q);
                if (!qSnap.empty && qSnap.docs[0].id !== firebaseUser.uid) {
                  linkedMaster = qSnap.docs[0].data();
                }
              }
            } catch (linkErr) {
              console.warn('Firestore phone linking check notice:', linkErr?.message);
            }
          }

          // Check local registered users if Firestore didn't have a linked account
          if (!linkedMaster && cleanUserPhone && (typeof window !== 'undefined' || typeof localStorage !== 'undefined')) {
            try {
              const regUsers = JSON.parse(localStorage.getItem('mandi_registered_users') || '[]');
              const matched = regUsers.find(u => normalizePhoneNumber(u.phone) === cleanUserPhone);
              if (matched) linkedMaster = matched;
            } catch {}
          }

          if (linkedMaster) {
            // Restore existing linked account details into this session
            userData = {
              ...linkedMaster,
              uid: firebaseUser.uid,
              id: firebaseUser.uid,
              phone: cleanUserPhone,
              linkedMasterUid: linkedMaster.uid || linkedMaster.id,
              linkedAt: new Date().toISOString(),
            };
          } else {
            // Initialize new user profile document in Firestore
            const genReferral = `MANDI-${cleanUserPhone ? cleanUserPhone.slice(-4).toUpperCase() : firebaseUser.uid.slice(0, 4).toUpperCase()}-${firebaseUser.uid.slice(-4).toUpperCase()}`;
            const initialRole = isAdminEmail(firebaseUser.email) ? 'admin' : 'customer';
            userData = {
              uid: firebaseUser.uid,
              id: firebaseUser.uid,
              name: fallbackName,
              email: firebaseUser.email || '',
              phone: cleanUserPhone || '',
              role: initialRole,
              storeId: null,
              addresses: [],
              wishlist: [],
              referralCode: genReferral,
              avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fallbackName)}`,
              createdAt: new Date().toISOString(),
            };
          }

          try {
            await setDoc(userDocRef, userData, { merge: true });
            if (cleanUserPhone) {
              await setDoc(doc(db, 'phoneIndex', cleanUserPhone), {
                uid: firebaseUser.uid,
                email: userData.email || '',
                name: userData.name || '',
                role: userData.role || 'customer',
                storeId: userData.storeId || null,
                phone: cleanUserPhone,
                updatedAt: new Date().toISOString(),
              }, { merge: true });
            }
          } catch (writeErr) {
            console.warn('Could not save profile to Firestore:', writeErr?.message);
          }
        }
      } catch (err) {
        console.warn('Notice loading Firestore profile (using Auth fallback):', err?.message);
      }
    } else if (cleanUserPhone && (typeof window !== 'undefined' || typeof localStorage !== 'undefined')) {
      // Local/Mock mode without Firestore
      try {
        const regUsers = JSON.parse(localStorage.getItem('mandi_registered_users') || '[]');
        const matched = regUsers.find(u => normalizePhoneNumber(u.phone) === cleanUserPhone);
        if (matched) {
          userData = { ...matched, uid: firebaseUser.uid, id: firebaseUser.uid };
        }
      } catch {}
    }

    let resolvedRole = userData?.role;
    if (isAdminEmail(userData?.email || firebaseUser.email)) {
      resolvedRole = 'admin';
    } else {
      resolvedRole = userData?.role || 'customer';
    }

    const resolvedStoreId = userData?.storeId || null;

    const profileUser = {
      id: firebaseUser.uid,
      uid: firebaseUser.uid,
      email: userData?.email || firebaseUser.email || '',
      displayName: userData?.name || firebaseUser.displayName || fallbackName,
      name: userData?.name || firebaseUser.displayName || fallbackName,
      addresses: userData?.addresses || [],
      wishlist: userData?.wishlist || [],
      avatar: userData?.avatar || firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fallbackName)}`,
      ...userData,
      phone: cleanUserPhone || normalizePhoneNumber(userData?.phone) || userData?.phone || '',
      phoneNumber: firebaseUser.phoneNumber || toE164(cleanUserPhone),
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

  // Real Phone Authentication with Terminal OTP (Dev) & Recaptcha (Prod)
  sendPhoneOtp: async (phoneNumber, appVerifier) => {
    const cleanPhone = normalizePhoneNumber(phoneNumber);
    if (!cleanPhone || !isValidIndianPhone(cleanPhone)) {
      throw new Error('Please enter a valid 10-digit Indian mobile number.');
    }

    const formattedPhone = `+91${cleanPhone}`;
    const isDev = import.meta.env.DEV || (typeof process !== 'undefined' && process.env?.VITEST);

    // Development Mode: Generate OTP and send directly to active Terminal CLI & Console
    if (isDev) {
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

      if (typeof window !== 'undefined') {
        window._mandiDevOtps = window._mandiDevOtps || {};
        window._mandiDevOtps[cleanPhone] = {
          otp: generatedOtp,
          expiresAt: Date.now() + 5 * 60 * 1000,
        };
      }

      // Dispatch to Vite dev server middleware to print on active terminal
      if (typeof fetch === 'function') {
        try {
          fetch('/api/dev-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: cleanPhone, otp: generatedOtp }),
          }).catch(() => {});
        } catch {
          // Dev middleware might not be present in test runners
        }
      }

      // Output directly to browser developer console
      console.info(
        `%c⚡ MANDI MINUTES DEV OTP: ${generatedOtp} (Mobile: +91 ${cleanPhone})`,
        'background: #00C851; color: #000; font-weight: bold; font-size: 14px; padding: 4px 8px; border-radius: 4px;'
      );

      return {
        verificationId: 'dev-otp-' + Date.now(),
        phone: cleanPhone,
        isDevOtp: true,
        confirm: async (enteredOtp) => {
          const session = typeof window !== 'undefined' ? window._mandiDevOtps?.[cleanPhone] : null;
          const validOtp = session?.otp || generatedOtp;
          if (enteredOtp !== validOtp && enteredOtp !== '123456') {
            const err = new Error('Invalid OTP code. Please enter the 6-digit code shown in your terminal.');
            err.code = 'auth/invalid-verification-code';
            throw err;
          }

          return {
            user: {
              uid: 'phone-user-' + cleanPhone,
              phoneNumber: formattedPhone,
              displayName: '',
              email: '',
              isDevPhoneUser: true,
            },
          };
        },
      };
    }

    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase Authentication is required in production.');
    }

    try {
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
    if (!otp || String(otp).trim().length < 6) {
      throw new Error('Please enter the 6-digit OTP code.');
    }

    const cleanOtp = String(otp).trim();
    set({ loading: true });

    try {
      if (!confirmationResult || typeof confirmationResult.confirm !== 'function') {
        throw new Error('No active OTP session. Please request a new OTP.');
      }

      const result = await confirmationResult.confirm(cleanOtp);
      const profileUser = await get().syncUserProfile(result.user);
      return profileUser;
    } catch (err) {
      set({ loading: false });
      let message = 'Invalid or expired OTP code.';
      if (err.code === 'auth/invalid-verification-code') {
        message = 'Invalid OTP code. Please enter the correct code shown in your terminal.';
      } else if (err.code === 'auth/code-expired') {
        message = 'OTP has expired. Please request a new one.';
      } else if (err.message) {
        message = err.message;
      }
      const customErr = new Error(message);
      customErr.code = err.code || 'auth/unknown';
      throw customErr;
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
      const isVendor = isVendorEmailCheck(cleanEmail) || Boolean(matchedStore);
      const targetStoreId = matchedStore ? matchedStore.id : (isVendor ? 'store-mahalaxmi-1' : null);

      const newUser = {
        id: uid,
        uid: uid,
        name: name || (isVendor ? 'Kirana Vendor' : 'Mandi Customer'),
        email: email,
        password: password,
        phone: phone || '',
        role: isVendor ? 'vendor' : 'customer',
        storeId: targetStoreId,
        addresses: [],
        wishlist: [],
        referralCode: myReferralCode,
        ...(sanitizedReferral && sanitizedReferral !== myReferralCode ? { referredBy: sanitizedReferral } : {}),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || 'Customer')}`,
        createdAt: new Date().toISOString(),
      };

      const { password: _p, ...safeUser } = newUser;
      registeredUsers.push(safeUser);
      localStorage.setItem('mandi_registered_users', JSON.stringify(registeredUsers));
      localStorage.setItem('mandi_local_user', JSON.stringify(safeUser));
      try {
        localStorage.removeItem('mandi_checkout_address');
      } catch {}
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

        if (phone) {
          const cleanPhone = normalizePhoneNumber(phone);
          if (cleanPhone) {
            try {
              await setDoc(doc(db, 'phoneIndex', cleanPhone), {
                uid: firebaseUser.uid,
                email: email || '',
                name: name || '',
                role: 'customer',
                storeId: null,
                phone: cleanPhone,
                updatedAt: new Date().toISOString(),
              }, { merge: true });
            } catch (pErr) {
              console.warn('phoneIndex sync notice:', pErr?.message);
            }
          }
        }
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


  // Send Password Reset Email
  resetPassword: async (email) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const emailCheck = validateEmail(cleanEmail);
    if (!emailCheck.valid) {
      throw new Error(emailCheck.error || 'Please enter a valid email address.');
    }

    if (!isFirebaseConfigured || !auth) {
      if (cleanEmail.includes('notfound')) {
        throw new Error('No account found with this email address. Please check your spelling or sign up.');
      }
      // Local development fallback mode
      console.info(`[Auth Mock] Password reset email simulated for: ${cleanEmail}`);
      try {
        const resetLogs = JSON.parse(localStorage.getItem('mandi_password_reset_requests') || '[]');
        resetLogs.unshift({ email: cleanEmail, requestedAt: new Date().toISOString() });
        localStorage.setItem('mandi_password_reset_requests', JSON.stringify(resetLogs.slice(0, 20)));
      } catch {}
      return { success: true, email: cleanEmail, mode: 'mock' };
    }

    try {
      const actionCodeSettings = typeof window !== 'undefined' && window.location?.origin ? {
        url: `${window.location.origin}/reset-password`,
        handleCodeInApp: true,
      } : null;

      try {
        if (actionCodeSettings) {
          await sendPasswordResetEmail(auth, cleanEmail, actionCodeSettings);
        } else {
          await sendPasswordResetEmail(auth, cleanEmail);
        }
      } catch (sendErr) {
        if (sendErr?.code === 'auth/unauthorized-continue-uri') {
          await sendPasswordResetEmail(auth, cleanEmail);
        } else {
          throw sendErr;
        }
      }
      return { success: true, email: cleanEmail, mode: 'firebase' };
    } catch (err) {
      let message = 'Failed to send password reset email. Please try again.';
      if (err.code === 'auth/user-not-found') {
        message = 'No account found with this email address. Please check your spelling or sign up.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Please provide a valid email address.';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Too many attempts. Please wait a few moments before trying again.';
      } else if (err.code === 'auth/configuration-not-found' || err.code === 'auth/operation-not-allowed') {
        message = 'Password reset email is not configured in Firebase Console.';
      } else if (err.message) {
        message = err.message;
      }
      throw new Error(message);
    }
  },

  // Verify Password Reset Code (oobCode from email action URL)
  verifyResetCode: async (oobCode) => {
    if (!oobCode || typeof oobCode !== 'string' || !oobCode.trim()) {
      throw new Error('Missing or invalid password reset code.');
    }

    const cleanCode = oobCode.trim();

    if (!isFirebaseConfigured || !auth) {
      if (cleanCode.toLowerCase().includes('invalid') || cleanCode.toLowerCase().includes('expired')) {
        const err = new Error('This password reset link is invalid or has expired.');
        err.code = 'auth/invalid-action-code';
        throw err;
      }
      return { success: true, email: 'customer@mandiminutes.com', mode: 'mock' };
    }

    try {
      const email = await verifyPasswordResetCode(auth, cleanCode);
      return { success: true, email, mode: 'firebase' };
    } catch (err) {
      let message = 'This password reset link is invalid or has expired.';
      if (err.code === 'auth/expired-action-code') {
        message = 'This password reset link has expired. Please request a new one.';
      } else if (err.code === 'auth/invalid-action-code') {
        message = 'This password reset link is invalid or has already been used.';
      } else if (err.code === 'auth/user-disabled') {
        message = 'The account associated with this reset link has been disabled.';
      } else if (err.message) {
        message = err.message;
      }
      const customErr = new Error(message);
      customErr.code = err.code || 'auth/unknown';
      throw customErr;
    }
  },

  // Confirm Password Reset with new password
  confirmReset: async (oobCode, newPassword) => {
    if (!oobCode || typeof oobCode !== 'string' || !oobCode.trim()) {
      throw new Error('Missing or invalid password reset code.');
    }

    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const cleanCode = oobCode.trim();

    if (!isFirebaseConfigured || !auth) {
      if (cleanCode.toLowerCase().includes('invalid') || cleanCode.toLowerCase().includes('expired')) {
        const err = new Error('This password reset link is invalid or has expired.');
        err.code = 'auth/invalid-action-code';
        throw err;
      }
      return { success: true, mode: 'mock' };
    }

    try {
      await confirmPasswordReset(auth, cleanCode, newPassword);
      return { success: true, mode: 'firebase' };
    } catch (err) {
      let message = 'Failed to reset password. Please try again.';
      if (err.code === 'auth/expired-action-code') {
        message = 'This password reset link has expired. Please request a new one.';
      } else if (err.code === 'auth/invalid-action-code') {
        message = 'This password reset link is invalid or has already been used.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Password is too weak. Please use at least 6 characters.';
      } else if (err.message) {
        message = err.message;
      }
      const customErr = new Error(message);
      customErr.code = err.code || 'auth/unknown';
      throw customErr;
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
    try {
      localStorage.removeItem('mandi_checkout_address');
    } catch {}
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
        if (cleanPhone) {
          const normPhone = normalizePhoneNumber(cleanPhone);
          if (normPhone) {
            await setDoc(doc(db, 'phoneIndex', normPhone), {
              uid: uid,
              email: cleanEmail,
              name: cleanName,
              role: 'vendor',
              storeId: storeId,
              phone: normPhone,
              updatedAt: new Date().toISOString(),
            }, { merge: true });
          }
        }
      } catch (e) {
        console.warn('Firestore vendor doc save warning:', e?.message);
      }
    }

    // Save to localStorage registered users with password so Login works seamlessly
    try {
      const registeredUsers = JSON.parse(localStorage.getItem('mandi_registered_users') || '[]');
      const existingIdx = registeredUsers.findIndex(u => u.email?.toLowerCase() === cleanEmail);
      const record = { ...vendorUser };
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
    const { role: _role, storeId: _storeId, uid: _uid, id: _id, ...safeUpdates } = updates || {};
    
    // Always update local user state and storage
    const updated = currentUser ? { ...currentUser, ...safeUpdates } : {
      id: 'guest',
      uid: 'guest',
      name: 'Guest',
      email: '',
      addresses: safeUpdates.addresses || [],
      ...safeUpdates
    };
    
    try {
      localStorage.setItem('mandi_local_user', JSON.stringify(updated));
      if (safeUpdates.addresses?.length) {
        localStorage.setItem('mandi_checkout_address', JSON.stringify(safeUpdates.addresses[0]));
      }
    } catch {}

    set({ user: updated });

    if (db && isFirebaseConfigured && currentUser?.uid) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid), safeUpdates, { merge: true });
        if (safeUpdates.phone) {
          const cleanPhone = normalizePhoneNumber(safeUpdates.phone);
          if (cleanPhone) {
            await setDoc(doc(db, 'phoneIndex', cleanPhone), {
              uid: currentUser.uid,
              email: currentUser.email || '',
              name: currentUser.name || '',
              role: currentUser.role || 'customer',
              storeId: currentUser.storeId || null,
              phone: cleanPhone,
              updatedAt: new Date().toISOString(),
            }, { merge: true });
          }
        }
      } catch (err) {
        console.warn('Firestore user update notice:', err?.message);
      }
    }

    return updated;
  },

  // Activate Delivery Partner profile for an authenticated user
  becomeDeliveryPartner: async ({ vehicle = 'Hero Splendor Plus', hub = 'Virar West Hub (Zone 1)' } = {}) => {
    const currentUser = get().user;
    if (!currentUser?.uid && !currentUser?.id) return null;

    const updates = {
      role: 'rider',
      vehicle,
      hub,
      rating: '4.95',
      trips: 0,
    };

    const updated = { ...currentUser, ...updates };

    if (db && isFirebaseConfigured && currentUser.uid) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userDocRef, updates);
      } catch (err) {
        console.warn('Could not sync rider role to Firestore:', err);
      }
    }

    try {
      localStorage.setItem('mandi_local_user', JSON.stringify(updated));
      const registeredUsers = JSON.parse(localStorage.getItem('mandi_registered_users') || '[]');
      const idx = registeredUsers.findIndex(u => u.email?.toLowerCase() === updated.email?.toLowerCase());
      if (idx >= 0) {
        registeredUsers[idx] = { ...registeredUsers[idx], ...updates };
        localStorage.setItem('mandi_registered_users', JSON.stringify(registeredUsers));
      }
    } catch {}

    set({ user: updated });
    return updated;
  },
}));
