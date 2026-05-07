'use client';

import { useChatContext } from './components/ChatProvider';
import { Bot, Send, Trash2, LogOut, Settings, UserCircle, ChevronDown, Menu, CheckCircle2, Globe } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { useSettings } from '../store/useSettings';
import ChatSidebar from './components/ChatSidebar';
import NotificationBanner from './components/chat/NotificationBanner';
import WelcomeScreen from './components/chat/WelcomeScreen';
import MessageBubble from './components/chat/MessageBubble';
import FeedbackModal from './components/chat/FeedbackModal';
import ApprovalDetailModal from './components/chat/ApprovalDetailModal';
import { track, trackPageView } from '@/lib/analytics';

const DICT = {
  zh: {
    title: "AI 智能秘书",
    subtitle: "你的 HR 与 IT 专属副驾",
    greeting: { employee: "今天能帮到你什么？", manager: "团队管理助手就绪", admin: "系统管理模式，随时待命" },
    greetingSub: { employee: "试着问问关于年假余额、重置密码或者查询最近的报销进度。", manager: "可以查看团队考勤、审批申请、了解团队动态。", admin: "可直接查询和修改员工数据，查看全公司统计。" },
    suggestions: {
      employee: ["我的年假还剩多少天？", "我的电脑连不上 VPN 怎么办？", "帮我解释一下这个月的工资扣款明细", "如何申请新的设计软件授权？"],
      manager: ["查看团队本月考勤概览", "查看待我审批的申请", "团队本月出勤率怎么样", "最近谁请假了"],
      admin: ["查询员工 张伟 的信息", "全公司目前在职多少人", "本月全公司考勤异常统计", "修改员工 刘洋 的部门为产品部"],
    },
    suggestionIcons: { employee: ['🏖️','💻','💰','🔑'], manager: ['📊','📋','📈','🏖️'], admin: ['🔍','👥','📊','✏️'] },
    placeholder: "有什么问题随时问我...",
    poweredBy: "基于火山引擎豆包大模型提供支持",
    clear: "清空对话",
    profile: "个人中心",
    admin: "管理后台",
    dashboard: "数据看板",
    knowledge: "知识库",
    logout: "退出登录",
    feedback: "已反馈",
    helpful: "有帮助",
    dissatisfied: "不满意",
    confirmSubmit: "确认提交",
    modify: "修改信息",
  },
  en: {
    title: "AI Secretary",
    subtitle: "Your HR & IT Copilot",
    greeting: { employee: "How can I help you today?", manager: "Team management assistant ready", admin: "Admin mode, ready to serve" },
    greetingSub: { employee: "Try asking about your remaining leave balance, resetting your password, or tracking a recent expense.", manager: "Check team attendance, review approvals, or see team updates.", admin: "Search and update employee data, view company-wide stats." },
    suggestions: {
      employee: ["What is my remaining leave balance?", "My laptop won't connect to the VPN", "Explain my payroll deductions this month", "How do I request a new software license?"],
      manager: ["Show team attendance this month", "View pending approvals", "Team attendance rate this month", "Who is on leave recently"],
      admin: ["Search employee Zhang Wei", "How many active employees total", "Company-wide attendance anomalies", "Change employee Liu Yang's department"],
    },
    suggestionIcons: { employee: ['🏖️','💻','💰','🔑'], manager: ['📊','📋','📈','🏖️'], admin: ['🔍','👥','📊','✏️'] },
    placeholder: "Ask the secretary anything...",
    poweredBy: "Powered by Volcengine Doubao",
    clear: "Clear chat",
    profile: "Profile",
    admin: "Admin",
    dashboard: "Dashboard",
    knowledge: "Knowledge",
    logout: "Logout",
    feedback: "Sent",
    helpful: "Helpful",
    dissatisfied: "Not satisfied",
    confirmSubmit: "Confirm & Submit",
    modify: "Edit Info",
  }
};

