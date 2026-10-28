import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  Lock, 
  KeyRound, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  Mail, 
  RotateCw, 
  ShoppingBag
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyResetCode, confirmReset, openAuthModal } = useAuth();
  const { addToast } = useToast();

  // Extract parameters from URL
  const initialCode = searchParams.get('oobCode') || searchParams.get('code') || '';

  const [code, setCode] = useState(initialCode);
  const [manualInput, setManualInput] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'verifying' | 'ready' | 'submitting' | 'success' | 'error' | 'no-code'
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Form states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState('');

  // Helper to extract oobCode from any string (raw code or full URL)
  const extractCode = (raw) => {
    if (!raw) return '';
    const trimmed = raw.trim();
    try {
      const parsedUrl = new URL(trimmed);
      const codeParam = parsedUrl.searchParams.get('oobCode') || parsedUrl.searchParams.get('code');
      if (codeParam) return codeParam.trim();
    } catch {
      // Not a full valid URL, check if contains oobCode=
      const match = trimmed.match(/oobCode=([^&]+)/);
      if (match) return decodeURIComponent(match[1]).trim();
    }
    return trimmed;
  };

  // Verify code with Firebase Auth
  const handleVerifyCode = useCallback(async (codeToVerify) => {
    if (!codeToVerify) {
      setStatus('no-code');
      return;
    }

    setStatus('verifying');
    setErrorMessage('');

    try {
      const result = await verifyResetCode(codeToVerify);
      setVerifiedEmail(result?.email || 'your account');
      setStatus('ready');
    } catch (err) {
      setErrorMessage(err?.message || 'This password reset link is invalid or has expired.');
      setStatus('error');
    }
  }, [verifyResetCode]);

  // Initial code verification on mount
  useEffect(() => {
    if (initialCode) {
      handleVerifyCode(initialCode);
    } else {
      setStatus('no-code');
    }
  }, [initialCode, handleVerifyCode]);

  // Handle manual code/link paste
  const handleManualCodeSubmit = (e) => {
    e.preventDefault();
    const parsed = extractCode(manualInput);
    if (!parsed) {
      setFormError('Please enter a valid reset code or paste the link from your email.');
      return;
    }
    setFormError('');
    setCode(parsed);
    handleVerifyCode(parsed);
  };

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!newPassword) return { score: 0, label: '', color: 'bg-mandi-border' };
    let score = 0;
    if (newPassword.length >= 6) score += 1;
    if (newPassword.length >= 8) score += 1;
    if (/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword)) score += 1;
    if (/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: 'Weak', color: 'bg-red-500' };
      case 2:
        return { score: 2, label: 'Fair', color: 'bg-amber-500' };
      case 3:
        return { score: 3, label: 'Good', color: 'bg-lime-500' };
      case 4:
        return { score: 4, label: 'Strong', color: 'bg-mandi-green' };
      default:
        return { score: 0, label: '', color: 'bg-mandi-border' };
    }
  }, [newPassword]);

  // Submit new password
  const handleSubmitReset = async (e) => {
    e.preventDefault();
    setFormError('');

    if (newPassword.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError('Passwords do not match. Please verify both fields.');
      return;
    }

    setStatus('submitting');

    try {
      await confirmReset(code, newPassword);
      setStatus('success');
      addToast('Password reset successfully! You can now log in.', 'success');
    } catch (err) {
      setStatus('ready');
      setFormError(err?.message || 'Failed to update password. Please try again.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 sm:py-16">
      <Helmet>
        <title>Reset Password — Mandi Minutes</title>
        <meta name="description" content="Set a new secure password for your Mandi Minutes account." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="w-full max-w-md mx-auto">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 group mb-3">
            <div className="w-12 h-12 bg-mandi-green/10 border border-mandi-green/30 rounded-2xl flex items-center justify-center text-mandi-green group-hover:scale-105 transition-transform shadow-glow">
              <ShoppingBag size={24} />
            </div>
          </Link>
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="badge-green text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5">
              Account Security
            </span>
            <span className="text-xs text-mandi-muted font-medium">10-15 Min Delivery</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-mandi-text tracking-tight">
            <span className="text-mandi-green">Mandi</span> Minutes
          </h1>
        </div>

        {/* Dynamic Card Container */}
        <div className="card p-6 sm:p-8 shadow-card border-mandi-border relative overflow-hidden backdrop-blur-xl">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-mandi-green/10 rounded-full blur-3xl pointer-events-none" />

          {/* STATE 1: VERIFYING CODE */}
          {status === 'verifying' && (
            <div className="text-center py-8 space-y-4 animate-fade-in">
              <div className="w-16 h-16 bg-mandi-surface rounded-2xl border border-mandi-border flex items-center justify-center mx-auto text-mandi-green">
                <RotateCw size={32} className="animate-spin text-mandi-green" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-mandi-text">Verifying Security Link...</h2>
                <p className="text-xs sm:text-sm text-mandi-muted mt-1">
                  Connecting to Mandi Minutes secure auth to validate your one-time reset code.
                </p>
              </div>
            </div>
          )}

          {/* STATE 2: FORM READY */}
          {(status === 'ready' || status === 'submitting') && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-mandi-green bg-mandi-green/10 px-3 py-1 rounded-full border border-mandi-green/20 mb-2">
                  <ShieldCheck size={14} />
                  <span>Secure Reset Authorized</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-mandi-text">Create New Password</h2>
                {verifiedEmail && (
                  <p className="text-xs sm:text-sm text-mandi-muted mt-1">
                    Setting a new password for <span className="font-semibold text-mandi-text">{verifiedEmail}</span>
                  </p>
                )}
              </div>

              {formError && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-3 text-red-400 text-xs sm:text-sm animate-fade-in">
                  <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <span className="leading-snug">{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitReset} className="space-y-4">
                {/* New Password Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-mandi-muted uppercase tracking-wider">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-mandi-subtle">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setFormError('');
                      }}
                      placeholder="Enter at least 6 characters"
                      required
                      minLength={6}
                      autoFocus
                      disabled={status === 'submitting'}
                      className="input-field pl-10 pr-11 text-sm font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-mandi-muted hover:text-mandi-text transition-colors"
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {newPassword.length > 0 && (
                    <div className="pt-1.5 space-y-1 animate-fade-in">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-mandi-muted">Strength:</span>
                        <span className="font-bold text-mandi-text">{passwordStrength.label}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1 h-1.5">
                        {[1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            className={`h-full rounded-full transition-all duration-300 ${
                              passwordStrength.score >= step
                                ? passwordStrength.color
                                : 'bg-mandi-surface'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-mandi-muted uppercase tracking-wider">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-mandi-subtle">
                      <KeyRound size={18} />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setFormError('');
                      }}
                      placeholder="Re-enter your new password"
                      required
                      minLength={6}
                      disabled={status === 'submitting'}
                      className="input-field pl-10 pr-11 text-sm font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-mandi-muted hover:text-mandi-text transition-colors"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {/* Real-time Mismatch Alert */}
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-[11px] text-red-400 font-medium pl-1">
                      Passwords do not match yet.
                    </p>
                  )}
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={
                    status === 'submitting' || 
                    newPassword.length < 6 || 
                    newPassword !== confirmPassword
                  }
                  className="btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-lg mt-2 cursor-pointer"
                >
                  {status === 'submitting' ? (
                    <>
                      <RotateCw size={18} className="animate-spin text-black" />
                      <span>Saving New Password...</span>
                    </>
                  ) : (
                    <>
                      <span>Update Password</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* STATE 3: SUCCESS */}
          {status === 'success' && (
            <div className="text-center py-6 space-y-5 animate-fade-in">
              <div className="w-16 h-16 bg-mandi-green/15 border border-mandi-green/40 rounded-3xl flex items-center justify-center mx-auto text-mandi-green shadow-glow">
                <CheckCircle2 size={36} />
              </div>

              <div>
                <span className="badge-green text-xs font-bold px-3 py-1 mb-2 inline-block">
                  Success
                </span>
                <h2 className="text-2xl font-black text-mandi-text">Password Reset Complete!</h2>
                <p className="text-xs sm:text-sm text-mandi-muted mt-2 max-w-xs mx-auto leading-relaxed">
                  Your Mandi Minutes password has been successfully updated. You can now log into your account and start ordering fresh groceries.
                </p>
              </div>

              <div className="pt-2 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    openAuthModal('login');
                    navigate('/');
                  }}
                  className="btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <span>Log In to Mandi Minutes</span>
                  <ArrowRight size={18} />
                </button>

                <Link
                  to="/"
                  className="btn-outline w-full py-3 text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <span>Go to Homepage</span>
                </Link>
              </div>
            </div>
          )}

          {/* STATE 4: ERROR / EXPIRED LINK */}
          {status === 'error' && (
            <div className="text-center py-6 space-y-5 animate-fade-in">
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-3xl flex items-center justify-center mx-auto text-red-400">
                <AlertCircle size={36} />
              </div>

              <div>
                <span className="bg-red-500/15 text-red-400 text-xs font-bold px-3 py-1 rounded-full border border-red-500/30 mb-2 inline-block">
                  Link Expired or Invalid
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-mandi-text">
                  Cannot Reset Password
                </h2>
                <p className="text-xs sm:text-sm text-mandi-muted mt-2 max-w-xs mx-auto leading-relaxed">
                  {errorMessage || 'This password reset link is invalid, expired, or has already been used for security reasons.'}
                </p>
              </div>

              <div className="pt-2 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    openAuthModal('forgot');
                    navigate('/');
                  }}
                  className="btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <Mail size={18} />
                  <span>Request a New Reset Link</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus('no-code')}
                  className="btn-outline w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Paste Reset Link Manually</span>
                </button>

                <Link
                  to="/"
                  className="btn-ghost w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <span>Return to Home</span>
                </Link>
              </div>
            </div>
          )}

          {/* STATE 5: NO CODE OR MANUAL PASTE */}
          {status === 'no-code' && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <div className="w-14 h-14 bg-mandi-surface rounded-2xl border border-mandi-border flex items-center justify-center mx-auto mb-3 text-mandi-green">
                  <KeyRound size={28} />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-mandi-text">Password Reset</h2>
                <p className="text-xs sm:text-sm text-mandi-muted mt-1.5 leading-relaxed">
                  Did you receive a password reset link in your email? Paste the link or code below to set your new password.
                </p>
              </div>

              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-2.5 text-red-400 text-xs animate-fade-in">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleManualCodeSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-mandi-muted uppercase tracking-wider">
                    Reset Link or Code
                  </label>
                  <textarea
                    rows={3}
                    value={manualInput}
                    onChange={(e) => {
                      setManualInput(e.target.value);
                      setFormError('');
                    }}
                    placeholder="Paste the reset link from your email here (e.g. https://mandi-minutes-virar.firebaseapp.com/__/auth/action?... or oobCode)"
                    className="input-field py-2.5 px-3.5 text-xs font-mono resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!manualInput.trim()}
                  className="btn-primary w-full py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <span>Verify Link & Continue</span>
                  <ArrowRight size={16} />
                </button>
              </form>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-mandi-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-mandi-card px-3 text-mandi-muted font-medium">Or</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => {
                    openAuthModal('forgot');
                    navigate('/');
                  }}
                  className="btn-outline w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Mail size={16} />
                  <span>Send Reset Email to My Inbox</span>
                </button>

                <Link
                  to="/"
                  className="btn-ghost w-full py-2 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <span>Back to Home</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Security Assurance Badge */}
        <div className="mt-6 text-center">
          <p className="text-[11px] text-mandi-subtle inline-flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-mandi-green" />
            <span>256-bit encrypted authentication powered by Google Firebase</span>
          </p>
        </div>
      </div>
    </div>
  );
}
