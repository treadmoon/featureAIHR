'use client';

import { useChatContext } from './components/ChatProvider';
import { Bot } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSettings } from '../store/useSettings';
import ChatSidebar from './components/ChatSidebar';
import NotificationBanner from './components/chat/NotificationBanner';
import WelcomeScreen from './components/chat/WelcomeScreen';
import MessageBubble from './components/chat/MessageBubble';
import FeedbackModal from './components/chat/FeedbackModal';
import ApprovalDetailModal from './components/chat/ApprovalDetailModal';
import Header from './components/Header';
import ChatInput from './components/ChatInput';
import { track } from '@/lib/analytics';
import { DICT, SHORTCUTS_ALL } from './constants';
import { useAuth } from './hooks/useAuth';
import { useChatSessions } from './hooks/useChatSessions';
import { useNotifications } from './hooks/useNotifications';

export default function HomeContent() {
  const { language, setLanguage } = useSettings();
  const t = DICT[language];
  const router = useRouter();

  // Auth
  const { authUser, handleLogout } = useAuth();
  const eRole = (authUser?.effectiveRole || 'employee') as 'employee' | 'manager' | 'admin';

  // Chat context
  const { messages, sendMessage, status, setMessages } = useChatContext();
  const isLoading = status === 'submitted' || status === 'streaming';

  // Sessions
  const { sessions, currentSessionId, loadSession, handleNewChat: resetSession, deleteSession, historyAction } =
    useChatSessions({ messages, isLoading, setMessages });

  // Notifications
  const { pendingItems, notifications, dismissedNotifs, dismissNotif } = useNotifications();

  // Local UI state
  const [input, setInput] = useState('');
  const [confirmedDrafts, setConfirmedDrafts] = useState<Set<string>>(new Set());
  const [feedbackSent, setFeedbackSent] = useState<Set<string>>(new Set());
  const [feedbackModal, setFeedbackModal] = useState<{ id: string; rating: string } | null>(null);
  const [approvalModal, setApprovalModal] = useState<{ id: string; title: string; status: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const msgTimestamps = useRef<Map<string, number>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Derived
  const pendingCount = pendingItems.length;
  const shortcuts = SHORTCUTS_ALL[eRole] || SHORTCUTS_ALL.employee;

  // Click-outside menu close
  useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    if (menuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  // Track message timestamps
  useEffect(() => {
    for (const m of messages) {
      if (!msgTimestamps.current.has(m.id)) msgTimestamps.current.set(m.id, Date.now());
    }
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // New chat wrapper (resets session + UI state)
  const handleNewChat = useCallback(() => {
    resetSession();
    setConfirmedDrafts(new Set());
    setFeedbackSent(new Set());
    setSidebarOpen(false);
    msgTimestamps.current.clear();
  }, [resetSession]);

  const handleClear = useCallback(() => {
    if (window.confirm('确定要清空当前对话吗？此操作不可恢复。')) {
      handleNewChat();
    }
  }, [handleNewChat]);

  const sendFeedback = useCallback(async (msgId: string, rating: string, reason?: string) => {
    const msg = messages.find(m => m.id === msgId);
    const prevUser = messages[messages.findIndex(m => m.id === msgId) - 1];
    setFeedbackSent(prev => new Set(prev).add(msgId));
    setFeedbackModal(null);
    track('feedback', { rating, reason });
    fetch('/api/feedback', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messageId: msgId, rating, reason,
        userMessage: prevUser?.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('') || '',
        assistantMessage: msg?.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('') || '',
      }),
    }).catch(() => {});
  }, [messages]);

  const getSmartShortcuts = useCallback(() => {
    const contextKeys = ['请假','leave','年假','balance','工资','salary','密码','password','vpn','考勤','attendance'];
    const filtered = shortcuts.filter(s => contextKeys.some(k => s.text.toLowerCase().includes(k)));
    const seen = new Set<string>(filtered.map(s => s.text));
    return [...filtered, ...shortcuts.filter(s => !seen.has(s.text))].slice(0, 5);
  }, [shortcuts]);

  const fmtTime = useCallback((id: string) => {
    const ts = msgTimestamps.current.get(id);
    return ts ? new Date(ts).toLocaleTimeString(language === 'zh' ? 'zh-CN' : 'en', { hour: '2-digit', minute: '2-digit' }) : '';
  }, [language]);

  const handleSend = useCallback(() => {
    if (!input.trim() || isLoading) return;
    track('chat_send', { length: input.length });
    sendMessage(input);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [input, isLoading, sendMessage]);

  const quickSend = useCallback((text: string) => {
    if (isLoading) return;
    track('shortcut_use', { text: text.slice(0, 30) });
    sendMessage(text);
  }, [isLoading, sendMessage]);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 128) + 'px'; }
  }, []);

  const handleFeedbackReason = useCallback((reason: string) => {
    if (feedbackModal) sendFeedback(feedbackModal.id, 'bad', reason);
  }, [feedbackModal, sendFeedback]);

  const handleLanguageToggle = useCallback(() => {
    setLanguage(language === 'zh' ? 'en' : 'zh');
  }, [language, setLanguage]);

  // Draft confirmation logic
  const lastMsg = messages[messages.length - 1];
  const pendingDraft = !isLoading && lastMsg?.role === 'assistant' && lastMsg.parts?.some((p: any) => p.type === 'tool-draftWorkflowApplication' && !confirmedDrafts.has(p.toolCallId))
    ? {
        onConfirm: () => {
          const dp: any = lastMsg.parts?.find((p: any) => p.type === 'tool-draftWorkflowApplication' && !confirmedDrafts.has(p.toolCallId));
          if (dp) setConfirmedDrafts(prev => new Set(prev).add(dp.toolCallId));
          quickSend('确认无误，请提交。');
        },
        onModify: () => quickSend('帮我修改一下信息'),
      }
    : null;

  return (
    <div className="flex flex-col h-screen w-full ai-bg" style={{ color: '#111827' }}>
      <Header
        authUser={authUser}
        pendingCount={pendingCount}
        messagesLength={messages.length}
        onClear={handleClear}
        onMenuToggle={() => setMenuOpen(v => !v)}
        menuOpen={menuOpen}
        menuRef={menuRef}
        language={language}
        onLogout={handleLogout}
        onLanguageToggle={handleLanguageToggle}
        onNavigate={router.push}
        onSidebarToggle={() => setSidebarOpen(v => !v)}
      />

      {/* ── Main Chat Area ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 md:px-6 lg:px-8 pb-48">
          <NotificationBanner
            notifications={notifications}
            dismissedNotifs={dismissedNotifs}
            onDismiss={dismissNotif}
            onNavigate={router.push}
            language={language}
          />

          {messages.length === 0 ? (
            <WelcomeScreen
              role={eRole}
              suggestions={t.suggestions[eRole]}
              suggestionIcons={t.suggestionIcons[eRole]}
              greeting={t.greeting[eRole]}
              greetingSub={t.greetingSub[eRole]}
              onQuickSend={quickSend}
              badgeText={language === 'zh' ? '✨ AI 智能工作流助手' : '✨ AI Workflow Copilot'}
            />
          ) : (
            messages.map((message: any, mIndex: number) => (
              <MessageBubble
                key={message.id}
                message={message}
                isLast={mIndex === messages.length - 1}
                isLoading={isLoading}
                confirmedDrafts={confirmedDrafts}
                setConfirmedDrafts={setConfirmedDrafts}
                quickSend={quickSend}
                onApprovalClick={(id, title, status) => setApprovalModal({ id, title, status })}
                feedbackSent={feedbackSent}
                onFeedback={(id) => setFeedbackModal({ id, rating: 'bad' })}
                onGoodFeedback={(id) => sendFeedback(id, 'good')}
                fmtTime={fmtTime}
                t={t}
              />
            ))
          )}

          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex gap-3 animate-fade-up">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ background: 'linear-gradient(135deg, #5e6ad2, #5e6ad2)' }}>
                <Bot size={15} color="#fff" />
              </div>
              <div className="flex items-center gap-1.5 rounded-lg px-4 py-3"
                style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.08)' }}>
                <span className="h-1.5 w-1.5 rounded-full animate-pulse-dot" style={{ background: '#5e6ad2' }} />
                <span className="h-1.5 w-1.5 rounded-full animate-pulse-dot" style={{ background: '#5e6ad2', animationDelay: '0.15s' }} />
                <span className="h-1.5 w-1.5 rounded-full animate-pulse-dot" style={{ background: '#5e6ad2', animationDelay: '0.3s' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* ── Sidebar ── */}
      <ChatSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onLoadSession={loadSession}
        onDeleteSession={deleteSession}
        onNewChat={handleNewChat}
        onHistoryAction={historyAction}
      />

      {/* ── Feedback Modal ── */}
      {feedbackModal && (
        <FeedbackModal
          onSendReason={handleFeedbackReason}
          onClose={() => setFeedbackModal(null)}
          language={language}
        />
      )}

      {/* ── Approval Detail Modal ── */}
      {approvalModal && (
        <ApprovalDetailModal
          id={approvalModal.id}
          userId={authUser?.id || ''}
          onClose={() => setApprovalModal(null)}
          onExpand={() => router.push(`/approvals/${approvalModal.id}`)}
        />
      )}

      {/* ── Footer ── */}
      <ChatInput
        input={input}
        onInputChange={setInput}
        onSend={handleSend}
        isLoading={isLoading}
        textareaRef={textareaRef}
        shortcuts={getSmartShortcuts()}
        onQuickSend={quickSend}
        pendingDraft={pendingDraft}
        confirmSubmitText={t.confirmSubmit}
        modifyText={t.modify}
        placeholder={t.placeholder}
        poweredByText={t.poweredBy}
        onAutoResize={autoResize}
      />
    </div>
  );
}
