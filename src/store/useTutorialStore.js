import { create } from 'zustand';

export const TUTORIAL_STORAGE_KEY = 'mandi_tutorial_completed_v1';

const getStorage = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch {}
  return null;
};

export const hasSeenTutorial = () => {
  const storage = getStorage();
  if (!storage) return false;
  try {
    return storage.getItem(TUTORIAL_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

export const useTutorialStore = create((set, get) => ({
  isOpen: false,
  currentStep: 0,

  hasSeenTutorial: () => hasSeenTutorial(),

  openTutorial: (startStep = 0) => {
    set({ isOpen: true, currentStep: Math.max(0, startStep) });
  },

  closeTutorial: () => {
    const storage = getStorage();
    if (storage) {
      try {
        storage.setItem(TUTORIAL_STORAGE_KEY, 'true');
      } catch {}
    }
    set({ isOpen: false });
  },

  nextStep: (totalSteps = 4) => {
    const current = get().currentStep;
    if (current + 1 >= totalSteps) {
      get().closeTutorial();
    } else {
      set({ currentStep: current + 1 });
    }
  },

  prevStep: () => {
    set((state) => ({ currentStep: Math.max(0, state.currentStep - 1) }));
  },

  setStep: (step) => {
    set({ currentStep: Math.max(0, step) });
  },

  resetTutorial: () => {
    const storage = getStorage();
    if (storage) {
      try {
        storage.removeItem(TUTORIAL_STORAGE_KEY);
      } catch {}
    }
    set({ isOpen: true, currentStep: 0 });
  },
}));
