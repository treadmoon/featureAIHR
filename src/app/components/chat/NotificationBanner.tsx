'use client';

import React from 'react';
import { X } from 'lucide-react';

const NOTIF_COLORS: Record<string, { bg: string; border: string; icon: string }> = {
  birthday:    { bg: 'rgba(244,63,94,0.1)', border: 'rgba(244,63,94,0.2)', icon: '🎂' },
  contract:    { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', icon: '⚠️' },
  approval:    { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', icon: '📋' },
  onboarding:  { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', icon: '🎉' },
  attendance:  { bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.2)', icon: '⏰' },
  approval_approved:  { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', icon: '✅' },
  approval_rejected:  { bg: 'rgba(244,63,94,0.1)', border: 'rgba(244,63,94,0.2)', icon: '❌' },
};

interface Notification {
  type: string;
  title: string;
  desc: string;
  action?: string;
}

interface Props {
  notifications: Notification[];
  dismissedNotifs: Set<string>;
  onDismiss: (type: string) => void;
  onNavigate: (path: string) => void;
  language: string;
}

export default React.memo(function NotificationBanner({ notifications, dismissedNotifs, onDismiss, onNavigate, language }: Props) {
  const visible = notifications.filter(n => !dismissedNotifs.has(n.type));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2 mt-4 animate-fade-up">
      {visible.map(n => {
        const nc = NOTIF_COLORS[n.type] || NOTIF_COLORS.approval;
        return (
          <div
            key={n.type}
            className="flex items-start justify-between rounded-lg px-4 py-3"
            style={{ background: nc.bg, border: `1px solid ${nc.border}` }}
          >
            <div className="flex items-start gap-2.5 flex-1 min-w-0">
              <span style={{ fontSize: '16px' }}>{nc.icon}</span>
              <div className="min-w-0">
                <p className="text-[13px] font-medium" style={{ color: '#374151' }}>{n.title}</p>
                <p className="text-[12px] mt-0.5" style={{ color: '#9ca3af' }}>{n.desc}</p>
              </div>
            </div>
            <button
              onClick={() => onDismiss(n.type)}
              className="ml-2 shrink-0 p-1 rounded"
              style={{ color: '#9ca3af' }}
            >
              <X size={12} />
            </button>
            {n.action && n.action.startsWith('/') && (
              <button
                onClick={() => onNavigate(n.action!)}
                className="mt-2 w-full py-1.5 text-[12px] font-medium rounded-md text-center transition-colors"
                style={{ background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.08)', color: '#374151' }}
              >
                {language === 'zh' ? '前往处理 →' : 'View →'}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
});
