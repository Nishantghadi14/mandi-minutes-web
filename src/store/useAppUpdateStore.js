import { create } from 'zustand';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { CURRENT_APP_VERSION, compareVersions, openPlayStore } from '../utils/appVersion';
import { isNativeApp, isRiderApp } from '../utils/platform';

export const useAppUpdateStore = create((set, get) => ({
  isChecking: false,
  updateAvailable: false,
  isCritical: false,
  remoteVersion: null,
  minVersion: null,
  changelog: [],
  apkDownloadUrl: null,
  dismissed: false,

  // OTA state (Capgo / Live Updates)
  otaStatus: 'idle', // 'idle' | 'checking' | 'downloading' | 'ready' | 'error'
  otaProgress: 0,
  otaError: null,
  otaBundleVersion: null,

  dismissUpdate: () => {
    // Only allow dismissing if the update is non-critical
    if (!get().isCritical) {
      set({ dismissed: true });
    }
  },

  checkForUpdates: async () => {
    set({ isChecking: true });
    const isRider = isRiderApp();

    try {
      let configData = null;

      if (db) {
        try {
          const docRef = doc(db, 'app_config', 'version');
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            configData = snap.data();
          }
        } catch (dbErr) {
          console.warn('Firebase update config check notice:', dbErr?.message);
        }
      }

      // Fallback configuration if Firestore config doc doesn't exist yet
      if (!configData) {
        configData = {
          min_supported_version: '1.0.0',
          latest_version: CURRENT_APP_VERSION,
          rider_min_version: '1.0.0',
          rider_latest_version: CURRENT_APP_VERSION,
          rider_apk_url: 'https://mandiminutes.com/download/mandi-rider.apk',
          changelog: [
            'Hyperlocal grocery delivery in 10-15 minutes across Virar',
            'Live GPS rider delivery tracking map',
            'Monthly kirana partner settlements & payouts'
          ],
        };
      }

      const minVer = isRider
        ? (configData.rider_min_version || configData.min_supported_version || '1.0.0')
        : (configData.min_supported_version || '1.0.0');

      const latestVer = isRider
        ? (configData.rider_latest_version || configData.latest_version || CURRENT_APP_VERSION)
        : (configData.latest_version || CURRENT_APP_VERSION);

      const changelog = Array.isArray(configData.changelog)
        ? configData.changelog
        : [configData.changelog].filter(Boolean);

      const isBelowMin = compareVersions(CURRENT_APP_VERSION, minVer) < 0;
      const isBelowLatest = compareVersions(CURRENT_APP_VERSION, latestVer) < 0;

      if (isBelowMin) {
        // Critical / mandatory update required
        set({
          isChecking: false,
          updateAvailable: true,
          isCritical: true,
          remoteVersion: latestVer,
          minVersion: minVer,
          changelog,
          apkDownloadUrl: configData.rider_apk_url || null,
          dismissed: false,
        });
      } else if (isBelowLatest) {
        // Optional update available
        set({
          isChecking: false,
          updateAvailable: true,
          isCritical: false,
          remoteVersion: latestVer,
          minVersion: minVer,
          changelog,
          apkDownloadUrl: configData.rider_apk_url || null,
        });
      } else {
        set({
          isChecking: false,
          updateAvailable: false,
          isCritical: false,
          remoteVersion: latestVer,
          minVersion: minVer,
        });
      }

      // Check OTA live updates in the background on native apps
      if (isNativeApp()) {
        get().checkOtaUpdate();
      }
    } catch (err) {
      console.warn('Update check notice:', err?.message);
      set({ isChecking: false });
    }
  },

  checkOtaUpdate: async () => {
    if (!isNativeApp()) return;

    try {
      set({ otaStatus: 'checking' });
      // Dynamically load Capgo updater if available in native runtime
      const capgoPkg = '@capgo/capacitor-updater';
      const updaterModule = await import(/* @vite-ignore */ capgoPkg).catch(() => null);
      if (!updaterModule?.CapacitorUpdater) {
        set({ otaStatus: 'idle' });
        return;
      }

      const { CapacitorUpdater } = updaterModule;

      // Listen to download progress
      try {
        CapacitorUpdater.addListener('download', (info) => {
          set({
            otaStatus: 'downloading',
            otaProgress: info?.percent || 0,
          });
        });
      } catch {}

      // Notify Capacitor native container that the current bundle is functional
      try {
        await CapacitorUpdater.notifyAppReady();
      } catch {}

      set({ otaStatus: 'idle' });
    } catch (err) {
      console.warn('Capgo OTA status notice:', err?.message);
      set({ otaStatus: 'error', otaError: err?.message });
    }
  },

  triggerPlayStoreUpdate: () => {
    const isRider = isRiderApp();
    const { apkDownloadUrl } = get();

    if (isRider && apkDownloadUrl) {
      window.open(apkDownloadUrl, '_system');
    } else {
      openPlayStore(isRider ? 'com.mandiminutes.rider' : 'com.mandiminutes.app');
    }
  },

  setSimulatedUpdate: ({ isCritical = false, remoteVersion = '1.1.0', changelog = [] } = {}) => {
    set({
      updateAvailable: true,
      isCritical,
      remoteVersion,
      minVersion: isCritical ? remoteVersion : '1.0.0',
      changelog: changelog.length > 0 ? changelog : [
        'Enhanced checkout speed & live GPS accuracy',
        'Kirana partner direct settlements upgrade',
        'Bug fixes and battery consumption improvements'
      ],
      dismissed: false,
    });
  },

  resetUpdate: () => {
    set({
      updateAvailable: false,
      isCritical: false,
      remoteVersion: null,
      minVersion: null,
      changelog: [],
      dismissed: false,
      otaStatus: 'idle',
      otaProgress: 0,
      otaError: null,
    });
  },
}));
