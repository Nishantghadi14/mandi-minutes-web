import { useState, useEffect, useCallback, useMemo } from 'react';
import { MapPin, Navigation, X, Search, Plus, Check, Home, Briefcase } from 'lucide-react';
import { useLocation } from '../../context/LocationContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from './Toast';

const popularVirarPincodes = [
  { code: '401305', label: 'Bolinj & Viva College Rd, Virar W' },
  { code: '401303', label: 'Manvelpada & Phoolpada, Virar E' },
  { code: '401305', label: 'Agashi & Yazoo Park, Virar W' },
  { code: '401303', label: 'Chandansar & Totale Talao, Virar E' },
  { code: '401301', label: 'Nallasopara Link Rd, Virar' },
  { code: '401309', label: 'Arnala Beach Road, Virar W' },
];

export default function LocationModal() {
  const { locationModal, setLocationModal, setLocationByPincode, detectLocation } = useLocation();
  const { user, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [pincode, setPincode] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState('');

  const savedAddresses = useMemo(() => {
    if (!user?.addresses || !Array.isArray(user.addresses)) return [];
    return user.addresses.filter(a => a && (a.line1 || a.street) && a.line1 !== 'Virar West, Maharashtra, 401303');
  }, [user]);

  const activeSavedAddressId = useMemo(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('mandi_active_address') || 'null');
      if (stored?.id) return stored.id;
    } catch {}
    const def = savedAddresses.find(a => a.isDefault);
    return def ? def.id : savedAddresses[0]?.id;
  }, [savedAddresses]);

  const handleSelectSavedAddress = (addr) => {
    try {
      localStorage.setItem('mandi_active_address', JSON.stringify(addr));
    } catch {}
    if (addr.pincode && typeof setLocationByPincode === 'function') {
      setLocationByPincode(addr.pincode);
    }
    handleClose();
    addToast(`Delivery set to ${addr.label || 'Saved Address'}`, 'success');
  };

  const handleAddNewAddress = () => {
    handleClose();
    const isApp = typeof window !== 'undefined' && window.location.search.includes('mode=app');
    const path = isApp ? '/profile?action=add-address&mode=app' : '/profile?action=add-address';
    if (user) {
      navigate(path);
    } else {
      openAuthModal('login');
      addToast('Please sign in to add your delivery address', 'info');
    }
  };

  const handleClose = useCallback(() => {
    setLocationModal(false);
  }, [setLocationModal]);

  // Keyboard Escape listener to dismiss location modal
  useEffect(() => {
    if (!locationModal) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [locationModal, handleClose]);

  if (!locationModal) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pincode.length !== 6 || !/^\d+$/.test(pincode)) { setError('Enter a valid 6-digit Virar pincode'); return; }
    setLocationByPincode(pincode);
    addToast(`Delivery location set to Virar (${pincode})`, 'success');
  };

  const handleDetect = async () => {
    setDetecting(true); setError('');
    try {
      await detectLocation();
      addToast('Virar location detected successfully!', 'success');
    } catch (err) {
      setError(err.message);
      addToast('Could not detect location', 'error');
    } finally {
      setDetecting(false);
    }
  };

  return (
    <div 
      className="overlay flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-modal-title"
    >
      <div 
        className="bg-mandi-card border border-mandi-border rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 w-full max-w-md animate-slide-in-up sm:animate-fade-in max-h-[90dvh] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-clay-floating relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle indicator */}
        <div 
          onClick={handleClose}
          className="w-12 h-1.5 bg-mandi-border-light hover:bg-mandi-muted/60 rounded-full mx-auto mb-4 sm:hidden cursor-pointer"
          title="Dismiss"
        />

        <div className="flex items-center justify-between mb-5 sm:mb-6">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="bg-mandi-green-muted p-2.5 rounded-2xl shadow-clay-pill"><MapPin size={20} className="text-mandi-green" /></div>
            <div>
              <h2 id="location-modal-title" className="text-base sm:text-lg font-bold text-mandi-text">Set Delivery Location</h2>
              <p className="text-[11px] sm:text-xs text-mandi-muted">Palghar District, Maharashtra</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={handleClose} 
            className="w-8 h-8 rounded-full bg-mandi-surface border border-mandi-border hover:border-mandi-green/50 flex items-center justify-center text-mandi-muted hover:text-mandi-text transition-all active:scale-90 cursor-pointer shadow-clay-pill"
            aria-label="Close location selector"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Primary Action: Add Detailed Delivery Address */}
        <button
          type="button"
          onClick={handleAddNewAddress}
          className="w-full flex items-center justify-center gap-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-mandi-green border border-emerald-500/40 font-black py-3.5 px-4 rounded-2xl mb-4 transition-all active:scale-[0.98] shadow-clay-badge cursor-pointer"
        >
          <Plus size={18} />
          <span>Add Detailed Delivery Address</span>
        </button>

        {/* Saved Addresses List (if available) */}
        {savedAddresses.length > 0 && (
          <div className="mb-4">
            <p className="text-mandi-subtle text-xs mb-2 font-bold tracking-wide uppercase">Your Saved Addresses</p>
            <div className="space-y-2">
              {savedAddresses.map(addr => {
                const IconComp = addr.label === 'Work' ? Briefcase : addr.label === 'Home' ? Home : MapPin;
                const isSelected = activeSavedAddressId === addr.id;
                return (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => handleSelectSavedAddress(addr)}
                    className={`w-full flex items-center justify-between text-left p-3 rounded-2xl border transition-all active:scale-[0.99] cursor-pointer shadow-clay-badge ${
                      isSelected
                        ? 'bg-mandi-green/10 border-mandi-green'
                        : 'bg-mandi-surface border-mandi-border hover:border-mandi-green/40'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1 mr-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isSelected ? 'bg-mandi-green text-black' : 'bg-mandi-card text-mandi-muted'
                      }`}>
                        <IconComp size={15} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-xs font-bold text-mandi-text">{addr.label || 'Home'}</span>
                          {addr.isDefault && (
                            <span className="text-[9px] font-bold text-mandi-green bg-mandi-green/15 px-1.5 py-0.2 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-mandi-muted truncate">
                          {addr.line1 || addr.street}{addr.area ? `, ${addr.area}` : ''}
                        </p>
                      </div>
                    </div>
                    {isSelected && <Check size={16} className="text-mandi-green flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <button onClick={handleDetect} disabled={detecting} className="w-full flex items-center justify-center gap-3 border border-mandi-green text-mandi-green font-bold py-3.5 px-4 rounded-2xl mb-4 bg-mandi-surface hover:bg-mandi-green hover:text-black transition-all duration-200 disabled:opacity-50 shadow-clay-pill active:scale-[0.98]">
          <Navigation size={18} />
          <span>{detecting ? 'Detecting Virar Location...' : 'Use My Current Location'}</span>
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 border-t border-mandi-border" />
          <span className="text-mandi-subtle text-xs font-semibold tracking-wider">OR ENTER PINCODE</span>
          <div className="flex-1 border-t border-mandi-border" />
        </div>

        <form onSubmit={handleSubmit} className="mb-4">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mandi-subtle" />
            <input
              type="text"
              placeholder="e.g. 401305 or 401303"
              value={pincode}
              onChange={e => { setPincode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
              className="input-field pl-10"
              maxLength={6}
            />
          </div>
          {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
          <button type="submit" className="btn-primary w-full mt-3">Deliver to Virar</button>
        </form>

        <div>
          <p className="text-mandi-subtle text-xs mb-2 font-bold tracking-wide uppercase">Popular Virar Localities</p>
          <div className="grid grid-cols-2 gap-2">
            {popularVirarPincodes.map((p, idx) => (
              <button key={idx} onClick={() => { setLocationByPincode(p.code); addToast(`Delivery set: ${p.label}`, 'success'); }} className="text-left px-3 py-2.5 rounded-xl bg-mandi-surface border border-mandi-border hover:border-mandi-green transition-all shadow-clay-badge active:scale-95">
                <p className="text-mandi-text text-xs font-semibold truncate">{p.label}</p>
                <p className="text-mandi-subtle text-xs font-medium">{p.code}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Dismiss / Cancel Button */}
        <div className="mt-4 pt-3 border-t border-mandi-border/60">
          <button 
            type="button" 
            onClick={handleClose}
            className="w-full py-2.5 rounded-xl border border-mandi-border bg-mandi-surface/80 hover:bg-mandi-surface text-xs font-bold text-mandi-muted hover:text-mandi-text transition-all active:scale-[0.99] cursor-pointer"
          >
            Cancel & Keep Current Location
          </button>
        </div>
      </div>
    </div>
  );
}
