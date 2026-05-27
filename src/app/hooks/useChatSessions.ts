'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export function useChatSessions(opts: {
  messages: any[];
  isLoading: boolean;
  setMessages: (msgs: any[]) => void;
}) {
  const { messages, isLoading, setMessages } = opts;
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const savedMsgCount = useRef(0);

  const loadSessions = useCallback(() => {
    fetch('/api/chat-history').then(r => r.json()).then(d => { if (Array.isArray(d)) setSessions(d); }).catch(() => {});
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  // Persist new messages to server
  useEffect(() => {
    if (isLoading || messages.length === 0) return;
    if (messages.length <= savedMsgCount.current) return;
    const newMsgs = messages.slice(savedMsgCount.current).filter((m: any) => !m.id?.startsWith('hist-'));
    savedMsgCount.current = messages.length;
    if (!newMsgs.length) return;
    (async () => {
      let sid = currentSessionId;
      if (!sid) {
        const firstText = (newMsgs.find((m: any) => m.role === 'user') as any)?.parts?.find((p: any) => p.type === 'text')?.text?.slice(0, 20) || '新对话';
        const res = await fetch('/api/chat-history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', title: firstText }) });
        const data = await res.json();
        sid = data?.id;
        if (sid) setCurrentSessionId(sid);
      }
      if (sid) {
        await fetch('/api/chat-history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'save', sessionId: sid, messages: newMsgs, totalCount: messages.length }) });
        loadSessions();
      }
    })();
  }, [messages, isLoading, currentSessionId, loadSessions]);

  const loadSession = useCallback(async (sid: string) => {
    const res = await fetch('/api/chat-history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'load', sessionId: sid }) });
    const msgs = await res.json();
    if (Array.isArray(msgs)) {
      setMessages(msgs.map((m: any, i: number) => ({ id: `hist-${i}`, role: m.role, parts: m.parts || [{ type: 'text', text: m.content }] })));
      setCurrentSessionId(sid);
      savedMsgCount.current = msgs.length;
    }
  }, [setMessages]);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setCurrentSessionId(null);
    savedMsgCount.current = 0;
  }, [setMessages]);

  const deleteSession = useCallback(async (sid: string) => {
    await fetch('/api/chat-history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', sessionId: sid }) });
    if (currentSessionId === sid) handleNewChat();
    loadSessions();
  }, [currentSessionId, handleNewChat, loadSessions]);

  const historyAction = useCallback(async (action: 'deleteByDate' | 'compress', before: string) => {
    await fetch('/api/chat-history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, before }) });
    loadSessions();
  }, [loadSessions]);

  return { sessions, currentSessionId, loadSession, handleNewChat, deleteSession, historyAction, setSidebarClosed: () => {} };
}
