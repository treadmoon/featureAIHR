'use client';

import React from 'react';
import ApprovalDetailContent from '@/app/approvals/[id]/ApprovalDetailClient';

interface Props {
  id: string;
  userId: string;
  onClose: () => void;
  onExpand: () => void;
}

export default React.memo(function ApprovalDetailModal({ id, userId, onClose, onExpand }: Props) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl overflow-hidden"
        style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 16px 64px rgba(0,0,0,0.2)', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-2">
            <span className="text-lg">🔍</span>
            <h3 className="text-[15px] font-semibold" style={{ color: '#111827' }}>审批详情</h3>
          </div>
          <button onClick={onClose} style={{ color: '#9ca3af', padding: '4px', cursor: 'pointer' }}>✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <ApprovalDetailContent id={id} userId={userId} />
        </div>
        <div className="px-5 py-3" style={{ borderTop: '1px solid rgba(0,0,0,0.06)', background: 'rgba(0,0,0,0.01)' }}>
          <button
            onClick={onExpand}
            className="w-full py-2 text-[13px] font-medium rounded-lg transition-colors"
            style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            展开完整页面 →
          </button>
        </div>
      </div>
    </div>
  );
});