const SHORTCUTS_ALL = {
  employee: [
    { emoji: '🏖️', text: '我想请假', shortLabel: '请假', bg: 'rgba(94,106,210,0.15)', border: 'rgba(94,106,210,0.3)', color: '#5e6ad2' },
    { emoji: '📊', text: '查一下我的年假余额', shortLabel: '年假余额', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', color: '#10b981' },
    { emoji: '📋', text: '查看我的申请记录', shortLabel: '申请记录', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', color: '#f59e0b' },
    { emoji: '⏰', text: '查一下我的考勤记录', shortLabel: '考勤', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.25)', color: '#6366f1' },
    { emoji: '💰', text: '查一下我的薪资明细', shortLabel: '薪资明细', bg: 'rgba(244,63,94,0.12)', border: 'rgba(244,63,94,0.25)', color: '#f43f5e' },
    { emoji: '🔑', text: '帮我重置密码', shortLabel: '重置密码', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.25)', color: '#8b5cf6' },
    { emoji: '💻', text: 'VPN连不上怎么办', shortLabel: 'VPN排障', bg: 'rgba(6,182,212,0.12)', border: 'rgba(6,182,212,0.25)', color: '#06b6d4' },
    { emoji: '📝', text: '帮我起草一封邮件', shortLabel: '起草邮件', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.25)', color: '#f97316' },
  ],
  manager: [
    { emoji: '📊', text: '查看团队本月考勤概览', shortLabel: '团队考勤', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.25)', color: '#6366f1' },
    { emoji: '📋', text: '查看待我审批的申请', shortLabel: '待审批', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', color: '#f59e0b' },
    { emoji: '📈', text: '团队本月出勤率怎么样', shortLabel: '出勤率', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', color: '#10b981' },
    { emoji: '🏖️', text: '最近谁请假了', shortLabel: '谁请假了', bg: 'rgba(94,106,210,0.12)', border: 'rgba(94,106,210,0.25)', color: '#5e6ad2' },
    { emoji: '👥', text: '查看我的团队成员', shortLabel: '团队成员', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.25)', color: '#8b5cf6' },
    { emoji: '💰', text: '查一下我的薪资明细', shortLabel: '我的薪资', bg: 'rgba(244,63,94,0.12)', border: 'rgba(244,63,94,0.25)', color: '#f43f5e' },
  ],
  admin: [
    { emoji: '🔍', text: '查询员工信息', shortLabel: '查员工', bg: 'rgba(94,106,210,0.15)', border: 'rgba(94,106,210,0.3)', color: '#5e6ad2' },
    { emoji: '👥', text: '全公司目前在职多少人', shortLabel: '在职统计', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', color: '#10b981' },
    { emoji: '📊', text: '本月全公司考勤异常统计', shortLabel: '异常考勤', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', color: '#f59e0b' },
    { emoji: '✏️', text: '修改员工信息', shortLabel: '改信息', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.25)', color: '#8b5cf6' },
    { emoji: '💰', text: '查看全公司统计数据', shortLabel: '公司统计', bg: 'rgba(244,63,94,0.12)', border: 'rgba(244,63,94,0.25)', color: '#f43f5e' },
    { emoji: '📋', text: '查看待审批的申请', shortLabel: '待审批', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.25)', color: '#6366f1' },
  ],
};

export default function HomeContent() {
  const { language, setLanguage } = useSettings();
  const t = DICT[language];
  const router = useRouter();
  const supabase = createClient();

  const [authUser, setAuthUser] = useState<{ id?: string; email?: string; role?: string; effectiveRole?: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }: any) => {
      if (!user) {
        supabase.auth.getSession().then(({ data: { session } }: any) => {
          if (session?.user) fetchProfile(session.user.id, session.user.email);
        });
        return;
      }
      fetchProfile(user.id, user.email);
    });

    async function fetchProfile(uid: string, email?: string | null) {
      setAuthUser({ id: uid, email: email || '' });
      const { data: profile } = await supabase.from('profiles').select('role, name').eq('id', uid).single();
      if (!profile) return;
      let effectiveRole = profile.role;
      if (profile.role !== 'admin') {
        const { data: managed } = await supabase.from('departments').select('id').eq('manager_id', uid).limit(1);
        const { data: subordinates } = await supabase.from('profiles').select('id').eq('report_to', uid).limit(1);
        effectiveRole = (managed && managed.length > 0) || (subordinates && subordinates.length > 0) ? 'manager' : 'employee';
      }
      setAuthUser({ id: uid, email: email || '', role: profile.role, effectiveRole });
    }
  }, []);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }, [supabase, router]);

  const { messages, sendMessage, status, setMessages } = useChatContext();

  const eRole = (authUser?.effectiveRole || 'employee') as 'employee' | 'manager' | 'admin';

  const [input, setInput] = useState('');
  const [confirmedDrafts, setConfirmedDrafts] = useState<Set<string>>(new Set());
  const [feedbackSent, setFeedbackSent] = useState<Set<string>>(new Set());
  const [feedbackModal, setFeedbackModal] = useState<{ id: string; rating: string } | null>(null);
  const msgTimestamps = useRef<Map<string, number>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isLoading = status === 'submitted' || status === 'streaming';
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [dismissedNotifs, setDismissedNotifs] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const savedMsgCount = useRef(0);

  const [approvalModal, setApprovalModal] = useState<{ id: string; title: string; status: string } | null>(null);
  const pendingCount = pendingItems.length;

  // Merged initial fetch
  useEffect(() => {
    Promise.all([
      fetch('/api/approvals?tab=pending').then(r => r.json()).catch(() => []),
      fetch('/api/notifications').then(r => r.json()).catch(() => []),
    ]).then(([approvals, notifs]) => {
      if (Array.isArray(approvals)) setPendingItems(approvals);
      if (Array.isArray(notifs)) setNotifications(notifs);
    });
    trackPageView('home');
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    if (menuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const loadSessions = useCallback(() => {
    fetch('/api/chat-history').then(r => r.json()).then(d => { if (Array.isArray(d)) setSessions(d); }).catch(() => {});
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

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
      setSidebarOpen(false);
    }
  }, [setMessages]);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setCurrentSessionId(null);
    savedMsgCount.current = 0;
    setConfirmedDrafts(new Set());
    setFeedbackSent(new Set());
    setSidebarOpen(false);
    msgTimestamps.current.clear();
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

  useEffect(() => {
    for (const m of messages) {
      if (!msgTimestamps.current.has(m.id)) msgTimestamps.current.set(m.id, Date.now());
    }
  }, [messages]);

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

  const shortcuts = SHORTCUTS_ALL[eRole] || SHORTCUTS_ALL.employee;

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const dismissNotif = useCallback((type: string) => {
    setDismissedNotifs(prev => new Set(prev).add(type));
  }, []);

  const handleFeedbackReason = useCallback((reason: string) => {
    if (feedbackModal) sendFeedback(feedbackModal.id, 'bad', reason);
  }, [feedbackModal, sendFeedback]);

  return (
    <div className="flex flex-col h-screen w-full ai-bg" style={{ color: '#111827' }}>

      {/* ── Header ── */}
      <header
        className="flex h-14 shrink-0 items-center justify-between px-4 md:px-5 sticky top-0 z-30 ai-glass"
        style={{ borderBottom: '1px solid rgba(94,106,210,0.12)' }}
      >
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(v => !v)} className="btn-icon" title="历史对话">
            <Menu size={16} />
          </button>
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: 'linear-gradient(135deg, #5e6ad2, #5e6ad2)' }}>
            <Bot size={16} color="#fff" />
            <span className="absolute -bottom-px -right-px h-2.5 w-2.5 rounded-full bg-emerald-400" style={{ border: '1.5px solid #f7f7f8' }} />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-[14px] font-semibold tracking-tight leading-tight" style={{ color: '#111827' }}>{t.title}</h1>
            <p className="text-[11px]" style={{ color: '#9ca3af' }}>{t.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button onClick={handleClear} title={t.clear} className="btn-icon" style={{ color: '#9ca3af' }}>
              <Trash2 size={14} />
            </button>
          )}
          <button
            onClick={() => router.push('/approvals')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150"
            style={{
              background: pendingCount > 0 ? 'rgba(245,158,11,0.12)' : 'rgba(0,0,0,0.03)',
              border: `1px solid ${pendingCount > 0 ? 'rgba(245,158,11,0.25)' : 'rgba(0,0,0,0.08)'}`,
              color: pendingCount > 0 ? '#f59e0b' : '#6b7280',
            }}
          >
            <CheckCircle2 size={13} />
            <span className="hidden sm:inline">{language === 'zh' ? '审批' : 'Approvals'}</span>
            {pendingCount > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold rounded-full" style={{ background: '#f43f5e', color: '#fff' }}>
                {pendingCount}
              </span>
            )}
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-md transition-all duration-150"
              style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)' }}
            >
              <div className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold"
                style={{ background: 'linear-gradient(135deg, #5e6ad2, #5e6ad2)', color: '#fff' }}>
                {(authUser?.email || '?')[0].toUpperCase()}
              </div>
              <span className="text-xs hidden sm:inline max-w-[80px] truncate font-medium" style={{ color: '#6b7280' }}>
                {authUser?.email?.split('@')[0] || ''}
              </span>
              <ChevronDown size={12} style={{ color: '#9ca3af', transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-full mt-1.5 w-52 rounded-lg py-1 z-50 animate-fade-up"
                style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }}
              >
                <button onClick={() => { setMenuOpen(false); router.push('/profile'); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] transition-colors" style={{ color: '#6b7280' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.04)', e.currentTarget.style.color = '#111827')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = '#6b7280')}>
                  <UserCircle size={14} />{t.profile}
                </button>
                {authUser?.role === 'admin' && (
                  <>
                    <button onClick={() => { setMenuOpen(false); router.push('/admin/employees'); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] transition-colors" style={{ color: '#6b7280' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.04)', e.currentTarget.style.color = '#111827')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = '#6b7280')}>
                      <Settings size={14} />{t.admin}
                    </button>
                    <button onClick={() => { setMenuOpen(false); router.push('/admin/dashboard'); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] transition-colors" style={{ color: '#6b7280' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.04)', e.currentTarget.style.color = '#111827')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = '#6b7280')}>
                      <span style={{ fontSize: '14px' }}>📊</span>{t.dashboard}
                    </button>
                    <button onClick={() => { setMenuOpen(false); router.push('/admin/knowledge'); }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] transition-colors" style={{ color: '#6b7280' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.04)', e.currentTarget.style.color = '#111827')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = '#6b7280')}>
                      <span style={{ fontSize: '14px' }}>📚</span>{t.knowledge}
                    </button>
                  </>
                )}
                <button onClick={() => { setMenuOpen(false); setLanguage(language === 'zh' ? 'en' : 'zh'); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] transition-colors" style={{ color: '#6b7280' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.04)', e.currentTarget.style.color = '#111827')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = '#6b7280')}>
                  <Globe size={14} />{language === 'zh' ? 'English' : '中文'}
                </button>
                <div style={{ height: '1px', background: 'rgba(0,0,0,0.05)', margin: '4px 0' }} />
                <button onClick={() => { setMenuOpen(false); handleLogout(); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] transition-colors" style={{ color: '#f43f5e' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(244,63,94,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <LogOut size={14} />{t.logout}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

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
      <footer className="fixed bottom-0 w-full" style={{ background: 'linear-gradient(to top, #ffffff 60%, transparent)', paddingTop: '48px' }}>
        {!isLoading && (
          <div className="mx-auto max-w-3xl px-4 pb-2 flex flex-wrap gap-2 justify-center">
            {(() => {
              const lastMsg = messages[messages.length - 1];
              const hasPendingDraft = lastMsg?.role === 'assistant' && lastMsg.parts?.some((p: any) => p.type === 'tool-draftWorkflowApplication' && !confirmedDrafts.has(p.toolCallId));
              if (!hasPendingDraft) return null;
              return (
                <>
                  <button
                    onClick={() => {
                      const dp: any = lastMsg.parts?.find((p: any) => p.type === 'tool-draftWorkflowApplication' && !confirmedDrafts.has(p.toolCallId));
                      if (dp) setConfirmedDrafts(prev => new Set(prev).add(dp.toolCallId));
                      quickSend('确认无误，请提交。');
                    }}
                    className="text-[13px] px-4 py-1.5 rounded-md font-medium transition-all"
                    style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' }}
                  >
                    ✅ {t.confirmSubmit}
                  </button>
                  <button
                    onClick={() => quickSend('帮我修改一下信息')}
                    className="text-[13px] px-4 py-1.5 rounded-md transition-all"
                    style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)', color: '#6b7280' }}
                  >
                    ✏️ {t.modify}
                  </button>
                </>
              );
            })()}
            {getSmartShortcuts().map((s, i) => (
              <button
                key={i}
                onClick={() => quickSend(s.text)}
                className="text-[12px] px-3 py-1.5 rounded-md transition-all font-medium"
                style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}
              >
                {s.emoji} {s.shortLabel}
              </button>
            ))}
          </div>
        )}

        <div className="mx-auto max-w-3xl px-4">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-end gap-2 rounded-xl px-3 py-2.5 mb-2 ai-glass"
            style={{ border: '1px solid rgba(94,106,210,0.16)', boxShadow: '0 10px 40px rgba(94,106,210,0.16)' }}
          >
            <textarea
              ref={textareaRef}
              className="max-h-32 min-h-[44px] w-full resize-none border-0 bg-transparent py-2 pl-2 text-[14px]"
              style={{ color: '#111827', outline: 'none' }}
              placeholder={t.placeholder}
              value={input}
              onChange={(e) => { setInput(e.target.value); autoResize(); }}
              rows={1}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-all"
              style={{
                background: 'linear-gradient(135deg, #5e6ad2, #7c8bff)',
                color: '#fff',
                opacity: (isLoading || !input.trim()) ? 0.4 : 1,
                cursor: (isLoading || !input.trim()) ? 'not-allowed' : 'pointer',
              }}
            >
              <Send size={15} />
            </button>
          </form>
          <div className="pb-3 pt-1 text-center text-[11px]" style={{ color: '#d1d5db' }}>{t.poweredBy}</div>
        </div>
      </footer>
    </div>
  );
}
