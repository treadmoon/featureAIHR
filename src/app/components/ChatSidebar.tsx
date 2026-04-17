'use client';

import { useState } from 'react';
import { Trash2, Plus, Search, Package, Clock } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  sessions: any[];
  currentSessionId: string | null;
  onLoadSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onNewChat: () => void;
  onHistoryAction: (action: 'deleteByDate' | 'compress', before: string) => void;
}

export default function ChatSidebar({ open, onClose, sessions, currentSessionId, onLoadSession, onDeleteSession, onNewChat, onHistoryAction }: Props) {
  const [mgmt, setMgmt] = useState(false);
  const [search, setSearch] = useState('');

  if (!open) return null;

  const filtered = search ? sessions.filter(s => s.title?.includes(search)) : sessions;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose}
        style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }} />

      {/* Sidebar panel */}
      <div
        className="fixed top-0 left-0 h-full w-72 max-w-[85vw] z-50 flex flex-col animate-slide-in"
        style={{ background: '#f7f7f8', borderRight: '1px solid rgba(0,0,0,0.05)', boxShadow: '8px 0 32px rgba(0,0,0,0.15)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <span className="text-[13px] font-semibold" style={{ color: '#111827', letterSpacing: '-0.1px' }}>对话历史</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMgmt(true)}
              className="text-[12px] px-2.5 py-1 rounded-md transition-colors"
              style={{ color: '#9ca3af' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#6b7280', e.currentTarget.style.background = 'rgba(0,0,0,0.04)')}
              onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af', e.currentTarget.style.background = 'transparent')}
            >
              管理
            </button>
            <button
              onClick={onNewChat}
              className="text-[12px] px-2.5 py-1 rounded-md font-medium transition-colors"
              style={{ background: 'rgba(94,106,210,0.15)', color: '#5e6ad2', border: '1px solid rgba(94,106,210,0.3)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(94,106,210,0.25)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(94,106,210,0.15)')}
            >
              + 新对话
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-2.5" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-md" style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)' }}>
            <Search size={13} style={{ color: '#9ca3af' }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索对话..."
              className="flex-1 text-[12px] border-0 bg-transparent outline-none"
              style={{ color: '#111827' }}
            />
          </div>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Clock size={24} style={{ color: '#d1d5db', marginBottom: '8px' }} />
              <p className="text-[12px]" style={{ color: '#9ca3af' }}>
                {search ? '无匹配结果' : '暂无历史对话'}
              </p>
            </div>
          ) : (
            <div>
              {filtered.map(s => (
                <div
                  key={s.id}
                  className="flex items-center justify-between px-4 py-3 cursor-pointer group transition-colors"
                  style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}
                  onClick={() => onLoadSession(s.id)}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.03)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-[13px] truncate font-medium"
                      style={{ color: currentSessionId === s.id ? '#111827' : '#6b7280' }}
                    >
                      {s.title}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: '#d1d5db' }}>
                      {new Date(s.updated_at).toLocaleDateString('zh-CN')} · {s.message_count} 条
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteSession(s.id); }}
                    className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: '#9ca3af' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#f43f5e', e.currentTarget.style.background = 'rgba(244,63,94,0.1)')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af', e.currentTarget.style.background = 'transparent')}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Management Modal */}
      {mgmt && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setMgmt(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl p-5"
            style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 16px 64px rgba(0,0,0,0.15)' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-[14px] font-semibold mb-4" style={{ color: '#111827' }}>管理对话历史</h3>
            <div className="space-y-2">
              {[
                { label: '删除 7 天前的对话', icon: '🗑️', action: () => { onHistoryAction('deleteByDate', new Date(Date.now() - 7 * 86400000).toISOString()); setMgmt(false); }, danger: true },
                { label: '删除 30 天前的对话', icon: '🗑️', action: () => { onHistoryAction('deleteByDate', new Date(Date.now() - 30 * 86400000).toISOString()); setMgmt(false); }, danger: true },
                { label: '压缩 7 天前的对话（保留首尾）', icon: '📦', action: () => { onHistoryAction('compress', new Date(Date.now() - 7 * 86400000).toISOString()); setMgmt(false); }, danger: false },
                { label: '压缩 30 天前的对话（保留首尾）', icon: '📦', action: () => { onHistoryAction('compress', new Date(Date.now() - 30 * 86400000).toISOString()); setMgmt(false); }, danger: false },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={item.action}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] rounded-lg transition-colors"
                  style={{
                    background: item.danger ? 'rgba(244,63,94,0.08)' : 'rgba(245,158,11,0.08)',
                    border: `1px solid ${item.danger ? 'rgba(244,63,94,0.2)' : 'rgba(245,158,11,0.2)'}`,
                    color: item.danger ? '#f43f5e' : '#f59e0b',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = item.danger ? 'rgba(244,63,94,0.14)' : 'rgba(245,158,11,0.14)')}
                  onMouseLeave={e => (e.currentTarget.style.background = item.danger ? 'rgba(244,63,94,0.08)' : 'rgba(245,158,11,0.08)')}
                >
                  <span style={{ fontSize: '14px' }}>{item.icon}</span> {item.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setMgmt(false)}
              className="mt-4 text-[12px] transition-colors"
              style={{ color: '#9ca3af' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#6b7280')}
              onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
            >
              取消
            </button>
          </div>
        </div>
      )}
    </>
  );
}
