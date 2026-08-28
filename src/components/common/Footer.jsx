import { Link } from 'react-router-dom';
import { Zap, MapPin, Phone, Mail, Globe, MessageCircle, Share2, Store } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-mandi-card border-t border-mandi-border mt-16 mb-16 md:mb-0">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-mandi-green rounded-xl flex items-center justify-center"><Zap size={22} className="text-black" fill="black" /></div>
              <div><span className="text-xl font-black text-gradient-green">Mandi</span><span className="text-xl font-black text-mandi-text"> Minutes</span></div>
            </div>
            <p className="text-mandi-muted text-sm leading-relaxed mb-4">Connecting you with your nearest kirana stores for ultrafast grocery delivery. Fresh, local, and delivered in minutes.</p>
            <div className="flex gap-3">
              {[Globe, MessageCircle, Share2].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 bg-mandi-surface border border-mandi-border rounded-lg flex items-center justify-center hover:border-mandi-green hover:text-mandi-green text-mandi-muted transition-all">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-mandi-text font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2.5">
              {[{to:'/',label:'Home'},{to:'/search',label:'Browse Products'},{to:'/orders',label:'My Orders'},{to:'/wishlist',label:'Wishlist'},{to:'/about',label:'About Us'}].map(l=>(
                <li key={l.to}><Link to={l.to} className="text-mandi-muted text-sm hover:text-mandi-green transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Partner */}
          <div>
            <h3 className="text-mandi-text font-semibold mb-4">For Partners & Riders</h3>
            <ul className="space-y-2.5">
              {[{to:'/vendor-onboarding',label:'Become a Vendor'},{to:'/vendor',label:'Vendor Dashboard'},{to:'/rider',label:'Delivery Rider Portal'},{to:'/admin',label:'Admin Panel'},{to:'/about',label:'How It Works'},{to:'/contact',label:'Contact Us'},{to:'/privacy',label:'Privacy Policy'}].map(l=>(
                <li key={l.to}><Link to={l.to} className="text-mandi-muted text-sm hover:text-mandi-green transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-mandi-text font-semibold mb-4">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-mandi-muted text-sm"><MapPin size={15} className="text-mandi-green flex-shrink-0" /><span>Cyber Hub, DLF, Gurugram, Haryana 122002</span></div>
              <div className="flex items-center gap-2 text-mandi-muted text-sm"><Phone size={15} className="text-mandi-green flex-shrink-0" /><span>+91 99209 41603</span></div>
              <div className="flex items-center gap-2 text-mandi-muted text-sm"><Mail size={15} className="text-mandi-green flex-shrink-0" /><span>hello@mandiminutes.com</span></div>
            </div>
            <div className="mt-4">
              <p className="text-mandi-muted text-xs mb-2">Download App (Coming Soon)</p>
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5 bg-mandi-surface border border-mandi-border rounded-lg px-3 py-2 cursor-pointer hover:border-mandi-green transition-colors">
                  <span className="text-mandi-text text-xs font-medium">App Store</span>
                </div>
                <div className="flex items-center gap-1.5 bg-mandi-surface border border-mandi-border rounded-lg px-3 py-2 cursor-pointer hover:border-mandi-green transition-colors">
                  <span className="text-mandi-text text-xs font-medium">Play Store</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-mandi-border mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-mandi-subtle text-sm">&copy; 2026 Mandi Minutes. All rights reserved.</p>
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
