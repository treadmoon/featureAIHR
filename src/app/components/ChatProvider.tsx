'use client';

import { useChat } from '@ai-sdk/react';
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
  isLoading: boolean;
  sendMessage: (text: string) => void;
  setMessages: (messages: ChatMessage[]) => void;
  clearMessages: () => void;
  isSuspended: boolean;
  setSuspended: (v: boolean) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatContext must be used within ChatProvider');
  return ctx;
}

export default function ChatProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);

  // Track if stream finished while user was away
  const streamFinishedWhileAwayRef = useRef(false);

  // @ts-expect-error - AI SDK v6 types
  const { messages: chatMessages, sendMessage, setMessages: setChatMessages, status } = useChat({
    api: '/api/chat',
    onError: (err) => { console.error('[useChat error]', err); },
    onFinish: () => {
      // Stream completed server-side while user may be on another page
      streamFinishedWhileAwayRef.current = isSuspended;
    },
  });

  const isStreaming = status === 'submitted' || status === 'streaming';
  const hasHydrated = useRef(false);
  const isResumingRef = useRef(false);

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

  // Watch pathname changes for suspend detection
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isStreaming || isSuspended) return;

    const interval = setInterval(() => {
      const path = window.location.pathname;
      if (path !== '/' && !isResumingRef.current && isStreaming) {
        setIsSuspended(true);
      }
      if (path === '/') {
        isResumingRef.current = false;
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isStreaming, isSuspended]);

  // Auto-resume when user returns to homepage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const interval = setInterval(() => {
      if (isSuspended && window.location.pathname === '/') {
        // If stream finished while away, don't auto-resume — messages are complete
        if (streamFinishedWhileAwayRef.current) {
          streamFinishedWhileAwayRef.current = false;
          return;
        }
        setIsSuspended(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isSuspended]);

  const handleSendMessage = useCallback((text: string) => {
    sendMessage(text);
  }, [sendMessage]);

  const handleClearMessages = useCallback(() => {
    setChatMessages([]);
    sessionStorage.removeItem(STORAGE_KEY);
  }, [setChatMessages]);

  const handleSetMessages = useCallback((messages: ChatMessage[]) => {
    setChatMessages(messages);
  }, [setChatMessages]);

  const handleSetSuspended = useCallback((v: boolean) => {
    if (v === false) {
      isResumingRef.current = true;
      setTimeout(() => { isResumingRef.current = false; }, 2000);
    }
    setIsSuspended(v);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        messages: chatMessages as ChatMessage[],
        isLoading: isStreaming && !isSuspended,
        sendMessage: handleSendMessage,
        setMessages: handleSetMessages,
        clearMessages: handleClearMessages,
        isSuspended,
        setSuspended: handleSetSuspended,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
