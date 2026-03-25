'use client';

import { useChat } from '@ai-sdk/react';
import ReactMarkdown from 'react-markdown';
import { Bot, Send, User, Globe, CheckCircle2, Trash2, LogOut, Settings, UserCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { useSettings } from '../store/useSettings';
import ToolCards from './components/tool-cards/ToolCards';

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
  }
};

export default function HomeContent() {
  const { language, setLanguage } = useSettings();
  const t = DICT[language];
  const router = useRouter();
  const supabase = createClient();

  const [authUser, setAuthUser] = useState<{ email?: string; role?: string; effectiveRole?: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) fetchProfile(session.user.id, session.user.email);
        });
        return;
      }
      fetchProfile(user.id, user.email);
    });

    async function fetchProfile(uid: string, email?: string | null) {
      setAuthUser({ email: email || '' });
      const { data: profile } = await supabase.from('profiles').select('role, name').eq('id', uid).single();
      if (!profile) return;
      let effectiveRole = profile.role; // admin stays admin
      if (profile.role !== 'admin') {
        const { data: managed } = await supabase.from('departments').select('id').eq('manager_id', uid).limit(1);
        effectiveRole = managed && managed.length > 0 ? 'manager' : 'employee';
      }
      setAuthUser({ email: email || '', role: profile.role, effectiveRole });
    }
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const { messages, sendMessage, status, error, clearError, setMessages } = useChat({
    // @ts-expect-error - AI SDK v6 React bindings
    api: `/api/chat?role=${authUser?.effectiveRole || 'employee'}`,
    onError: (err) => { console.error('[useChat error]', err); },
  });

  const eRole = (authUser?.effectiveRole || 'employee') as 'employee' | 'manager' | 'admin';

  const [input, setInput] = useState('');
  const [confirmedDrafts, setConfirmedDrafts] = useState<Set<string>>(new Set());
  const [feedbackSent, setFeedbackSent] = useState<Set<string>>(new Set());
  const [feedbackModal, setFeedbackModal] = useState<{ id: string; rating: string } | null>(null);
  const [msgTimestamps] = useState<Map<string, number>>(() => new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isLoading = status === 'submitted' || status === 'streaming';
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const pendingCount = pendingItems.length;
  const [notifications, setNotifications] = useState<any[]>([]);
  const [dismissedNotifs, setDismissedNotifs] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [historyMgmt, setHistoryMgmt] = useState(false);
  const savedMsgCount = useRef(0);

  useEffect(() => {
    fetch('/api/approvals?tab=pending').then(r => r.json()).then(d => { if (Array.isArray(d)) setPendingItems(d); }).catch(() => {});
    fetch('/api/notifications').then(r => r.json()).then(d => { if (Array.isArray(d)) setNotifications(d); }).catch(() => {});
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    if (menuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  // 加载历史会话列表
  const loadSessions = () => { fetch('/api/chat-history').then(r => r.json()).then(d => { if (Array.isArray(d)) setSessions(d); }).catch(() => {}); };
  useEffect(() => { loadSessions(); }, []);

  // 自动保存：当消息增加且非 streaming 时保存
  useEffect(() => {
    if (status === 'streaming' || status === 'submitted' || messages.length === 0) return;
    if (messages.length <= savedMsgCount.current) return;
    const newMsgs = messages.slice(savedMsgCount.current);
    savedMsgCount.current = messages.length;
    (async () => {
      let sid = currentSessionId;
      if (!sid) {
        const res = await fetch('/api/chat-history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create' }) });
        const data = await res.json();
        sid = data?.id;
        if (sid) setCurrentSessionId(sid);
      }
      if (sid) {
        await fetch('/api/chat-history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'save', sessionId: sid, messages: newMsgs, totalCount: messages.length }) });
        loadSessions();
      }
    })();
  }, [messages, status]);

  // 加载历史会话
  const loadSession = async (sid: string) => {
    const res = await fetch('/api/chat-history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'load', sessionId: sid }) });
    const msgs = await res.json();
    if (Array.isArray(msgs)) {
      setMessages(msgs.map((m: any, i: number) => ({ id: `hist-${i}`, role: m.role, parts: m.parts || [{ type: 'text', text: m.content }] })));
      setCurrentSessionId(sid);
      savedMsgCount.current = msgs.length;
      setSidebarOpen(false);
    }
  };

  // 新对话
  const handleNewChat = () => { setMessages([]); setCurrentSessionId(null); savedMsgCount.current = 0; setConfirmedDrafts(new Set()); setFeedbackSent(new Set()); setSidebarOpen(false); };

  // 删除会话
  const deleteSession = async (sid: string) => {
    await fetch('/api/chat-history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', sessionId: sid }) });
    if (currentSessionId === sid) handleNewChat();
    loadSessions();
  };

  // 按日期删除/压缩
  const historyAction = async (action: 'deleteByDate' | 'compress', before: string) => {
    await fetch('/api/chat-history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, before }) });
    loadSessions();
    setHistoryMgmt(false);
  };

  const autoResize = () => {
    const el = textareaRef.current;
    if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 128) + 'px'; }
  };

  // Track timestamps for new messages
  useEffect(() => {
    for (const m of messages) {
      if (!msgTimestamps.has(m.id)) msgTimestamps.set(m.id, Date.now());
    }
  }, [messages, msgTimestamps]);

  useEffect(() => {
    if (status === 'error') {
      console.error('[Chat error]', error);
    }
  }, [status, error]);

  const handleClear = () => { handleNewChat(); };

  const sendFeedback = async (msgId: string, rating: string, reason?: string) => {
    const msg = messages.find(m => m.id === msgId);
    const prevUser = messages[messages.findIndex(m => m.id === msgId) - 1];
    setFeedbackSent(prev => new Set(prev).add(msgId));
    setFeedbackModal(null);
    fetch('/api/feedback', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messageId: msgId, rating, reason,
        userMessage: prevUser?.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('') || '',
        assistantMessage: msg?.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('') || '',
      }),
    }).catch(() => {});
  };

  // ---- Dynamic shortcuts based on usage frequency ----
  const SHORTCUTS_KEY = 'ai_hr_shortcut_usage';
  type ShortcutItem = { emoji: string; text: string; shortLabel: string; color: string };
  const ROLE_SHORTCUTS: Record<string, ShortcutItem[]> = {
    employee: language === 'zh' ? [
      { emoji: '🏖️', text: '我想请假', shortLabel: '请假', color: 'indigo' },
      { emoji: '📊', text: '查一下我的年假余额', shortLabel: '年假余额', color: 'emerald' },
      { emoji: '📋', text: '查看我的申请记录', shortLabel: '申请记录', color: 'amber' },
      { emoji: '⏰', text: '查一下我的考勤记录', shortLabel: '考勤', color: 'sky' },
      { emoji: '💰', text: '查一下我的薪资明细', shortLabel: '薪资明细', color: 'rose' },
      { emoji: '🔑', text: '帮我重置密码', shortLabel: '重置密码', color: 'purple' },
      { emoji: '💻', text: 'VPN连不上怎么办', shortLabel: 'VPN排障', color: 'cyan' },
      { emoji: '📝', text: '帮我起草一封邮件', shortLabel: '起草邮件', color: 'orange' },
      { emoji: '🧾', text: '我要报销', shortLabel: '报销', color: 'teal' },
      { emoji: '🏥', text: '查一下我的社保信息', shortLabel: '社保', color: 'pink' },
    ] : [
      { emoji: '🏖️', text: 'I want to take leave', shortLabel: 'Leave', color: 'indigo' },
      { emoji: '📊', text: 'Check my leave balance', shortLabel: 'Balance', color: 'emerald' },
      { emoji: '📋', text: 'View my requests', shortLabel: 'Requests', color: 'amber' },
      { emoji: '⏰', text: 'Check my attendance', shortLabel: 'Attendance', color: 'sky' },
      { emoji: '💰', text: 'Check my salary details', shortLabel: 'Salary', color: 'rose' },
      { emoji: '🔑', text: 'Reset my password', shortLabel: 'Password', color: 'purple' },
      { emoji: '💻', text: 'VPN not working', shortLabel: 'VPN', color: 'cyan' },
      { emoji: '📝', text: 'Draft an email for me', shortLabel: 'Email', color: 'orange' },
      { emoji: '🧾', text: 'Submit expense report', shortLabel: 'Expense', color: 'teal' },
      { emoji: '🏥', text: 'Check my insurance info', shortLabel: 'Insurance', color: 'pink' },
    ],
    manager: language === 'zh' ? [
      { emoji: '📊', text: '查看团队本月考勤概览', shortLabel: '团队考勤', color: 'sky' },
      { emoji: '📋', text: '查看待我审批的申请', shortLabel: '待审批', color: 'amber' },
      { emoji: '📈', text: '团队本月出勤率怎么样', shortLabel: '出勤率', color: 'emerald' },
      { emoji: '🏖️', text: '最近谁请假了', shortLabel: '谁请假了', color: 'indigo' },
      { emoji: '👥', text: '查看我的团队成员', shortLabel: '团队花名册', color: 'purple' },
      { emoji: '💰', text: '查一下我的薪资明细', shortLabel: '我的薪资', color: 'rose' },
      { emoji: '🏖️', text: '我想请假', shortLabel: '我要请假', color: 'teal' },
    ] : [
      { emoji: '📊', text: 'Show team attendance this month', shortLabel: 'Team Attendance', color: 'sky' },
      { emoji: '📋', text: 'View pending approvals', shortLabel: 'Approvals', color: 'amber' },
      { emoji: '📈', text: 'Team attendance rate this month', shortLabel: 'Rate', color: 'emerald' },
      { emoji: '🏖️', text: 'Who is on leave recently', shortLabel: 'On Leave', color: 'indigo' },
      { emoji: '👥', text: 'Show my team members', shortLabel: 'Team', color: 'purple' },
      { emoji: '💰', text: 'Check my salary details', shortLabel: 'My Salary', color: 'rose' },
      { emoji: '🏖️', text: 'I want to take leave', shortLabel: 'My Leave', color: 'teal' },
    ],
    admin: language === 'zh' ? [
      { emoji: '🔍', text: '查询员工信息', shortLabel: '查员工', color: 'indigo' },
      { emoji: '👥', text: '全公司目前在职多少人', shortLabel: '在职统计', color: 'emerald' },
      { emoji: '📊', text: '本月全公司考勤异常统计', shortLabel: '异常考勤', color: 'amber' },
      { emoji: '✏️', text: '修改员工信息', shortLabel: '改信息', color: 'purple' },
      { emoji: '💰', text: '全公司薪资总览', shortLabel: '薪资总览', color: 'rose' },
      { emoji: '📋', text: '查看待审批的申请', shortLabel: '待审批', color: 'sky' },
    ] : [
      { emoji: '🔍', text: 'Search employee info', shortLabel: 'Search', color: 'indigo' },
      { emoji: '👥', text: 'Total active employees', shortLabel: 'Headcount', color: 'emerald' },
      { emoji: '📊', text: 'Company attendance anomalies', shortLabel: 'Anomalies', color: 'amber' },
      { emoji: '✏️', text: 'Update employee info', shortLabel: 'Update', color: 'purple' },
      { emoji: '💰', text: 'Company salary overview', shortLabel: 'Salary', color: 'rose' },
      { emoji: '📋', text: 'View pending approvals', shortLabel: 'Approvals', color: 'sky' },
    ],
  };
  const ALL_SHORTCUTS = ROLE_SHORTCUTS[eRole] || ROLE_SHORTCUTS.employee;

  const getUsage = (): Record<string, number> => {
    try { return JSON.parse(localStorage.getItem(SHORTCUTS_KEY) || '{}'); } catch { return {}; }
  };
  const trackUsage = (text: string) => {
    const usage = getUsage();
    usage[text] = (usage[text] || 0) + 1;
    localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(usage));
  };

  // Sort by usage frequency, show top 5; context-aware extras based on last message
  const getSmartShortcuts = () => {
    const usage = getUsage();
    const lastAst = messages.filter(m => m.role === 'assistant').slice(-1)[0];
    const lastText = (lastAst?.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join(' ') || '').toLowerCase();

    // Context-aware: detect topic from last AI response
    const contextExtras: typeof ALL_SHORTCUTS = [];
    if (lastText.includes('请假') || lastText.includes('leave') || lastText.includes('年假')) {
      contextExtras.push(...ALL_SHORTCUTS.filter(s => ['请假','年假','leave','balance'].some(k => s.text.includes(k))));
    }
    if (lastText.includes('工资') || lastText.includes('薪') || lastText.includes('salary')) {
      contextExtras.push(...ALL_SHORTCUTS.filter(s => ['薪资','salary','社保','insurance'].some(k => s.text.includes(k))));
    }
    if (lastText.includes('密码') || lastText.includes('vpn') || lastText.includes('password')) {
      contextExtras.push(...ALL_SHORTCUTS.filter(s => ['密码','VPN','password','vpn'].some(k => s.text.toLowerCase().includes(k.toLowerCase()))));
    }

    // Merge: context extras first, then by frequency
    const sorted = [...ALL_SHORTCUTS].sort((a, b) => (usage[b.text] || 0) - (usage[a.text] || 0));
    const seen = new Set<string>();
    const result: typeof ALL_SHORTCUTS = [];
    for (const s of [...contextExtras, ...sorted]) {
      if (!seen.has(s.text)) { seen.add(s.text); result.push(s); }
    }
    return result.slice(0, 5);
  };

  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100',
    amber: 'bg-amber-50 text-amber-600 hover:bg-amber-100',
    sky: 'bg-sky-50 text-sky-600 hover:bg-sky-100',
    rose: 'bg-rose-50 text-rose-600 hover:bg-rose-100',
    purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
    cyan: 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100',
    orange: 'bg-orange-50 text-orange-600 hover:bg-orange-100',
    teal: 'bg-teal-50 text-teal-600 hover:bg-teal-100',
    pink: 'bg-pink-50 text-pink-600 hover:bg-pink-100',
  };

  const fmtTime = (id: string) => {
    const ts = msgTimestamps.get(id);
    return ts ? new Date(ts).toLocaleTimeString(language === 'zh' ? 'zh-CN' : 'en', { hour: '2-digit', minute: '2-digit' }) : '';
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    if (status === 'error') clearError();
    sendMessage({ role: 'user', parts: [{ type: 'text', text: input }] });
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const quickSend = (text: string) => {
    if (isLoading) return;
    if (status === 'error') clearError();
    trackUsage(text);
    sendMessage({ role: 'user', parts: [{ type: 'text', text }] });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex h-screen w-full flex-col bg-gradient-to-b from-slate-50 to-gray-100/80 text-gray-900 font-sans">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/60 bg-white/70 backdrop-blur-xl px-4 md:px-6 sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(v => !v)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-indigo-200/50">
            <Bot size={22} />
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-[15px] font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent leading-tight">{t.title}</h1>
            <p className="text-[11px] text-slate-400 leading-tight">{t.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {messages.length > 0 && (
            <button onClick={handleClear} title={language === 'zh' ? '清空对话' : 'Clear chat'}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all duration-200">
              <Trash2 size={17} />
            </button>
          )}

          <button onClick={() => router.push('/approvals')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-50 to-orange-50 text-amber-600 hover:from-amber-100 hover:to-orange-100 border border-amber-100/80 transition-all duration-200 relative">
            <CheckCircle2 size={14} /><span className="hidden sm:inline">{language === 'zh' ? '审批' : 'Approvals'}</span>
            {pendingCount > 0 && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">{pendingCount}</span>}
          </button>

          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen(v => !v)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full bg-slate-100/80 hover:bg-slate-200/80 transition-all duration-200 border border-slate-200/50">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                {(authUser?.email || '?')[0].toUpperCase()}
              </div>
              <span className="text-xs text-slate-600 hidden sm:inline max-w-[80px] truncate font-medium">{authUser?.email?.split('@')[0] || ''}</span>
              <svg className={`w-3 h-3 text-slate-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl shadow-lg shadow-slate-200/50 border border-slate-200/80 py-1 z-50 animate-fade-up">
                <button onClick={() => { setMenuOpen(false); router.push('/profile'); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                  <UserCircle size={15} className="text-slate-400" />{language === 'zh' ? '个人中心' : 'Profile'}
                </button>
                {authUser?.role === 'admin' && (<>
                  <button onClick={() => { setMenuOpen(false); router.push('/admin/employees'); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                    <Settings size={15} className="text-slate-400" />{language === 'zh' ? '管理后台' : 'Admin'}
                  </button>
                  <button onClick={() => { setMenuOpen(false); router.push('/admin/dashboard'); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                    <span className="text-slate-400 text-[15px]">📊</span>{language === 'zh' ? '数据看板' : 'Dashboard'}
                  </button>
                </>)}
                <button onClick={() => { setMenuOpen(false); setLanguage(language === 'zh' ? 'en' : 'zh'); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                  <Globe size={15} className="text-slate-400" />{language === 'zh' ? 'English' : '中文'}
                </button>
                <div className="my-1 border-t border-slate-100" />
                <button onClick={() => { setMenuOpen(false); handleLogout(); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-rose-500 hover:bg-rose-50 transition-colors">
                  <LogOut size={15} />{language === 'zh' ? '退出登录' : 'Logout'}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10">
        <div className="mx-auto flex max-w-3xl flex-col gap-5 pb-48">
          {/* 通知区 */}
          {notifications.filter(n => !dismissedNotifs.has(n.type)).length > 0 && (
            <div className="space-y-2 animate-fade-up">
              {notifications.filter(n => !dismissedNotifs.has(n.type)).map(n => {
                const colors: Record<string, string> = {
                  birthday: 'from-pink-50 to-rose-50 border-pink-200/80',
                  contract: 'from-red-50 to-orange-50 border-red-200/80',
                  approval: 'from-amber-50 to-orange-50 border-amber-200/80',
                  onboarding: 'from-emerald-50 to-teal-50 border-emerald-200/80',
                  attendance: 'from-sky-50 to-blue-50 border-sky-200/80',
                };
                const textColors: Record<string, string> = {
                  birthday: 'text-pink-800', contract: 'text-red-800', approval: 'text-amber-800',
                  onboarding: 'text-emerald-800', attendance: 'text-sky-800',
                };
                return (
                  <div key={n.type} className={`bg-gradient-to-r ${colors[n.type] || colors.approval} border rounded-2xl p-3.5 shadow-sm`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <span className="text-lg shrink-0">{n.icon}</span>
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold ${textColors[n.type] || 'text-gray-800'}`}>{n.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{n.desc}</p>
                        </div>
                      </div>
                      <button onClick={() => setDismissedNotifs(prev => new Set(prev).add(n.type))} className="text-gray-300 hover:text-gray-500 text-xs ml-2 shrink-0">✕</button>
                    </div>
                    {n.action && n.action.startsWith('/') && (
                      <button onClick={() => router.push(n.action)} className="mt-2 w-full py-1.5 text-xs font-medium text-gray-600 bg-white/80 hover:bg-white rounded-lg border border-gray-200 transition-colors">
                        前往处理 →
                      </button>
                    )}
                    {n.action === 'onboarding' && (
                      <div className="mt-2 grid grid-cols-2 gap-1.5">
                        {['完善个人信息', '阅读员工手册', '设置 VPN/邮箱', '认识你的团队'].map((item, i) => (
                          <button key={i} onClick={() => quickSend(item)}
                            className="text-xs py-1.5 px-2 bg-white/80 hover:bg-white rounded-lg border border-emerald-200 text-emerald-700 transition-colors">
                            {['📝','📖','🔑','👥'][i]} {item}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {messages.length === 0 ? (
            <div className="mt-16 md:mt-24 flex flex-col items-center text-center animate-fade-up">
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-400 to-purple-400 blur-2xl opacity-20 scale-110" />
                <div className="relative rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-5 shadow-xl shadow-indigo-200/40">
                  <Bot size={40} className="text-white" />
                </div>
              </div>
              <h2 className="mb-2 text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">{t.greeting[eRole]}</h2>
              <p className="max-w-md text-sm text-slate-400 leading-relaxed">{t.greetingSub[eRole]}</p>
              <div className="mt-10 grid w-full max-w-2xl grid-cols-1 gap-3 md:grid-cols-2">
                {t.suggestions[eRole].map((s: string, i: number) => (
                  <button key={i} onClick={() => quickSend(s)}
                    className="group flex text-left items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-sm p-4 text-sm text-slate-600 shadow-sm transition-all duration-200 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-100/30 hover:-translate-y-0.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-500 group-hover:from-indigo-100 group-hover:to-purple-100 transition-colors">
                      {(t.suggestionIcons[eRole] || [])[i] || '💬'}
                    </span>
                    <span className="leading-snug">{s}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message: any, mIndex: number) => (
              <div key={message.id} className={`flex gap-3 animate-fade-up ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm ${message.role === 'user' ? 'bg-gradient-to-br from-slate-700 to-slate-900 text-white' : 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-indigo-200/40'}`}>
                  {message.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                </div>
                <div className="flex flex-col gap-1 max-w-[78%]">
                <div className={`rounded-2xl px-4 py-3 shadow-sm ${message.role === 'user' ? 'bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-tr-md' : 'bg-white/90 backdrop-blur-sm text-slate-700 border border-slate-200/60 rounded-tl-md'}`}>
                  {message.parts?.filter((p: any) => p.type === 'text' && p.text?.trim())
                    .filter((p: any) => {
                      const t = p.text.trim();
                      if (message.role !== 'assistant') return true;
                      return !t.startsWith('🤔') && !t.includes('(Reasoning)') && !t.includes('思考流') && !/^[\s\S]{0,20}workflowType:/m.test(t);
                    })
                    .map((part: any, index: number) => (
                    <div key={`text-${index}`} className="prose text-sm max-w-none mb-2">
                      <ReactMarkdown>{part.text}</ReactMarkdown>
                    </div>
                  ))}
                  <ToolCards message={message} confirmedDrafts={confirmedDrafts} setConfirmedDrafts={setConfirmedDrafts} isLoading={isLoading} quickSend={quickSend} />
                  {(!message.parts || message.parts.length === 0) && <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>}
                </div>
                <span className={`text-[10px] text-gray-400 px-1 flex items-center gap-1.5 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {fmtTime(message.id)}
                  {message.role === 'assistant' && !(mIndex === messages.length - 1 && status === 'streaming') && (
                    feedbackSent.has(message.id)
                      ? <span className="text-[10px] text-emerald-400 ml-1">已反馈</span>
                      : <>
                          <button onClick={() => sendFeedback(message.id, 'good')} className="ml-1 hover:scale-125 transition-transform" title="有帮助">👍</button>
                          <button onClick={() => setFeedbackModal({ id: message.id, rating: 'bad' })} className="hover:scale-125 transition-transform" title="不满意">👎</button>
                        </>
                  )}
                </span>
                </div>
              </div>
            ))
          )}
          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex gap-3 flex-row animate-fade-up">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-sm shadow-indigo-200/40"><Bot size={18} /></div>
              <div className="rounded-2xl rounded-tl-md bg-white/90 backdrop-blur-sm border border-slate-200/60 px-5 py-3.5 shadow-sm">
                <div className="flex gap-1.5 items-center">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-300"></span>
                  <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400" style={{ animationDelay: '0.15s' }}></span>
                  <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-500" style={{ animationDelay: '0.3s' }}></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* 侧边栏 */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-72 max-w-[80vw] bg-white shadow-xl flex flex-col h-full animate-slide-in">
            <div className="p-4 border-b flex items-center justify-between">
              <span className="font-semibold text-gray-800 text-sm">对话历史</span>
              <div className="flex gap-1">
                <button onClick={() => setHistoryMgmt(true)} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-100">管理</button>
                <button onClick={handleNewChat} className="text-xs text-indigo-600 hover:text-indigo-700 px-2 py-1 rounded hover:bg-indigo-50 font-medium">+ 新对话</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {sessions.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-10">暂无历史对话</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {sessions.map(s => (
                    <div key={s.id} className={`px-4 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer group ${currentSessionId === s.id ? 'bg-indigo-50' : ''}`}>
                      <div className="min-w-0 flex-1" onClick={() => loadSession(s.id)}>
                        <p className="text-sm text-gray-800 truncate font-medium">{s.title}</p>
                        <p className="text-[10px] text-gray-400">{new Date(s.updated_at).toLocaleDateString('zh-CN')} · {s.message_count} 条</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 历史管理弹窗 */}
      {historyMgmt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setHistoryMgmt(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-800 mb-4">管理对话历史</h3>
            <div className="space-y-2">
              {[
                { label: '删除 7 天前的对话', action: () => historyAction('deleteByDate', new Date(Date.now() - 7 * 86400000).toISOString()), color: 'red' },
                { label: '删除 30 天前的对话', action: () => historyAction('deleteByDate', new Date(Date.now() - 30 * 86400000).toISOString()), color: 'red' },
                { label: '压缩 7 天前的对话（保留首尾）', action: () => historyAction('compress', new Date(Date.now() - 7 * 86400000).toISOString()), color: 'amber' },
                { label: '压缩 30 天前的对话（保留首尾）', action: () => historyAction('compress', new Date(Date.now() - 30 * 86400000).toISOString()), color: 'amber' },
              ].map((item, i) => (
                <button key={i} onClick={item.action}
                  className={`w-full text-left px-4 py-2.5 text-sm rounded-xl border transition-colors ${item.color === 'red' ? 'border-red-100 text-red-600 hover:bg-red-50' : 'border-amber-100 text-amber-600 hover:bg-amber-50'}`}>
                  {item.color === 'red' ? '🗑️' : '📦'} {item.label}
                </button>
              ))}
            </div>
            <button onClick={() => setHistoryMgmt(false)} className="mt-3 text-xs text-gray-400 hover:text-gray-600">取消</button>
          </div>
        </div>
      )}

      {feedbackModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setFeedbackModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-800 mb-3">👎 哪里不满意？</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {['回答不准确', '没有解决问题', '回复太慢', '信息不完整', '其他'].map(r => (
                <button key={r} onClick={() => sendFeedback(feedbackModal.id, 'bad', r)}
                  className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors border border-gray-200">{r}</button>
              ))}
            </div>
            <button onClick={() => setFeedbackModal(null)} className="text-xs text-gray-400 hover:text-gray-600">取消</button>
          </div>
        </div>
      )}

      <footer className="fixed bottom-0 w-full bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent pt-6">
        {status === 'error' && (
          <div className="mx-auto max-w-3xl px-4 pb-2">
            <div className="flex items-center justify-between bg-rose-50 border border-rose-200 rounded-2xl px-4 py-2.5 text-sm text-rose-700 animate-fade-up">
              <span>⚠️ {language === 'zh' ? '网络异常，请重试' : 'Network error, please retry'}</span>
              <button onClick={() => clearError()} className="text-rose-500 hover:text-rose-700 font-semibold ml-3 text-xs">✕</button>
            </div>
          </div>
        )}
        {!isLoading && (
          <div className="mx-auto max-w-3xl flex flex-wrap gap-2 px-4 pb-2 justify-center">
            {(() => {
              const lastMsg = messages[messages.length - 1];
              const hasPendingDraft = lastMsg?.role === 'assistant' && lastMsg.parts?.some((p: any) => p.type === 'tool-draftWorkflowApplication' && !confirmedDrafts.has(p.toolCallId));
              if (hasPendingDraft) return (
                <>
                  <button onClick={() => { const dp: any = lastMsg.parts?.find((p: any) => p.type === 'tool-draftWorkflowApplication' && !confirmedDrafts.has(p.toolCallId)); if (dp) setConfirmedDrafts(prev => new Set(prev).add(dp.toolCallId)); quickSend('确认无误，请提交。'); }} className="text-sm bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full hover:bg-indigo-200 transition-all duration-200 shadow-sm font-semibold border border-indigo-200/50">✅ 确认提交</button>
                  <button onClick={() => quickSend('帮我修改一下信息')} className="text-sm bg-white text-slate-600 px-4 py-1.5 rounded-full hover:bg-slate-100 transition-all duration-200 shadow-sm font-medium border border-slate-200">✏️ 修改信息</button>
                </>
              );
              return null;
            })()}
            {getSmartShortcuts().map((s, i) => (
              <button key={i} onClick={() => quickSend(s.text)}
                className={`text-[13px] px-3.5 py-1.5 rounded-full transition-all duration-200 shadow-sm font-medium border border-transparent hover:-translate-y-0.5 hover:shadow-md ${colorMap[s.color] || colorMap.indigo}`}>
                {s.emoji} {s.shortLabel}
              </button>
            ))}
          </div>
        )}
        <div className="mx-auto max-w-3xl px-4">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex w-full items-end gap-2 rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-xl p-2 shadow-xl shadow-slate-200/30 ring-1 ring-slate-900/[0.03] transition-all duration-200 focus-within:ring-2 focus-within:ring-indigo-500/40 focus-within:border-indigo-200 focus-within:shadow-indigo-100/20 mb-2">
            <textarea ref={textareaRef} className="max-h-32 min-h-[44px] w-full resize-none border-0 bg-transparent py-3 pl-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-0" placeholder={t.placeholder} value={input} onChange={(e) => { setInput(e.target.value); autoResize(); }} rows={1} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} />
            <button type="submit" disabled={isLoading || !input.trim()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-200/50 transition-all duration-200 hover:shadow-indigo-300/50 hover:scale-105 disabled:opacity-40 disabled:shadow-none disabled:hover:scale-100 active:scale-95"><Send size={17} className="translate-x-[1px]" /></button>
          </form>
          <div className="pb-3 pt-1 text-center text-[11px] text-slate-400/80">{t.poweredBy}</div>
        </div>
      </footer>
    </div>
  );
}
