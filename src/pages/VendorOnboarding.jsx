import { useState } from 'react';
import { Store, CheckCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useToast } from '../components/common/Toast';
import ImageUploadField from '../components/common/ImageUploadField';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { validateIndianPhone, validateEmail, validatePincode, validateUPI, sanitizeText } from '../utils/validators';

export default function VendorOnboarding() {
  const { submitVendorApplication } = useData();
  const { user, openAuthModal, registerVendor } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    storeName: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    password: '',
    address: '',
    city: 'Virar, Palghar',
    pincodes: '401305, 401303',
    gstin: '',
    upiId: '',
    bankAccount: '',
    description: '',
    image: '',
    coverImage: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    const storeName = sanitizeText(form.storeName, 100);
    if (!storeName || storeName.length < 3) {
      newErrors.storeName = 'Store name must be at least 3 characters';
    }

    const ownerName = sanitizeText(form.ownerName, 60);
    if (!ownerName || ownerName.length < 2) {
      newErrors.ownerName = 'Owner name must be at least 2 characters';
    }

    const emailCheck = validateEmail(form.ownerEmail);
    if (!emailCheck.valid) {
      newErrors.ownerEmail = emailCheck.error;
    }

    const phoneCheck = validateIndianPhone(form.ownerPhone);
    if (!phoneCheck.valid) {
      newErrors.ownerPhone = phoneCheck.error;
    }

    const passwordVal = (form.password || 'vendor123').trim();
    if (passwordVal.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    const address = sanitizeText(form.address, 150);
    if (!address || address.length < 5) {
      newErrors.address = 'Store address must be at least 5 characters';
    }

    const rawPincodes = form.pincodes.split(',').map(p => p.trim()).filter(Boolean);
    if (rawPincodes.length === 0) {
      newErrors.pincodes = 'Provide at least one 6-digit delivery PIN code';
    } else {
      for (const p of rawPincodes) {
        const pinCheck = validatePincode(p);
        if (!pinCheck.valid) {
          newErrors.pincodes = `Invalid pincode "${p}". Must be 6 digits.`;
          break;
        }
      }
    }

    const upiCheck = validateUPI(form.upiId);
    if (!upiCheck.valid) {
      newErrors.upiId = upiCheck.error;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      addToast('Please correct the errors in the form', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const newStore = {
        name: storeName,
        ownerName: ownerName,
        ownerEmail: emailCheck.value,
        ownerPhone: phoneCheck.value,
        address: address,
        city: sanitizeText(form.city || 'Virar, Palghar', 50),
        pincodes: rawPincodes,
        status: 'approved',
        isOpen: true,
        gstin: sanitizeText(form.gstin || '', 20),
        upiId: upiCheck.value,
        bankAccount: sanitizeText(form.bankAccount || '', 40),
        description: sanitizeText(form.description || '', 400),
        rating: 0,
        totalRatings: 0,
        deliveryTime: '10-15 min',
        minOrder: 99,
        deliveryCharge: 0,
        image: form.image || '',
        coverImage: form.coverImage || '',
        categories: ['cat-1', 'cat-2', 'cat-3', 'cat-4'],
      };

      const createdStore = await submitVendorApplication(newStore);

      // Register vendor user credentials & immediately establish active vendor session
      await registerVendor({
        name: ownerName,
        email: emailCheck.value,
        phone: phoneCheck.value,
        password: passwordVal,
        storeId: createdStore.id,
        storeName: storeName,
      });

      setSubmitted(true);
      addToast('🎉 Store onboarding successful! You are now logged in as Vendor.', 'success', 5000);
    } catch (err) {
      console.error('Vendor onboarding submission failed:', err);
      addToast(err.message || 'Failed to submit onboarding form. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="w-12 h-12 bg-mandi-green-muted rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Store size={24} className="text-mandi-green" />
        </div>
        <h1 className="text-3xl font-black text-mandi-text mb-2">Partner with Mandi Minutes</h1>
        <p className="text-mandi-muted text-sm">Join India's fastest-growing hyperlocal network. Connect your kirana store to nearby customers and boost your daily sales.</p>
      </div>

      {submitted ? (
        <div className="card p-8 sm:p-10 text-center max-w-lg mx-auto shadow-2xl border border-mandi-green/30 animate-scale-in">
          <div className="w-16 h-16 bg-mandi-green/15 text-mandi-green rounded-full flex items-center justify-center mx-auto mb-4 glow-green-sm">
            <CheckCircle size={36} />
          </div>
          <h2 className="text-mandi-text font-black text-2xl mb-1">Store Registered Successfully! 🎉</h2>
          <p className="text-mandi-green text-sm font-semibold mb-4">✓ You are now logged in as Vendor</p>
          
          <div className="bg-mandi-surface border border-mandi-border rounded-2xl p-4 text-left mb-6 space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-mandi-muted">Store Name:</span>
              <span className="text-mandi-text font-bold">{form.storeName}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-mandi-muted">Owner Name:</span>
              <span className="text-mandi-text font-medium">{form.ownerName}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-mandi-muted">Login Email:</span>
              <span className="text-mandi-text font-mono font-medium">{form.ownerEmail}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-mandi-muted">Account Role:</span>
              <span className="badge-green text-[10px] font-bold uppercase">Vendor Partner</span>
            </div>
            <p className="text-[11px] text-mandi-subtle pt-2 border-t border-mandi-border">
              💡 You can use <strong>{form.ownerEmail}</strong> and your password to log in anytime from any device.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button 
              onClick={() => navigate('/vendor')} 
              className="btn-primary flex items-center justify-center gap-2 py-3 px-6 font-bold shadow-green glow-green-sm text-sm"
            >
              <Store size={18} /> Open Vendor Dashboard
            </button>
            <button 
              onClick={() => navigate('/')} 
              className="btn-outline py-3 px-5 text-sm"
            >
              Return Home
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Form */}
          <div className="md:col-span-2 card p-6">
            <h2 className="text-mandi-text font-bold text-lg mb-4">Store Registration Form</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-mandi-muted text-xs font-medium mb-1">Store Name *</label>
                  <input 
                    required 
                    value={form.storeName} 
                    onChange={e => handleChange('storeName', e.target.value)} 
                    placeholder="e.g. Gupta General Store" 
                    className={`input-field text-sm ${errors.storeName ? 'border-red-500' : ''}`} 
                  />
                  {errors.storeName && <p className="text-red-400 text-xs mt-1">{errors.storeName}</p>}
                </div>
                <div>
                  <label className="block text-mandi-muted text-xs font-medium mb-1">Owner Name *</label>
                  <input 
                    required 
                    value={form.ownerName} 
                    onChange={e => handleChange('ownerName', e.target.value)} 
                    placeholder="Full Name" 
                    className={`input-field text-sm ${errors.ownerName ? 'border-red-500' : ''}`} 
                  />
                  {errors.ownerName && <p className="text-red-400 text-xs mt-1">{errors.ownerName}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-mandi-muted text-xs font-medium mb-1">Email Address * (Used for Login)</label>
                  <input 
                    type="email" 
                    required 
                    value={form.ownerEmail} 
                    onChange={e => handleChange('ownerEmail', e.target.value)} 
                    placeholder="vendor@gmail.com" 
                    className={`input-field text-sm ${errors.ownerEmail ? 'border-red-500' : ''}`} 
                  />
                  {errors.ownerEmail && <p className="text-red-400 text-xs mt-1">{errors.ownerEmail}</p>}
                </div>
                <div>
                  <label className="block text-mandi-muted text-xs font-medium mb-1">Mobile Number *</label>
                  <input 
                    type="tel" 
                    required 
                    value={form.ownerPhone} 
                    onChange={e => handleChange('ownerPhone', e.target.value.replace(/\D/g, '').slice(0, 10))} 
                    placeholder="10-digit number" 
                    className={`input-field text-sm ${errors.ownerPhone ? 'border-red-500' : ''}`} 
                  />
                  {errors.ownerPhone && <p className="text-red-400 text-xs mt-1">{errors.ownerPhone}</p>}
                </div>
              </div>

              <div>
                <label className="block text-mandi-muted text-xs font-medium mb-1">Create Vendor Password * (Min 6 chars)</label>
                <input 
                  type="password" 
                  required 
                  minLength={6}
                  value={form.password} 
                  onChange={e => handleChange('password', e.target.value)} 
                  placeholder="Set your password to log in as Vendor" 
                  className={`input-field text-sm ${errors.password ? 'border-red-500' : ''}`} 
                />
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-mandi-muted text-xs font-medium mb-1">Store Address *</label>
                <input 
                  required 
                  value={form.address} 
                  onChange={e => handleChange('address', e.target.value)} 
                  placeholder="Shop number, street, locality" 
                  className={`input-field text-sm ${errors.address ? 'border-red-500' : ''}`} 
                />
                {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-mandi-muted text-xs font-medium mb-1">City *</label>
                  <input 
                    required 
                    value={form.city} 
                    onChange={e => handleChange('city', e.target.value)} 
                    className="input-field text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-mandi-muted text-xs font-medium mb-1">Pincodes Served *</label>
                  <input 
                    required 
                    value={form.pincodes} 
                    onChange={e => handleChange('pincodes', e.target.value)} 
                    placeholder="401305, 401303" 
                    className={`input-field text-sm ${errors.pincodes ? 'border-red-500' : ''}`} 
                  />
                  {errors.pincodes && <p className="text-red-400 text-xs mt-1">{errors.pincodes}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-mandi-muted text-xs font-medium mb-1">Merchant UPI ID *</label>
                  <input 
                    required 
                    value={form.upiId} 
                    onChange={e => handleChange('upiId', e.target.value)} 
                    placeholder="e.g. storename@okaxis" 
                    className={`input-field text-sm ${errors.upiId ? 'border-red-500' : ''}`} 
                  />
                  {errors.upiId && <p className="text-red-400 text-xs mt-1">{errors.upiId}</p>}
                </div>
                <div>
                  <label className="block text-mandi-muted text-xs font-medium mb-1">GSTIN (Optional)</label>
                  <input 
                    value={form.gstin} 
                    onChange={e => handleChange('gstin', e.target.value)} 
                    placeholder="27AAAAA0000A1Z5" 
                    className="input-field text-sm" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-mandi-muted text-xs font-medium mb-1">Bank Account Number (Optional)</label>
                <input 
                  value={form.bankAccount} 
                  onChange={e => handleChange('bankAccount', e.target.value)} 
                  placeholder="Optional bank account number" 
                  className="input-field text-sm" 
                />
              </div>

              <div>
                <label className="block text-mandi-muted text-xs font-medium mb-1">Store Description</label>
                <textarea 
                  rows={2} 
                  value={form.description} 
                  onChange={e => handleChange('description', e.target.value)} 
                  placeholder="Tell customers about your store..." 
                  className="input-field text-sm w-full" 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <ImageUploadField
                  label="Store's Picture (Logo / Storefront)"
                  value={form.image}
                  onChange={(val) => handleChange('image', val)}
                  aspectRatio="square"
                  recommendedText="400×400px (1:1)"
                  placeholderText="Image not available"
                />
                <ImageUploadField
                  label="Store Cover Picture (Hero Banner)"
                  value={form.coverImage}
                  onChange={(val) => handleChange('coverImage', val)}
                  aspectRatio="banner"
                  recommendedText="1200×400px"
                  placeholderText="Image not available"
                />
              </div>

              <button 
                type="submit" 
                disabled={submitting} 
                className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2"
              >
                {submitting ? 'Submitting Application...' : 'Submit Registration'} <ArrowRight size={16} />
              </button>
            </form>
          </div>

          {/* Benefits */}
          <div className="space-y-4">
            <div className="card p-5">
              <h3 className="text-mandi-text font-bold text-base mb-3 flex items-center gap-2">
                <ShieldCheck size={18} className="text-mandi-green" /> Why Partner?
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-mandi-text font-semibold text-xs">🚀 Zero Commission First Month</p>
                  <p className="text-mandi-muted text-xs">Keep 100% of your sales earnings during your trial period.</p>
                </div>
                <div>
                  <p className="text-mandi-text font-semibold text-xs">📱 Easy Product Manager</p>
                  <p className="text-mandi-muted text-xs">Add products, update prices and stock levels in seconds.</p>
                </div>
                <div>
                  <p className="text-mandi-text font-semibold text-xs">⚡ Fast Weekly Payouts</p>
                  <p className="text-mandi-muted text-xs">Direct bank transfer into your account every Monday.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
