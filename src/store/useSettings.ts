import { create } from 'zustand';

export type Language = 'zh' | 'en';
export type UserRole = 'employee' | 'hr' | 'it_admin' | 'manager';

interface SettingsState {
  language: Language;
  setLanguage: (lang: Language) => void;
  userRole: UserRole;
  setRole: (role: UserRole) => void;
}

export const useSettings = create<SettingsState>((set) => ({
  language: 'zh',
  setLanguage: (lang) => set({ language: lang }),
  userRole: 'employee',
  setRole: (role) => set({ userRole: role }),
}));
