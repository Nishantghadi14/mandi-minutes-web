import { useState } from 'react';
import { X, Gift, Copy, Check, MessageCircle, Share2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from './Toast';

export default function ReferralModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const referralCode = user?.referralCode || (user ? `MANDI-${user.id.slice(0, 4).toUpperCase()}-${user.id.slice(-4).toUpperCase()}` : 'MANDI-VIRAR-50');
  const shareText = `Hey! Order fresh groceries, Gokul milk, rice & daily staples from local Kirana stores in Virar with 10-15 min delivery on Mandi Minutes! 🛒🛵\n\nUse my referral code: *${referralCode}* to get ₹50 OFF on your first order!\n\nOrder here: ${window.location.origin}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    addToast('Referral code copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4">
      <div className="card max-w-md w-full p-6 space-y-5 relative bg-mandi-card border-mandi-border overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 text-mandi-muted hover:text-mandi-text z-10">
          <X size={18} />
        </button>

        <div className="text-center space-y-2 pt-2">
          <div className="w-16 h-16 bg-gradient-to-tr from-mandi-green to-[#25D366] rounded-2xl flex items-center justify-center mx-auto shadow-green">
            <Gift size={32} className="text-black" />
          </div>
          <h2 className="text-xl font-black text-mandi-text">Refer & Earn ₹50</h2>
          <p className="text-mandi-muted text-xs leading-relaxed max-w-xs mx-auto">
            Invite friends in Virar to Mandi Minutes. They get ₹50 off on their first order, and you get ₹50 off when they order!
          </p>
        </div>

        <div className="bg-mandi-surface rounded-2xl p-4 border border-mandi-border space-y-2">
          <span className="text-[11px] font-semibold text-mandi-subtle block text-center uppercase tracking-wider">
            Your Unique Referral Code
          </span>
          <div className="flex items-center justify-between bg-mandi-card rounded-xl px-4 py-2.5 border border-mandi-border">
            <span className="font-mono font-black text-mandi-green text-base tracking-wider">
              {referralCode}
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs font-semibold text-mandi-text hover:text-mandi-green transition-colors py-1 px-2.5 rounded-lg bg-mandi-surface border border-mandi-border"
            >
              {copied ? <Check size={14} className="text-mandi-green" /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          <button
            onClick={handleWhatsAppShare}
            className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-black font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md"
          >
            <MessageCircle size={18} /> Share via WhatsApp
          </button>
          <button
            onClick={handleCopy}
            className="w-full py-2.5 px-4 rounded-xl btn-outline text-xs flex items-center justify-center gap-2"
          >
            <Share2 size={14} /> Copy Invite Link & Code
          </button>
        </div>

        <div className="border-t border-mandi-border pt-4 space-y-2">
          <p className="text-[11px] font-bold text-mandi-subtle uppercase tracking-wider">How it works</p>
          <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-mandi-muted">
            <div className="bg-mandi-surface p-2 rounded-xl border border-mandi-border">
              <span className="text-mandi-green font-bold block mb-0.5">1. Share</span>
              Send code to friends in Virar
            </div>
            <div className="bg-mandi-surface p-2 rounded-xl border border-mandi-border">
              <span className="text-mandi-green font-bold block mb-0.5">2. They Order</span>
              Friend gets ₹50 off on 1st order
            </div>
            <div className="bg-mandi-surface p-2 rounded-xl border border-mandi-border">
              <span className="text-mandi-green font-bold block mb-0.5">3. You Earn</span>
              Get ₹50 discount on your next order
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
