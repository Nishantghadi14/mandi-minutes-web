import { describe, it, expect, beforeEach } from 'vitest';
import { useTutorialStore, hasSeenTutorial, TUTORIAL_STORAGE_KEY } from '../src/store/useTutorialStore';
import fs from 'node:fs';
import path from 'node:path';

// Hermetic in-memory localStorage mock
const mockStorage = new Map();
globalThis.localStorage = {
  getItem: (key) => mockStorage.get(key) ?? null,
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
};

describe('App Tutorial & Onboarding Store (useTutorialStore)', () => {
  beforeEach(() => {
    mockStorage.clear();
    useTutorialStore.setState({ isOpen: false, currentStep: 0 });
  });

  it('correctly detects whether the user has seen the tutorial', () => {
    expect(hasSeenTutorial()).toBe(false);
    expect(useTutorialStore.getState().hasSeenTutorial()).toBe(false);

    mockStorage.set(TUTORIAL_STORAGE_KEY, 'true');
    expect(hasSeenTutorial()).toBe(true);
    expect(useTutorialStore.getState().hasSeenTutorial()).toBe(true);
  });

  it('opens tutorial at the requested step', () => {
    const store = useTutorialStore.getState();
    expect(store.isOpen).toBe(false);

    store.openTutorial(0);
    expect(useTutorialStore.getState().isOpen).toBe(true);
    expect(useTutorialStore.getState().currentStep).toBe(0);

    store.openTutorial(2);
    expect(useTutorialStore.getState().currentStep).toBe(2);
  });

  it('progresses through steps with nextStep and completes on final step', () => {
    const store = useTutorialStore.getState();
    store.openTutorial(0);
    expect(useTutorialStore.getState().currentStep).toBe(0);

    // Step 0 -> Step 1
    store.nextStep(4);
    expect(useTutorialStore.getState().currentStep).toBe(1);

    // Step 1 -> Step 2
    store.nextStep(4);
    expect(useTutorialStore.getState().currentStep).toBe(2);

    // Step 2 -> Step 3
    store.nextStep(4);
    expect(useTutorialStore.getState().currentStep).toBe(3);

    // Step 3 -> Final completion
    store.nextStep(4);
    expect(useTutorialStore.getState().isOpen).toBe(false);
    expect(mockStorage.get(TUTORIAL_STORAGE_KEY)).toBe('true');
  });

  it('regresses through steps with prevStep down to minimum 0', () => {
    const store = useTutorialStore.getState();
    store.openTutorial(2);
    expect(useTutorialStore.getState().currentStep).toBe(2);

    store.prevStep();
    expect(useTutorialStore.getState().currentStep).toBe(1);

    store.prevStep();
    expect(useTutorialStore.getState().currentStep).toBe(0);

    // Should not go below 0
    store.prevStep();
    expect(useTutorialStore.getState().currentStep).toBe(0);
  });

  it('closes tutorial and persists completion in localStorage', () => {
    const store = useTutorialStore.getState();
    store.openTutorial(1);
    expect(useTutorialStore.getState().isOpen).toBe(true);

    store.closeTutorial();
    expect(useTutorialStore.getState().isOpen).toBe(false);
    expect(mockStorage.get(TUTORIAL_STORAGE_KEY)).toBe('true');
  });

  it('resets tutorial and clears persistence', () => {
    const store = useTutorialStore.getState();
    mockStorage.set(TUTORIAL_STORAGE_KEY, 'true');

    store.resetTutorial();
    expect(useTutorialStore.getState().isOpen).toBe(true);
    expect(useTutorialStore.getState().currentStep).toBe(0);
    expect(mockStorage.get(TUTORIAL_STORAGE_KEY)).toBeUndefined();
  });
});

describe('App Tutorial Modal & Application Wiring Contracts', () => {
  it('guarantees AppTutorialModal defines 4 comprehensive onboarding steps', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/common/AppTutorialModal.jsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Step titles and content
    expect(content).toContain('Choose Your Virar Neighborhood');
    expect(content).toContain('APMC Mandi Wholesale Rates');
    expect(content).toContain('Instant Express or Morning Slots');
    expect(content).toContain('Live Tracking & Flexible Payments');

    // Controls: Skip, Touch swipe, Keyboard navigation
    expect(content).toContain('Skip Tour');
    expect(content).toContain('handleTouchStart');
    expect(content).toContain('handleTouchEnd');
    expect(content).toContain('ArrowRight');
    expect(content).toContain('ArrowLeft');
    expect(content).toContain('Escape');
    expect(content).toContain('Start Shopping in Virar 🚀');
  });

  it('guarantees App.jsx mounts AppTutorialModal and provides auto-trigger logic', () => {
    const filePath = path.resolve(process.cwd(), 'src/App.jsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('AppTutorialModal');
    expect(content).toContain('useTutorialStore');
    expect(content).toContain('hasSeenTutorial()');
    expect(content).toContain('<AppTutorialModal />');
  });

  it('guarantees ProfilePage provides a permanent App Quick Tour & Guide option', () => {
    const filePath = path.resolve(process.cwd(), 'src/pages/ProfilePage.jsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('useTutorialStore');
    expect(content).toContain('App Quick Tour & Guide');
    expect(content).toContain('openTutorial(0)');
  });

  it('guarantees quick tour button is hidden from MobileAppHome header and preserved in settings', () => {
    const mobileHomePath = path.resolve(process.cwd(), 'src/pages/MobileAppHome.jsx');
    const mobileHomeContent = fs.readFileSync(mobileHomePath, 'utf-8');
    const profilePath = path.resolve(process.cwd(), 'src/pages/ProfilePage.jsx');
    const profileContent = fs.readFileSync(profilePath, 'utf-8');

    // Header in MobileAppHome should be clean and not have duplicate quick tour button
    expect(mobileHomeContent).not.toContain('aria-label="App Quick Tour"');
    expect(mobileHomeContent).not.toContain('How to use Mandi Minutes (Tour)');

    // Settings (ProfilePage) retains the permanent tour trigger
    expect(profileContent).toContain('useTutorialStore');
    expect(profileContent).toContain('App Quick Tour & Guide');
    expect(profileContent).toContain('openTutorial(0)');
  });
});
