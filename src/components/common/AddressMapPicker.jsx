import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react';
import { VIRAR_LOCALITIES } from '../../data/virarCoordinates';

// Fix Leaflet marker icons in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Quick locality shortcuts in the Virar/Vasai cluster
const VIRAR_SHORTCUTS = [
  { label: 'Bolinj', pincode: '401305', lat: 19.4674, lng: 72.8055 },
  { label: 'Viva College Rd', pincode: '401305', lat: 19.4620, lng: 72.8120 },
  { label: 'Global City', pincode: '401305', lat: 19.4530, lng: 72.8020 },
  { label: 'Agashi', pincode: '401305', lat: 19.4750, lng: 72.7980 },
  { label: 'Manvelpada (East)', pincode: '401303', lat: 19.4580, lng: 72.8220 },
  { label: 'Nallasopara', pincode: '401301', lat: 19.4200, lng: 72.8100 },
];

/** Helper hook to capture map movements and update the center pin coordinates */
function MapCenterController({ onCenterChange, initialCenter }) {
  const map = useMap();
  const isFirstRender = useRef(true);
  const userInteractedRef = useRef(false);

  useMapEvents({
    dragstart: () => {
      userInteractedRef.current = true;
    },
    zoomstart: () => {
      userInteractedRef.current = true;
    },
    moveend: () => {
      // ONLY trigger onCenterChange if user actually interacted with the map
      if (userInteractedRef.current) {
        const center = map.getCenter();
        onCenterChange(center.lat, center.lng);
      }
    },
    click: (e) => {
      userInteractedRef.current = true;
      map.panTo(e.latlng);
    },
  });

  useEffect(() => {
    if (initialCenter && isFirstRender.current) {
      map.setView(initialCenter, 16);
      isFirstRender.current = false;
    }
  }, [map, initialCenter]);

  // Invalidate size after modal transition/mount
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        map.invalidateSize();
      } catch {}
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);

  return null;
}

