import { describe, it, expect, beforeEach } from 'vitest';
import { normalizePhoneNumber, toE164, formatDisplayPhone, isValidIndianPhone } from '../src/utils/phone';
import { useAuthStore } from '../src/store/useAuthStore';

// In-memory storage mock for hermetic testing in Node
const mockStorage = new Map();
globalThis.localStorage = {
  getItem: (key) => mockStorage.get(key) || null,
  setItem: (key, value) => mockStorage.set(key, String(value)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
};

describe('Phone Number Normalization & Validation', () => {
  it('normalizes various Indian phone formats to 10 canonical digits', () => {
    expect(normalizePhoneNumber('+919820098200')).toBe('9820098200');
    expect(normalizePhoneNumber('+91 98200 98200')).toBe('9820098200');
    expect(normalizePhoneNumber('+91-98200-98200')).toBe('9820098200');
    expect(normalizePhoneNumber('09820098200')).toBe('9820098200');
    expect(normalizePhoneNumber('9820098200')).toBe('9820098200');
    expect(normalizePhoneNumber('  98200 98200  ')).toBe('9820098200');
  });

  it('formats to E.164 standard format for Firebase', () => {
    expect(toE164('9820098200')).toBe('+919820098200');
    expect(toE164('+919820098200')).toBe('+919820098200');
    expect(toE164('09820098200')).toBe('+919820098200');
  });

  it('formats phone numbers for UI display', () => {
    expect(formatDisplayPhone('9820098200')).toBe('+91 98200 98200');
    expect(formatDisplayPhone('+919820098200')).toBe('+91 98200 98200');
  });

  it('validates 10-digit Indian mobile numbers correctly', () => {
    expect(isValidIndianPhone('9820098200')).toBe(true);
    expect(isValidIndianPhone('8820098200')).toBe(true);
    expect(isValidIndianPhone('7820098200')).toBe(true);
    expect(isValidIndianPhone('6820098200')).toBe(true);
    // Invalid prefixes / lengths
    expect(isValidIndianPhone('1820098200')).toBe(false);
    expect(isValidIndianPhone('5820098200')).toBe(false);
    expect(isValidIndianPhone('98200')).toBe(false);
    expect(isValidIndianPhone('')).toBe(false);
  });
});

describe('Phone OTP Authentication & Account Linking', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      if (typeof localStorage.clear === 'function') {
        localStorage.clear();
      } else {
        localStorage.removeItem('mandi_registered_users');
        localStorage.removeItem('mandi_local_user');
      }
    }
    useAuthStore.setState({ user: null, loading: false });
  });

  it('rejects invalid mobile numbers when requesting OTP', async () => {
    const { sendPhoneOtp } = useAuthStore.getState();

    await expect(sendPhoneOtp('12345')).rejects.toThrow(/valid 10-digit/i);
    await expect(sendPhoneOtp('')).rejects.toThrow(/valid 10-digit/i);
    await expect(sendPhoneOtp('5555555555')).rejects.toThrow(/valid 10-digit/i);
  });

  it('generates dev OTP and dispatches confirmation session', async () => {
    const { sendPhoneOtp } = useAuthStore.getState();
    const result = await sendPhoneOtp('9820098200');

    expect(result).toBeDefined();
    expect(result.phone).toBe('9820098200');
    expect(result.isDevOtp).toBe(true);
    expect(typeof result.confirm).toBe('function');
  });

  it('rejects incorrect OTP code in confirmPhoneOtp', async () => {
    const { sendPhoneOtp, confirmPhoneOtp } = useAuthStore.getState();
    const session = await sendPhoneOtp('9820098200');

    await expect(confirmPhoneOtp(session, '000000')).rejects.toThrow(/invalid otp code/i);
  });

  it('successfully links to an existing account with matching phone number', async () => {
    // 1. Seed an existing registered user with email and phone
    const existingVendor = {
      id: 'vendor-123',
      uid: 'vendor-123',
      name: 'Ramesh Kirana Store',
      email: 'ramesh.kirana@gmail.com',
      phone: '9820098200',
      role: 'vendor',
      storeId: 'store-virar-1',
      addresses: [{ id: 'addr-1', label: 'Shop', line1: 'Station Road, Virar West' }],
      wishlist: ['prod-1'],
    };
    localStorage.setItem('mandi_registered_users', JSON.stringify([existingVendor]));

    // 2. User logs in with Phone OTP using the exact same mobile number
    const { sendPhoneOtp, confirmPhoneOtp } = useAuthStore.getState();
    const session = await sendPhoneOtp('9820098200');

    // 3. User enters the test OTP
    const loggedInUser = await confirmPhoneOtp(session, '123456');

    // 4. Verify that the session restored the existing vendor account
    expect(loggedInUser).toBeDefined();
    expect(loggedInUser.phone).toBe('9820098200');
    expect(loggedInUser.email).toBe('ramesh.kirana@gmail.com');
    expect(loggedInUser.name).toBe('Ramesh Kirana Store');
    expect(loggedInUser.role).toBe('vendor');
    expect(loggedInUser.storeId).toBe('store-virar-1');
    expect(loggedInUser.addresses.length).toBe(1);

    // Verify current auth store state
    expect(useAuthStore.getState().user?.email).toBe('ramesh.kirana@gmail.com');
  });

  it('creates a fresh customer account when no existing account has this phone number', async () => {
    const { sendPhoneOtp, confirmPhoneOtp } = useAuthStore.getState();
    const newPhone = '9876543210';

    const session = await sendPhoneOtp(newPhone);
    const loggedInUser = await confirmPhoneOtp(session, '123456');

    expect(loggedInUser).toBeDefined();
    expect(loggedInUser.phone).toBe(newPhone);
    expect(loggedInUser.role).toBe('customer');
    expect(loggedInUser.name).toBe('Customer 3210');
    expect(useAuthStore.getState().user?.role).toBe('customer');
  });

  it('validates auth modal state transitions and reset password operations', () => {
    const { openAuthModal, closeAuthModal } = useAuthStore.getState();
    openAuthModal('forgot');
    expect(useAuthStore.getState().authModal.open).toBe(true);
    expect(useAuthStore.getState().authModal.mode).toBe('forgot');

    closeAuthModal();
    expect(useAuthStore.getState().authModal.open).toBe(false);
  });

  it('ensures newly registered accounts start with empty addresses and require user to enter their own address', async () => {
    const { register } = useAuthStore.getState();
    const newUser = await register(
      'newcustomer@mandiminutes.com',
      'SecurePass123!',
      'Aditya Sharma',
      '',
      '9820098200'
    );

    expect(newUser).toBeDefined();
    expect(newUser.addresses).toEqual([]);
    expect(newUser.addresses.length).toBe(0);
    expect(useAuthStore.getState().user?.addresses).toEqual([]);
  });
});
