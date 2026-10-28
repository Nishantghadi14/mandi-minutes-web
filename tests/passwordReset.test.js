import { describe, it, expect, vi } from 'vitest';
import { useAuthStore } from '../src/store/useAuthStore';

// Mock sendPasswordResetEmail from firebase/auth
vi.mock('firebase/auth', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    sendPasswordResetEmail: vi.fn(async (_auth, email) => {
      if (email === 'notfound@domain.com') {
        const err = new Error('No user record found');
        err.code = 'auth/user-not-found';
        throw err;
      }
      return Promise.resolve();
    }),
  };
});

describe('Email Messaging & Password Reset System', () => {
  it('validates email format before attempting password reset', async () => {
    const { resetPassword } = useAuthStore.getState();

    // Empty email
    await expect(resetPassword('')).rejects.toThrow(/email/i);

    // Invalid format
    await expect(resetPassword('invalid-email-address')).rejects.toThrow(/valid email/i);
    await expect(resetPassword('test@')).rejects.toThrow(/valid email/i);
    await expect(resetPassword('@domain.com')).rejects.toThrow(/valid email/i);
  });

  it('successfully dispatches password reset request for a valid email', async () => {
    const { resetPassword } = useAuthStore.getState();
    const testEmail = 'customer.reset@mandiminutes.com';

    const result = await resetPassword(testEmail);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.email).toBe(testEmail);
  });

  it('translates Firebase user-not-found error into a clear, user-friendly message', async () => {
    const { resetPassword } = useAuthStore.getState();
    await expect(resetPassword('notfound@domain.com')).rejects.toThrow(/No account found with this email/i);
  });

  it('controls authModal mode transitions for forgot password flow', () => {
    const { openAuthModal, closeAuthModal } = useAuthStore.getState();

    // Open in forgot password mode
    openAuthModal('forgot');
    expect(useAuthStore.getState().authModal.open).toBe(true);
    expect(useAuthStore.getState().authModal.mode).toBe('forgot');

    // Switch to login mode
    openAuthModal('login');
    expect(useAuthStore.getState().authModal.open).toBe(true);
    expect(useAuthStore.getState().authModal.mode).toBe('login');

    // Close modal
    closeAuthModal();
    expect(useAuthStore.getState().authModal.open).toBe(false);
    expect(useAuthStore.getState().authModal.mode).toBe('login');
  });

  it('normalizes email with whitespace and capitalization before sending reset', async () => {
    const { resetPassword } = useAuthStore.getState();
    const messyEmail = '   TestUser.Reset@Gmail.COM   ';

    const result = await resetPassword(messyEmail);

    expect(result.success).toBe(true);
    expect(result.email).toBe('testuser.reset@gmail.com');
  });

  it('validates empty or invalid oobCode when verifying password reset', async () => {
    const { verifyResetCode } = useAuthStore.getState();

    await expect(verifyResetCode('')).rejects.toThrow(/missing or invalid/i);
    await expect(verifyResetCode(null)).rejects.toThrow(/missing or invalid/i);
    await expect(verifyResetCode('invalid_test_code')).rejects.toThrow(/invalid or has expired/i);
  });

  it('successfully verifies a valid password reset code', async () => {
    const { verifyResetCode } = useAuthStore.getState();
    const validCode = 'sample_secure_oob_code_123';

    const result = await verifyResetCode(validCode);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.email).toBeDefined();
  });

  it('validates minimum password length in confirmReset', async () => {
    const { confirmReset } = useAuthStore.getState();

    await expect(confirmReset('valid_code_123', '')).rejects.toThrow(/at least 6 characters/i);
    await expect(confirmReset('valid_code_123', '12345')).rejects.toThrow(/at least 6 characters/i);
    await expect(confirmReset('', 'ValidPass123!')).rejects.toThrow(/missing or invalid/i);
  });

  it('successfully completes password reset confirmation', async () => {
    const { confirmReset } = useAuthStore.getState();

    const result = await confirmReset('sample_secure_oob_code_123', 'SecureNewPassword456!');

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });
});
