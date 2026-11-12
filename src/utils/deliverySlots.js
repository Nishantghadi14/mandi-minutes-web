/**
 * deliverySlots.js
 * Centralized, time-aware delivery preferences & slot management for Mandi Minutes.
 * Handles operating hours, same-day slot cutoffs, time-based slot badges,
 * and dynamic promo banners for Virar, Palghar.
 */

export const SAME_DAY_SLOTS = [
  {
    id: 'same-day-express',
    type: 'same-day',
    date: 'Today',
    timeWindow: '15–30 Mins',
    label: 'Express Instant (15-30 Mins)',
    desc: 'Hyperlocal rider assigned immediately from store',
    badge: 'Fastest ⚡',
    openHour: 7.0,   // 07:00 AM
    cutoffHour: 22.0, // 10:00 PM (Delivery only available till 10 PM)
  },
  {
    id: 'same-day-eve',
    type: 'same-day',
    date: 'Today',
    timeWindow: '05:00 PM – 08:30 PM',
    label: 'Today Evening (5PM–8:30PM)',
    desc: 'Fresh doorstep delivery before dinner',
    badge: 'Popular',
    openHour: 7.0,     // 07:00 AM
    cutoffHour: 19.75, // 07:45 PM (delivery window ends 8:30 PM)
  },
  {
    id: 'same-day-night',
    type: 'same-day',
    date: 'Today',
    timeWindow: '08:30 PM – 10:00 PM',
    label: 'Tonight (8:30PM–10:00PM)',
    desc: 'Late evening relaxed doorstep drop till 10:00 PM',
    badge: null,
    openHour: 7.0,   // 07:00 AM
    cutoffHour: 22.0, // 10:00 PM (Delivery only available till 10 PM)
  },
];

export const SCHEDULED_SLOTS = [
  {
    id: 'tom-morn',
    type: 'scheduled',
    date: 'Tomorrow',
    timeWindow: '07:00 AM – 11:00 AM',
    label: 'Tomorrow Morning (7AM–11AM)',
    desc: 'Direct fresh harvest drop right to your door',
    badge: 'Recommended 🌅',
  },
  {
    id: 'tom-noon',
    type: 'scheduled',
    date: 'Tomorrow',
    timeWindow: '12:00 PM – 04:00 PM',
    label: 'Tomorrow Afternoon (12PM–4PM)',
    desc: 'Standard mid-day grocery slot',
    badge: null,
  },
  {
    id: 'tom-eve',
    type: 'scheduled',
    date: 'Tomorrow',
    timeWindow: '05:00 PM – 08:30 PM',
    label: 'Tomorrow Evening (5PM–8:30PM)',
    desc: 'Convenient after-work delivery',
    badge: null,
  },
  {
    id: 'day-after-morn',
    type: 'scheduled',
    date: 'Day After Tomorrow',
    timeWindow: '08:00 AM – 01:00 PM',
    label: 'Day After Tomorrow (8AM–1PM)',
    desc: 'Advance planned weekly groceries',
    badge: 'Advance 📅',
  },
];

/**
 * Converts Date object to decimal hours (e.g. 19:30 => 19.5, 19:45 => 19.75)
 */
export function getDecimalHour(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  return d.getHours() + d.getMinutes() / 60;
}

/**
 * Returns store operating status for the given time:
 * - 07:00 to 22:00: open (delivery available till 10:00 PM)
 * - 22:00 to 06:30: night_closed (closed for delivery)
 * - 06:30 to 07:00: early_morning (opening soon)
 */
export function getStoreOperatingStatus(date = new Date()) {
  const hour = getDecimalHour(date);

  if (hour >= 7.0 && hour < 22.0) {
    const isClosingSoon = hour >= 21.0;
    return {
      isOpen: true,
      isSameDayAvailable: true,
      status: isClosingSoon ? 'closing_soon' : 'open',
      badge: isClosingSoon ? 'Closing Soon ⏳' : 'Live Now ⚡',
      message: isClosingSoon
        ? 'Last calls! Delivery is only available till 10:00 PM tonight.'
        : 'Kirana stores in Virar are open for delivery till 10:00 PM.',
      nextOpenTime: null,
    };
  }

  if (hour >= 6.5 && hour < 7.0) {
    return {
      isOpen: false,
      isSameDayAvailable: false,
      status: 'early_morning',
      badge: 'Opens 7:00 AM',
      message: 'Early morning! Stores open at 7:00 AM for fresh deliveries.',
      nextOpenTime: 'Today 7:00 AM',
    };
  }

  // 22:00 to 06:30 (Night)
  return {
    isOpen: false,
    isSameDayAvailable: false,
    status: 'night_closed',
    badge: 'Closed (Opens 7 AM)',
    message: 'Delivery is only available till 10:00 PM. Scheduled for Tomorrow Morning (7AM–11AM).',
    nextOpenTime: 'Tomorrow 7:00 AM',
  };
}

