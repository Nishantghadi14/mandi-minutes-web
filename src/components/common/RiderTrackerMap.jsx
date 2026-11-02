import React, { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { STORE_COORDINATES, VIRAR_LOCALITIES } from '../../data/virarCoordinates';
import { useLocationStore } from '../../store/useLocationStore';
import { useDataStore } from '../../store/useDataStore';

// Fix Leaflet default icon paths in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error('Leaflet map render error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function VirarVisualTimeline({ storeName, targetName, progress, isLive, roadInfo }) {
  const etaText = roadInfo?.durationMins ? `~${roadInfo.durationMins} Mins` : 'Estimated ~10 Mins';
  const distText = roadInfo?.distanceKm ? `${roadInfo.distanceKm} km` : '1.4 km';

  return (
    <div className="w-full h-[240px] bg-mandi-surface rounded-2xl border border-mandi-border p-5 flex flex-col justify-between shadow-card">
      <div className="flex items-center justify-between">
        <span className="badge-green text-xs font-bold flex items-center gap-1">
          {isLive ? '⚡ Live GPS Route Virar' : '⏱️ Estimated Route (Virar)'}
        </span>
        <span className="text-mandi-muted text-xs font-mono">
          {isLive ? 'Live Tracking Active' : `${distText} • ${etaText}`}
        </span>
      </div>
      
      <div className="flex items-center justify-between my-4 relative px-2">
        <div className="absolute top-1/2 left-6 right-6 h-1.5 bg-mandi-border -translate-y-1/2 z-0 rounded-full" />
        <div 
          className="absolute top-1/2 left-6 h-1.5 bg-mandi-green -translate-y-1/2 z-0 transition-all duration-500 rounded-full"
          style={{ width: `calc(${progress * 100}% - 24px)` }}
        />

        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-xl z-10 border-2 border-mandi-dark shadow-md" title="Kirana Store">🏪</div>
        <div className="w-12 h-12 rounded-full bg-mandi-green flex items-center justify-center text-xl z-10 border-2 border-mandi-dark shadow-lg animate-pulse" title="Delivery Agent">🛵</div>
        <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-xl z-10 border-2 border-mandi-dark shadow-md" title="Customer Address">🏠</div>
      </div>

      <div className="flex justify-between text-xs text-mandi-muted border-t border-mandi-border pt-3">
        <span className="font-medium text-mandi-text">{storeName}</span>
        <span className="text-mandi-green font-bold">
          {isLive ? 'Live GPS Coordinate Pin' : `${Math.round(progress * 100)}% Estimated Track`}
        </span>
        <span className="font-medium text-mandi-text">{targetName}</span>
      </div>
    </div>
  );
}

function MapViewport({ position, useLivePosition, bounds }) {
  const map = useMap();
  const hasFittedRef = useRef(false);

  // Auto-fit initial bounds so both Store and Customer pins are beautifully framed
  useEffect(() => {
    if (!hasFittedRef.current && bounds && bounds.length >= 2) {
      try {
        map.fitBounds(bounds, { padding: [35, 35], maxZoom: 16 });
        hasFittedRef.current = true;
      } catch {}
    }
  }, [map, bounds]);

  // Smoothly center on live rider location when GPS broadcast is streaming
  useEffect(() => {
    if (useLivePosition && position) {
      map.setView(position, Math.max(map.getZoom(), 15), { animate: true });
    }
  }, [map, position, useLivePosition]);

  return null;
}

