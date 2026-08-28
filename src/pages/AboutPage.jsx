import { Helmet } from 'react-helmet-async';
import { Zap, Store, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <Helmet>
        <title>About Us — Mandi Minutes Kirana Delivery Virar</title>
        <meta name="description" content="Empowering Virar Kirana store owners with digital quick-commerce capabilities. 10-20 min deliveries directly from local neighborhood shops in Palghar district." />
        <meta property="og:title" content="About Mandi Minutes — Hyperlocal Virar Kirana Delivery" />
        <meta property="og:description" content="Connecting local grocery shops with residents across Virar West and Virar East." />
      </Helmet>

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="w-14 h-14 bg-mandi-green rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Zap size={32} className="text-black" fill="black" />
        </div>
        <h1 className="text-4xl font-black text-mandi-text mb-3">About <span className="text-gradient-green">Mandi Minutes</span></h1>
        <p className="text-mandi-muted text-base leading-relaxed">Empowering local Kirana stores with lightning-fast quick commerce capabilities. Bringing neighborhood freshness directly to your doorstep in 10-20 minutes.</p>
      </div>

      {/* Mission */}
      <div className="card p-8 mb-8 bg-gradient-to-br from-mandi-card via-[#162916] to-mandi-card border-mandi-green border-opacity-30">
        <h2 className="text-2xl font-bold text-mandi-text mb-3">Our Mission</h2>
        <p className="text-mandi-muted leading-relaxed text-sm md:text-base">
          India's millions of neighborhood Kirana store owners have been the backbone of Indian retail for generations. Mandi Minutes bridges the gap between traditional Kirana trust and modern quick-commerce expectations. We enable local shopkeepers to list their inventory digitally and serve their immediate pincodes in minutes.
        </p>
      </div>

      {/* Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {[
          { icon: Zap, title: 'Hyperlocal Speed', desc: 'Orders are fulfilled from stores located within 1-2 km of your location for ultra-fast delivery.' },
          { icon: Store, title: 'Kirana Empowerment', desc: 'We provide shopkeepers with intuitive digital tools to manage stock, pricing, and orders effortlessly.' },
          { icon: Heart, title: 'Fresh & Authentic', desc: 'No warehouse storage delays. Get farm-fresh produce and daily dairy items sourced that very morning.' },
        ].map(item => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="card p-6">
              <div className="w-10 h-10 bg-mandi-green-muted rounded-xl flex items-center justify-center mb-4">
                <Icon size={20} className="text-mandi-green" />
              </div>
              <h3 className="text-mandi-text font-bold text-base mb-2">{item.title}</h3>
              <p className="text-mandi-muted text-xs leading-relaxed">{item.desc}</p>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="card p-8 text-center bg-mandi-surface border-mandi-border">
        <h2 className="text-xl font-bold text-mandi-text mb-2">Want to partner your store with us?</h2>
        <p className="text-mandi-muted text-sm mb-6">Join hundreds of verified Kirana vendors already growing their daily revenue.</p>
        <Link to="/vendor-onboarding" className="btn-primary inline-flex items-center gap-2">Become a Vendor Partner</Link>
      </div>
    </div>
  );
}
