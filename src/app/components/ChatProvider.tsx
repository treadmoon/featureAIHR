'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useRef, useState, createContext, useContext, useCallback } from 'react';

const STORAGE_KEY = 'chat_messages';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content?: string;
  parts?: any[];
  [key: string]: any;
}

interface ChatContextValue {
  messages: ChatMessage[];
  status: string;
  isLoading: boolean;
  sendMessage: (text: string) => void;
  setMessages: (messages: ChatMessage[]) => void;
  clearMessages: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatContext must be used within ChatProvider');
  return ctx;
}

export function useChatContextSafe() {
  return useContext(ChatContext);
}

export default function ChatProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);

  const { messages: chatMessages, sendMessage, setMessages: setChatMessages, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
    onError: (err) => { console.error('[useChat error]', err); },
  });

  const isStreaming = status === 'submitted' || status === 'streaming';
  const hasHydrated = useRef(false);

  // Hydrate from sessionStorage on mount
  useEffect(() => {
    if (hasHydrated.current) return;
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setChatMessages(parsed);
        }
      }
    } catch (err) {
      console.warn('[ChatProvider] Failed to hydrate:', err);
    }
    hasHydrated.current = true;
    setIsHydrated(true);
  }, []);

  // Persist messages to sessionStorage
  useEffect(() => {
    if (!isHydrated) return;
    if (chatMessages.length > 0) {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(chatMessages));
      } catch (err) {
        console.warn('[ChatProvider] Failed to persist:', err);
      }
    }
  }, [chatMessages, isHydrated]);

  const handleSendMessage = useCallback((text: string) => {
    sendMessage({ text });
  }, [sendMessage]);

  const handleClearMessages = useCallback(() => {
    setChatMessages([]);
    sessionStorage.removeItem(STORAGE_KEY);
  }, [setChatMessages]);

  const handleSetMessages = useCallback((messages: ChatMessage[]) => {
    setChatMessages(messages as any);
  }, [setChatMessages]);

  return (
    <ChatContext.Provider
      value={{
        messages: chatMessages as ChatMessage[],
        status,
        isLoading: isStreaming,
        sendMessage: handleSendMessage,
        setMessages: handleSetMessages,
        clearMessages: handleClearMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
