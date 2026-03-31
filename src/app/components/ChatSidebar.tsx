'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';

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

  if (!open) return null;

  return (<>
    <div className="fixed inset-0 z-40 flex">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-72 max-w-[80vw] bg-white shadow-xl flex flex-col h-full animate-slide-in">
        <div className="p-4 border-b flex items-center justify-between">
          <span className="font-semibold text-gray-800 text-sm">对话历史</span>
          <div className="flex gap-1">
            <button onClick={() => setMgmt(true)} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-100">管理</button>
            <button onClick={onNewChat} className="text-xs text-indigo-600 hover:text-indigo-700 px-2 py-1 rounded hover:bg-indigo-50 font-medium">+ 新对话</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-10">暂无历史对话</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {sessions.map(s => (
                <div key={s.id} className={`px-4 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer group ${currentSessionId === s.id ? 'bg-indigo-50' : ''}`}>
                  <div className="min-w-0 flex-1" onClick={() => onLoadSession(s.id)}>
                    <p className="text-sm text-gray-800 truncate font-medium">{s.title}</p>
                    <p className="text-[10px] text-gray-400">{new Date(s.updated_at).toLocaleDateString('zh-CN')} · {s.message_count} 条</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); onDeleteSession(s.id); }}
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

    {mgmt && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setMgmt(false)}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
          <h3 className="font-semibold text-gray-800 mb-4">管理对话历史</h3>
          <div className="space-y-2">
            {[
              { label: '删除 7 天前的对话', action: () => { onHistoryAction('deleteByDate', new Date(Date.now() - 7 * 86400000).toISOString()); setMgmt(false); }, color: 'red' },
              { label: '删除 30 天前的对话', action: () => { onHistoryAction('deleteByDate', new Date(Date.now() - 30 * 86400000).toISOString()); setMgmt(false); }, color: 'red' },
              { label: '压缩 7 天前的对话（保留首尾）', action: () => { onHistoryAction('compress', new Date(Date.now() - 7 * 86400000).toISOString()); setMgmt(false); }, color: 'amber' },
              { label: '压缩 30 天前的对话（保留首尾）', action: () => { onHistoryAction('compress', new Date(Date.now() - 30 * 86400000).toISOString()); setMgmt(false); }, color: 'amber' },
            ].map((item, i) => (
              <button key={i} onClick={item.action}
                className={`w-full text-left px-4 py-2.5 text-sm rounded-xl border transition-colors ${item.color === 'red' ? 'border-red-100 text-red-600 hover:bg-red-50' : 'border-amber-100 text-amber-600 hover:bg-amber-50'}`}>
                {item.color === 'red' ? '🗑️' : '📦'} {item.label}
              </button>
            ))}
          </div>
          <button onClick={() => setMgmt(false)} className="mt-3 text-xs text-gray-400 hover:text-gray-600">取消</button>
        </div>
      </div>
    )}
  </>);
}
