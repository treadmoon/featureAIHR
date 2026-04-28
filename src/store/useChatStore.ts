'use client';

import { create } from 'zustand';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content?: string;
  parts?: any[];
  [key: string]: any;
}

interface ChatStoreState {
  messages: ChatMessage[];
  isStreaming: boolean;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  setStreaming: (streaming: boolean) => void;
  clearMessages: () => void;
}

const STORAGE_KEY = 'chat_store_messages';

export const useChatStore = create<ChatStoreState>((set, get) => ({
  messages: (() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  })(),
  isStreaming: false,

  setMessages: (messages) => {
    set({ messages });
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (err) {
      console.warn('[ChatStore] Failed to save:', err);
    }
  },

  addMessage: (message) => {
    const messages = [...get().messages, message];
    set({ messages });
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (err) {
      console.warn('[ChatStore] Failed to save:', err);
    }
  },

  updateMessage: (id, updates) => {
    const messages = get().messages.map((m) =>
      m.id === id ? { ...m, ...updates } : m
    );
    set({ messages });
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (err) {
      console.warn('[ChatStore] Failed to save:', err);
    }
  },

  setStreaming: (isStreaming) => set({ isStreaming }),

  clearMessages: () => {
    set({ messages: [], isStreaming: false });
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.warn('[ChatStore] Failed to clear:', err);
    }
  },
}));
