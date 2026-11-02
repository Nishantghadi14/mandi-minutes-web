import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { validateAddress } from '../src/utils/validators';

describe('Mandatory Map Pin Address Validation', () => {
  const validBase = {
    label: 'Home',
    line1: 'Flat 402, Gokul Heights, Bolinj',
    city: 'Virar West',
    pincode: '401305',
  };

  it('passes regular validation when coordinates are not required', () => {
    const res = validateAddress(validBase);
    expect(res.valid).toBe(true);
    expect(res.errors.coordinates).toBeUndefined();
  });

  it('fails validation when requireCoordinates is true and lat/lng are missing', () => {
    const res = validateAddress(validBase, { requireCoordinates: true });
    expect(res.valid).toBe(false);
    expect(res.errors.coordinates).toBeDefined();
    expect(res.errors.coordinates).toContain('drop a pin on the map');
  });

  it('fails validation when lat or lng are 0 or NaN', () => {
    const resZero = validateAddress({ ...validBase, lat: 0, lng: 0 }, { requireCoordinates: true });
    expect(resZero.valid).toBe(false);
    expect(resZero.errors.coordinates).toBeDefined();

    const resNaN = validateAddress({ ...validBase, lat: 'abc', lng: 'xyz' }, { requireCoordinates: true });
    expect(resNaN.valid).toBe(false);
    expect(resNaN.errors.coordinates).toBeDefined();
  });

  it('passes validation when valid coordinates are provided and sanitizes them', () => {
    const res = validateAddress(
      { ...validBase, lat: 19.46741234, lng: 72.80554321 },
      { requireCoordinates: true }
    );
    expect(res.valid).toBe(true);
    expect(res.sanitized.lat).toBe(19.467412);
    expect(res.sanitized.lng).toBe(72.805543);
  });
});

describe('AddressMapPicker UI & Architecture Integration', () => {
  it('verifies AddressMapPicker contains center pin crosshair, GPS locator, and watermark-free dark tiles', () => {
    const code = fs.readFileSync(path.resolve(__dirname, '../src/components/common/AddressMapPicker.jsx'), 'utf8');
    expect(code).toContain('dark-map-tiles');
    expect(code).toContain('tile.openstreetmap.org');
    expect(code).toContain('Use My Current GPS');
    expect(code).toContain('navigator.geolocation');
    expect(code).toContain('Pin This Spot');
    expect(code).toContain('userInteractedRef');
    expect(code).toContain('Doorstep');
    expect(code).toContain('Store Pin');
  });

  it('verifies address forms start empty without default values or pre-pinned coordinates', () => {
    const checkoutCode = fs.readFileSync(path.resolve(__dirname, '../src/pages/CheckoutPage.jsx'), 'utf8');
    expect(checkoutCode).toContain("city: '', pincode: '', lat: null, lng: null");

    const profileCode = fs.readFileSync(path.resolve(__dirname, '../src/pages/ProfilePage.jsx'), 'utf8');
    expect(profileCode).toContain("city: '',\n    pincode: '',\n    lat: null,\n    lng: null");
  });

  it('verifies CheckoutPage embeds AddressMapPicker with mandatory coordinate validation', () => {
    const code = fs.readFileSync(path.resolve(__dirname, '../src/pages/CheckoutPage.jsx'), 'utf8');
    expect(code).toContain('import AddressMapPicker from');
    expect(code).toContain('<AddressMapPicker');
    expect(code).toContain('requireCoordinates: true');
    expect(code).toContain('addressErrors.coordinates');
  });

  it('verifies ProfilePage embeds AddressMapPicker in address modal with mandatory validation', () => {
    const code = fs.readFileSync(path.resolve(__dirname, '../src/pages/ProfilePage.jsx'), 'utf8');
    expect(code).toContain('import AddressMapPicker from');
    expect(code).toContain('<AddressMapPicker');
    expect(code).toContain('requireCoordinates: true');
    expect(code).toContain('addressErrors.coordinates');
  });

  it('verifies VendorOnboarding embeds AddressMapPicker and enforces store coordinates', () => {
    const code = fs.readFileSync(path.resolve(__dirname, '../src/pages/VendorOnboarding.jsx'), 'utf8');
    expect(code).toContain('import AddressMapPicker from');
    expect(code).toContain('<AddressMapPicker');
    expect(code).toContain('pinType="store"');
    expect(code).toContain('errors.coordinates');
    expect(code).toContain('latVal');
  });

  it('verifies VendorDashboard embeds AddressMapPicker and enforces store coordinates on settings update', () => {
    const code = fs.readFileSync(path.resolve(__dirname, '../src/pages/VendorDashboard.jsx'), 'utf8');
    expect(code).toContain('import AddressMapPicker from');
    expect(code).toContain('<AddressMapPicker');
    expect(code).toContain('pinType="store"');
    expect(code).toContain('storeSettingsError');
    expect(code).toContain('latVal');
  });

  it('verifies clicking Use My Current GPS resolves city & pincode and triggers autofill in address forms', () => {
    const pickerCode = fs.readFileSync(path.resolve(__dirname, '../src/components/common/AddressMapPicker.jsx'), 'utf8');
    expect(pickerCode).toContain('isGps: true');
    expect(pickerCode).toContain('bestLoc.city');
    expect(pickerCode).toContain('bestLoc.pincode');

    const profileCode = fs.readFileSync(path.resolve(__dirname, '../src/pages/ProfilePage.jsx'), 'utf8');
    expect(profileCode).toContain('coords.isGps && coords.city ? { city: coords.city }');
    expect(profileCode).toContain('coords.isGps && coords.pincode ? { pincode: coords.pincode }');

    const checkoutCode = fs.readFileSync(path.resolve(__dirname, '../src/pages/CheckoutPage.jsx'), 'utf8');
    expect(checkoutCode).toContain('coords.isGps && coords.city ? { city: coords.city }');
    expect(checkoutCode).toContain('coords.isGps && coords.pincode ? { pincode: coords.pincode }');
  });

  it('verifies RiderTrackerMap accepts customerCoordinates and storeCoordinates for real pin plotting', () => {
    const code = fs.readFileSync(path.resolve(__dirname, '../src/components/common/RiderTrackerMap.jsx'), 'utf8');
    expect(code).toContain('customerCoordinates = null');
    expect(code).toContain('storeCoordinates = null');
    expect(code).toContain('customerLatLng');
    expect(code).toContain('storeLatLng');
  });
});