function LeafletMapInner({ 
  storeLatLng, 
  customerLatLng, 
  currentRiderLatLng, 
  routePolyline, 
  storePos, 
  targetLoc, 
  progress, 
  isLiveGps,
  roadInfo 
}) {
  const storeIcon = useMemo(() => {
    try {
      return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<div style="width:38px;height:38px;background:#2563eb;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;border:2.5px solid #121212;box-shadow:0 4px 12px rgba(37,99,235,0.6);">🏪</div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 38],
      });
    } catch { return null; }
  }, []);

  const riderIcon = useMemo(() => {
    try {
      return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<div style="width:38px;height:38px;background:#00C851;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;border:2.5px solid #121212;box-shadow:0 4px 14px rgba(0,200,81,0.65);">🛵</div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 38],
      });
    } catch { return null; }
  }, []);

  const homeIcon = useMemo(() => {
    try {
      return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<div style="width:38px;height:38px;background:#9333ea;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;border:2.5px solid #121212;box-shadow:0 4px 12px rgba(147,51,234,0.6);">🏠</div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 38],
      });
    } catch { return null; }
  }, []);

  const centerLatLng = [
    (storeLatLng[0] + customerLatLng[0]) / 2,
    (storeLatLng[1] + customerLatLng[1]) / 2,
  ];

  const mapBounds = useMemo(() => [storeLatLng, customerLatLng], [storeLatLng, customerLatLng]);

  return (
    <div className="relative w-full h-[340px] rounded-2xl overflow-hidden border border-mandi-border z-0 shadow-card">
      <MapContainer
        key="virar-live-map"
        center={centerLatLng}
        zoom={14}
        scrollWheelZoom={false}
        className="w-full h-full"
        style={{ background: '#0a0e17' }}
      >
        <MapViewport position={currentRiderLatLng} useLivePosition={isLiveGps} bounds={mapBounds} />
        
        {/* Free Official OpenStreetMap Tiles with Custom Dark Palette Filter (Zero API Key, Zero Watermark) */}
        <TileLayer
          className="dark-map-tiles"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          subdomains={['a', 'b', 'c']}
          maxZoom={19}
        />

        {/* Road Outline Underlay for High Contrast */}
        <Polyline
          positions={routePolyline}
          color="#000000"
          weight={6}
          opacity={0.55}
        />

        {/* Real Driving Street Polyline via OSRM */}
        <Polyline
          positions={routePolyline}
          color="#00C851"
          weight={4}
          dashArray="6, 6"
          opacity={0.9}
        />

        {storeIcon && (
          <Marker position={storeLatLng} icon={storeIcon}>
            <Popup><div className="text-black text-xs font-bold">🏪 {storePos.name}</div></Popup>
          </Marker>
        )}

        {riderIcon && (
          <Marker position={currentRiderLatLng} icon={riderIcon}>
            <Popup><div className="text-black text-xs font-bold">🛵 Delivery Agent ({isLiveGps ? 'Live GPS' : `${Math.round(progress * 100)}% Route`})</div></Popup>
          </Marker>
        )}

        {homeIcon && (
          <Marker position={customerLatLng} icon={homeIcon}>
            <Popup><div className="text-black text-xs font-bold">🏠 {targetLoc.name}</div></Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Floating Status Indicator (Top-Left) */}
      <div className="absolute top-3 left-3 bg-mandi-card/95 backdrop-blur-md border border-mandi-border rounded-xl px-3 py-1.5 text-xs z-[400] flex items-center gap-2 shadow-lg select-none">
        <span className="w-2.5 h-2.5 rounded-full bg-mandi-green animate-ping" />
        <span className="text-mandi-text font-bold">
          {isLiveGps ? 'Live GPS Active' : 'Real Street Route (Virar)'}
        </span>
      </div>

      {/* Floating Real-Time Driving Distance & ETA (Top-Right) */}
      {roadInfo && (
        <div className="absolute top-3 right-3 bg-mandi-card/95 backdrop-blur-md border border-mandi-border rounded-xl px-3 py-1.5 text-xs z-[400] flex items-center gap-2 shadow-lg font-mono select-none">
          <span className="text-emerald-400 font-bold">🛣️ {roadInfo.distanceKm} km</span>
          <span className="text-mandi-muted">•</span>
          <span className="text-sky-300 font-semibold">~{roadInfo.durationMins} mins</span>
        </div>
      )}
    </div>
  );
}

