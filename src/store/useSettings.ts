import { create } from 'zustand';

export type Language = 'zh' | 'en';

interface SettingsState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useSettings = create<SettingsState>((set) => ({
  language: 'zh',
  setLanguage: (lang) => set({ language: lang }),
}));
