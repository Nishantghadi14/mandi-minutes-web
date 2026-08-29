import { useEffect, useRef } from 'react';
import { CheckCircle, Clock, ChefHat, Bike, Home } from 'lucide-react';
import { useNotifications } from '../../utils/useNotifications';

const STEPS = [
  { key: 'placed', label: 'Order Placed', icon: CheckCircle, desc: 'Your order has been received' },
  { key: 'accepted', label: 'Accepted', icon: CheckCircle, desc: 'Store confirmed your order' },
  { key: 'preparing', label: 'Preparing', icon: ChefHat, desc: 'Store is packing your items' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Bike, desc: 'Rider is on the way' },
  { key: 'delivered', label: 'Delivered', icon: Home, desc: 'Order delivered successfully' },
];

const STATUS_IDX = { placed: 0, accepted: 1, preparing: 2, out_for_delivery: 3, delivered: 4 };

export default function OrderTracker({ order = {} }) {
  const statusKey = order?.status || 'placed';
  const currentIdx = STATUS_IDX[statusKey] ?? 0;
  const prevStatusRef = useRef(statusKey);
  const { notifyStatusUpdate } = useNotifications();

  // Update tracker step when real Firestore status changes
  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    // Fire browser notification when status genuinely advances (not on initial render)
    if (order?.status && order.status !== prevStatus && prevStatus !== order?.status) {
      notifyStatusUpdate(order.status, order?.id);
    }
    prevStatusRef.current = order?.status || 'placed';
  }, [order?.status, order?.id, notifyStatusUpdate]);

  const historyList = Array.isArray(order?.statusHistory) ? order.statusHistory : [];

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-mandi-text font-bold text-lg">Order Tracking</h3>
        <span className="badge-green text-xs">{STEPS[currentIdx]?.label || 'Processing'}</span>
      </div>

      {/* Progress bar */}
      <div className="relative mb-8">
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-mandi-border" />
        <div
          className="absolute top-4 left-4 h-0.5 bg-mandi-green transition-all duration-700"
          style={{ width: currentIdx === 0 ? '0%' : `${(currentIdx / (STEPS.length - 1)) * 90}%` }}
        />
        <div className="relative flex justify-between">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const done = idx <= currentIdx;
            const active = idx === currentIdx;
            return (
              <div key={step.key} className="flex flex-col items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 border-2 transition-all duration-500 ${
                  done ? 'bg-mandi-green border-mandi-green text-black' : 'bg-mandi-card border-mandi-border text-mandi-subtle'
                } ${active ? 'animate-pulse-green shadow-green' : ''}`}>
                  <Icon size={16} />
                </div>
                <p className={`text-xs font-medium text-center hidden sm:block ${done ? 'text-mandi-green' : 'text-mandi-subtle'}`}>{step.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current step detail */}
      <div className="bg-mandi-surface rounded-xl p-4 mb-4">
        <div className="flex items-center gap-3">
          {(() => { const Icon = STEPS[currentIdx]?.icon || Clock; return <div className="w-10 h-10 bg-mandi-green-muted rounded-full flex items-center justify-center"><Icon size={20} className="text-mandi-green" /></div>; })()}
          <div>
            <p className="text-mandi-text font-semibold">{STEPS[currentIdx]?.label}</p>
            <p className="text-mandi-muted text-sm">{STEPS[currentIdx]?.desc}</p>
          </div>
        </div>
      </div>

      {/* Status history */}
      {historyList.length > 0 && (
        <div className="space-y-2">
          <p className="text-mandi-muted text-xs font-medium">Status History</p>
          {historyList.slice().reverse().map((entry, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 bg-mandi-green rounded-full mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-mandi-text text-xs font-medium">{entry.note || `Status: ${entry.status}`}</p>
                <p className="text-mandi-subtle text-xs">{entry.time ? new Date(entry.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
