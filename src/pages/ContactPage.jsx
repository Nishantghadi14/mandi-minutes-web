import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Mail, Phone, MapPin, Send, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';

const faqs = [
  { q: 'How fast is Mandi Minutes delivery?', a: 'Standard delivery time is between 10 to 20 minutes depending on your proximity to the selected Kirana store.' },
  { q: 'What are the delivery charges?', a: 'Delivery is completely FREE on orders above ₹199. A nominal fee of ₹15-20 applies for smaller order amounts.' },
  { q: 'How do Kirana store owners join Mandi Minutes?', a: 'Shop owners can fill out our "Become a Vendor" form. Our onboarding team verifies GSTIN/location details and approves the store within 24 hours.' },
  { q: 'What payment options are supported?', a: 'We accept Cash on Delivery (COD), all major UPI apps (GPay, PhonePe, Paytm), and Credit/Debit Cards.' },
];

export default function ContactPage() {
  const { addTicket } = useData();
  const { user, openAuthModal } = useAuth();
  const { addToast } = useToast();

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) { openAuthModal('login'); return; }
    if (!subject || !message) { addToast('Please fill all fields', 'error'); return; }
    addTicket({ customerId: user.id, subject, message });
    setSubject(''); setMessage('');
    addToast('Support ticket created! We will get back to you soon.', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <Helmet>
        <title>Help & Support — Mandi Minutes Customer Service</title>
        <meta name="description" content="Contact Mandi Minutes support for help with your Virar grocery orders, refunds, and vendor partner inquiries." />
        <meta property="og:title" content="Help & Support | Mandi Minutes Virar" />
        <meta property="og:description" content="Customer support and ticketing for Mandi Minutes grocery deliveries in Virar." />
      </Helmet>

      <h1 className="text-3xl font-black text-mandi-text mb-2">Help & Support</h1>
      <p className="text-mandi-muted text-sm mb-8">We are here to assist you with your orders, refunds, and partner inquiries.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {/* Contact Form */}
        <div className="md:col-span-2 card p-6">
          <h2 className="text-mandi-text font-bold text-lg mb-4 flex items-center gap-2">
            <Mail size={18} className="text-mandi-green" /> Submit Support Ticket
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-mandi-muted text-xs font-medium mb-1">Subject</label>
              <input required value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Order #ORD-001 delay inquiry" className="input-field text-sm" />
            </div>
            <div>
              <label className="block text-mandi-muted text-xs font-medium mb-1">Message</label>
              <textarea required rows={4} value={message} onChange={e => setMessage(e.target.value)} placeholder="Describe your issue or question..." className="input-field text-sm w-full" />
            </div>
            <button type="submit" className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2">
              <Send size={14} /> Send Message
            </button>
          </form>
        </div>

        {/* Contact Info */}
        <div className="space-y-4">
          <div className="card p-5 space-y-4">
            <h3 className="text-mandi-text font-bold text-base">Direct Contact</h3>
            <div className="flex items-start gap-3">
              <MapPin size={16} className="text-mandi-green mt-1 flex-shrink-0" />
              <p className="text-mandi-muted text-xs">Cyber Hub, DLF Phase 2, Gurugram, Haryana 122002</p>
            </div>
            <div className="flex items-center gap-3">
              <Phone size={16} className="text-mandi-green flex-shrink-0" />
              <p className="text-mandi-muted text-xs">+91 99209 41603 (24x7 Support)</p>
            </div>
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-mandi-green flex-shrink-0" />
              <p className="text-mandi-muted text-xs">support@mandiminutes.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="card p-6">
        <h2 className="text-mandi-text font-bold text-lg mb-4 flex items-center gap-2">
          <HelpCircle size={18} className="text-mandi-green" /> Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-mandi-border rounded-xl overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full p-4 text-left flex justify-between items-center bg-mandi-surface hover:bg-mandi-card transition-colors">
                <span className="text-mandi-text font-semibold text-sm">{faq.q}</span>
                {openFaq === i ? <ChevronUp size={16} className="text-mandi-green" /> : <ChevronDown size={16} className="text-mandi-subtle" />}
              </button>
              {openFaq === i && (
                <div className="p-4 bg-mandi-card border-t border-mandi-border text-mandi-muted text-xs leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