/**
 * Checks a specific same-day slot's availability at a given time.
 */
export function getSameDaySlotAvailability(slot, date = new Date()) {
  const hour = getDecimalHour(date);

  // Before store opening (before 7:00 AM)
  if (hour < slot.openHour) {
    return {
      isAvailable: false,
      statusBadge: 'Opens 7 AM',
      statusReason: 'Ordering starts at 7:00 AM',
    };
  }

  // After slot cutoff
  if (hour >= slot.cutoffHour) {
    return {
      isAvailable: false,
      statusBadge: 'Slot Ended',
      statusReason: 'Window closed for today',
    };
  }

  // Slot is available! Check if closing soon (within 30 mins of cutoff)
  const minutesLeft = (slot.cutoffHour - hour) * 60;
  if (minutesLeft <= 30) {
    return {
      isAvailable: true,
      statusBadge: 'Closing Soon ⏳',
      statusReason: `Order in next ${Math.max(1, Math.round(minutesLeft))} mins`,
    };
  }

  if (slot.id === 'same-day-express') {
    return {
      isAvailable: true,
      statusBadge: 'Fastest ⚡',
      statusReason: 'Rider assigned immediately',
    };
  }

  if (slot.id === 'same-day-eve') {
    return {
      isAvailable: true,
      statusBadge: hour >= 17 ? 'Delivering Soon' : 'Popular 🌅',
      statusReason: 'Fresh drop before dinner',
    };
  }

  if (slot.id === 'same-day-night') {
    return {
      isAvailable: true,
      statusBadge: 'Available Tonight',
      statusReason: 'Relaxed evening drop',
    };
  }

  return {
    isAvailable: true,
    statusBadge: slot.badge || null,
    statusReason: slot.desc,
  };
}

/**
 * Decorates SAME_DAY_SLOTS with live availability
 */
export function getDecoratedSameDaySlots(date = new Date()) {
  return SAME_DAY_SLOTS.map(slot => {
    const avail = getSameDaySlotAvailability(slot, date);
    return {
      ...slot,
      isAvailable: avail.isAvailable,
      statusBadge: avail.statusBadge,
      statusReason: avail.statusReason,
    };
  });
}

/**
 * Resolves smart initial delivery preferences based on current time:
 * - If same-day delivery is available, recommends same-day with first active slot.
 * - If night closed, recommends scheduled delivery with tomorrow morning slot.
 */
export function resolveDeliveryPreference(date = new Date()) {
  const op = getStoreOperatingStatus(date);
  const slots = getDecoratedSameDaySlots(date);
  const firstAvailableSameDay = slots.find(s => s.isAvailable);

  if (op.isSameDayAvailable && firstAvailableSameDay) {
    return {
      deliveryMode: 'same-day',
      recommendedSameDaySlotId: firstAvailableSameDay.id,
      recommendedScheduledSlotId: 'tom-morn',
      isNightClosed: false,
      operatingStatus: op,
    };
  }

  return {
    deliveryMode: 'scheduled',
    recommendedSameDaySlotId: 'same-day-express',
    recommendedScheduledSlotId: 'tom-morn',
    isNightClosed: true,
    operatingStatus: op,
  };
}

/**
 * Returns dynamic promo banner according to current time
 */
export function getTimeBasedBanner(date = new Date()) {
  const hour = getDecimalHour(date);

  // Night / Early morning (10:00 PM to 6:30 AM)
  if (hour >= 22.0 || hour < 6.5) {
    return {
      id: 'b1',
      badge: '🌅 TOMORROW 7:00 AM',
      badgeColor: 'bg-emerald-400 text-black',
      title: 'Order Tonight, Fresh Tomorrow',
      subtitle: 'Daily staples delivered to your doorstep between 7 AM – 11 AM.',
      tag: 'FREE Delivery on ₹199+',
      code: 'FREESHIP',
      bgDark: 'from-emerald-950/90 via-teal-900/70 to-slate-900/90',
      bgLight: 'from-emerald-100 via-teal-50 to-green-100/70',
      borderDark: 'border-emerald-500/30',
      borderLight: 'border-emerald-300/80',
      emoji: '🚚',
    };
  }

  // Morning / Daytime / Evening (6:30 AM to 10:00 PM)
  return {
    id: 'b1',
    badge: '⚡ 15–30 MINS',
    badgeColor: 'bg-emerald-400 text-black',
    title: 'Delivered Fresh in 15–30 Mins',
    subtitle: 'Hyperlocal staples & daily groceries delivered to your door today (till 10 PM).',
    tag: 'FREE Delivery on ₹199+',
    code: 'FREESHIP',
    bgDark: 'from-emerald-950/90 via-teal-900/70 to-slate-900/90',
    bgLight: 'from-emerald-100 via-teal-50 to-green-100/70',
    borderDark: 'border-emerald-500/30',
    borderLight: 'border-emerald-300/80',
    emoji: '⚡',
  };
}
