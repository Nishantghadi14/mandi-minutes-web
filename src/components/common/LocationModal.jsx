import { useState } from 'react';
import { MapPin, Navigation, X, Search } from 'lucide-react';
import { useLocation } from '../../context/LocationContext';
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
  const { locationModal, setLocationModal, setLocationByPincode, detectLocation, location } = useLocation();
  const { addToast } = useToast();
  const [pincode, setPincode] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState('');

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
    <div className="overlay flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-mandi-card border border-mandi-border rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 w-full max-w-md animate-slide-in-up sm:animate-fade-in max-h-[90dvh] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl">
        {/* Mobile drag handle indicator */}
        <div className="w-12 h-1.5 bg-mandi-border-light rounded-full mx-auto mb-4 sm:hidden" />

        <div className="flex items-center justify-between mb-5 sm:mb-6">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="bg-mandi-green-muted p-2 rounded-xl"><MapPin size={20} className="text-mandi-green" /></div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-mandi-text">Set Delivery Location</h2>
              <p className="text-[11px] sm:text-xs text-mandi-muted">Palghar District, Maharashtra</p>
            </div>
          </div>
          {location && <button onClick={() => setLocationModal(false)} className="text-mandi-subtle hover:text-mandi-text transition-colors p-1.5 active:scale-90"><X size={18} /></button>}
        </div>

        <button onClick={handleDetect} disabled={detecting} className="w-full flex items-center gap-3 border border-mandi-green text-mandi-green font-semibold py-3 px-4 rounded-xl mb-4 hover:bg-mandi-green hover:text-black transition-all duration-200 disabled:opacity-50">
          <Navigation size={18} />
          <span>{detecting ? 'Detecting Virar Location...' : 'Use My Current Location'}</span>
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 border-t border-mandi-border" />
          <span className="text-mandi-subtle text-xs">OR ENTER PINCODE</span>
          <div className="flex-1 border-t border-mandi-border" />
        </div>

        <form onSubmit={handleSubmit} className="mb-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mandi-subtle" />
            <input
              type="text"
              placeholder="e.g. 401305 or 401303"
              value={pincode}
              onChange={e => { setPincode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
              className="input-field pl-9"
              maxLength={6}
            />
          </div>
          {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
          <button type="submit" className="btn-primary w-full mt-3">Deliver to Virar</button>
        </form>

        <div>
          <p className="text-mandi-subtle text-xs mb-2 font-medium">Popular Virar Localities</p>
          <div className="grid grid-cols-2 gap-2">
            {popularVirarPincodes.map((p, idx) => (
              <button key={idx} onClick={() => { setLocationByPincode(p.code); addToast(`Delivery set: ${p.label}`, 'success'); }} className="text-left px-3 py-2 rounded-lg bg-mandi-surface border border-mandi-border hover:border-mandi-green transition-colors">
                <p className="text-mandi-text text-xs font-medium truncate">{p.label}</p>
                <p className="text-mandi-subtle text-xs">{p.code}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