export default function RiderTrackerMap({ 
  orderId = null,
  storeId = 'store-mahalaxmi-1', 
  storeCoordinates = null,
  customerPincode = '401305', 
  customerCoordinates = null,
  orderStatus = 'out_for_delivery', 
  liveRiderLocation = null,
  onRouteCalculated = null
}) {
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState(0.4);
  const [firestoreRiderLocation, setFirestoreRiderLocation] = useState(null);
  const [roadPoints, setRoadPoints] = useState([]);
  const [roadInfo, setRoadInfo] = useState(null);

  const riderPosition = useLocationStore(state => state.riderPosition);
  const riderGpsStatus = useLocationStore(state => state.riderGpsStatus);
  const stores = useDataStore(state => state.stores) || [];
  const matchedStore = stores.find(s => s.id === storeId);

  const storePos = (storeCoordinates?.lat && storeCoordinates?.lng)
    ? { name: storeCoordinates.name || 'Kirana Store (Virar)', lat: Number(storeCoordinates.lat), lng: Number(storeCoordinates.lng) }
    : (matchedStore?.lat && matchedStore?.lng)
      ? { name: matchedStore.name || 'Kirana Store (Virar)', lat: Number(matchedStore.lat), lng: Number(matchedStore.lng) }
      : (STORE_COORDINATES[storeId] || { name: 'Kirana Store (Virar)', lat: 19.4674, lng: 72.8055 });

  const targetLoc = VIRAR_LOCALITIES[customerPincode] || VIRAR_LOCALITIES['401305'];

  const storeLatLng = useMemo(() => [storePos.lat, storePos.lng], [storePos.lat, storePos.lng]);
  const customerLatLng = useMemo(() => {
    if (customerCoordinates?.lat && customerCoordinates?.lng && !isNaN(Number(customerCoordinates.lat)) && !isNaN(Number(customerCoordinates.lng))) {
      return [Number(customerCoordinates.lat), Number(customerCoordinates.lng)];
    }
    return [targetLoc.lat + 0.005, targetLoc.lng + 0.004];
  }, [customerCoordinates, targetLoc.lat, targetLoc.lng]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch real driving road route via OSRM (Free, Open-Source Road Routing)
  useEffect(() => {
    let isCancelled = false;

    const fetchRoadRoute = async () => {
      try {
        const storeLng = storeLatLng[1];
        const storeLat = storeLatLng[0];
        const custLng = customerLatLng[1];
        const custLat = customerLatLng[0];

        const url = `https://router.project-osrm.org/route/v1/driving/${storeLng},${storeLat};${custLng},${custLat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('OSRM network response not ok');
        const data = await res.json();

        if (data.code === 'Ok' && data.routes?.[0]?.geometry?.coordinates?.length > 0) {
          const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
          const distanceKm = (data.routes[0].distance / 1000).toFixed(1);
          const durationMins = Math.max(3, Math.round(data.routes[0].duration / 60));

          if (!isCancelled) {
            setRoadPoints(coords);
            setRoadInfo({ distanceKm, durationMins });
            if (typeof onRouteCalculated === 'function') {
              onRouteCalculated({ distanceKm, durationMins, coords });
            }
          }
        }
      } catch (err) {
        // Fallback silently if offline or blocked; straight-line will be used
        console.warn('OSRM routing fallback active:', err?.message);
        const storeLng = storeLatLng[1];
        const storeLat = storeLatLng[0];
        const custLng = customerLatLng[1];
        const custLat = customerLatLng[0];
        const approxDistKm = (Math.hypot(custLat - storeLat, custLng - storeLng) * 111).toFixed(1);
        const approxDurMin = Math.max(3, Math.round(Number(approxDistKm) * 3));
        if (!isCancelled) {
          setRoadInfo({ distanceKm: approxDistKm, durationMins: approxDurMin });
          if (typeof onRouteCalculated === 'function') {
            onRouteCalculated({ distanceKm: approxDistKm, durationMins: approxDurMin });
          }
        }
      }
    };

    fetchRoadRoute();
    return () => { isCancelled = true; };
  }, [storeLatLng, customerLatLng, onRouteCalculated]);

  // Real-time Firestore listener for rider location broadcast on the specific order
  useEffect(() => {
    if (!orderId || !db) return;

    const unsubscribe = onSnapshot(doc(db, 'orders', orderId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.riderLocation?.lat && data.riderLocation?.lng) {
          setFirestoreRiderLocation(data.riderLocation);
        }
      }
    });

    return () => unsubscribe();
  }, [orderId]);

  // Smooth simulated delivery progression along the road
  useEffect(() => {
    if (orderStatus !== 'out_for_delivery') return;
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 0.95) return 0.95;
        return prev + 0.02;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [orderStatus]);

  // Rider position: follow real road route coordinates when available, else interpolate straight line
  const simulatedRiderLatLng = useMemo(() => {
    if (roadPoints.length > 0) {
      const idx = Math.min(
        roadPoints.length - 1,
        Math.max(0, Math.floor(progress * (roadPoints.length - 1)))
      );
      return roadPoints[idx];
    }
    return [
      storeLatLng[0] + (customerLatLng[0] - storeLatLng[0]) * progress,
      storeLatLng[1] + (customerLatLng[1] - storeLatLng[1]) * progress,
    ];
  }, [roadPoints, progress, storeLatLng, customerLatLng]);

  const resolvedLiveLocation = firestoreRiderLocation || liveRiderLocation;
  const isLiveGps = Boolean(resolvedLiveLocation || (riderPosition && riderGpsStatus === 'active'));
  
  const currentRiderLatLng = useMemo(() => {
    if (resolvedLiveLocation) return [resolvedLiveLocation.lat, resolvedLiveLocation.lng];
    if (riderPosition) return [riderPosition.lat, riderPosition.lng];
    return simulatedRiderLatLng;
  }, [resolvedLiveLocation, riderPosition, simulatedRiderLatLng]);

  // Polyline draws the full real street curve when OSRM data is loaded
  const routePolyline = useMemo(() => {
    if (roadPoints.length > 0) return roadPoints;
    return [storeLatLng, currentRiderLatLng, customerLatLng];
  }, [roadPoints, storeLatLng, currentRiderLatLng, customerLatLng]);

  const fallback = (
    <VirarVisualTimeline 
      storeName={storePos.name} 
      targetName={targetLoc.name} 
      progress={progress} 
      isLive={isLiveGps} 
      roadInfo={roadInfo}
    />
  );

  if (!mounted) return fallback;

  return (
    <MapErrorBoundary fallback={fallback}>
      <LeafletMapInner
        storeLatLng={storeLatLng}
        customerLatLng={customerLatLng}
        currentRiderLatLng={currentRiderLatLng}
        routePolyline={routePolyline}
        storePos={storePos}
        targetLoc={targetLoc}
        progress={progress}
        isLiveGps={isLiveGps}
        roadInfo={roadInfo}
      />
    </MapErrorBoundary>
  );
}
