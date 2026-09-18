import { Link, useNavigate } from 'react-router-dom';
import { Zap, MapPin, Phone, Mail, Camera, MessageCircle, Share2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

/**
 * Smart navigation link for footer.
 * - Opens the login modal if the user is not logged in (for protected routes).
 * - Opens the login modal if the user lacks the required role.
 * - Smooth scroll-to-top is handled globally by ScrollToTop in App.jsx.
 */
function FooterNavLink({ to, label, requireAuth = false, allowedRoles = null }) {
  const { user, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const handleClick = (e) => {
    e.preventDefault();
    if (requireAuth && !user) {
      openAuthModal('login');
      return;
    }
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      openAuthModal('login');
      return;
    }
    navigate(to);
  };

  return (
    <a
      href={to}
      onClick={handleClick}
      className="text-mandi-muted text-sm hover:text-mandi-green transition-colors duration-200 flex items-center gap-1.5 group"
    >
      <ArrowRight
        size={12}
        className="opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all duration-200 text-mandi-green"
      />
      {label}
    </a>
  );
}

export default function Footer() {
  const { t } = useTranslation();
  const socialLinks = [
    { icon: Camera, href: '#', label: 'Instagram', color: 'hover:text-pink-400 hover:border-pink-400/40 hover:bg-pink-500/10' },
    { icon: MessageCircle, href: '#', label: 'WhatsApp', color: 'hover:text-green-400 hover:border-green-400/40 hover:bg-green-500/10' },
    { icon: Share2, href: '#', label: 'Twitter / X', color: 'hover:text-sky-400 hover:border-sky-400/40 hover:bg-sky-500/10' },
  ];

  return (
    <footer className="relative bg-mandi-card border-t border-mandi-border mt-16 mb-16 md:mb-0 overflow-hidden">
      {/* Subtle dot pattern background */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, #2A2A2A 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      />
      {/* Top green glow accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-px bg-gradient-to-r from-transparent via-mandi-green/40 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4 group w-fit">
              <div className="w-10 h-10 bg-mandi-green rounded-xl flex items-center justify-center shadow-green glow-green-sm group-hover:glow-green transition-all duration-300">
                <Zap size={22} className="text-black" fill="black" />
              </div>
              <div>
                <span className="text-xl font-black text-gradient-green">Mandi</span>
                <span className="text-xl font-black text-mandi-text"> Minutes</span>
              </div>
            </Link>
            <p className="text-mandi-muted text-sm leading-relaxed mb-5">
              {t('footer.tagline')}
            </p>
            <div className="flex gap-2.5">
              {socialLinks.map(({ icon: Icon, href, label, color }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className={`w-9 h-9 bg-mandi-surface border border-mandi-border rounded-lg flex items-center justify-center text-mandi-muted transition-all duration-200 ${color}`}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-mandi-text font-bold mb-4 text-sm uppercase tracking-wider">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2.5">
              <li><FooterNavLink to="/" label={t('footer.links.home')} /></li>
              <li><FooterNavLink to="/search" label={t('footer.links.browseProducts')} /></li>
              <li><FooterNavLink to="/orders"   label={t('footer.links.myOrders')}  requireAuth /></li>
              <li><FooterNavLink to="/wishlist" label={t('footer.links.wishlist')}   requireAuth /></li>
              <li><FooterNavLink to="/about"   label={t('footer.links.aboutUs')} /></li>
            </ul>
          </div>

          {/* Partners */}
          <div>
            <h3 className="text-mandi-text font-bold mb-4 text-sm uppercase tracking-wider">{t('footer.forPartners')}</h3>
            <ul className="space-y-2.5">
              <li><FooterNavLink to="/vendor-onboarding" label={t('footer.links.becomeVendor')} /></li>
              <li><FooterNavLink to="/vendor" label={t('footer.links.vendorDashboard')} requireAuth allowedRoles={['vendor', 'admin']} /></li>
              <li><FooterNavLink to="/rider"  label={t('footer.links.riderPortal')}     requireAuth allowedRoles={['rider', 'admin']} /></li>
              <li><FooterNavLink to="/admin"  label={t('footer.links.adminPanel')}      requireAuth allowedRoles={['admin']} /></li>
              <li><FooterNavLink to="/contact" label={t('footer.links.contactUs')} /></li>
              <li><FooterNavLink to="/privacy" label={t('footer.links.privacyPolicy')} /></li>
              <li><FooterNavLink to="/terms"   label={t('footer.links.termsOfService')} /></li>
            </ul>
          </div>

          {/* Contact & App */}
          <div>
            <h3 className="text-mandi-text font-bold mb-4 text-sm uppercase tracking-wider">{t('footer.contact')}</h3>
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-2.5 text-mandi-muted text-sm">
                <MapPin size={15} className="text-mandi-green flex-shrink-0 mt-0.5" />
                <span>Cyber Hub, DLF, Gurugram, Haryana 122002</span>
              </div>
              <a href="tel:+919920941603" className="flex items-center gap-2.5 text-mandi-muted text-sm hover:text-mandi-green transition-colors group">
                <Phone size={15} className="text-mandi-green flex-shrink-0 group-hover:drop-shadow-green" />
                <span>+91 99209 41603</span>
              </a>
              <a href="mailto:hello@mandiminutes.com" className="flex items-center gap-2.5 text-mandi-muted text-sm hover:text-mandi-green transition-colors group">
                <Mail size={15} className="text-mandi-green flex-shrink-0 group-hover:drop-shadow-green" />
                <span>hello@mandiminutes.com</span>
              </a>
            </div>

            {/* App store badges */}
            <p className="text-mandi-subtle text-xs mb-2.5 font-medium">{t('footer.downloadApp')}</p>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 bg-mandi-surface border border-mandi-border rounded-xl px-3 py-2 cursor-pointer hover:border-mandi-green transition-all duration-200 group">
                <span className="text-base">🍎</span>
                <div>
                  <p className="text-mandi-subtle text-[9px] leading-none">{t('footer.downloadOn')}</p>
                  <p className="text-mandi-text text-xs font-bold leading-tight group-hover:text-mandi-green transition-colors">App Store</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-mandi-surface border border-mandi-border rounded-xl px-3 py-2 cursor-pointer hover:border-mandi-green transition-all duration-200 group">
                <span className="text-base">🤖</span>
                <div>
                  <p className="text-mandi-subtle text-[9px] leading-none">{t('footer.getItOn')}</p>
                  <p className="text-mandi-text text-xs font-bold leading-tight group-hover:text-mandi-green transition-colors">Play Store</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-mandi-border mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-mandi-subtle text-sm">
            &copy; 2026 <span className="text-mandi-green font-semibold">Mandi Minutes</span>. {t('footer.rights')}
          </p>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="text-mandi-subtle text-sm hover:text-mandi-green transition-colors">Terms</Link>
            <Link to="/privacy" className="text-mandi-subtle text-sm hover:text-mandi-green transition-colors">Privacy</Link>
            <Link to="/contact" className="text-mandi-subtle text-sm hover:text-mandi-green transition-colors">FAQ</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
