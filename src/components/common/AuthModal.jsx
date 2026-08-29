import { useState, useRef, useEffect } from 'react';
import { X, Eye, EyeOff, Phone, Mail, Lock, User, ShieldCheck, Gift } from 'lucide-react';
import { RecaptchaVerifier } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from './Toast';
import { validateIndianPhone, validateEmail, sanitizeText } from '../../utils/validators';

export default function AuthModal() {
  const { authModal, closeAuthModal, login, register, sendPhoneOtp, confirmPhoneOtp } = useAuth();
  const { addToast } = useToast();
  const [tab, setTab] = useState('email');
  const [mode, setMode] = useState(authModal.mode || 'login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', referralCode: '', otp: '' });
  const [error, setError] = useState('');
  const recaptchaVerifierRef = useRef(null);

  useEffect(() => {
    if (authModal.mode) setMode(authModal.mode);
    setError('');
  }, [authModal.mode, authModal.open]);

  useEffect(() => {
    // Reset confirmation and recaptcha when modal is closed
    if (!authModal.open) {
      setOtpSent(false);
      setConfirmationResult(null);
      setError('');
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
      if (mode === 'login') {
        await login(emailCheck.value, form.password);
        addToast('Welcome back to Mandi Minutes!', 'success');
      } else {
        const sanitizedName = sanitizeText(form.name, 60);
        await register(sanitizedName, emailCheck.value, form.phone, form.password, form.referralCode);
        addToast('Account created successfully! Welcome 🎉', 'success');
      }
      closeAuthModal();
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const setupRecaptcha = () => {
    if (!auth) throw new Error('Firebase Auth is not available.');
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
    e.preventDefault();
    const phoneCheck = validateIndianPhone(form.phone);
    if (!phoneCheck.valid) {
      setError(phoneCheck.error);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const appVerifier = setupRecaptcha();
      const confirmResult = await sendPhoneOtp(phoneCheck.value, appVerifier);
      setConfirmationResult(confirmResult);
      setOtpSent(true);
      addToast(`OTP sent to +91 ${phoneCheck.value}`, 'info', 5000);
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
      setError('Please enter the 6-digit OTP received on your phone.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      if (!confirmationResult) {
        throw new Error('No active OTP session. Please request a new OTP.');
      }
      await confirmPhoneOtp(confirmationResult, form.otp);
      addToast('Phone number verified! Welcome to Mandi Minutes 🎉', 'success');
      closeAuthModal();
    } catch (err) {
      setError(err.message || 'Invalid OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overlay flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-mandi-card border border-mandi-border rounded-t-3xl sm:rounded-2xl p-6 w-full max-w-md animate-slide-in-up sm:animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-mandi-text">{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
            <p className="text-mandi-muted text-sm">{mode === 'login' ? 'Login to your verified account' : 'Join Mandi Minutes today'}</p>
          </div>
          <button onClick={closeAuthModal} className="text-mandi-subtle hover:text-mandi-text transition-colors p-1"><X size={20} /></button>
        </div>

        {/* Security badge */}
        <div className="flex items-center gap-2 bg-mandi-surface border border-mandi-border rounded-xl px-3 py-2 mb-4 text-xs text-mandi-muted">
          <ShieldCheck size={14} className="text-mandi-green flex-shrink-0" />
          <span>Secured by Firebase Authentication (Zero-Trust RBAC)</span>
        </div>

        {/* Tabs */}
        <div className="flex bg-mandi-surface rounded-xl p-1 mb-4">
          {[{id:'email',label:'Email & Password'},{id:'phone',label:'Phone OTP'}].map(t=>(
            <button 
              key={t.id} 
              onClick={() => { setTab(t.id); setError(''); }} 
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === t.id ? 'bg-mandi-green text-black font-semibold' : 'text-mandi-muted hover:text-mandi-text'}`}
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

            {error && <p className="text-red-400 text-xs bg-red-950 bg-opacity-30 border border-red-800 p-2.5 rounded-xl">{error}</p>}

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
              />
            </div>
            {otpSent && (
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Enter 6-digit SMS OTP" 
                  value={form.otp} 
                  onChange={e => upd('otp', e.target.value.replace(/\D/g,'').slice(0,6))} 
                  className="input-field text-center tracking-widest text-lg font-bold" 
                  maxLength={6} 
                  required 
                  autoFocus
                />
              </div>
            )}

            {error && <p className="text-red-400 text-xs bg-red-950 bg-opacity-30 border border-red-800 p-2.5 rounded-xl">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? 'Please wait...' : otpSent ? 'Verify OTP & Log In' : 'Send SMS OTP'}
            </button>

            {otpSent && (
              <button 
                type="button" 
                onClick={() => { setOtpSent(false); setConfirmationResult(null); setError(''); }} 
                className="btn-ghost w-full text-center text-xs text-mandi-muted"
              >
                ← Change Number / Resend
              </button>
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
      </div>
    </div>
  );
}
