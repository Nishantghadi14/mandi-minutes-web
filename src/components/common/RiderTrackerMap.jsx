import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { STORE_COORDINATES, VIRAR_LOCALITIES } from '../../data/virarCoordinates';
import { useLocationStore } from '../../store/useLocationStore';

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

function VirarVisualTimeline({ storeName, targetName, progress }) {
  return (
    <div className="w-full h-[240px] bg-mandi-surface rounded-2xl border border-mandi-border p-5 flex flex-col justify-between shadow-card">
      <div className="flex items-center justify-between">
        <span className="badge-green text-xs font-bold flex items-center gap-1">⚡ Express Route Virar</span>
        <span className="text-mandi-muted text-xs font-mono">Arriving in ~12 Mins</span>
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
        <span className="text-mandi-green font-bold">{Math.round(progress * 100)}% Route Covered</span>
        <span className="font-medium text-mandi-text">{targetName}</span>
      </div>
    </div>
  );
}

function MapViewport({ position, useLivePosition }) {
  const map = useMap();

  useEffect(() => {
    if (useLivePosition && position) {
      map.setView(position, Math.max(map.getZoom(), 15), { animate: true });
    }
  }, [map, position, useLivePosition]);

  return null;
}

function LeafletMapInner({ storeLatLng, customerLatLng, currentRiderLatLng, routePolyline, storePos, targetLoc, orderStatus, progress, isLiveGps }) {
  const storeIcon = useMemo(() => {
    try {
      return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<div style="width:38px;height:38px;background:#2563eb;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;border:2.5px solid #121212;box-shadow:0 4px 10px rgba(0,0,0,0.5);">🏪</div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 38],
      });
    } catch { return null; }
  }, []);

  const riderIcon = useMemo(() => {
    try {
      return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<div style="width:38px;height:38px;background:#00C851;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;border:2.5px solid #121212;box-shadow:0 4px 10px rgba(0,200,81,0.5);">🛵</div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 38],
      });
    } catch { return null; }
  }, []);

  const homeIcon = useMemo(() => {
    try {
      return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<div style="width:38px;height:38px;background:#9333ea;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;border:2.5px solid #121212;box-shadow:0 4px 10px rgba(0,0,0,0.5);">🏠</div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 38],
      });
    } catch { return null; }
  }, []);

  const centerLatLng = [
    (storeLatLng[0] + customerLatLng[0]) / 2,
    (storeLatLng[1] + customerLatLng[1]) / 2,
  ];

  return (
    <div className="relative w-full h-[340px] rounded-2xl overflow-hidden border border-mandi-border z-0 shadow-card">
      <MapContainer
        key="virar-live-map"
        center={centerLatLng}
        zoom={14}
        scrollWheelZoom={false}
        className="w-full h-full"
        style={{ background: '#121212' }}
      >
        <MapViewport position={currentRiderLatLng} useLivePosition={isLiveGps} />
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <Polyline
          positions={routePolyline}
          color="#00C851"
          weight={4}
          dashArray="8, 8"
          opacity={0.85}
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

      <div className="absolute top-3 left-3 bg-mandi-card bg-opacity-90 backdrop-blur-md border border-mandi-border rounded-xl px-3 py-1.5 text-xs z-[400] flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-mandi-green animate-ping" />
        <span className="text-mandi-text font-bold">
          {isLiveGps ? 'Live GPS Active (Virar)' : 'Live Virar Route Map'}
        </span>
      </div>
    </div>
  );
}

export default function RiderTrackerMap({ storeId = 'store-mahalaxmi-1', customerPincode = '401305', orderStatus = 'out_for_delivery', liveRiderLocation = null }) {
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState(0.4);
  const riderPosition = useLocationStore(state => state.riderPosition);
  const riderGpsStatus = useLocationStore(state => state.riderGpsStatus);

  const storePos = STORE_COORDINATES[storeId] || { name: 'Kirana Store (Virar)', lat: 19.4674, lng: 72.8055 };
  const targetLoc = VIRAR_LOCALITIES[customerPincode] || VIRAR_LOCALITIES['401305'];

  const storeLatLng = [storePos.lat, storePos.lng];
  const customerLatLng = [targetLoc.lat + 0.005, targetLoc.lng + 0.004];

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const simulatedRiderLatLng = [
    storeLatLng[0] + (customerLatLng[0] - storeLatLng[0]) * progress,
    storeLatLng[1] + (customerLatLng[1] - storeLatLng[1]) * progress,
  ];

  // Prioritize live coordinates from Firestore order, then local rider GPS state, then simulated track
  const isLiveGps = Boolean(liveRiderLocation || (riderPosition && riderGpsStatus === 'active'));
  const currentRiderLatLng = liveRiderLocation
    ? [liveRiderLocation.lat, liveRiderLocation.lng]
    : riderPosition
    ? [riderPosition.lat, riderPosition.lng]
    : simulatedRiderLatLng;

  const routePolyline = [storeLatLng, currentRiderLatLng, customerLatLng];

  const fallback = <VirarVisualTimeline storeName={storePos.name} targetName={targetLoc.name} progress={progress} />;

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
        orderStatus={orderStatus}
        progress={progress}
        isLiveGps={isLiveGps}
      />
    </MapErrorBoundary>
  );
}
