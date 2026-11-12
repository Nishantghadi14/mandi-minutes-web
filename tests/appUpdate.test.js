import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  CURRENT_APP_VERSION,
  CURRENT_BUILD_CODE,
  CUSTOMER_PACKAGE_ID,
  RIDER_PACKAGE_ID,
  compareVersions,
  getPlayStoreUrl,
  openPlayStore,
} from '../src/utils/appVersion';
import { useAppUpdateStore } from '../src/store/useAppUpdateStore';

describe('App Version Utilities (appVersion.js)', () => {
  it('exports correct constants for customer and rider apps', () => {
    expect(CURRENT_APP_VERSION).toBe('1.0.0');
    expect(CURRENT_BUILD_CODE).toBe(1);
    expect(CUSTOMER_PACKAGE_ID).toBe('com.mandiminutes.app');
    expect(RIDER_PACKAGE_ID).toBe('com.mandiminutes.rider');
  });

  describe('compareVersions()', () => {
    it('returns 0 for identical versions', () => {
      expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
      expect(compareVersions('2.4.15', '2.4.15')).toBe(0);
    });

    it('returns 1 when v1 is newer than v2', () => {
      expect(compareVersions('1.0.1', '1.0.0')).toBe(1);
      expect(compareVersions('1.1.0', '1.0.9')).toBe(1);
      expect(compareVersions('2.0.0', '1.9.9')).toBe(1);
      expect(compareVersions('1.0.10', '1.0.2')).toBe(1);
    });

    it('returns -1 when v1 is older than v2', () => {
      expect(compareVersions('1.0.0', '1.0.1')).toBe(-1);
      expect(compareVersions('0.9.9', '1.0.0')).toBe(-1);
      expect(compareVersions('1.0.5', '1.1.0')).toBe(-1);
    });

    it('handles differing segment counts and edge cases cleanly', () => {
      expect(compareVersions('1.0', '1.0.0')).toBe(0);
      expect(compareVersions('1', '1.0.0')).toBe(0);
      expect(compareVersions('1.1', '1.0.5')).toBe(1);
      expect(compareVersions(null, null)).toBe(0);
      expect(compareVersions(null, '1.0.0')).toBe(-1);
      expect(compareVersions('1.0.0', null)).toBe(1);
    });
  });

  describe('getPlayStoreUrl() and openPlayStore()', () => {
    it('generates standard HTTPS Play Store web URLs by default', () => {
      const customerWeb = getPlayStoreUrl(CUSTOMER_PACKAGE_ID, false);
      expect(customerWeb).toBe('https://play.google.com/store/apps/details?id=com.mandiminutes.app');

      const riderWeb = getPlayStoreUrl(RIDER_PACKAGE_ID, false);
      expect(riderWeb).toBe('https://play.google.com/store/apps/details?id=com.mandiminutes.rider');
    });

    it('generates market:// deep link URLs for native devices', () => {
      const customerMarket = getPlayStoreUrl(CUSTOMER_PACKAGE_ID, true);
      expect(customerMarket).toBe('market://details?id=com.mandiminutes.app');

      const riderMarket = getPlayStoreUrl(RIDER_PACKAGE_ID, true);
      expect(riderMarket).toBe('market://details?id=com.mandiminutes.rider');
    });

    it('openPlayStore() triggers window.open on browser fallback', () => {
      const windowOpenMock = vi.fn();
      global.window = {
        open: windowOpenMock,
        location: { href: '' },
      };

      openPlayStore(CUSTOMER_PACKAGE_ID);
      expect(windowOpenMock).toHaveBeenCalledWith(
        'https://play.google.com/store/apps/details?id=com.mandiminutes.app',
        '_blank',
        'noopener,noreferrer'
      );

      delete global.window;
    });
  });
});

