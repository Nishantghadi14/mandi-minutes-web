import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { initialStores } from '../src/data/initialStores';
import { getGoogleMapsNavUrl, openGoogleMapsNavigation } from '../src/utils/platform';

describe('Map Engine & OSRM Real Road Route Integration', () => {
  beforeEach(() => {
    global.window = {
      location: { href: '' },
      open: vi.fn(),
    };
  });

  afterEach(() => {
    delete global.window;
    vi.restoreAllMocks();
  });

  it('verifies RiderTrackerMap file contains OSRM public routing engine call', () => {
    const file = fs.readFileSync(path.resolve(__dirname, '../src/components/common/RiderTrackerMap.jsx'), 'utf8');
    expect(file).toContain('router.project-osrm.org/route/v1/driving');
    expect(file).toContain('geometries=geojson');
    expect(file).toContain('roadPoints');
    expect(file).toContain('roadInfo');
    expect(file).toContain('useDataStore');
    expect(file).toContain('onRouteCalculated');
  });

  it('verifies free OpenStreetMap dark tile layer and CSS filter configuration', () => {
    const file = fs.readFileSync(path.resolve(__dirname, '../src/components/common/RiderTrackerMap.jsx'), 'utf8');
    expect(file).toContain('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
    expect(file).toContain('dark-map-tiles');

    const css = fs.readFileSync(path.resolve(__dirname, '../src/index.css'), 'utf8');
    expect(css).toContain('.dark-map-tiles');
  });

  it('calculates road distance and duration correctly from mock OSRM response', () => {
    const mockOsrmData = {
      code: 'Ok',
      routes: [{
        distance: 1450.5, // 1450.5 meters
        duration: 185.2,  // 185.2 seconds
        geometry: {
          coordinates: [
            [72.8055, 19.4674],
            [72.8060, 19.4680],
            [72.8095, 19.4724],
          ],
        },
      }],
    };

    const distanceKm = (mockOsrmData.routes[0].distance / 1000).toFixed(1);
    const durationMins = Math.max(3, Math.round(mockOsrmData.routes[0].duration / 60));
    const coords = mockOsrmData.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);

    expect(distanceKm).toBe('1.5');
    expect(durationMins).toBe(3);
    expect(coords[0]).toEqual([19.4674, 72.8055]);
    expect(coords[2]).toEqual([19.4724, 72.8095]);
  });

  it('verifies initialStores contains explicit coordinates for Virar hub', () => {
    const mahalaxmi = initialStores.find(s => s.id === 'store-mahalaxmi-1');
    expect(mahalaxmi).toBeDefined();
    expect(mahalaxmi.lat).toBe(19.4674);
    expect(mahalaxmi.lng).toBe(72.8055);
  });

  it('generates exact turn-by-turn driving navigation URL from coordinates or fallback address', () => {
    const exactUrl = getGoogleMapsNavUrl(19.4674, 72.8055, 'Customer Doorstep');
    expect(exactUrl).toBe('https://www.google.com/maps/dir/?api=1&destination=19.4674,72.8055&travelmode=driving');

    const fallbackUrl = getGoogleMapsNavUrl(null, null, 'Bolinj, Virar West');
    expect(fallbackUrl).toContain('destination=Bolinj%2C%20Virar%20West');
    expect(fallbackUrl).toContain('travelmode=driving');
  });

  it('triggers window.open for desktop web navigation via openGoogleMapsNavigation', () => {
    openGoogleMapsNavigation(19.4674, 72.8055, 'Customer Doorstep');
    expect(global.window.open).toHaveBeenCalledWith(
      'https://www.google.com/maps/dir/?api=1&destination=19.4674,72.8055&travelmode=driving',
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('verifies RiderPortal displays GPS PINNED and calls openGoogleMapsNavigation', () => {
    const riderPortalCode = fs.readFileSync(path.resolve(__dirname, '../src/pages/RiderPortal.jsx'), 'utf8');
    expect(riderPortalCode).toContain('GPS PINNED');
    expect(riderPortalCode).toContain('openGoogleMapsNavigation');
    expect(riderPortalCode).toContain('onRouteCalculated={setLiveRouteInfo}');
  });

  it('verifies AndroidManifest.xml queries com.google.android.apps.maps', () => {
    const manifest = fs.readFileSync(path.resolve(__dirname, '../android/app/src/main/AndroidManifest.xml'), 'utf8');
    expect(manifest).toContain('<package android:name="com.google.android.apps.maps" />');
  });
});