export default function AddressMapPicker({
  lat = null,
  lng = null,
  onChange = () => {},
  pinType = 'consumer', // 'consumer' | 'store'
  error = null,
  initialPincode = '401305',
  height = '240px',
}) {
  const [locatingGps, setLocatingGps] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [gpsSuccess, setGpsSuccess] = useState('');
  const mapRef = useRef(null);

  // Default coordinate fallback from Virar registry
  const defaultLoc = VIRAR_LOCALITIES[initialPincode] || VIRAR_LOCALITIES['401305'];
  const hasPin = Boolean(lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng)) && Number(lat) !== 0);

  const activeLat = hasPin ? Number(lat) : defaultLoc.lat;
  const activeLng = hasPin ? Number(lng) : defaultLoc.lng;

  // Reverse match nearest Virar locality from coordinates (only when pinned)
  const nearestLocality = useMemo(() => {
    if (!hasPin) return null;
    let closest = VIRAR_SHORTCUTS[0];
    let minDist = Infinity;
    for (const item of VIRAR_SHORTCUTS) {
      const d = Math.hypot(item.lat - activeLat, item.lng - activeLng);
      if (d < minDist) {
        minDist = d;
        closest = item;
      }
    }
    return closest;
  }, [hasPin, activeLat, activeLng]);

  const handleCenterChange = (newLat, newLng) => {
    const roundedLat = Number(newLat.toFixed(6));
    const roundedLng = Number(newLng.toFixed(6));
    
    // Only emit coordinates - never overwrite the user's typed address fields
    onChange({
      lat: roundedLat,
      lng: roundedLng,
    });
  };

  const handleUseGps = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsError('Geolocation is not supported by your device.');
      return;
    }

    setLocatingGps(true);
    setGpsError('');
    setGpsSuccess('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocatingGps(false);

        const roundedLat = Number(latitude.toFixed(6));
        const roundedLng = Number(longitude.toFixed(6));

        // 1. Instant local reverse-match from Virar localities registry
        let bestLoc = {
          city: 'Virar West',
          pincode: '401305',
          area: 'Bolinj',
        };

        let minDist = Infinity;
        for (const [pin, loc] of Object.entries(VIRAR_LOCALITIES)) {
          const d = Math.hypot(loc.lat - roundedLat, loc.lng - roundedLng);
          if (d < minDist) {
            minDist = d;
            bestLoc = {
              city: pin === '401303' ? 'Virar East' : pin === '401301' ? 'Nallasopara' : pin.startsWith('4012') ? 'Vasai' : 'Virar West',
              pincode: pin,
              area: loc.name.split('(')[1]?.replace(')', '') || loc.name,
            };
          }
        }

        // 2. Try fast OpenStreetMap reverse geocode query with 1.8s timeout
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1800);
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${roundedLat}&lon=${roundedLng}&format=json&addressdetails=1`,
            { signal: controller.signal }
          );
          clearTimeout(timeoutId);
          if (res.ok) {
            const data = await res.json();
            if (data?.address) {
              const detectedPin = data.address.postcode?.replace(/\D/g, '').slice(0, 6);
              const detectedCity = data.address.city || data.address.town || data.address.suburb || data.address.municipality || data.address.city_district || data.address.village;
              if (detectedPin && detectedPin.length === 6) {
                bestLoc.pincode = detectedPin;
              }
              if (detectedCity) {
                bestLoc.city = detectedCity;
              }
              if (data.address.suburb || data.address.neighbourhood || data.address.residential || data.address.road) {
                bestLoc.area = data.address.suburb || data.address.neighbourhood || data.address.residential || data.address.road;
              }
            }
          }
        } catch {}

        // Emit coordinates + GPS autofill data
        onChange({
          lat: roundedLat,
          lng: roundedLng,
          city: bestLoc.city,
          pincode: bestLoc.pincode,
          area: bestLoc.area,
          isGps: true,
        });

        setGpsSuccess(`GPS location pinned! Autofilled ${bestLoc.city} - ${bestLoc.pincode}`);

        if (mapRef.current) {
          mapRef.current.flyTo([latitude, longitude], 17, { animate: true, duration: 1 });
        }
      },
      (err) => {
        setLocatingGps(false);
        setGpsError(err.code === 1 ? 'Location permission denied. Please pan the map manually.' : 'Could not detect GPS location.');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  };

  const handleJumpToLocality = (item) => {
    handleCenterChange(item.lat, item.lng);
    if (mapRef.current) {
      mapRef.current.flyTo([item.lat, item.lng], 16, { animate: true });
    }
  };

  return (
    <div className="space-y-2 select-none">
      {/* Header Bar: Label & GPS Button */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-mandi-text flex items-center gap-1.5">
          <MapPin size={14} className="text-mandi-green" />
          <span>{pinType === 'store' ? 'Exact Store Pin on Map' : 'Exact Doorstep Pin on Map'}</span>
          <span className="text-red-400 font-bold">*</span>
        </label>

        <button
          type="button"
          onClick={handleUseGps}
          disabled={locatingGps}
          className="text-[11px] font-bold text-mandi-green hover:text-emerald-300 flex items-center gap-1 bg-mandi-surface border border-mandi-green/40 px-2.5 py-1 rounded-xl active:scale-95 transition-all shadow-sm"
        >
          <Navigation size={12} className={locatingGps ? 'animate-spin' : ''} />
          <span>{locatingGps ? 'Locating...' : 'Use My Current GPS'}</span>
        </button>
      </div>

      {/* Quick Sector Shortcut Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
        <span className="text-[10px] text-mandi-subtle font-mono uppercase flex-shrink-0">Jump:</span>
        {VIRAR_SHORTCUTS.map(item => (
          <button
            key={item.label}
            type="button"
            onClick={() => handleJumpToLocality(item)}
            className="px-2 py-0.5 rounded-lg bg-mandi-surface hover:bg-mandi-card border border-mandi-border text-mandi-muted hover:text-mandi-text flex-shrink-0 transition-colors"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Interactive Map Box with Fixed Center Crosshair Pin */}
      <div 
        className={`relative w-full rounded-2xl overflow-hidden border transition-all ${
          error ? 'border-red-500 ring-2 ring-red-500/20' : hasPin ? 'border-mandi-green/50' : 'border-mandi-border'
        }`}
        style={{ height }}
      >
        <MapContainer
          key="address-picker-map"
          center={[activeLat, activeLng]}
          zoom={16}
          scrollWheelZoom={false}
          className="w-full h-full"
          style={{ background: '#0a0e17' }}
          ref={mapRef}
        >
          {/* Map Movement Controller */}
          <MapCenterController 
            onCenterChange={handleCenterChange} 
            initialCenter={[activeLat, activeLng]} 
          />

          {/* Watermark-Free OpenStreetMap Tiles with Obsidian Dark Theme */}
          <TileLayer
            className="dark-map-tiles"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            subdomains={['a', 'b', 'c']}
            maxZoom={19}
          />
        </MapContainer>

        {/* ── Fixed Center Delivery Pin (Uber/Swiggy Style Crosshair) ── */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none z-[400] flex flex-col items-center">
          {/* Floating Pill Label */}
          <div className={`backdrop-blur-md border px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shadow-lg flex items-center gap-1 mb-1 ${
            hasPin 
              ? 'bg-emerald-950/95 border-emerald-500/60 text-emerald-300' 
              : 'bg-amber-950/95 border-amber-500/60 text-amber-300 animate-bounce'
          }`}>
            <span>
              {hasPin 
                ? (pinType === 'store' ? '🏪 Confirmed Store Pin' : '🏠 Confirmed Doorstep Pin') 
                : (pinType === 'store' ? '🏪 Drag to Pin Store' : '🏠 Drag to Pin Doorstep')}
            </span>
          </div>

          {/* Pin Graphic */}
          <div className="relative">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xl shadow-xl border-2 border-black ${
              pinType === 'store' ? 'bg-blue-600' : 'bg-mandi-green text-black'
            }`}>
              {pinType === 'store' ? '🏪' : '📍'}
            </div>
            {/* Ground shadow ripple */}
            <div className="w-3 h-1 bg-black/60 rounded-full mx-auto mt-0.5 blur-[1px]" />
          </div>
        </div>

        {/* Top Floating Helper Overlay */}
        <div className="absolute top-2.5 left-2.5 right-2.5 pointer-events-none z-[400] flex items-center justify-between">
          <div className="bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] text-mandi-muted border border-white/10 shadow-md">
            Drag the map to center the pin on your exact entrance
          </div>
        </div>

        {/* Bottom Pinned Coordinates Status Bar */}
        <div className="absolute bottom-2 left-2 right-2 pointer-events-none z-[400] flex items-center justify-between gap-2">
          <div className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold flex items-center gap-1.5 backdrop-blur-md shadow-md border ${
            hasPin 
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40' 
              : 'bg-amber-950/90 text-amber-300 border-amber-500/40'
          }`}>
            {hasPin ? (
              <>
                <CheckCircle2 size={12} className="text-mandi-green" />
                <span>Pinned: {activeLat.toFixed(4)}, {activeLng.toFixed(4)}{nearestLocality ? ` (${nearestLocality.label})` : ''}</span>
              </>
            ) : (
              <>
                <AlertCircle size={12} className="text-amber-400" />
                <span>Move map or pin spot *</span>
              </>
            )}
          </div>

          {!hasPin && (
            <button
              type="button"
              onClick={() => handleCenterChange(activeLat, activeLng)}
              className="pointer-events-auto bg-amber-400 hover:bg-amber-300 active:scale-95 text-black font-extrabold px-2.5 py-1 rounded-xl text-[10px] shadow-lg transition-transform flex items-center gap-1 cursor-pointer"
            >
              <span>📍 Pin This Spot</span>
            </button>
          )}
        </div>
      </div>

      {/* Validation Error Banner */}
      {error && (
        <p className="text-red-400 text-xs flex items-center gap-1 mt-1 font-medium">
          <AlertCircle size={13} className="text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {gpsSuccess && (
        <p className="text-emerald-400 text-[11px] font-medium flex items-center gap-1 mt-0.5">
          <CheckCircle2 size={12} className="text-mandi-green flex-shrink-0" />
          <span>{gpsSuccess}</span>
        </p>
      )}

      {gpsError && (
        <p className="text-amber-400 text-[11px] mt-0.5">
          {gpsError}
        </p>
      )}
    </div>
  );
}
