import { create } from 'zustand';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const LOC_KEY = 'mandi_location';

const PINCODE_MAP = {
  '401305': 'Virar West (Bolinj, Viva College, Agashi, Global City)',
  '401303': 'Virar East (Manvelpada, Phoolpada, Chandansar)',
  '401301': 'Nallasopara West (Link Road, Vasai-Virar Belt)',
  '401309': 'Virar Gardens & Arnala Beach Road',
  '401209': 'Vasai West (Station Road)',
  '401208': 'Vasai East (Evershine City)',
};

const defaultVirarLoc = { pincode: '401305', area: 'Virar West (Bolinj, Viva College, Agashi, Global City)' };

const getInitialLocation = () => {
  try {
    const stored = localStorage.getItem(LOC_KEY);
    return stored ? JSON.parse(stored) : defaultVirarLoc;
  } catch {
    return defaultVirarLoc;
  }
};

export const useLocationStore = create((set, get) => ({
  location: getInitialLocation(),
  riderPosition: null,
  riderGpsStatus: 'idle',
  riderWatchId: null,
  locationModal: false,
  selectedStore: null,
  pincodeMap: PINCODE_MAP,
  activeBroadcastOrderId: null,

  setLocationModal: (open) => set({ locationModal: open }),
  setSelectedStore: (store) => set({ selectedStore: store }),
  setActiveBroadcastOrderId: (orderId) => set({ activeBroadcastOrderId: orderId }),

  setLocationByPincode: (pincode) => {
    const area = PINCODE_MAP[pincode] || `Virar Area ${pincode}`;
    const loc = { pincode, area };
    localStorage.setItem(LOC_KEY, JSON.stringify(loc));
    set({ location: loc, locationModal: false });
  },

  startRiderTracking: (orderId = null) => {
    if (!navigator.geolocation) {
      set({ riderGpsStatus: 'unsupported' });
      return;
    }

    if (orderId) {
      set({ activeBroadcastOrderId: orderId });
    }

    if (get().riderWatchId !== null) return;

    set({ riderGpsStatus: 'requesting' });
    const watchId = navigator.geolocation.watchPosition(
      async ({ coords }) => {
        const pos = { 
          lat: coords.latitude, 
          lng: coords.longitude, 
          accuracy: coords.accuracy,
          updatedAt: new Date().toISOString() 
        };

        set({
          riderPosition: pos,
          riderGpsStatus: 'active',
        });

        // Broadcast to Firestore if tracking an active order
        const currentOrderId = get().activeBroadcastOrderId;
        if (currentOrderId && db) {
          try {
            await updateDoc(doc(db, 'orders', currentOrderId), {
              riderLocation: pos,
            });
          } catch (err) {
            // Non-blocking log
            console.debug('Rider live coordinate sync:', err?.message);
          }
        }
      },
      () => set({ riderGpsStatus: 'denied', riderWatchId: null }),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
    set({ riderWatchId: watchId });
  },

  stopRiderTracking: () => {
    const watchId = get().riderWatchId;
    if (watchId !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchId);
    set({ riderWatchId: null, riderGpsStatus: 'idle', riderPosition: null, activeBroadcastOrderId: null });
  },

  detectLocation: () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      const calculateNearestPincode = (lat, lng) => {
        // Virar area coordinates reference map
        const points = [
          { pincode: '401305', lat: 19.4674, lng: 72.8055 }, // Virar West
          { pincode: '401303', lat: 19.4580, lng: 72.8220 }, // Virar East
          { pincode: '401309', lat: 19.4750, lng: 72.7980 }, // Arnala / Virar Gardens
          { pincode: '401301', lat: 19.4200, lng: 72.8100 }, // Nallasopara / Vasai-Virar
          { pincode: '401209', lat: 19.3800, lng: 72.8200 }, // Vasai West
          { pincode: '401208', lat: 19.3900, lng: 72.8300 }, // Vasai East
        ];

        let closest = points[0];
        let minDist = Infinity;
        for (const p of points) {
          const d = Math.hypot(p.lat - lat, p.lng - lng);
          if (d < minDist) {
            minDist = d;
            closest = p;
          }
        }
        return closest.pincode;
      };

      const onSuccess = (position) => {
        const { latitude, longitude } = position.coords;
        const matchedPincode = calculateNearestPincode(latitude, longitude);
        get().setLocationByPincode(matchedPincode);
        resolve(matchedPincode);
      };

      const onError = (error) => {
        // If high accuracy failed/timed out, try low accuracy once as fallback
        navigator.geolocation.getCurrentPosition(
          onSuccess,
          () => {
            // If completely denied or unavailable, set default Virar West and resolve
            const defaultPin = '401305';
            get().setLocationByPincode(defaultPin);
            if (error.code === 1) {
              reject(new Error('Location permission denied. Defaulted to Virar West.'));
            } else {
              reject(new Error('Could not get precise GPS. Defaulted to Virar West.'));
            }
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
        );
      };

      navigator.geolocation.getCurrentPosition(
        onSuccess,
        onError,
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    });
  },

  clearLocation: () => {
    localStorage.removeItem(LOC_KEY);
    set({ location: defaultVirarLoc, selectedStore: null, locationModal: true });
  },
}));
