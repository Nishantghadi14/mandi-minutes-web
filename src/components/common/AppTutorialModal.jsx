import { useEffect, useRef } from 'react';
import { 
  MapPin, 
  ShoppingBag, 
  Zap, 
  Truck, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  BadgePercent 
} from 'lucide-react';
import { useTutorialStore } from '../../store/useTutorialStore';

const TUTORIAL_STEPS = [
  {
    id: 'location',
    stepNumber: 1,
    badge: 'Step 1 of 4 • Delivery Area',
    badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    icon: MapPin,
    iconBg: 'bg-emerald-500 text-black',
    title: 'Choose Your Virar Neighborhood 📍',
    subtitle: 'Pinpoint your local area to browse verified neighborhood kirana stores and real-time inventory.',
    renderVisual: () => (
      <div className="bg-mandi-surface/80 border border-mandi-border/80 rounded-2xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between text-xs pb-2 border-b border-mandi-border/60">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-mandi-text">Serving Virar Region</span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full">
            10–15 Min
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-mandi-card border border-mandi-border flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
            <MapPin size={15} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-mandi-text truncate">
              Virar West (Bolinj, Viva College Rd)
            </p>
            <p className="text-[10px] text-mandi-muted truncate">
              Agashi • Global City • Manvelpada • Chandansar
            </p>
          </div>
        </div>
        <p className="text-[11px] text-mandi-subtle text-center">
          💡 Tap the location bar at any time in the header to change address or detect GPS.
        </p>
      </div>
    ),
  },
  {
    id: 'staples',
    stepNumber: 2,
    badge: 'Step 2 of 4 • Wholesale Savings',
    badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    icon: ShoppingBag,
    iconBg: 'bg-amber-500 text-black',
    title: 'APMC Mandi Wholesale Rates 🌾',
    subtitle: 'Cut out middlemen! Order daily kitchen staples directly sourced from wholesale mills and verified kiranas.',
    renderVisual: () => (
      <div className="bg-mandi-surface/80 border border-mandi-border/80 rounded-2xl p-3.5 space-y-2.5">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-mandi-card border border-mandi-border">
            <div className="text-lg mb-1">🍚</div>
            <p className="font-bold text-mandi-text text-xs truncate">Kolam Rice (1kg)</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-mandi-green font-black text-xs">₹48</span>
              <span className="text-mandi-subtle text-[10px] line-through">₹60</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-mandi-card border border-mandi-border">
            <div className="text-lg mb-1">🥣</div>
            <p className="font-bold text-mandi-text text-xs truncate">Toore Daal (500g)</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-mandi-green font-black text-xs">₹68</span>
              <span className="text-mandi-subtle text-[10px] line-through">₹85</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px]">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <BadgePercent size={14} />
            <span>Welcome Offer: Flat ₹50 OFF</span>
          </div>
          <span className="font-mono font-bold bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded">
            MANDI50
          </span>
        </div>
      </div>
    ),
  },
  {
    id: 'delivery',
    stepNumber: 3,
    badge: 'Step 3 of 4 • Flexible Delivery',
    badgeColor: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    icon: Zap,
    iconBg: 'bg-cyan-500 text-black',
    title: 'Instant Express or Morning Slots ⚡',
    subtitle: 'Need it right now or planning for tomorrow? Choose the delivery mode that fits your routine.',
    renderVisual: () => (
      <div className="bg-mandi-surface/80 border border-mandi-border/80 rounded-2xl p-3.5 space-y-2">
        <div className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-500/15 to-transparent border border-emerald-500/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500 text-black flex items-center justify-center font-black">
              <Zap size={13} />
            </div>
            <div>
              <p className="text-xs font-bold text-mandi-text">⚡ Instant Express (10–15 min)</p>
              <p className="text-[10px] text-mandi-subtle">Urgent tea, milk, cooking essentials</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md">
            Fastest
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-gradient-to-r from-blue-500/15 to-transparent border border-blue-500/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-500 text-black flex items-center justify-center font-black">
              <Clock size={13} />
            </div>
            <div>
              <p className="text-xs font-bold text-mandi-text">🌅 Morning Slot (7 AM – 11 AM)</p>
              <p className="text-[10px] text-mandi-subtle">Order tonight, arrives before breakfast</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-md">
            Scheduled
          </span>
        </div>
      </div>
    ),
  },
  {
    id: 'tracking',
    stepNumber: 4,
    badge: 'Step 4 of 4 • Rider Tracking & Payments',
    badgeColor: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    icon: Truck,
    iconBg: 'bg-purple-500 text-white',
    title: 'Live Tracking & Flexible Payments 🛵',
    subtitle: 'Track your local delivery partner on a live map with real-time WhatsApp updates and simple payment options.',
    renderVisual: () => (
      <div className="bg-mandi-surface/80 border border-mandi-border/80 rounded-2xl p-3.5 space-y-2.5">
        <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-500 text-white flex items-center justify-center">
              <Truck size={14} />
            </div>
            <div>
              <p className="text-xs font-bold text-mandi-text">Live Rider Tracking</p>
              <p className="text-[10px] text-purple-300">Rider dispatched • 4 mins away</p>
            </div>
          </div>
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
          </span>
        </div>

        <div className="flex items-center justify-between gap-1.5 text-[10px] text-mandi-muted flex-wrap">
          <span className="px-2 py-1 rounded-lg bg-mandi-card border border-mandi-border font-medium flex items-center gap-1">
            <CheckCircle2 size={11} className="text-emerald-400" /> Cash on Delivery
          </span>
          <span className="px-2 py-1 rounded-lg bg-mandi-card border border-mandi-border font-medium flex items-center gap-1">
            <CheckCircle2 size={11} className="text-emerald-400" /> UPI (GPay/PhonePe)
          </span>
          <span className="px-2 py-1 rounded-lg bg-mandi-card border border-mandi-border font-medium flex items-center gap-1">
            <CheckCircle2 size={11} className="text-emerald-400" /> Cards & NetBanking
          </span>
        </div>
      </div>
    ),
  },
];

