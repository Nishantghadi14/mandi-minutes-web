import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { validateAddress } from '../utils/validators';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { useData } from '../context/DataContext';
import { useToast } from '../components/common/Toast';
import ReferralModal from '../components/common/ReferralModal';
import {
  User, Package, Heart, ShoppingCart, MapPin, Gift,
  Moon, Sun, Globe, Shield, Store, Bike, Phone,
  MessageCircle, HelpCircle, FileText, Lock, ChevronRight,
  LogOut, Zap, Check, ArrowRight, ArrowLeft, Sparkles, ExternalLink, X, Briefcase, Pencil, Trash2, Plus, Home as HomeIcon
} from 'lucide-react';
import { getAppHomePath } from '../utils/platform';

export default function ProfilePage() {
  const { user, logout, openAuthModal, resetPassword, updateUser } = useAuth();
  const { location, setLocationModal, setLocationByPincode } = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const { itemCount, setIsOpen } = useCart();
  const { orders = [] } = useData();
  const { addToast } = useToast();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [referralOpen, setReferralOpen] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetCooldown, setResetCooldown] = useState(0);

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    line1: '',
    area: '',
    landmark: '',
    city: 'Virar West',
    pincode: location?.pincode || '401305',
  });
  const [addressErrors, setAddressErrors] = useState({});
  const [savingAddress, setSavingAddress] = useState(false);

  const userAddresses = Array.isArray(user?.addresses) ? user.addresses : [];

  const handleOpenAddAddress = () => {
    setEditingAddressId(null);
    setAddressForm({
      label: 'Home',
      line1: '',
      area: '',
      landmark: '',
      city: 'Virar West',
      pincode: location?.pincode || '401305',
    });
    setAddressErrors({});
    setShowAddressModal(true);
  };

  const handleOpenEditAddress = (addr) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      label: addr.label || 'Home',
      line1: addr.line1 || '',
      area: addr.area || '',
      landmark: addr.landmark || '',
      city: addr.city || 'Virar West',
      pincode: addr.pincode || '401305',
    });
    setAddressErrors({});
    setShowAddressModal(true);
  };

  const handleDeleteAddress = async (addrId) => {
    const updated = userAddresses.filter(a => a.id !== addrId);
    if (typeof updateUser === 'function') {
      await updateUser({ addresses: updated });
    }
    addToast('Address removed from saved list', 'info');
  };

  const handleSetDefaultAddress = async (addrId) => {
    const updated = userAddresses.map(a => ({
      ...a,
      isDefault: a.id === addrId
    }));
    if (typeof updateUser === 'function') {
      await updateUser({ addresses: updated });
    }
    const defaultAddr = updated.find(a => a.id === addrId);
    if (defaultAddr?.pincode && typeof setLocationByPincode === 'function') {
      setLocationByPincode(defaultAddr.pincode);
    }
    addToast('Default delivery address updated! 📍', 'success');
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    const check = validateAddress(addressForm);
    if (!check.valid) {
      setAddressErrors(check.errors);
      const first = Object.values(check.errors)[0];
      addToast(first || 'Please fill in required fields', 'error');
      return;
    }

    setSavingAddress(true);
    try {
      const isExisting = Boolean(editingAddressId);
      const newAddr = {
        id: editingAddressId || `addr-${Date.now()}`,
        ...check.sanitized,
        isDefault: isExisting 
          ? (userAddresses.find(a => a.id === editingAddressId)?.isDefault ?? (userAddresses.length === 0))
          : (userAddresses.length === 0),
      };

      const others = userAddresses.filter(a => a.id !== newAddr.id);
      const updated = newAddr.isDefault 
        ? [newAddr, ...others.map(o => ({ ...o, isDefault: false }))]
        : [...others, newAddr];

      if (typeof updateUser === 'function') {
        await updateUser({ addresses: updated });
      }
      if (check.sanitized.pincode && typeof setLocationByPincode === 'function') {
        setLocationByPincode(check.sanitized.pincode);
      }
      setShowAddressModal(false);
      addToast(isExisting ? 'Address updated successfully! 🎉' : 'Delivery address saved! 🎉', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to save address', 'error');
    } finally {
      setSavingAddress(false);
    }
  };

  useEffect(() => {
    let t = null;
    if (resetCooldown > 0) {
      t = setInterval(() => setResetCooldown(c => Math.max(0, c - 1)), 1000);
    }
    return () => { if (t) clearInterval(t); };
  }, [resetCooldown]);

  const handleSendPasswordReset = async () => {
    if (!user?.email || resetCooldown > 0 || isSendingReset) return;
    setIsSendingReset(true);
    try {
      await resetPassword(user.email);
      setResetCooldown(30);
      addToast(`Password reset link sent to ${user.email}! Please check your email.`, 'success', 5000);
    } catch (err) {
      addToast(err.message || 'Could not send reset email', 'error');
    } finally {
      setIsSendingReset(false);
    }
  };

  // User past orders count
  const userOrders = user
    ? orders.filter(o => o.customerId === user.id || o.customerEmail === user.email)
    : [];

  const wishlistCount = user?.wishlist?.length || 0;

  const handleLogout = () => {
    logout();
    addToast('Logged out successfully', 'info');
    navigate(getAppHomePath());
  };

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    try {
      localStorage.setItem('i18nextLng', lang);
    } catch {
      // Ignore localStorage errors
    }
  };

  const isAdmin = user && (
    user.role === 'admin' ||
    user.email?.toLowerCase() === 'admin@mandiminutes.com' ||
    user.email?.toLowerCase() === 'admin@mandi.in'
  );

  const isVendor = user && (user.role === 'vendor' || isAdmin);

  return (
    <div className="max-w-md w-full mx-auto px-3.5 py-3 pb-28 text-mandi-text select-none">
      <Helmet>
        <title>Account & Settings — Mandi Minutes</title>
        <meta name="description" content="Manage your Mandi Minutes account, view orders, wishlist, delivery address, and app preferences." />
      </Helmet>

      {/* ─── Mobile Top Header ─── */}
      <div className="flex items-center gap-2 mb-3.5">
        <button
          onClick={() => navigate(getAppHomePath())}
          className="w-10 h-10 rounded-full hover:bg-mandi-surface active:bg-mandi-card flex items-center justify-center text-mandi-muted hover:text-mandi-text active:scale-90 transition-all flex-shrink-0"
          aria-label="Back to Home"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-black text-mandi-text">My Account</h1>
      </div>

      {/* ─── Profile Header / Authentication Card ─── */}
      {user ? (
        <div className="card p-5 mb-4 relative overflow-hidden gradient-border">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-mandi-green to-emerald-400 flex items-center justify-center text-black font-black text-2xl shadow-green glow-green-sm">
                {(user.name || user.displayName || user.email || 'U')[0].toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-mandi-card rounded-full flex items-center justify-center border border-mandi-border">
                <span className="w-2.5 h-2.5 rounded-full bg-mandi-green animate-pulse" />
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-mandi-text font-black text-lg sm:text-xl truncate">
                  {user.name || user.displayName || 'Customer'}
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-mandi-green/10 text-mandi-green border border-mandi-green/30">
                  {isAdmin ? 'Admin' : (user.role || 'Member')}
                </span>
              </div>
              <p className="text-mandi-muted text-xs truncate mt-0.5">
                {user.email || user.phone || 'Verified User'}
              </p>
              {user.phone && user.email && (
                <p className="text-mandi-subtle text-[11px] truncate">
                  {user.phone}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Guest Welcome Banner */
        <div className="card p-6 mb-4 relative overflow-hidden bg-gradient-to-br from-mandi-card via-mandi-surface to-mandi-card border-mandi-green/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-mandi-green/10 border border-mandi-green/30 flex items-center justify-center flex-shrink-0">
              <User size={24} className="text-mandi-green" />
            </div>
            <div className="flex-1">
              <h1 className="text-mandi-text font-black text-lg mb-1">
                Welcome to Mandi Minutes ⚡
              </h1>
              <p className="text-mandi-muted text-xs leading-relaxed mb-4">
                Log in to track your 10-minute grocery orders, view saved items, and manage addresses.
              </p>
              <button
                onClick={() => openAuthModal('login')}
                className="btn-primary py-2.5 px-6 text-sm font-bold shadow-green glow-green-sm inline-flex items-center gap-2"
              >
                <span>{t('nav.login')} / Sign Up</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Zepto Standard Section: Saved Addresses ─── */}
      <div className="card p-4 mb-4">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-mandi-green flex items-center justify-center">
              <MapPin size={17} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-mandi-text">Saved Addresses</h2>
              <p className="text-[11px] text-mandi-subtle">Manage your delivery locations</p>
            </div>
          </div>
          {userAddresses.length > 0 && (
            <button
              onClick={handleOpenAddAddress}
              className="btn-outline text-xs py-1.5 px-3 font-bold flex items-center gap-1.5 cursor-pointer hover:border-mandi-green hover:text-mandi-green"
            >
              <Plus size={14} /> Add New
            </button>
          )}
        </div>

        {userAddresses.length === 0 ? (
          <div className="text-center py-6 px-4 bg-mandi-surface/50 rounded-2xl border border-dashed border-mandi-border">
            <div className="w-12 h-12 rounded-full bg-mandi-card border border-mandi-border flex items-center justify-center mx-auto mb-3 text-mandi-subtle">
              <MapPin size={22} className="text-mandi-muted" />
            </div>
            <h3 className="text-sm font-bold text-mandi-text mb-1">No saved addresses</h3>
            <p className="text-xs text-mandi-subtle mb-4 max-w-xs mx-auto">
              Add a delivery address for instant 10-minute grocery delivery to your doorstep.
            </p>
            <button
              onClick={handleOpenAddAddress}
              className="btn-primary text-xs py-2 px-4 font-bold inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus size={14} /> Add Delivery Address
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {userAddresses.map(addr => {
              const IconComponent = addr.label === 'Work' ? Briefcase : addr.label === 'Home' ? HomeIcon : MapPin;
              return (
                <div
                  key={addr.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    addr.isDefault 
                      ? 'bg-mandi-surface/80 border-mandi-green/40 ring-1 ring-mandi-green/20' 
                      : 'bg-mandi-surface/40 border-mandi-border hover:border-mandi-border-light'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        addr.isDefault ? 'bg-mandi-green/15 text-mandi-green' : 'bg-mandi-card text-mandi-muted'
                      }`}>
                        <IconComponent size={15} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-mandi-text uppercase tracking-wide">
                            {addr.label || 'Home'}
                          </span>
                          {addr.isDefault && (
                            <span className="text-[9px] font-bold text-mandi-green bg-mandi-green/15 px-1.5 py-0.2 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-mandi-text font-medium leading-relaxed">
                          {addr.line1}
                          {addr.area ? `, ${addr.area}` : ''}
                        </p>
                        {addr.landmark && (
                          <p className="text-[11px] text-mandi-subtle mt-0.5">
                            Landmark: {addr.landmark}
                          </p>
                        )}
                        <p className="text-[11px] text-mandi-muted mt-0.5">
                          {addr.city} — {addr.pincode}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {!addr.isDefault && (
                        <button
                          onClick={() => handleSetDefaultAddress(addr.id)}
                          className="text-[10px] text-mandi-subtle hover:text-mandi-green font-semibold py-1 px-2 rounded-lg hover:bg-mandi-surface cursor-pointer"
                          title="Set as default address"
                        >
                          Make Default
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenEditAddress(addr)}
                        className="p-1.5 rounded-lg text-mandi-subtle hover:text-mandi-text hover:bg-mandi-surface transition-colors cursor-pointer"
                        title="Edit address"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="p-1.5 rounded-lg text-mandi-subtle hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Delete address"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Zepto Standard Address Modal (Zero e.g. placeholders) ─── */}
      {showAddressModal && (
        <div className="overlay flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-mandi-card border border-mandi-border rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 w-full max-w-md animate-slide-in-up sm:animate-fade-in max-h-[90dvh] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-clay-floating">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="bg-mandi-green-muted p-2 rounded-xl">
                  <MapPin size={18} className="text-mandi-green" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-mandi-text">
                    {editingAddressId ? 'Edit Delivery Address' : 'Add Delivery Address'}
                  </h3>
                  <p className="text-[11px] text-mandi-subtle">Enter accurate house & building details</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddressModal(false)}
                className="text-mandi-subtle hover:text-mandi-text p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-3.5">
              {/* Save As Tag */}
              <div>
                <label className="text-[11px] font-semibold text-mandi-muted mb-1.5 block">Save Address As</label>
                <div className="flex gap-2">
                  {['Home', 'Work', 'Other'].map(lbl => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => setAddressForm(f => ({ ...f, label: lbl }))}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        addressForm.label === lbl 
                          ? 'bg-mandi-green text-black border-mandi-green font-bold shadow-sm' 
                          : 'border-mandi-border text-mandi-muted hover:border-mandi-border-light'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* House / Flat / Building */}
              <div>
                <label className="text-[11px] font-semibold text-mandi-muted mb-1 block">
                  House / Flat / Floor / Building Name *
                </label>
                <input
                  type="text"
                  placeholder="Flat, house no., building name"
                  value={addressForm.line1}
                  onChange={e => {
                    setAddressForm(f => ({ ...f, line1: e.target.value }));
                    setAddressErrors(err => ({ ...err, line1: null }));
                  }}
                  className={`input-field text-sm ${addressErrors.line1 ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                  autoFocus
                />
                {addressErrors.line1 && <p className="text-red-400 text-xs mt-1">{addressErrors.line1}</p>}
              </div>

              {/* Area / Sector / Street */}
              <div>
                <label className="text-[11px] font-semibold text-mandi-muted mb-1 block">
                  Area / Sector / Street Address
                </label>
                <input
                  type="text"
                  placeholder="Area, street, or sector"
                  value={addressForm.area || ''}
                  onChange={e => setAddressForm(f => ({ ...f, area: e.target.value }))}
                  className="input-field text-sm"
                />
              </div>

              {/* Nearby Landmark */}
              <div>
                <label className="text-[11px] font-semibold text-mandi-muted mb-1 block">
                  Nearby Landmark (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Landmark or famous spot"
                  value={addressForm.landmark || ''}
                  onChange={e => setAddressForm(f => ({ ...f, landmark: e.target.value }))}
                  className="input-field text-sm"
                />
              </div>

              {/* City & Pincode */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-mandi-muted mb-1 block">City *</label>
                  <input
                    type="text"
                    placeholder="City"
                    value={addressForm.city}
                    onChange={e => {
                      setAddressForm(f => ({ ...f, city: e.target.value }));
                      setAddressErrors(err => ({ ...err, city: null }));
                    }}
                    className={`input-field text-sm ${addressErrors.city ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                  />
                  {addressErrors.city && <p className="text-red-400 text-xs mt-1">{addressErrors.city}</p>}
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-mandi-muted mb-1 block">6-Digit Pincode *</label>
                  <input
                    type="text"
                    placeholder="6-digit Pincode"
                    value={addressForm.pincode}
                    maxLength={6}
                    onChange={e => {
                      setAddressForm(f => ({ ...f, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }));
                      setAddressErrors(err => ({ ...err, pincode: null }));
                    }}
                    className={`input-field text-sm ${addressErrors.pincode ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                  />
                  {addressErrors.pincode && <p className="text-red-400 text-xs mt-1">{addressErrors.pincode}</p>}
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={savingAddress}
                  className="btn-primary py-2.5 flex-1 font-bold text-xs sm:text-sm cursor-pointer"
                >
                  {savingAddress ? 'Saving Address...' : 'Save Delivery Address'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="btn-ghost py-2.5 px-4 text-xs font-semibold text-mandi-muted cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Quick Shortcuts Grid ─── */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* My Orders */}
        <Link
          to="/orders"
          className="card p-3.5 flex flex-col justify-between hover:border-mandi-green transition-all group active:scale-95"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Package size={18} />
            </div>
            {userOrders.length > 0 && (
              <span className="badge-green text-[10px]">{userOrders.length}</span>
            )}
          </div>
          <div>
            <p className="text-mandi-text font-bold text-sm">My Orders</p>
            <p className="text-mandi-subtle text-[11px] mt-0.5">Track & reorder items</p>
          </div>
        </Link>

        {/* Wishlist */}
        <Link
          to="/wishlist"
          className="card p-3.5 flex flex-col justify-between hover:border-mandi-green transition-all group active:scale-95"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Heart size={18} />
            </div>
            {wishlistCount > 0 && (
              <span className="badge-green text-[10px]">{wishlistCount}</span>
            )}
          </div>
          <div>
            <p className="text-mandi-text font-bold text-sm">My Favourites</p>
            <p className="text-mandi-subtle text-[11px] mt-0.5">Saved grocery staples</p>
          </div>
        </Link>

        {/* Cart */}
        <button
          onClick={() => setIsOpen(true)}
          className="card p-3.5 flex flex-col justify-between text-left hover:border-mandi-green transition-all group active:scale-95"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-mandi-green flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShoppingCart size={18} />
            </div>
            {itemCount > 0 && (
              <span className="badge-green text-[10px]">{itemCount} items</span>
            )}
          </div>
          <div>
            <p className="text-mandi-text font-bold text-sm">Active Cart</p>
            <p className="text-mandi-subtle text-[11px] mt-0.5">View & checkout</p>
          </div>
        </button>

        {/* Refer & Earn */}
        <button
          onClick={() => setReferralOpen(true)}
          className="card p-3.5 flex flex-col justify-between text-left hover:border-mandi-green transition-all group active:scale-95 bg-gradient-to-br from-mandi-card to-mandi-green/5"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Gift size={18} />
            </div>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
              ₹50 FREE
            </span>
          </div>
          <div>
            <p className="text-mandi-text font-bold text-sm">Refer & Earn</p>
            <p className="text-mandi-subtle text-[11px] mt-0.5">Invite neighbors</p>
          </div>
        </button>
      </div>

      {/* ─── Partner & Management Portal Links ─── */}
      <div className="card p-4 mb-4">
        <h2 className="text-mandi-muted text-xs font-bold uppercase tracking-wider mb-3">
          Partner & Portals
        </h2>
        <div className="space-y-1">
          {isAdmin && (
            <Link
              to="/admin"
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-mandi-surface transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-mandi-green flex items-center justify-center">
                  <Shield size={16} />
                </div>
                <div>
                  <p className="text-mandi-text font-semibold text-xs sm:text-sm">Admin Control Center</p>
                  <p className="text-mandi-subtle text-[11px]">System metrics, stores, orders</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-mandi-subtle group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}

          {isVendor ? (
            <Link
              to="/vendor"
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-mandi-surface transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center">
                  <Store size={16} />
                </div>
                <div>
                  <p className="text-mandi-text font-semibold text-xs sm:text-sm">Vendor Dashboard</p>
                  <p className="text-mandi-subtle text-[11px]">Manage products, live stock & orders</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-mandi-subtle group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ) : (
            <Link
              to="/vendor-onboarding"
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-mandi-surface transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center">
                  <Store size={16} />
                </div>
                <div>
                  <p className="text-mandi-text font-semibold text-xs sm:text-sm">Partner as Kirana Store</p>
                  <p className="text-mandi-subtle text-[11px]">List your store and grow daily orders</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-mandi-subtle group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}

          <Link
            to="/rider"
            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-mandi-surface transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
                <Bike size={16} />
              </div>
              <div>
                <p className="text-mandi-text font-semibold text-xs sm:text-sm">Rider Delivery Portal</p>
                <p className="text-mandi-subtle text-[11px]">Earn delivering local neighborhood orders</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-mandi-subtle group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* ─── App Preferences: Theme & Language ─── */}
      <div className="card p-4 mb-4">
        <h2 className="text-mandi-muted text-xs font-bold uppercase tracking-wider mb-3">
          App Preferences
        </h2>

        {/* Theme Toggle */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-mandi-surface/60 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-mandi-surface border border-mandi-border flex items-center justify-center text-mandi-green">
              {isDark ? <Moon size={16} /> : <Sun size={16} />}
            </div>
            <div>
              <p className="text-mandi-text font-semibold text-xs sm:text-sm">Theme Mode</p>
              <p className="text-mandi-subtle text-[11px]">{isDark ? 'Dark theme active' : 'Light theme active'}</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="px-3 py-1.5 rounded-lg border border-mandi-border bg-mandi-card text-xs font-bold text-mandi-text hover:border-mandi-green transition-all active:scale-95"
          >
            {isDark ? '🌙 Dark' : '☀️ Light'}
          </button>
        </div>

        {/* Language Selection */}
        <div className="p-2.5 rounded-xl bg-mandi-surface/60">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-mandi-surface border border-mandi-border flex items-center justify-center text-mandi-green">
                <Globe size={16} />
              </div>
              <div>
                <p className="text-mandi-text font-semibold text-xs sm:text-sm">Language</p>
                <p className="text-mandi-subtle text-[11px]">Select preferred display language</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {[
              { code: 'en', label: 'English', native: 'English' },
              { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
              { code: 'mr', label: 'Marathi', native: 'मराठी' },
            ].map(lang => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center ${
                  i18n.language?.startsWith(lang.code)
                    ? 'bg-mandi-green text-black shadow-sm'
                    : 'bg-mandi-card border border-mandi-border text-mandi-muted hover:text-mandi-text'
                }`}
              >
                <span>{lang.native}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Help, Support & Legal ─── */}
      <div className="card p-4 mb-4">
        <h2 className="text-mandi-muted text-xs font-bold uppercase tracking-wider mb-3">
          Help & Information
        </h2>
        <div className="space-y-1">
          <Link
            to="/contact"
            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-mandi-surface transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-mandi-green flex items-center justify-center">
                <HelpCircle size={16} />
              </div>
              <div>
                <p className="text-mandi-text font-semibold text-xs sm:text-sm">Customer Support & FAQs</p>
                <p className="text-mandi-subtle text-[11px]">Help with orders, delivery, refunds</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-mandi-subtle group-hover:translate-x-0.5 transition-transform" />
          </Link>

          {/* Direct WhatsApp Support */}
          <a
            href="https://wa.me/919920941603?text=Hi%20Mandi%20Minutes%20Support"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-mandi-surface transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-400 flex items-center justify-center">
                <MessageCircle size={16} />
              </div>
              <div>
                <p className="text-mandi-text font-semibold text-xs sm:text-sm">Chat on WhatsApp</p>
                <p className="text-mandi-subtle text-[11px]">+91 99209 41603 (Instant reply)</p>
              </div>
            </div>
            <ExternalLink size={14} className="text-mandi-subtle group-hover:text-green-400 transition-colors" />
          </a>

          {/* Direct Call Support */}
          <a
            href="tel:+919920941603"
            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-mandi-surface transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
                <Phone size={16} />
              </div>
              <div>
                <p className="text-mandi-text font-semibold text-xs sm:text-sm">Call Us</p>
                <p className="text-mandi-subtle text-[11px]">Available 7 AM to 11 PM</p>
              </div>
            </div>
            <ExternalLink size={14} className="text-mandi-subtle group-hover:text-sky-400 transition-colors" />
          </a>

          <Link
            to="/about"
            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-mandi-surface transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Zap size={16} />
              </div>
              <div>
                <p className="text-mandi-text font-semibold text-xs sm:text-sm">About Mandi Minutes</p>
                <p className="text-mandi-subtle text-[11px]">Our mission & local Kirana story</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-mandi-subtle group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            to="/terms"
            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-mandi-surface transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-mandi-surface text-mandi-muted flex items-center justify-center">
                <FileText size={16} />
              </div>
              <div>
                <p className="text-mandi-text font-semibold text-xs sm:text-sm">Terms of Service</p>
                <p className="text-mandi-subtle text-[11px]">User agreement & guidelines</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-mandi-subtle group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            to="/privacy"
            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-mandi-surface transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-mandi-surface text-mandi-muted flex items-center justify-center">
                <Lock size={16} />
              </div>
              <div>
                <p className="text-mandi-text font-semibold text-xs sm:text-sm">Privacy Policy</p>
                <p className="text-mandi-subtle text-[11px]">Data security & encryption</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-mandi-subtle group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* ─── Account Security: Password Reset ─── */}
      {user && user.email && (
        <div className="card p-4 mb-4">
          <h2 className="text-mandi-muted text-xs font-bold uppercase tracking-wider mb-3">
            Account Security
          </h2>
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-mandi-surface/60">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-mandi-green flex items-center justify-center flex-shrink-0">
                <Lock size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-mandi-text font-semibold text-xs sm:text-sm">Password &amp; Security</p>
                <p className="text-mandi-subtle text-[11px] truncate">Reset password for {user.email}</p>
              </div>
            </div>
            <button
              type="button"
              disabled={resetCooldown > 0 || isSendingReset}
              onClick={handleSendPasswordReset}
              className="btn-outline text-xs py-1.5 px-3 font-bold flex items-center gap-1.5 whitespace-nowrap active:scale-95 flex-shrink-0 disabled:opacity-50"
            >
              {isSendingReset ? 'Sending...' : resetCooldown > 0 ? `Sent (${resetCooldown}s)` : 'Reset Password'}
            </button>
          </div>
        </div>
      )}

      {/* ─── Logout Button ─── */}
      {user && (
        <button
          onClick={handleLogout}
          className="w-full card p-3.5 mb-6 flex items-center justify-center gap-2 text-red-500 dark:text-red-400 hover:bg-red-500/10 border-red-500/20 font-bold text-sm transition-all active:scale-95"
        >
          <LogOut size={16} />
          <span>Log Out of Mandi Minutes</span>
        </button>
      )}

      {/* ─── App Footprint Badge ─── */}
      <div className="text-center py-4 select-none opacity-60">
        <p className="text-xs font-semibold text-mandi-text">
          Mandi Minutes App • v1.0.0
        </p>
        <p className="text-[11px] text-mandi-subtle mt-0.5">
          Made with ❤️ for Local Kiranas in Virar, Palghar
        </p>
      </div>

      {/* Referral Modal */}
      <ReferralModal isOpen={referralOpen} onClose={() => setReferralOpen(false)} />
    </div>
  );
}