describe('useAppUpdateStore (Global State Management)', () => {
  beforeEach(() => {
    useAppUpdateStore.getState().resetUpdate();
  });

  afterEach(() => {
    useAppUpdateStore.getState().resetUpdate();
    vi.restoreAllMocks();
  });

  it('initializes with default non-active update state', () => {
    const state = useAppUpdateStore.getState();
    expect(state.updateAvailable).toBe(false);
    expect(state.isCritical).toBe(false);
    expect(state.dismissed).toBe(false);
    expect(state.remoteVersion).toBeNull();
  });

  it('supports simulating optional updates and permits user dismissal', () => {
    useAppUpdateStore.getState().setSimulatedUpdate({
      isCritical: false,
      remoteVersion: '1.1.0',
      changelog: ['Feature A', 'Feature B'],
    });

    let state = useAppUpdateStore.getState();
    expect(state.updateAvailable).toBe(true);
    expect(state.isCritical).toBe(false);
    expect(state.remoteVersion).toBe('1.1.0');
    expect(state.changelog).toEqual(['Feature A', 'Feature B']);
    expect(state.dismissed).toBe(false);

    // Optional update can be dismissed
    useAppUpdateStore.getState().dismissUpdate();
    state = useAppUpdateStore.getState();
    expect(state.dismissed).toBe(true);
  });

  it('supports simulating critical mandatory updates and prevents user dismissal', () => {
    useAppUpdateStore.getState().setSimulatedUpdate({
      isCritical: true,
      remoteVersion: '2.0.0',
      changelog: ['Critical Security Upgrade'],
    });

    let state = useAppUpdateStore.getState();
    expect(state.updateAvailable).toBe(true);
    expect(state.isCritical).toBe(true);
    expect(state.remoteVersion).toBe('2.0.0');
    expect(state.dismissed).toBe(false);

    // Critical update dismissal is blocked
    useAppUpdateStore.getState().dismissUpdate();
    state = useAppUpdateStore.getState();
    expect(state.dismissed).toBe(false);
  });

  it('resetUpdate() clears all update and OTA flags back to pristine state', () => {
    useAppUpdateStore.getState().setSimulatedUpdate({
      isCritical: true,
      remoteVersion: '2.0.0',
    });

    useAppUpdateStore.getState().resetUpdate();
    const state = useAppUpdateStore.getState();
    expect(state.updateAvailable).toBe(false);
    expect(state.isCritical).toBe(false);
    expect(state.remoteVersion).toBeNull();
    expect(state.dismissed).toBe(false);
    expect(state.otaStatus).toBe('idle');
  });
});

describe('Architecture & Component Integration Verification', () => {
  it('verifies App.jsx mounts the AppUpdateModal component globally', () => {
    const appPath = path.resolve(__dirname, '../src/App.jsx');
    const appCode = fs.readFileSync(appPath, 'utf8');

    expect(appCode).toContain('AppUpdateModal');
    expect(appCode).toContain('<AppUpdateModal />');
  });

  it('verifies ProfilePage.jsx features version display and Check for Updates trigger', () => {
    const profilePath = path.resolve(__dirname, '../src/pages/ProfilePage.jsx');
    const profileCode = fs.readFileSync(profilePath, 'utf8');

    expect(profileCode).toContain('CURRENT_APP_VERSION');
    expect(profileCode).toContain('useAppUpdateStore');
    expect(profileCode).toContain('Check for Updates');
    expect(profileCode).toContain('checkForUpdates');
  });

  it('verifies AdminPanel.jsx includes App Releases & OTA tab with dual-channel controls', () => {
    const adminPath = path.resolve(__dirname, '../src/pages/AdminPanel.jsx');
    const adminCode = fs.readFileSync(adminPath, 'utf8');

    expect(adminCode).toContain("id: 'releases',  label: 'App Releases & OTA'");
    expect(adminCode).toContain("activeTab === 'releases'");
    expect(adminCode).toContain('Channel 1: Live OTA Web Updates');
    expect(adminCode).toContain('Channel 2: Google Play &amp; Native APKs');
    expect(adminCode).toContain('Remote In-App Version Gates');
    expect(adminCode).toContain('Test Optional Update');
    expect(adminCode).toContain('Test Force / Critical Update');
  });
});
