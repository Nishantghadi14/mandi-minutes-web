import { Helmet } from 'react-helmet-async';
import { Shield, Lock, Clock, Truck, FileText, CheckCircle2, Mail } from 'lucide-react';

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
        <h1 className="text-2xl sm:text-3xl font-black text-mandi-text">Privacy Policy</h1>
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
            <p><strong>In-App Support:</strong> Available 24x7 via the Customer Support tab</p>
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
        <h1 className="text-2xl sm:text-3xl font-black text-mandi-text">Terms & Conditions</h1>
      </div>

      <div className="card p-6 sm:p-8 space-y-6 text-mandi-muted text-sm leading-relaxed">
        <div className="flex items-center justify-between pb-4 border-b border-mandi-border/60 flex-wrap gap-2">
          <p className="text-xs text-mandi-subtle">Effective Date: October 2026 • Virar, Palghar Region</p>
          <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
            Verified E-Commerce Policy
          </span>
        </div>

        {/* 1. Introduction & Acceptance */}
        <section className="space-y-2">
          <h2 className="text-mandi-text font-bold text-base flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-500/15 text-mandi-green flex items-center justify-center text-xs font-black">1</span>
            Introduction &amp; Acceptance of Terms
          </h2>
          <p>
            Welcome to <strong>Mandi Minutes</strong> (&ldquo;Platform&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), an online hyperlocal quick-commerce marketplace connecting consumers with verified neighborhood Kirana stores, grocery merchants, and independent delivery partners in Virar and surrounding regions (Palghar District, Maharashtra).
          </p>
          <p>
            By accessing, downloading, registering, or browsing the Mandi Minutes app or website, or by placing an order as a registered user or guest, you (&ldquo;User&rdquo;, &ldquo;Customer&rdquo;, &ldquo;you&rdquo;) agree to be bound by these <strong>Terms &amp; Conditions</strong>, our <strong>Privacy Policy</strong>, and all applicable Indian laws, including the <strong>Information Technology Act, 2000</strong> and the <strong>Consumer Protection (E-Commerce) Rules, 2020</strong>.
          </p>
        </section>

        {/* 2. Eligibility & Account */}
        <section className="space-y-2">
          <h2 className="text-mandi-text font-bold text-base flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-500/15 text-mandi-green flex items-center justify-center text-xs font-black">2</span>
            Eligibility &amp; Account Registration
          </h2>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs sm:text-sm">
            <li><strong>Age Requirement:</strong> You must be at least 18 years of age and legally competent to enter into a binding contract under the Indian Contract Act, 1872. Minors may use the Platform only under the guidance and consent of a parent or legal guardian.</li>
            <li><strong>Account Integrity:</strong> To access features such as live tracking, saved delivery addresses, and coupons, you may register via your mobile phone number (OTP verification) or email. You agree to provide accurate and complete details.</li>
            <li><strong>Account Confidentiality:</strong> You are solely responsible for maintaining the confidentiality of your account credentials and One-Time Passwords (OTPs).</li>
            <li><strong>Guest Mode:</strong> Guest users browsing or checking out without creating an account remain subject to these Terms for all orders placed.</li>
          </ul>
        </section>

        {/* 3. Marketplace Model */}
        <section className="space-y-2">
          <h2 className="text-mandi-text font-bold text-base flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-500/15 text-mandi-green flex items-center justify-center text-xs font-black">3</span>
            Platform Role &amp; Marketplace Model
          </h2>
          <p>
            Mandi Minutes operates as an <strong>e-commerce marketplace facilitator</strong> under Section 79 of the Information Technology Act, 2000. The contract of sale for any grocery, daily staple, or FMCG item is strictly bipartite between the customer and the respective local Kirana merchant (&ldquo;Vendor&rdquo;) fulfilling the order. Delivery services are performed by registered delivery partners (&ldquo;Riders&rdquo;) providing point-to-point transit from local stores to your doorstep.
          </p>
        </section>

        {/* 4. Ordering & Delivery SLAs */}
        <section className="space-y-2">
          <h2 className="text-mandi-text font-bold text-base flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-500/15 text-mandi-green flex items-center justify-center text-xs font-black">4</span>
            Ordering, Delivery Slots &amp; Service Areas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-2">
            <div className="p-3 rounded-xl bg-mandi-surface border border-mandi-border">
              <div className="flex items-center gap-1.5 text-xs font-bold text-mandi-text mb-1">
                <Truck size={14} className="text-emerald-400" />
                <span>⚡ Instant Express Delivery (10–15 min)</span>
              </div>
              <p className="text-[11px] text-mandi-subtle">
                Dispatched immediately from neighborhood Kirana stores. Expected transit times are subject to local traffic and weather conditions.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-mandi-surface border border-mandi-border">
              <div className="flex items-center gap-1.5 text-xs font-bold text-mandi-text mb-1">
                <Clock size={14} className="text-blue-400" />
                <span>🌅 Scheduled Morning Slots (7–11 AM)</span>
              </div>
              <p className="text-[11px] text-mandi-subtle">
                Order tonight and receive fresh milk, vegetables &amp; kitchen staples at your doorstep right before breakfast.
              </p>
            </div>
          </div>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs sm:text-sm">
            <li><strong>Serviceable Areas:</strong> Deliveries are limited to verified serviceable pincodes in Palghar District, Maharashtra (including Virar West 401305, Virar East 401303, Nallasopara 401301, and adjoining areas).</li>
            <li><strong>Minimum Order Value:</strong> ₹99 per order.</li>
            <li><strong>Delivery Charges:</strong> <strong>FREE Delivery</strong> on orders of ₹199 or more. A nominal delivery fee of ₹20 applies to orders below ₹199.</li>
          </ul>
        </section>

        {/* 5. Pricing & Inventory */}
        <section className="space-y-2">
          <h2 className="text-mandi-text font-bold text-base flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-500/15 text-mandi-green flex items-center justify-center text-xs font-black">5</span>
            Pricing, Inventory &amp; Loose Staples
          </h2>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs sm:text-sm">
            <li><strong>MRP Compliance:</strong> All packaged goods are sold at or below Maximum Retail Price (MRP) in accordance with the Legal Metrology (Packaged Commodities) Rules, 2011. APMC wholesale staples (dals, rice, grains, pulses) are priced based on verified mill rates.</li>
            <li><strong>Stock Discrepancies:</strong> If an ordered item becomes unavailable due to unexpected stock-outs, customer support will promptly assist with a replacement or full refund.</li>
            <li><strong>Weight-Based Loose Staples:</strong> For items sold by weight, partner Kirana stores must use certified, stamped digital scales in compliance with legal metrology standards.</li>
          </ul>
        </section>

        {/* 6. Payments & Billing */}
        <section className="space-y-2">
          <h2 className="text-mandi-text font-bold text-base flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-500/15 text-mandi-green flex items-center justify-center text-xs font-black">6</span>
            Payment Methods &amp; Security
          </h2>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs sm:text-sm">
            <li><strong>Accepted Modes:</strong> Instant UPI (GPay, PhonePe, Paytm, BHIM), Credit/Debit Cards, Net Banking, and Cash on Delivery (COD).</li>
            <li><strong>RBI Compliance:</strong> Online transactions are processed through encrypted, PCI-DSS certified, RBI-authorized payment aggregators. Mandi Minutes never stores your card CVV or bank passwords.</li>
            <li><strong>Digital Invoices:</strong> An itemized digital bill receipt is generated for every order and is downloadable from the app.</li>
          </ul>
        </section>

        {/* 7. Returns & 4-Hour Window */}
        <section className="space-y-2">
          <h2 className="text-mandi-text font-bold text-base flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-500/15 text-mandi-green flex items-center justify-center text-xs font-black">7</span>
            Cancellations, Returns &amp; 4-Hour Inspection Window
          </h2>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs sm:text-sm">
            <li><strong>Order Cancellation:</strong> You may cancel an order free of charge at any time <em>before</em> the merchant confirms acceptance and commences packing.</li>
            <li><strong>4-Hour Return Window:</strong> If any grocery item is received damaged, leaking, expired, missing, or defective, report it within <strong>4 hours</strong> of delivery through the in-app <strong>Customer Support</strong> center or via email to <strong>support@mandiminutes.com</strong> with an item description and photo for an immediate replacement or full refund.</li>
            <li><strong>Refund Timeline:</strong> Prepaid orders (UPI/Card/Net Banking) are refunded to the original payment source within <strong>3 to 5 business banking days</strong>. Cash on Delivery orders are refunded via direct UPI.</li>
          </ul>
        </section>

        {/* 8. Food Safety & FSSAI */}
        <section className="space-y-2">
          <h2 className="text-mandi-text font-bold text-base flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-500/15 text-mandi-green flex items-center justify-center text-xs font-black">8</span>
            Food Safety &amp; Hygiene Standards (FSSAI)
          </h2>
          <p>
            Partner Kirana stores agree to strictly adhere to the <strong>Food Safety and Standards Act, 2006 (FSSAI)</strong>, maintaining clean storage, proper pest control, and non-expired packaged inventory.
          </p>
        </section>

        {/* 9. Respect Policy */}
        <section className="space-y-2">
          <h2 className="text-mandi-text font-bold text-base flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-500/15 text-mandi-green flex items-center justify-center text-xs font-black">9</span>
            Customer Conduct &amp; Respect for Delivery Partners
          </h2>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs sm:text-sm">
            <li><strong>Zero-Tolerance Harassment Policy:</strong> We enforce strict zero-tolerance towards verbal abuse, threats, or discrimination directed against our neighborhood delivery riders or store merchants.</li>
            <li><strong>Fair Promotion Use:</strong> Introductory promo codes (e.g., <code>MANDI50</code>, <code>FREESHIP</code>) and referral benefits are limited to one per household. Misuse or automated scraping will lead to account restrictions.</li>
            <li><strong>Fake Orders:</strong> Repeated unjustified refusal of Cash on Delivery orders may lead to the suspension of COD privileges.</li>
          </ul>
        </section>

        {/* 10. Intellectual Property */}
        <section className="space-y-2">
          <h2 className="text-mandi-text font-bold text-base flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-500/15 text-mandi-green flex items-center justify-center text-xs font-black">10</span>
            Intellectual Property Rights
          </h2>
          <p>
            All trademarks, logos, visual designs, audio chimes, algorithms, and application software are the exclusive property of Mandi Minutes. Unauthorized reproduction or reverse engineering is prohibited.
          </p>
        </section>

        {/* 11. Force Majeure */}
        <section className="space-y-2">
          <h2 className="text-mandi-text font-bold text-base flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-500/15 text-mandi-green flex items-center justify-center text-xs font-black">11</span>
            Limitation of Liability &amp; Force Majeure
          </h2>
          <p>
            Mandi Minutes and its partners shall not be held liable for delivery delays caused by events beyond reasonable control, including heavy monsoon waterlogging in Virar, railway disruptions, power failures, or civic restrictions.
          </p>
        </section>

        {/* 12. Governing Law */}
        <section className="space-y-2">
          <h2 className="text-mandi-text font-bold text-base flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-500/15 text-mandi-green flex items-center justify-center text-xs font-black">12</span>
            Governing Law &amp; Jurisdiction
          </h2>
          <p>
            These Terms shall be governed by the laws of India. Any legal dispute or controversy shall be subject to the exclusive jurisdiction of the competent courts in <strong>Vasai / Palghar District / Mumbai, Maharashtra</strong>.
          </p>
        </section>

        {/* 13. Grievance Redressal */}
        <section className="space-y-2">
          <h2 className="text-mandi-text font-bold text-base flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-500/15 text-mandi-green flex items-center justify-center text-xs font-black">13</span>
            Grievance Redressal &amp; Customer Support
          </h2>
          <p>In accordance with the Consumer Protection (E-Commerce) Rules, 2020, our Grievance Redressal details are:</p>
          <div className="bg-mandi-surface p-4 rounded-2xl border border-mandi-border text-xs space-y-1.5">
            <p><strong>Grievance Redressal:</strong> Customer Experience &amp; Compliance Team, Mandi Minutes</p>
            <p><strong>Email Support:</strong> <a href="mailto:support@mandiminutes.com" className="text-mandi-green hover:underline">support@mandiminutes.com</a></p>
            <p><strong>In-App Help:</strong> Available 24x7 via the Customer Support tab in your profile</p>
            <p><strong>Operations Hub:</strong> Mandi Minutes Regional Operations, Virar West, Palghar District, Maharashtra 401305, India.</p>
          </div>
        </section>

        {/* 14. Modifications */}
        <section className="space-y-2 pt-2 border-t border-mandi-border/60">
          <h2 className="text-mandi-text font-bold text-base flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-500/15 text-mandi-green flex items-center justify-center text-xs font-black">14</span>
            Modifications to Terms
          </h2>
          <p className="text-xs text-mandi-subtle">
            We reserve the right to amend these Terms from time to time. Continued use of Mandi Minutes after updated Terms are published constitutes your acceptance of the revised Terms.
          </p>
        </section>
      </div>
    </div>
  );
}
