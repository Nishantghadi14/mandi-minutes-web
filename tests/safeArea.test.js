import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { isNativeApp, isInAppMode, isRiderApp, getAppHomePath } from '../src/utils/platform';

describe('Safe Area & Status Bar System Configuration', () => {
  it('correctly reports platform status and app modes', () => {
    // In node/vitest environment, isNativeApp() should be safely false without errors
    expect(isNativeApp()).toBe(false);
    expect(isInAppMode('/')).toBe(false);
    expect(getAppHomePath()).toBe('/');
  });

  it('verifies capacitor.config.json has SystemBars plugin with viewport cover configured', () => {
    const configRaw = fs.readFileSync(path.resolve(__dirname, '../capacitor.config.json'), 'utf8');
    const config = JSON.parse(configRaw);

    expect(config.plugins?.SystemBars).toBeDefined();
    expect(config.plugins.SystemBars.initialViewportFitValueHint).toBe('cover');
    expect(config.plugins.SystemBars.style).toBe('DARK');
  });

  it('verifies capacitor.rider.json has SystemBars plugin with viewport cover configured', () => {
    const configRaw = fs.readFileSync(path.resolve(__dirname, '../capacitor.rider.json'), 'utf8');
    const config = JSON.parse(configRaw);

    expect(config.plugins?.SystemBars).toBeDefined();
    expect(config.plugins.SystemBars.initialViewportFitValueHint).toBe('cover');
    expect(config.plugins.SystemBars.style).toBe('DARK');
  });

  it('verifies index.css defines safe area and status bar metrics and utility classes', () => {
    const css = fs.readFileSync(path.resolve(__dirname, '../src/index.css'), 'utf8');

    expect(css).toContain('--app-status-bar-height');
    expect(css).toContain('--app-nav-bar-height');
    expect(css).toContain('html.is-native-app');
    expect(css).toContain('.pt-app-header');
    expect(css).toContain('.pt-app-header-sm');
    expect(css).toContain('.pt-app-content');
    expect(css).toContain('.top-app-header-btn');
    expect(css).toContain('.pb-app-nav');
  });

  it('verifies RiderPortal header uses .pt-app-header to clear native status bar', () => {
    const riderPortalCode = fs.readFileSync(path.resolve(__dirname, '../src/pages/RiderPortal.jsx'), 'utf8');
    expect(riderPortalCode).toContain('pt-app-header');
    expect(riderPortalCode).toContain('pb-app-nav');
  });

  it('verifies MobileAppHome header uses .pt-app-header-sm to clear native status bar', () => {
    const mobileHomeCode = fs.readFileSync(path.resolve(__dirname, '../src/pages/MobileAppHome.jsx'), 'utf8');
    expect(mobileHomeCode).toContain('pt-app-header-sm');
  });
});
