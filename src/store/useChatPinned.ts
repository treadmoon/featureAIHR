import { create } from 'zustand';

interface ChatState {
  pinned: boolean;
  setPinned: (pinned: boolean) => void;
}

export const useChatPinned = create<ChatState>((set) => ({
  pinned: true,
  setPinned: (pinned) => set({ pinned }),
}));
