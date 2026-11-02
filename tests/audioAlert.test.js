import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isSoundAlertEnabled,
  setSoundAlertEnabled,
  startOrderAlertLoop,
  stopOrderAlertLoop,
  isAlertLoopActive,
  playOrderChime,
  testSound,
  unlockAudioContext
} from '../src/utils/audioAlert';

// Hermetic localStorage mock for testing
const mockStorage = new Map();
globalThis.localStorage = {
  getItem: (key) => mockStorage.get(key) ?? null,
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
};

describe('Vendor Audio Alert System', () => {
  beforeEach(() => {
    mockStorage.clear();
    stopOrderAlertLoop();
    vi.useFakeTimers();
  });

  afterEach(() => {
    stopOrderAlertLoop();
    vi.useRealTimers();
    delete globalThis.AudioContext;
    if (typeof window !== 'undefined') {
      delete window.AudioContext;
    }
  });

  it('defaults sound alerts to enabled when no preference is saved', () => {
    expect(isSoundAlertEnabled()).toBe(true);
  });

  it('updates and persists sound alert preference in localStorage', () => {
    expect(setSoundAlertEnabled(false)).toBe(false);
    expect(isSoundAlertEnabled()).toBe(false);
    expect(mockStorage.get('mandi_vendor_sound_enabled')).toBe('false');

    expect(setSoundAlertEnabled(true)).toBe(true);
    expect(isSoundAlertEnabled()).toBe(true);
    expect(mockStorage.get('mandi_vendor_sound_enabled')).toBe('true');
  });

  it('does not start alert loop if sound alerts are disabled', () => {
    setSoundAlertEnabled(false);
    startOrderAlertLoop(2000);
    expect(isAlertLoopActive()).toBe(false);
  });

  it('starts alert loop and marks active when enabled', () => {
    setSoundAlertEnabled(true);
    startOrderAlertLoop(2000);
    expect(isAlertLoopActive()).toBe(true);
  });

  it('stops alert loop immediately when stopOrderAlertLoop is called', () => {
    setSoundAlertEnabled(true);
    startOrderAlertLoop(2000);
    expect(isAlertLoopActive()).toBe(true);

    stopOrderAlertLoop();
    expect(isAlertLoopActive()).toBe(false);
  });

  it('automatically stops active loop when sound is disabled via setSoundAlertEnabled(false)', () => {
    setSoundAlertEnabled(true);
    startOrderAlertLoop(2000);
    expect(isAlertLoopActive()).toBe(true);

    setSoundAlertEnabled(false);
    expect(isAlertLoopActive()).toBe(false);
  });

  it('gracefully executes playOrderChime and testSound in environments without Web Audio API', async () => {
    delete globalThis.AudioContext;
    await expect(playOrderChime()).resolves.not.toThrow();
    await expect(testSound()).resolves.not.toThrow();
    await expect(unlockAudioContext()).resolves.toBe(false);
  });

  it('supports simulated Web Audio API oscillators and gain nodes', async () => {
    const mockGainNode = {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };

    const mockOscillator = {
      type: 'sine',
      frequency: {
        setValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };

    const mockContext = {
      currentTime: 0,
      state: 'suspended',
      resume: vi.fn().mockResolvedValue(),
      createGain: vi.fn(() => mockGainNode),
      createOscillator: vi.fn(() => mockOscillator),
      destination: {},
    };

    class MockAudioContext {
      constructor() {
        return mockContext;
      }
    }

    globalThis.AudioContext = MockAudioContext;

    await playOrderChime();
    expect(mockContext.resume).toHaveBeenCalled();
    expect(mockContext.createGain).toHaveBeenCalled();
    expect(mockContext.createOscillator).toHaveBeenCalled();
    expect(mockOscillator.start).toHaveBeenCalled();
    expect(mockOscillator.stop).toHaveBeenCalled();
  });
});

describe('Vendor Dashboard Audio Alert & Banner Integration', () => {
  it('guarantees VendorDashboard imports and wires audio alert system', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const vendorDashboardPath = path.resolve(process.cwd(), 'src/pages/VendorDashboard.jsx');
    const content = fs.readFileSync(vendorDashboardPath, 'utf-8');

    // Audio alert imports
    expect(content).toContain('startOrderAlertLoop');
    expect(content).toContain('stopOrderAlertLoop');
    expect(content).toContain('isSoundAlertEnabled');
    expect(content).toContain('setSoundAlertEnabled');
    expect(content).toContain('testSound');

    // UI Sound controls: Sound ON / OFF toggle and test chime
    expect(content).toContain('Sound ON');
    expect(content).toContain('Sound OFF');
    expect(content).toContain('handleToggleSound');
    expect(content).toContain('handleTestSound');

    // Live Order Alert Banner with Accept and Mute
    expect(content).toContain('New Online Order Received');
    expect(content).toContain('Accept Order (Start Packing)');
    expect(content).toContain('handleAcceptIncomingOrder');
    expect(content).toContain('handleMuteCurrentAlert');
    expect(content).toContain('incomingAlertOrder');
  });
});
