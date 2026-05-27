'use client';

import { Bot, Trash2, LogOut, Settings, UserCircle, ChevronDown, Menu, CheckCircle2, Globe } from 'lucide-react';
import { DICT } from '../constants';

interface HeaderProps {
  authUser: { id?: string; email?: string; role?: string; effectiveRole?: string } | null;
  pendingCount: number;
  messagesLength: number;
  onClear: () => void;
  onMenuToggle: () => void;
  menuOpen: boolean;
  menuRef: React.RefObject<HTMLDivElement | null>;
  language: 'zh' | 'en';
  onLogout: () => void;
  onLanguageToggle: () => void;
  onNavigate: (path: string) => void;
  onSidebarToggle: () => void;
}

export default function Header({
  authUser, pendingCount, messagesLength, onClear, onMenuToggle, menuOpen, menuRef,
  language, onLogout, onLanguageToggle, onNavigate, onSidebarToggle,
}: HeaderProps) {
  const t = DICT[language];

  return (
    <header
      className="flex h-14 shrink-0 items-center justify-between px-4 md:px-5 sticky top-0 z-30 ai-glass"
      style={{ borderBottom: '1px solid rgba(94,106,210,0.12)' }}
    >
      <div className="flex items-center gap-3">
        <button onClick={onSidebarToggle} className="btn-icon" title="历史对话">
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
        {messagesLength > 0 && (
          <button onClick={onClear} title={t.clear} className="btn-icon" style={{ color: '#9ca3af' }}>
            <Trash2 size={14} />
          </button>
        )}
        <button
          onClick={() => onNavigate('/approvals')}
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
            onClick={onMenuToggle}
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
              <button onClick={() => { onMenuToggle(); onNavigate('/profile'); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] transition-colors" style={{ color: '#6b7280' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.04)', e.currentTarget.style.color = '#111827')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = '#6b7280')}>
                <UserCircle size={14} />{t.profile}
              </button>
              {authUser?.role === 'admin' && (
                <>
                  <button onClick={() => { onMenuToggle(); onNavigate('/admin/employees'); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] transition-colors" style={{ color: '#6b7280' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.04)', e.currentTarget.style.color = '#111827')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = '#6b7280')}>
                    <Settings size={14} />{t.admin}
                  </button>
                  <button onClick={() => { onMenuToggle(); onNavigate('/admin/dashboard'); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] transition-colors" style={{ color: '#6b7280' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.04)', e.currentTarget.style.color = '#111827')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = '#6b7280')}>
                    <span style={{ fontSize: '14px' }}>📊</span>{t.dashboard}
                  </button>
                  <button onClick={() => { onMenuToggle(); onNavigate('/admin/knowledge'); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] transition-colors" style={{ color: '#6b7280' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.04)', e.currentTarget.style.color = '#111827')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = '#6b7280')}>
                    <span style={{ fontSize: '14px' }}>📚</span>{t.knowledge}
                  </button>
                </>
              )}
              <button onClick={() => { onMenuToggle(); onLanguageToggle(); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] transition-colors" style={{ color: '#6b7280' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.04)', e.currentTarget.style.color = '#111827')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = '#6b7280')}>
                <Globe size={14} />{language === 'zh' ? 'English' : '中文'}
              </button>
              <div style={{ height: '1px', background: 'rgba(0,0,0,0.05)', margin: '4px 0' }} />
              <button onClick={() => { onMenuToggle(); onLogout(); }}
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
  );
}
