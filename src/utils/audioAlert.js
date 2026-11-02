/**
 * Mandi Minutes - Vendor Live Order Audio Alert System
 * 
 * Standalone Web Audio API sound synthesizer inspired by Swiggy Partner & Zomato Business.
 * - Zero external MP3/audio assets: 100% offline & PWA friendly.
 * - Multi-harmonic arpeggiated chime (D5 -> A5 -> D6 -> A6) with smooth exponential decay.
 * - Continuous repeating alert loop until vendor accepts order or mutes.
 * - Persistent vendor sound preferences in localStorage.
 */

const STORAGE_KEY = 'mandi_vendor_sound_enabled';

let audioCtx = null;
let alertLoopTimer = null;
let isLooping = false;

function getStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch {}
  return null;
}

/**
 * Lazily instantiate or retrieve AudioContext singleton.
 * Safe in Node / SSR / test environments where AudioContext may not exist.
 */
function getAudioContext() {
  let AudioContextClass = null;
  if (typeof window !== 'undefined') {
    AudioContextClass = window.AudioContext || window.webkitAudioContext;
  } else if (typeof globalThis !== 'undefined' && globalThis.AudioContext) {
    AudioContextClass = globalThis.AudioContext;
  }
  if (!AudioContextClass) return null;

  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new AudioContextClass();
  }
  return audioCtx;
}

/**
 * Unlock AudioContext on user interaction (browser autoplay policy requirement).
 */
export async function unlockAudioContext() {
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      await ctx.resume();
    }
    return ctx?.state === 'running';
  } catch (err) {
    console.warn('[audioAlert] Failed to resume AudioContext:', err);
    return false;
  }
}

/**
 * Get whether sound alerts are enabled from localStorage (defaults to true).
 */
export function isSoundAlertEnabled() {
  const storage = getStorage();
  if (!storage) return true;
  try {
    const saved = storage.getItem(STORAGE_KEY);
    return saved === null ? true : saved === 'true';
  } catch {
    return true;
  }
}

/**
 * Update sound alert preference in localStorage.
 */
export function setSoundAlertEnabled(enabled) {
  const boolVal = Boolean(enabled);
  const storage = getStorage();
  if (storage) {
    try {
      storage.setItem(STORAGE_KEY, String(boolVal));
    } catch {}
  }
  if (!boolVal) {
    stopOrderAlertLoop();
  }
  return boolVal;
}

/**
 * Synthesizes a crisp, friendly, high-attention Swiggy/Zomato style order alert chime.
 * Uses 4 ascending notes with harmonic undertones and smooth exponential decay.
 */
export async function playOrderChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const now = ctx.currentTime || 0;
    // Pleasant ascending melodic chime: D5 (587.33Hz) -> A5 (880Hz) -> D6 (1174.66Hz) -> A6 (1760Hz)
    const notes = [
      { freq: 587.33, start: 0.00, dur: 0.22, vol: 0.35, type: 'triangle' },
      { freq: 880.00, start: 0.12, dur: 0.24, vol: 0.40, type: 'sine' },
      { freq: 1174.66, start: 0.24, dur: 0.28, vol: 0.45, type: 'triangle' },
      { freq: 1760.00, start: 0.38, dur: 0.55, vol: 0.50, type: 'sine' },
    ];

    // Master gain to avoid distortion and clipping
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.7, now);
    masterGain.connect(ctx.destination);

    notes.forEach(({ freq, start, dur, vol, type }) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + start);

      // Envelope: gentle attack, sustain, exponential decay
      const startTime = now + start;
      const endTime = startTime + dur;

      noteGain.gain.setValueAtTime(0.0001, startTime);
      noteGain.gain.exponentialRampToValueAtTime(vol, startTime + 0.02);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, endTime);

      osc.connect(noteGain);
      noteGain.connect(masterGain);

      osc.start(startTime);
      osc.stop(endTime);
    });
  } catch (err) {
    console.warn('[audioAlert] Web Audio playback failed:', err);
  }
}

/**
 * Starts a recurring chime loop every `intervalMs` (default 3500ms)
 * until `stopOrderAlertLoop()` is called.
 */
export function startOrderAlertLoop(intervalMs = 3500) {
  if (!isSoundAlertEnabled()) return;
  if (isLooping) return;

  isLooping = true;
  // Play immediately on first trigger
  playOrderChime();

  if (alertLoopTimer) clearInterval(alertLoopTimer);
  alertLoopTimer = setInterval(() => {
    if (!isSoundAlertEnabled() || !isLooping) {
      stopOrderAlertLoop();
      return;
    }
    playOrderChime();
  }, intervalMs);
}

/**
 * Stops the repeating chime alert.
 */
export function stopOrderAlertLoop() {
  if (alertLoopTimer) {
    clearInterval(alertLoopTimer);
    alertLoopTimer = null;
  }
  isLooping = false;
}

/**
 * Returns whether the alert loop is currently active.
 */
export function isAlertLoopActive() {
  return isLooping;
}

/**
 * Test chime triggered by vendor clicking "Test Sound" button.
 * Unlocks AudioContext and plays one chime burst regardless of mute state.
 */
export async function testSound() {
  await unlockAudioContext();
  await playOrderChime();
}
