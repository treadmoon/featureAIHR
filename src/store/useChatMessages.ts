import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  parts?: Array<{ type: string; text?: string }>;
  toolCallId?: string;
  state?: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
}

interface ChatMessagesState {
  messages: ChatMessage[];
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
}

export const useChatMessages = create<ChatMessagesState>((set) => ({
  messages: [],
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: [] }),
}));