export default function AppTutorialModal() {
  const { isOpen, currentStep, closeTutorial, nextStep, prevStep, setStep } = useTutorialStore();
  const touchStartXRef = useRef(null);

  // Keyboard navigation listener (ArrowRight = next, ArrowLeft = prev, Escape = close)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        nextStep(TUTORIAL_STEPS.length);
      } else if (e.key === 'ArrowLeft') {
        prevStep();
      } else if (e.key === 'Escape') {
        closeTutorial();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, nextStep, prevStep, closeTutorial]);

  if (!isOpen) return null;

  const activeStep = TUTORIAL_STEPS[currentStep] || TUTORIAL_STEPS[0];
  const Icon = activeStep.icon;
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;

  // Touch swipe detection for mobile
  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartXRef.current === null) return;
    const diff = touchStartXRef.current - e.changedTouches[0].clientX;
    touchStartXRef.current = null;
    if (diff > 50) {
      // Swiped left -> next
      nextStep(TUTORIAL_STEPS.length);
    } else if (diff < -50) {
      // Swiped right -> prev
      prevStep();
    }
  };

  return (
    <div 
      className="overlay flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
    >
      <div 
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="bg-mandi-card border border-mandi-border rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 w-full max-w-md animate-slide-in-up sm:animate-fade-in shadow-clay-floating relative overflow-hidden"
      >
        {/* Mobile drag handle */}
        <div className="w-12 h-1.5 bg-mandi-border-light rounded-full mx-auto mb-3 sm:hidden" />

        {/* Top Header Bar: Step Badge & Skip Button */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${activeStep.badgeColor}`}>
              {activeStep.badge}
            </span>
          </div>

          <button
            type="button"
            onClick={closeTutorial}
            className="text-mandi-muted hover:text-mandi-text text-xs font-semibold px-2 py-1 rounded-lg hover:bg-mandi-surface transition-colors flex items-center gap-1 cursor-pointer"
            title="Skip onboarding tour"
          >
            <span>Skip Tour</span>
            <X size={14} />
          </button>
        </div>

        {/* Segmented Step Progress Indicators */}
        <div className="grid grid-cols-4 gap-1.5 mb-5">
          {TUTORIAL_STEPS.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(idx)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                idx === currentStep
                  ? 'bg-mandi-green shadow-sm shadow-mandi-green/50'
                  : idx < currentStep
                    ? 'bg-mandi-green/50'
                    : 'bg-mandi-border'
              }`}
              title={`Go to step ${idx + 1}`}
            />
          ))}
        </div>

        {/* Step Visual Content */}
        <div className="space-y-4 min-h-[290px] flex flex-col justify-between">
          <div>
            {/* Header with icon and title */}
            <div className="flex items-start gap-3 mb-2.5">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md ${activeStep.iconBg}`}>
                <Icon size={22} />
              </div>
              <div>
                <h2 id="tutorial-title" className="text-base sm:text-lg font-black text-mandi-text leading-snug">
                  {activeStep.title}
                </h2>
                <p className="text-xs text-mandi-muted mt-0.5 leading-relaxed">
                  {activeStep.subtitle}
                </p>
              </div>
            </div>

            {/* Step specific interactive preview visual */}
            <div className="mt-3.5">
              {activeStep.renderVisual()}
            </div>
          </div>

          {/* Navigation Action Buttons */}
          <div className="pt-2 flex items-center gap-2.5">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={prevStep}
                className="btn-outline text-xs py-2.5 px-3.5 font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              >
                <ChevronLeft size={16} />
                <span>Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => nextStep(TUTORIAL_STEPS.length)}
              className="btn-primary flex-1 py-2.5 px-4 text-xs font-black shadow-lg shadow-mandi-green/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              {isLastStep ? (
                <>
                  <Sparkles size={15} />
                  <span>Start Shopping in Virar 🚀</span>
                </>
              ) : (
                <>
                  <span>Next Step</span>
                  <ChevronRight size={15} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
