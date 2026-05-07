'use client';

import React, { useState, useMemo } from 'react';

const LEAVE_TYPES = [
  { value: 'lieu', label: '调休假', desc: '不扣工资' },
  { value: 'annual', label: '年假', desc: '不扣工资' },
  { value: 'sick', label: '病假', desc: '按比例扣薪' },
  { value: 'personal', label: '事假', desc: '按日扣薪' },
  { value: 'marriage', label: '婚假', desc: '带薪' },
  { value: 'maternity', label: '产假', desc: '带薪' },
  { value: 'bereavement', label: '丧假', desc: '带薪' },
];

const inputStyle = {
  background: 'rgba(0,0,0,0.03)',
  border: '1px solid rgba(0,0,0,0.07)',
  borderRadius: '10px',
  color: '#111827',
  fontSize: '14px',
  outline: 'none',
  width: '100%' as const,
  padding: '8px 12px',
};
const inputFocus = { borderColor: 'rgba(113,112,255,0.5)', boxShadow: '0 0 0 3px rgba(113,112,255,0.12)' };
const labelStyle = { fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px', fontWeight: '500' as const };

function Badge({ children, colorClass }: { children: React.ReactNode; colorClass: string }) {
  const styles: Record<string, { bg: string; border: string; text: string }> = {
    indigo: { bg: 'rgba(94,106,210,0.2)', border: 'rgba(94,106,210,0.4)', text: '#5e6ad2' },
    emerald: { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', text: '#10b981' },
  };
  const s = styles[colorClass] || styles.indigo;
  return (
    <span style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.text, borderRadius: '9999px', fontSize: '11px', padding: '2px 8px', fontWeight: '510' }}>
      {children}
    </span>
  );
}

interface LeaveFormProps {
  leaveData: any;
  toolCallId: string;
  isConfirmed: boolean;
  isLoading: boolean;
  recommendation: string | null;
  balance: any;
  onConfirm: (data: { type: string; startDate: string; endDate: string; reason: string; note: string }) => void;
}

export default React.memo(function LeaveForm({ leaveData, toolCallId, isConfirmed, isLoading, recommendation, balance, onConfirm }: LeaveFormProps) {
  const [leaveType, setLeaveType] = useState(leaveData.leaveType);
  const [startDate, setStartDate] = useState(leaveData.startDate);
  const [endDate, setEndDate] = useState(leaveData.endDate);
  const [reason, setReason] = useState(leaveData.leaveReason || '');
  const [note, setNote] = useState(leaveData.leaveNote || '');

  const days = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000 + 1;
  }, [startDate, endDate]);

  const disabled = isConfirmed || isLoading;
  const disabledStyle = { opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'default' };

  return (
    <div style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '12px', padding: '20px', width: '320px', maxWidth: '100%' }} className="animate-fade-up">
      <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>🏖️ {leaveData.title || '请假申请'}</span>
        <Badge colorClass={isConfirmed ? 'emerald' : 'indigo'}>{isConfirmed ? '已提交' : '可编辑'}</Badge>
      </h3>

      {recommendation && (
        <div style={{ background: 'rgba(94,106,210,0.1)', border: '1px solid rgba(94,106,210,0.25)', borderRadius: '8px', padding: '6px 12px', marginTop: '8px', marginBottom: '12px', fontSize: '12px', color: '#5e6ad2' }}>
          💡 {recommendation}
        </div>
      )}

      {balance && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', fontSize: '12px' }}>
          <span style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981', borderRadius: '6px', padding: '2px 8px' }}>调休 {balance.lieu}天</span>
          <span style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', color: '#3b82f6', borderRadius: '6px', padding: '2px 8px' }}>年假 {balance.annual}天</span>
          <span style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b', borderRadius: '6px', padding: '2px 8px' }}>病假 {balance.sick}天</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
        <div>
          <label style={labelStyle}>假期类型</label>
          <select value={leaveType} onChange={e => setLeaveType(e.target.value)} disabled={disabled}
            style={{ ...inputStyle, ...disabledStyle }}
            onFocus={e => Object.assign(e.target.style, inputFocus)}
            onBlur={e => Object.assign(e.target.style, { borderColor: 'rgba(0,0,0,0.07)', boxShadow: 'none' })}>
            {LEAVE_TYPES.map(lt => <option key={lt.value} value={lt.value} style={{ background: '#ffffff', color: '#111827' }}>{lt.label}（{lt.desc}）</option>)}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={labelStyle}>开始日期</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} disabled={disabled}
              style={{ ...inputStyle, ...disabledStyle }}
              onFocus={e => Object.assign(e.target.style, inputFocus)}
              onBlur={e => Object.assign(e.target.style, { borderColor: 'rgba(0,0,0,0.07)', boxShadow: 'none' })} />
          </div>
          <div>
            <label style={labelStyle}>结束日期</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} disabled={disabled}
              style={{ ...inputStyle, ...disabledStyle }}
              onFocus={e => Object.assign(e.target.style, inputFocus)}
              onBlur={e => Object.assign(e.target.style, { borderColor: 'rgba(0,0,0,0.07)', boxShadow: 'none' })} />
          </div>
        </div>
        <div style={{ fontSize: '12px', fontWeight: '600', color: '#5e6ad2', marginTop: '-6px' }}>
          {days > 0 ? `共 ${days} 天` : ''}
        </div>
        <div>
          <label style={labelStyle}>请假事由</label>
          <input type="text" value={reason} onChange={e => setReason(e.target.value)} disabled={disabled}
            placeholder="如：个人事务" style={{ ...inputStyle, ...disabledStyle }}
            onFocus={e => Object.assign(e.target.style, inputFocus)}
            onBlur={e => Object.assign(e.target.style, { borderColor: 'rgba(0,0,0,0.07)', boxShadow: 'none' })} />
        </div>
        <div>
          <label style={labelStyle}>附加说明</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} disabled={disabled}
            rows={2} placeholder="选填"
            style={{ ...inputStyle, resize: 'none', ...disabledStyle }}
            onFocus={e => Object.assign(e.target.style, inputFocus)}
            onBlur={e => Object.assign(e.target.style, { borderColor: 'rgba(0,0,0,0.07)', boxShadow: 'none' })} />
        </div>
      </div>

      {isConfirmed ? (
        <div style={{ width: '100%', borderRadius: '10px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', padding: '10px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: '#10b981' }}>
          ✅ 已确认提交
        </div>
      ) : (
        <button
          disabled={isLoading}
          onClick={() => onConfirm({ type: leaveType, startDate, endDate, reason, note })}
          style={{
            width: '100%', borderRadius: '10px',
            background: 'linear-gradient(135deg, #5e6ad2, #5e6ad2)',
            color: '#fff', padding: '10px', fontSize: '14px', fontWeight: '600',
            border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.5 : 1,
          }}>
          {isLoading ? '处理中...' : '确认发起审批流'}
        </button>
      )}
    </div>
  );
});
