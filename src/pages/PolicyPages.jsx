import { Shield, Lock } from 'lucide-react';

export function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="flex items-center gap-2 mb-6">
        <Lock size={24} className="text-mandi-green" />
        <h1 className="text-3xl font-black text-mandi-text">Privacy Policy</h1>
      </div>
      <div className="card p-8 space-y-4 text-mandi-muted text-sm leading-relaxed">
        <p>Last updated: August 2026</p>
        <h2 className="text-mandi-text font-bold text-base pt-2">1. Information We Collect</h2>
        <p>Mandi Minutes collects information necessary to fulfill your hyperlocal grocery orders, including your phone number, delivery address, and pincode location.</p>
        <h2 className="text-mandi-text font-bold text-base pt-2">2. How We Use Information</h2>
        <p>Your delivery address and mobile contact are shared only with the specific Kirana store owner and assigned delivery rider for order fulfillment.</p>
        <h2 className="text-mandi-text font-bold text-base pt-2">3. Data Security</h2>
        <p>We implement strict encryption protocols for all payment transactions and user authentication sessions.</p>
      </div>
    </div>
  );
}

export function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="flex items-center gap-2 mb-6">
        <Shield size={24} className="text-mandi-green" />
        <h1 className="text-3xl font-black text-mandi-text">Terms & Conditions</h1>
      </div>
      <div className="card p-8 space-y-4 text-mandi-muted text-sm leading-relaxed">
        <p>Last updated: August 2026</p>
        <h2 className="text-mandi-text font-bold text-base pt-2">1. Delivery SLAs</h2>
        <p>Express 10-20 minute delivery estimates are subject to local traffic and weather conditions in the specified pincode.</p>
        <h2 className="text-mandi-text font-bold text-base pt-2">2. Returns & Refunds</h2>
        <p>Fresh items (dairy, produce, bread) can be inspected at time of delivery. Returns for damaged or wrong items are processed instantly via support.</p>
        <h2 className="text-mandi-text font-bold text-base pt-2">3. Vendor Obligations</h2>
        <p>Partner Kirana stores agree to maintain accurate pricing, stock levels, and store hygiene standards.</p>
      </div>
    </div>
  );
}
