import { useEffect } from 'react';
import { useAppUpdateStore } from '../../store/useAppUpdateStore';
import { CURRENT_APP_VERSION } from '../../utils/appVersion';
import { isRiderApp } from '../../utils/platform';
import { Sparkles, ArrowRight, X, ShieldCheck, Download, RefreshCw } from 'lucide-react';

export default function AppUpdateModal() {
  const {
    updateAvailable,
    isCritical,
    remoteVersion,
    changelog,
    dismissed,
    checkForUpdates,
    dismissUpdate,
    triggerPlayStoreUpdate,
    otaStatus,
    otaProgress,
  } = useAppUpdateStore();

  const isRider = isRiderApp();

  // Run update check on mount
  useEffect(() => {
    checkForUpdates();
  }, [checkForUpdates]);

  if (!updateAvailable) return null;

  // ─── 1. MANDATORY / BLOCKING CRITICAL UPDATE SCREEN ───────────────────────────
  if (isCritical) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
        <div className="bg-mandi-card border border-emerald-500/30 rounded-3xl p-6 sm:p-8 w-full max-w-md text-center shadow-clay-floating space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 dark:text-mandi-green mx-auto shadow-clay-badge">
            <Sparkles size={32} className="animate-pulse" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-700 dark:text-mandi-green border border-emerald-500/30">
              <ShieldCheck size={13} /> Mandatory Update Required
            </span>
            <h2 className="text-2xl font-black text-mandi-text tracking-tight">
              Update Mandi Minutes
            </h2>
            <p className="text-mandi-muted text-xs leading-relaxed max-w-xs mx-auto">
              A major update ({remoteVersion ? `v${remoteVersion}` : 'latest'}) is required to continue enjoying lightning-fast delivery and real-time order tracking.
            </p>
          </div>

          {/* Current vs Remote version tag */}
          <div className="flex items-center justify-center gap-2 text-xs font-mono">
            <span className="px-2 py-1 bg-mandi-surface rounded-lg border border-mandi-border text-mandi-subtle">
              Installed: v{CURRENT_APP_VERSION}
            </span>
            <ArrowRight size={12} className="text-mandi-green" />
            <span className="px-2 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/30 text-emerald-600 dark:text-mandi-green font-bold">
              Latest: v{remoteVersion || 'Latest'}
            </span>
          </div>

          {/* Changelog Highlights */}
          {changelog && changelog.length > 0 && (
            <div className="text-left bg-mandi-surface border border-mandi-border rounded-2xl p-4 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-mandi-muted">
                What&apos;s New in this Release:
              </p>
              <ul className="space-y-1.5 text-xs text-mandi-text">
                {changelog.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-500 dark:text-mandi-green mt-0.5">•</span>
                    <span className="leading-tight">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action button */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={triggerPlayStoreUpdate}
              className="w-full btn-primary py-3.5 text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
            >
              {isRider ? <Download size={18} /> : <Sparkles size={18} />}
              <span>{isRider ? 'Download & Update Rider APK' : 'Update Now on Google Play'}</span>
            </button>
            <p className="text-[11px] text-mandi-subtle">
              Quick download · Takes less than 1 minute
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── 2. OPTIONAL DISMISSIBLE TOP BANNER ────────────────────────────────────────
  if (dismissed) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-2 sm:p-3 pointer-events-none animate-slide-in-down">
      <div className="max-w-xl mx-auto pointer-events-auto bg-gradient-to-r from-emerald-950/95 via-mandi-card to-emerald-950/95 border border-emerald-500/40 rounded-2xl p-3 sm:p-3.5 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
            {otaStatus === 'downloading' ? (
              <RefreshCw size={15} className="animate-spin text-mandi-green" />
            ) : (
              <Sparkles size={15} className="text-mandi-green" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-mandi-text truncate">
                New Update Available {remoteVersion && `(v${remoteVersion})`}
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-1.5 py-0.2 rounded border border-emerald-500/30">
                New
              </span>
            </div>
            <p className="text-mandi-muted text-[11px] truncate mt-0.5">
              {otaStatus === 'downloading'
                ? `Applying live update (${otaProgress}%)...`
                : 'Performance improvements and new local store features'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={triggerPlayStoreUpdate}
            className="btn-primary py-1.5 px-3 text-xs font-bold whitespace-nowrap shadow-sm cursor-pointer"
          >
            {isRider ? 'Update APK' : 'Update'}
          </button>
          <button
            type="button"
            onClick={dismissUpdate}
            className="p-1 rounded-lg text-mandi-subtle hover:text-mandi-text hover:bg-mandi-surface transition-colors cursor-pointer"
            aria-label="Dismiss update notification"
            title="Dismiss for this session"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
