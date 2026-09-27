import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { useData } from '../context/DataContext';
import { useToast } from '../components/common/Toast';
import ReferralModal from '../components/common/ReferralModal';
import {
  User, Package, Heart, ShoppingCart, MapPin, Gift,
  Moon, Sun, Globe, Shield, Store, Bike, Phone,
  MessageCircle, HelpCircle, FileText, Lock, ChevronRight,
  LogOut, Zap, Check, ArrowRight, Sparkles, ExternalLink
} from 'lucide-react';

export default function ProfilePage() {
  const { user, logout, openAuthModal } = useAuth();
  const { location, setLocationModal } = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const { itemCount, setIsOpen } = useCart();
  const { orders = [] } = useData();
  const { addToast } = useToast();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [referralOpen, setReferralOpen] = useState(false);

  // User past orders count
  const userOrders = user
    ? orders.filter(o => o.customerId === user.id || o.customerEmail === user.email)
    : [];

  const wishlistCount = user?.wishlist?.length || 0;

  const handleLogout = () => {
    logout();
    addToast('Logged out successfully', 'info');
    navigate('/');
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
    user.email?.toLowerCase() === 'admin@mandi.in' ||
    user.email?.toLowerCase() === 'test3@gmail.com'
  );

  const isVendor = user && (user.role === 'vendor' || isAdmin);

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 pb-24 md:pb-12">
      <Helmet>
        <title>Account & Settings — Mandi Minutes</title>
        <meta name="description" content="Manage your Mandi Minutes account, view orders, wishlist, delivery address, and app preferences." />
      </Helmet>

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

      {/* ─── Current Delivery Location Bar ─── */}
      <div className="card p-4 mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-mandi-surface border border-mandi-border flex items-center justify-center flex-shrink-0">
            <MapPin size={17} className="text-mandi-green" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-mandi-subtle font-medium">Delivery Address</p>
            <p className="text-mandi-text font-semibold text-xs sm:text-sm truncate">
              {location ? `${location.area} (${location.pincode})` : 'Set your delivery location'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setLocationModal(true)}
          className="text-xs font-bold text-mandi-green hover:underline flex-shrink-0 px-2.5 py-1.5 rounded-lg bg-mandi-green/10 hover:bg-mandi-green/20 transition-all"
        >
          Change
        </button>
      </div>

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
