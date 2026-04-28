import { create } from 'zustand';

interface ChatPersistState {
  messages: any[];
  setMessages: (messages: any[]) => void;
  clearMessages: () => void;
  hasMessages: () => boolean;
}

const STORAGE_KEY = 'chat_messages';

/**
 * Hydrate messages from sessionStorage.
 * Called after mount to avoid SSR issues.
 */
export function hydrateMessages(): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export const useChatPersist = create<ChatPersistState>((set, get) => ({
  messages: [],

  setMessages: (messages) => {
    set({ messages });
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      } catch (err) {
        console.warn('[useChatPersist] Failed to save:', err);
      }
    }
  },

  clearMessages: () => {
    set({ messages: [] });
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch (err) {
        console.warn('[useChatPersist] Failed to clear:', err);
      }
    }
  },

  hasMessages: () => get().messages.length > 0,
}));
