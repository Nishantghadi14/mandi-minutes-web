import { Helmet } from 'react-helmet-async';
import { Shield, Lock, FileText, CheckCircle2, Phone, Mail } from 'lucide-react';

export function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <Helmet>
        <title>Privacy Policy — Mandi Minutes</title>
        <meta name="description" content="Learn how Mandi Minutes collects, protects, and uses your personal and grocery order data across Virar." />
        <meta property="og:title" content="Privacy Policy | Mandi Minutes" />
      </Helmet>

      <div className="flex items-center gap-2 mb-6">
        <Lock size={24} className="text-mandi-green" />
        <h1 className="text-3xl font-black text-mandi-text">Privacy Policy</h1>
      </div>
      <div className="card p-6 sm:p-8 space-y-5 text-mandi-muted text-sm leading-relaxed">
        <p className="text-xs text-mandi-subtle">Last updated: October 2026</p>
        
        <section className="space-y-2">
          <h2 className="text-mandi-text font-bold text-base">1. Information We Collect</h2>
          <p>Mandi Minutes collects only the information necessary to fulfill your hyperlocal grocery orders and provide seamless customer service:</p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-xs sm:text-sm">
            <li><strong>Personal Contact:</strong> Full name, mobile number, and email address.</li>
            <li><strong>Delivery Location:</strong> Street address, landmark, building number, and postal pincode.</li>
            <li><strong>Order History:</strong> Products purchased, quantities, timestamps, and preferred payment mode.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-mandi-text font-bold text-base">2. How Your Information is Used</h2>
          <p>Your details are strictly used to fulfill and track neighborhood grocery deliveries:</p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-xs sm:text-sm">
            <li>Dispatching orders to the partner Kirana store in your area.</li>
            <li>Coordinating delivery drops with assigned neighborhood delivery riders.</li>
            <li>Sending live status updates via SMS, Push notifications, and WhatsApp.</li>
            <li>Preventing fraudulent orders and maintaining account security.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-mandi-text font-bold text-base">3. Zero Third-Party Data Selling</h2>
          <p>We do NOT sell, rent, or trade your personal information to third-party advertisers. All payment credentials are processed directly through secure, RBI-authorized payment aggregators.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-mandi-text font-bold text-base">4. Grievance Redressal</h2>
          <p>If you have any questions regarding your personal data or privacy rights, please contact our designated Grievance Officer:</p>
          <div className="bg-mandi-surface p-3.5 rounded-xl border border-mandi-border text-xs space-y-1">
            <p><strong>Grievance Officer:</strong> Compliance Team, Mandi Minutes</p>
            <p><strong>Email:</strong> support@mandiminutes.com</p>
            <p><strong>Phone:</strong> +91 99209 41603 (Mon – Sun, 9:00 AM – 9:00 PM IST)</p>
            <p><strong>Address:</strong> Virar West, Palghar District, Maharashtra 401303</p>
          </div>
        </section>
      </div>
    </div>
  );
}

export function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <Helmet>
        <title>Terms & Conditions — Mandi Minutes</title>
        <meta name="description" content="Read the terms of service, delivery policies, return windows, and user agreement for Mandi Minutes grocery platform." />
        <meta property="og:title" content="Terms & Conditions | Mandi Minutes" />
      </Helmet>

      <div className="flex items-center gap-2 mb-6">
        <Shield size={24} className="text-mandi-green" />
        <h1 className="text-3xl font-black text-mandi-text">Terms & Conditions</h1>
      </div>
      <div className="card p-6 sm:p-8 space-y-5 text-mandi-muted text-sm leading-relaxed">
        <p className="text-xs text-mandi-subtle">Last updated: October 2026</p>

        <section className="space-y-2">
          <h2 className="text-mandi-text font-bold text-base">1. Platform Services & Delivery SLAs</h2>
          <p>Mandi Minutes acts as a digital marketplace enabling customers to order grocery staples from verified neighborhood Kirana stores in Virar.</p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-xs sm:text-sm">
            <li><strong>Next-Day Delivery Drops:</strong> Orders placed for morning delivery are delivered between 7:00 AM and 11:00 AM.</li>
            <li><strong>Delivery Charges:</strong> FREE delivery on orders over ₹199. Orders below ₹199 carry a nominal delivery fee of ₹20.</li>
            <li><strong>Service Area:</strong> Deliveries are limited to verified serviceable pincodes in Virar East and Virar West.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-mandi-text font-bold text-base">2. Returns, Refunds & Cancellations</h2>
          <ul className="list-disc list-inside space-y-1 pl-2 text-xs sm:text-sm">
            <li><strong>Inspection at Doorstep:</strong> Customers are encouraged to verify packaged groceries and grain seals upon delivery.</li>
            <li><strong>Damaged or Incorrect Items:</strong> If any item is damaged, defective, or missing, report it within 24 hours via the Support tab or WhatsApp (+91 99209 41603) for an immediate replacement or full refund.</li>
            <li><strong>Refund Timeline:</strong> Online payment refunds are processed back to the original payment source within 3–5 banking days. Cash on delivery orders are refunded via direct UPI.</li>
            <li><strong>Order Cancellation:</strong> Orders can be cancelled free of charge prior to the Kirana store accepting and packing the items.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-mandi-text font-bold text-base">3. Kirana Partner Standards</h2>
          <p>All partnering Kirana stores agree to maintain accurate weight measurements, non-expired goods, FSSAI hygiene standards, and price fairness aligned with retail maximum retail prices (MRP).</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-mandi-text font-bold text-base">4. Contact & Disputes</h2>
          <p>For any service discrepancies or order escalations, reach our 24x7 customer support via email at <strong>support@mandiminutes.com</strong> or phone at <strong>+91 99209 41603</strong>.</p>
        </section>
      </div>
    </div>
  );
}
