import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Eye, EyeOff, Phone, Mail, Lock, User, ShieldCheck, Gift, CheckCircle2, ArrowLeft, KeyRound, RotateCw, Clipboard, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { RecaptchaVerifier } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from './Toast';
import { validateIndianPhone, validateEmail, sanitizeText } from '../../utils/validators';

export default function AuthModal() {
  const { 
    authModal, 
    closeAuthModal, 
    login, 
    register, 
    resetPassword, 
    verifyResetCode, 
    confirmReset, 
    sendPhoneOtp, 
    confirmPhoneOtp 
  } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [tab, setTab] = useState('email');
  const [mode, setMode] = useState(authModal.mode || 'login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', referralCode: '', otp: '' });
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [phoneResendCooldown, setPhoneResendCooldown] = useState(0);

  // In-app Password Reset Code Verification & New Password states
  const [resetStep, setResetStep] = useState('request'); // 'request' | 'verify' | 'new-password'
  const [resetCodeInput, setResetCodeInput] = useState('');
  const [verifiedResetCode, setVerifiedResetCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);

  const recaptchaVerifierRef = useRef(null);

  // Helper to extract oobCode from any string (raw code or full URL)
  const extractCode = (raw) => {
    if (!raw) return '';
    const trimmed = raw.trim();
    try {
      const parsedUrl = new URL(trimmed);
      const codeParam = parsedUrl.searchParams.get('oobCode') || parsedUrl.searchParams.get('code');
      if (codeParam) return codeParam.trim();
    } catch {
      const match = trimmed.match(/oobCode=([^&]+)/);
      if (match) return decodeURIComponent(match[1]).trim();
    }
    return trimmed;
  };

  // Password strength calculation for in-modal password reset
  const resetPasswordStrength = useMemo(() => {
    if (!resetNewPassword) return { score: 0, label: '', color: 'bg-mandi-border' };
    let score = 0;
    if (resetNewPassword.length >= 6) score += 1;
    if (resetNewPassword.length >= 8) score += 1;
    if (/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(resetNewPassword)) score += 1;
    if (/[a-z]/.test(resetNewPassword) && /[A-Z]/.test(resetNewPassword)) score += 1;

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
  }, [resetNewPassword]);

  useEffect(() => {
    if (authModal.mode) setMode(authModal.mode);
    setError('');
    setResetStep('request');
    setResetCodeInput('');
    setVerifiedResetCode('');
    setResetNewPassword('');
    setResetConfirmPassword('');
  }, [authModal.mode, authModal.open]);

  useEffect(() => {
    let timer = null;
    if (resendCooldown > 0 || phoneResendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(c => Math.max(0, c - 1));
        setPhoneResendCooldown(c => Math.max(0, c - 1));
      }, 1000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [resendCooldown, phoneResendCooldown]);

  useEffect(() => {
    // Reset confirmation and recaptcha when modal is closed
    if (!authModal.open) {
      setOtpSent(false);
      setPhoneResendCooldown(0);
      setConfirmationResult(null);
      setError('');
      setResetStep('request');
      setResetCodeInput('');
      setVerifiedResetCode('');
      setResetNewPassword('');
      setResetConfirmPassword('');
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
          recaptchaVerifierRef.current = null;
        } catch {
          // ignore
        }
      }
    }
  }, [authModal.open]);

  if (!authModal.open) return null;

  const upd = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(''); };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');

    const emailCheck = validateEmail(form.email);
    if (!emailCheck.valid) {
      setError(emailCheck.error);
      return;
    }

    if (mode === 'register') {
      const sanitizedName = sanitizeText(form.name, 60);
      if (!sanitizedName || sanitizedName.length < 2) {
        setError('Please enter your full name (at least 2 characters).');
        return;
      }

      if (form.phone) {
        const phoneCheck = validateIndianPhone(form.phone);
        if (!phoneCheck.valid) {
          setError(phoneCheck.error);
          return;
        }
      }
    }

    if (!form.password || form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      let loggedUser = null;
      if (mode === 'login') {
        loggedUser = await login(emailCheck.value, form.password);
        addToast('Welcome back to Mandi Minutes!', 'success');
      } else {
        const sanitizedName = sanitizeText(form.name, 60);
        loggedUser = await register(sanitizedName, emailCheck.value, form.phone, form.password, form.referralCode);
        addToast('Account created successfully! Welcome 🎉', 'success');
      }
      closeAuthModal();
      if (loggedUser?.role === 'vendor') {
        navigate('/vendor');
      } else if (loggedUser?.role === 'admin') {
        navigate('/admin');
      } else if (items && items.length > 0) {
        navigate('/checkout');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordResetSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const emailCheck = validateEmail(form.email);
    if (!emailCheck.valid) {
      setError(emailCheck.error);
      return;
    }

    setLoading(true);
    try {
      await resetPassword(emailCheck.value);
      setResetStep('verify');
      setResendCooldown(30);
      addToast(`Password reset code sent to ${emailCheck.value}`, 'success', 4500);
    } catch (err) {
      setError(err.message || 'Could not send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Verify entered code / link in-modal
  const handleVerifyResetCode = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');

    const cleanCode = extractCode(resetCodeInput);
    if (!cleanCode) {
      setError('Please enter the code or paste the link sent to your email.');
      return;
    }

    setLoading(true);
    try {
      await verifyResetCode(cleanCode);
      setVerifiedResetCode(cleanCode);
      setResetStep('new-password');
      addToast('Security code verified! Set your new password.', 'success', 3500);
    } catch (err) {
      setError(err.message || 'The reset code is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  // Confirm new password in-modal & auto login
  const handleCompleteReset = async (e) => {
    e.preventDefault();
    setError('');

    if (resetNewPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setError('Passwords do not match. Please verify both fields.');
      return;
    }

    setLoading(true);
    try {
      await confirmReset(verifiedResetCode, resetNewPassword);
      addToast('Password updated! Logging you in...', 'success', 3000);

      // Attempt automatic sign-in with newly set password
      try {
        await login(form.email, resetNewPassword);
        closeAuthModal();
        addToast('Welcome back to Mandi Minutes 🎉', 'success', 4000);
      } catch {
        // If auto-login fails, redirect to standard login view with email prefilled
        setMode('login');
        setResetStep('request');
        setForm(f => ({ ...f, password: '' }));
        setError('Password changed successfully! Please log in with your new password.');
      }
    } catch (err) {
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (navigator?.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setResetCodeInput(text.trim());
          setError('');
        }
      }
    } catch {
      // Ignore clipboard permission denial
    }
  };

  const handleResendReset = async () => {
    if (resendCooldown > 0 || loading) return;
    setError('');
    setLoading(true);
    try {
      await resetPassword(form.email);
      setResendCooldown(30);
      addToast('Password reset link resent! Please check your email.', 'info', 3500);
    } catch (err) {
      setError(err.message || 'Could not resend email.');
    } finally {
      setLoading(false);
    }
  };

  const setupRecaptcha = () => {
    if (!isFirebaseConfigured || !auth) return null;
    if (!recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        },
        'expired-callback': () => {
          setError('reCAPTCHA expired. Please try sending OTP again.');
        },
      });
    }
    return recaptchaVerifierRef.current;
  };

  const handleSendOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const phoneCheck = validateIndianPhone(form.phone);
    if (!phoneCheck.valid) {
      setError(phoneCheck.error);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const isDev = import.meta.env.DEV || (typeof process !== 'undefined' && process.env?.VITEST);
      const appVerifier = isDev ? null : setupRecaptcha();
      const confirmResult = await sendPhoneOtp(phoneCheck.value, appVerifier);
      setConfirmationResult(confirmResult);
      setOtpSent(true);
      setPhoneResendCooldown(30);

      if (isDev) {
        addToast(`Dev OTP generated! Check your terminal for +91 ${phoneCheck.value}`, 'success', 5000);
      } else {
        addToast(`OTP sent to +91 ${phoneCheck.value}`, 'info', 5000);
      }
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please check your phone number.');
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
          recaptchaVerifierRef.current = null;
        } catch {
          // ignore
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    if (!form.otp || form.otp.length < 6) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      if (!confirmationResult) {
        throw new Error('No active OTP session. Please request a new OTP.');
      }
      const loggedUser = await confirmPhoneOtp(confirmationResult, form.otp);
      const isLinkedAccount = loggedUser?.email || (loggedUser?.name && !loggedUser.name.startsWith('Customer '));
      if (isLinkedAccount) {
        addToast(`Welcome back, ${loggedUser.name || loggedUser.email}! Linked account loaded. 🎉`, 'success', 4500);
      } else {
        addToast('Phone number verified! Welcome to Mandi Minutes 🎉', 'success', 4500);
      }
      closeAuthModal();
      if (loggedUser?.role === 'vendor') {
        navigate('/vendor');
      } else if (loggedUser?.role === 'admin') {
        navigate('/admin');
      } else if (items && items.length > 0) {
        navigate('/checkout');
      }
    } catch (err) {
      setError(err.message || 'Invalid OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overlay flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-mandi-card border border-mandi-border rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 w-full max-w-md animate-slide-in-up sm:animate-fade-in max-h-[90dvh] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-clay-floating">
        {/* Mobile drag handle indicator */}
        <div className="w-12 h-1.5 bg-mandi-border-light rounded-full mx-auto mb-4 sm:hidden" />

        <div className="flex items-center justify-between mb-5 sm:mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-mandi-text">
              {mode === 'forgot' 
                ? (resetStep === 'new-password' ? 'Create New Password' : resetStep === 'verify' ? 'Enter Verification Code' : 'Reset Password')
                : mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-mandi-muted text-xs sm:text-sm">
              {mode === 'forgot'
                ? (resetStep === 'new-password' ? 'Create a secure new password' : resetStep === 'verify' ? 'Put the code from your email to verify' : 'Enter email to receive reset code')
                : mode === 'login' ? 'Login to your verified account' : 'Join Mandi Minutes today'}
            </p>
          </div>
          <button onClick={closeAuthModal} className="text-mandi-subtle hover:text-mandi-text transition-colors p-1.5 rounded-lg active:scale-90"><X size={18} /></button>
        </div>

        {/* Security badge */}
        <div className="flex items-center gap-2 bg-mandi-surface border border-mandi-border rounded-2xl px-3.5 py-2 mb-4 text-xs text-mandi-muted shadow-clay-badge">
          <ShieldCheck size={14} className="text-mandi-green flex-shrink-0" />
          <span>100% Secure &amp; Verified Authentication</span>
        </div>

        {mode === 'forgot' ? (
          resetStep === 'verify' ? (
            /* STEP 2: ENTER CODE FROM EMAIL IN OUR APP */
            <div className="space-y-4 py-1 animate-fade-in">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-mandi-text">
                <CheckCircle2 size={16} className="text-mandi-green flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Reset code sent!</span> We emailed a reset link &amp; code to{' '}
                  <strong className="text-mandi-green font-bold">{form.email}</strong>.
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-mandi-muted uppercase tracking-wider">
                    Enter Code or Paste Email Link
                  </label>
                  <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    className="text-[11px] font-bold text-mandi-green hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Clipboard size={12} />
                    <span>Paste</span>
                  </button>
                </div>

                <div className="relative">
                  <KeyRound size={16} className="absolute left-3 top-3 text-mandi-subtle" />
                  <textarea
                    rows={2}
                    value={resetCodeInput}
                    onChange={(e) => {
                      setResetCodeInput(e.target.value);
                      setError('');
                    }}
                    placeholder="Enter verification code or paste link from email..."
                    className="input-field pl-9 pr-3 text-xs font-mono resize-none"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-mandi-subtle">
                  Tip: You can paste the code or the entire link from your Gmail.
                </p>
              </div>

              {error && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2 text-red-400 text-xs animate-fade-in">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="pt-1 space-y-2">
                <button
                  type="button"
                  disabled={loading || !resetCodeInput.trim()}
                  onClick={handleVerifyResetCode}
                  className="btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RotateCw size={14} className="animate-spin text-black" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify Code &amp; Reset Password</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || loading}
                    onClick={handleResendReset}
                    className="btn-outline flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
                  >
                    <RotateCw size={12} className={loading ? 'animate-spin' : ''} />
                    <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setResetStep('request'); setError(''); }}
                    className="btn-ghost flex-1 py-2 text-xs font-medium text-mandi-muted hover:text-mandi-text cursor-pointer"
                  >
                    Change Email
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); setResetStep('request'); }}
                  className="btn-ghost w-full py-2 text-xs text-mandi-muted flex items-center justify-center gap-1.5 hover:text-mandi-text"
                >
                  <ArrowLeft size={13} /> Back to Log In
                </button>
              </div>
            </div>
          ) : resetStep === 'new-password' ? (
            /* STEP 3: CODE VERIFIED - ENTER NEW PASSWORD */
            <form onSubmit={handleCompleteReset} className="space-y-3.5 animate-fade-in">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-2 text-xs text-mandi-green">
                <ShieldCheck size={16} className="flex-shrink-0" />
                <span className="font-semibold">Security code verified for {form.email}</span>
              </div>

              {/* New Password */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-mandi-muted uppercase tracking-wider">
                  New Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mandi-subtle" />
                  <input
                    type={showResetNewPassword ? 'text' : 'password'}
                    placeholder="At least 6 characters"
                    value={resetNewPassword}
                    onChange={(e) => {
                      setResetNewPassword(e.target.value);
                      setError('');
                    }}
                    minLength={6}
                    required
                    autoFocus
                    className="input-field pl-9 pr-9 text-sm font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetNewPassword(!showResetNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-mandi-muted hover:text-mandi-text"
                  >
                    {showResetNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {resetNewPassword.length > 0 && (
                  <div className="pt-1 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-mandi-muted">Strength:</span>
                      <span className="font-bold text-mandi-text">{resetPasswordStrength.label}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 h-1.5">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`h-full rounded-full transition-all duration-300 ${
                            resetPasswordStrength.score >= step
                              ? resetPasswordStrength.color
                              : 'bg-mandi-surface'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-mandi-muted uppercase tracking-wider">
                  Confirm Password
                </label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mandi-subtle" />
                  <input
                    type={showResetConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter your new password"
                    value={resetConfirmPassword}
                    onChange={(e) => {
                      setResetConfirmPassword(e.target.value);
                      setError('');
                    }}
                    minLength={6}
                    required
                    className="input-field pl-9 pr-9 text-sm font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-mandi-muted hover:text-mandi-text"
                  >
                    {showResetConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {resetConfirmPassword && resetNewPassword !== resetConfirmPassword && (
                  <p className="text-[11px] text-red-400 font-medium">Passwords do not match.</p>
                )}
              </div>

              {error && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2 text-red-400 text-xs animate-fade-in">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || resetNewPassword.length < 6 || resetNewPassword !== resetConfirmPassword}
                className="btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RotateCw size={14} className="animate-spin text-black" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <span>Update Password &amp; Log In</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 1: REQUEST CODE */
            <form onSubmit={handlePasswordResetSubmit} className="space-y-3.5">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-mandi-muted">
                <KeyRound size={16} className="text-mandi-green flex-shrink-0 mt-0.5" />
                <span>Enter your registered email address. We will send you an official reset code to create a new password.</span>
              </div>

              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mandi-subtle" />
                <input 
                  type="email" 
                  placeholder="Your registered email address" 
                  value={form.email} 
                  onChange={e => upd('email', e.target.value)} 
                  className="input-field pl-9" 
                  required 
                  autoFocus
                />
              </div>

              {error && <p className="text-red-600 dark:text-red-400 text-xs bg-red-500/10 border border-red-500/30 p-2.5 rounded-xl">{error}</p>}

              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 cursor-pointer">
                {loading ? 'Sending Reset Code...' : 'Send Password Reset Code'}
              </button>

              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className="btn-ghost w-full py-2 text-xs text-mandi-muted flex items-center justify-center gap-1.5 hover:text-mandi-text"
              >
                <ArrowLeft size={14} /> Back to Log In
              </button>
            </form>
          )
        ) : (
          <>
            {/* Tabs */}
            <div className="flex bg-mandi-surface rounded-2xl p-1 mb-4 shadow-clay-inset">
              {[{id:'email',label:'Email & Password'},{id:'phone',label:'Phone OTP'}].map(t=>(
                <button 
                  key={t.id} 
                  onClick={() => { setTab(t.id); setError(''); }} 
                  className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${tab === t.id ? 'bg-mandi-green text-black clay-btn-green' : 'text-mandi-muted hover:text-mandi-text'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Invisible Recaptcha Container for Phone Auth */}
            <div id="recaptcha-container"></div>

            {tab === 'email' ? (
              <form onSubmit={handleEmailAuth} className="space-y-3">
                {mode === 'register' && (
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mandi-subtle" />
                    <input 
                      placeholder="Full Name" 
                      value={form.name} 
                      onChange={e => upd('name', e.target.value)} 
                      className="input-field pl-9" 
                      required 
                    />
                  </div>
                )}
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mandi-subtle" />
                  <input 
                    type="email" 
                    placeholder="Email address" 
                    value={form.email} 
                    onChange={e => upd('email', e.target.value)} 
                    className="input-field pl-9" 
                    required 
                  />
                </div>
                {mode === 'register' && (
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mandi-subtle" />
                    <input 
                      type="tel" 
                      placeholder="10-digit phone number" 
                      value={form.phone} 
                      onChange={e => upd('phone', e.target.value.replace(/\D/g,'').slice(0,10))} 
                      className="input-field pl-9" 
                    />
                  </div>
                )}
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mandi-subtle" />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="Password (min 6 characters)" 
                    value={form.password} 
                    onChange={e => upd('password', e.target.value)} 
                    className="input-field pl-9 pr-9" 
                    required 
                    minLength={6}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-mandi-subtle hover:text-mandi-text"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {mode === 'login' && (
                  <div className="flex justify-end -mt-1">
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setError(''); }}
                      className="text-xs text-mandi-green hover:underline font-semibold"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                {mode === 'register' && (
                  <div className="relative">
                    <Gift size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mandi-green" />
                    <input 
                      type="text" 
                      placeholder="Referral code (optional, get ₹50 off)" 
                      value={form.referralCode} 
                      onChange={e => upd('referralCode', e.target.value.toUpperCase())} 
                      className="input-field pl-9 uppercase placeholder:normal-case text-xs" 
                    />
                  </div>
                )}

                {error && <p className="text-red-600 dark:text-red-400 text-xs bg-red-500/10 border border-red-500/30 p-2.5 rounded-xl">{error}</p>}

                <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                  {loading ? 'Authenticating...' : mode === 'login' ? 'Login' : 'Create Account'}
                </button>
              </form>
            ) : (
              <form onSubmit={otpSent ? handleOtpVerify : handleSendOtp} className="space-y-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-mandi-subtle text-sm font-medium">+91</span>
                  <input 
                    type="tel" 
                    placeholder="10-digit mobile number" 
                    value={form.phone} 
                    onChange={e => upd('phone', e.target.value.replace(/\D/g,'').slice(0,10))} 
                    className="input-field pl-12" 
                    required 
                    disabled={otpSent} 
                    maxLength={10}
                    autoFocus={!otpSent}
                  />
                </div>

                {otpSent && (
                  <div className="space-y-2 animate-fade-in">
                    {import.meta.env.DEV && (
                      <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-[11px] text-mandi-green">
                        <Sparkles size={14} className="flex-shrink-0 animate-pulse text-mandi-green" />
                        <span><strong>Dev Mode:</strong> 6-digit OTP code printed in your <strong>terminal</strong> &amp; console.</span>
                      </div>
                    )}

                    <div className="relative">
                      <input 
                        type="text" 
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="Enter 6-digit OTP" 
                        value={form.otp} 
                        onChange={e => upd('otp', e.target.value.replace(/\D/g,'').slice(0,6))} 
                        className="input-field text-center tracking-widest text-lg font-bold font-mono" 
                        maxLength={6} 
                        required 
                        autoFocus
                      />
                    </div>
                  </div>
                )}

                {error && <p className="text-red-600 dark:text-red-400 text-xs bg-red-500/10 border border-red-500/30 p-2.5 rounded-xl">{error}</p>}

                <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 cursor-pointer">
                  {loading ? 'Please wait...' : otpSent ? 'Verify OTP & Log In' : 'Send SMS OTP'}
                </button>

                {otpSent && (
                  <div className="flex gap-2 pt-1 animate-fade-in">
                    <button 
                      type="button" 
                      disabled={phoneResendCooldown > 0 || loading}
                      onClick={handleSendOtp}
                      className="btn-outline flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
                    >
                      <RotateCw size={12} className={loading ? 'animate-spin' : ''} />
                      <span>{phoneResendCooldown > 0 ? `Resend in ${phoneResendCooldown}s` : 'Resend OTP'}</span>
                    </button>
                    <button 
                      type="button" 
                      onClick={() => { setOtpSent(false); setConfirmationResult(null); setError(''); setForm(f => ({ ...f, otp: '' })); }} 
                      className="btn-ghost flex-1 py-2 text-xs text-mandi-muted hover:text-mandi-text cursor-pointer"
                    >
                      Change Number
                    </button>
                  </div>
                )}
              </form>
            )}

            <p className="text-center text-mandi-muted text-sm mt-4">
              {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
              {' '}
              <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }} className="text-mandi-green font-semibold hover:underline">
                {mode === 'login' ? 'Sign Up' : 'Log In'}
              </button>
            </p>
          </>
        )}

        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={closeAuthModal}
            className="text-xs text-mandi-subtle hover:text-mandi-muted underline transition-colors"
          >
            Continue as Guest for now
          </button>
        </div>
      </div>
    </div>
  );
}
