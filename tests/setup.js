import { vi } from 'vitest';

// Mock Leaflet and React-Leaflet in Node.js test environment
vi.mock('leaflet', () => {
  const mockL = {
    Icon: {
      Default: {
        prototype: {},
        mergeOptions: () => {},
      },
    },
    divIcon: () => ({}),
  };
  return {
    default: mockL,
    ...mockL,
  };
});

vi.mock('react-leaflet', () => ({
  MapContainer: () => null,
  TileLayer: () => null,
  Marker: () => null,
  Popup: () => null,
  Polyline: () => null,
  useMap: () => ({
    getCenter: () => ({ lat: 19.4674, lng: 72.8055 }),
    setView: () => {},
    panTo: () => {},
    flyTo: () => {},
    invalidateSize: () => {},
    fitBounds: () => {},
    getZoom: () => 14,
  }),
  useMapEvents: () => {},
}));
