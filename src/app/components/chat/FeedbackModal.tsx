'use client';

import React from 'react';

const REASONS = ['回答不准确', '没有解决问题', '回复太慢', '信息不完整', '其他'];

interface Props {
  onSendReason: (reason: string) => void;
  onClose: () => void;
  language: string;
}

export default React.memo(function FeedbackModal({ onSendReason, onClose, language }: Props) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl p-5"
        style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 16px 64px rgba(0,0,0,0.15)' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-[14px] font-semibold mb-3" style={{ color: '#111827' }}>
          {language === 'zh' ? '👎 哪里不满意？' : '👎 What was wrong?'}
        </h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {REASONS.map(r => (
            <button
              key={r}
              onClick={() => onSendReason(r)}
              className="px-3 py-1.5 text-[12px] rounded-md transition-colors"
              style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)', color: '#6b7280' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(244,63,94,0.12)', e.currentTarget.style.color = '#f43f5e', e.currentTarget.style.borderColor = 'rgba(244,63,94,0.25)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.04)', e.currentTarget.style.color = '#6b7280', e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)')}
            >
              {r}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="text-[12px] transition-colors"
          style={{ color: '#9ca3af' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#6b7280')}
          onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
        >
          {language === 'zh' ? '取消' : 'Cancel'}
        </button>
      </div>
    </div>
  );
});
