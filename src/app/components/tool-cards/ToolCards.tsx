'use client';

import { Bot, Shield, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ToolCardsProps {
  message: any;
  confirmedDrafts: Set<string>;
  setConfirmedDrafts: (fn: (prev: Set<string>) => Set<string>) => void;
  isLoading: boolean;
  quickSend: (text: string) => void;
  onApprovalClick?: (id: string, title: string, status: string) => void;
}

// Dark theme color helpers
const card = (extra = {}) => ({
  style: { background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '12px', ...extra }
});
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

// Pill badge with semantic color
function Badge({ children, colorClass }: { children: React.ReactNode; colorClass: string }) {
  const styles: Record<string, { bg: string; border: string; text: string }> = {
    indigo: { bg: 'rgba(94,106,210,0.2)', border: 'rgba(94,106,210,0.4)', text: '#5e6ad2' },
    emerald: { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', text: '#10b981' },
    amber: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', text: '#f59e0b' },
    red: { bg: 'rgba(244,63,94,0.15)', border: 'rgba(244,63,94,0.3)', text: '#f43f5e' },
    blue: { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', text: '#3b82f6' },
    sky: { bg: 'rgba(14,165,233,0.12)', border: 'rgba(14,165,233,0.3)', text: '#0ea5e9' },
    orange: { bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)', text: '#f97316' },
    violet: { bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.3)', text: '#8b5cf6' },
    gray: { bg: 'rgba(0,0,0,0.05)', border: 'rgba(0,0,0,0.09)', text: '#6b7280' },
  };
  const s = styles[colorClass] || styles.gray;
  return (
    <span style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.text, borderRadius: '9999px', fontSize: '11px', padding: '2px 8px', fontWeight: '510' }}>
      {children}
    </span>
  );
}

export default function ToolCards({ message, confirmedDrafts, setConfirmedDrafts, isLoading, quickSend, onApprovalClick }: ToolCardsProps) {
  const router = useRouter();

  return message.parts?.filter((p: any) => typeof p.type === 'string' && p.type.startsWith('tool-') && p.type !== 'tool-invocation').map((part: any, index: number) => {
    const toolName = part.type.replace('tool-', '');
    const args = part.input || {};
    const hasResult = part.state === 'output-available';
    const result = part.output || {};

    // ── draftWorkflowApplication ──────────────────────────
    if (toolName === 'draftWorkflowApplication') {
      const icons: Record<string, string> = { leave:'🏖️', missed_clock_in:'⏰', salary_adjustment:'💰', promotion:'📈', expense_reimbursement:'🧾', job_transfer:'🔄', resignation:'👋', recruitment:'🤝' };
      const d = (hasResult && result.details) ? result.details : args;
      const isLeave = hasResult && result.type === 'leave';
      const leaveData = isLeave ? result.leave : null;
      const recommendation = hasResult ? result.recommendation : null;
      const balance = isLeave ? result.balance : null;
      const leaveId = `leave-${part.toolCallId}`;

      if (isLeave && leaveData) {
        const LEAVE_TYPES = [
          { value: 'lieu', label: '调休假', desc: '不扣工资' },
          { value: 'annual', label: '年假', desc: '不扣工资' },
          { value: 'sick', label: '病假', desc: '按比例扣薪' },
          { value: 'personal', label: '事假', desc: '按日扣薪' },
          { value: 'marriage', label: '婚假', desc: '带薪' },
          { value: 'maternity', label: '产假', desc: '带薪' },
          { value: 'bereavement', label: '丧假', desc: '带薪' },
        ];
        return (
          <div key={`tool-${index}`} {...card({ padding: '20px', width: '320px', maxWidth: '100%' })} className="animate-fade-up">
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                🏖️ {leaveData.title || '请假申请'}
              </span>
              <Badge colorClass={confirmedDrafts.has(part.toolCallId) ? 'emerald' : 'indigo'}>
                {confirmedDrafts.has(part.toolCallId) ? '已提交' : '可编辑'}
              </Badge>
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
                <select
                  id={`${leaveId}-type`}
                  defaultValue={leaveData.leaveType}
                  disabled={confirmedDrafts.has(part.toolCallId)}
                  style={{ ...inputStyle, opacity: confirmedDrafts.has(part.toolCallId) ? 0.5 : 1, cursor: confirmedDrafts.has(part.toolCallId) ? 'not-allowed' : 'default' }}
                  onFocus={e => Object.assign(e.target.style, inputFocus)}
                  onBlur={e => Object.assign(e.target.style, { borderColor: 'rgba(0,0,0,0.07)', boxShadow: 'none' })}
                >
                  {LEAVE_TYPES.map(lt => <option key={lt.value} value={lt.value} style={{ background: '#ffffff', color: '#111827' }}>{lt.label}（{lt.desc}）</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>开始日期</label>
                  <input
                    type="date" id={`${leaveId}-start`} defaultValue={leaveData.startDate}
                    disabled={confirmedDrafts.has(part.toolCallId)}
                    onChange={() => {
                      const s = (document.getElementById(`${leaveId}-start`) as HTMLInputElement)?.value;
                      const e = (document.getElementById(`${leaveId}-end`) as HTMLInputElement)?.value;
                      const el = document.getElementById(`${leaveId}-days`);
                      if (s && e && el) {
                        const days = (new Date(e).getTime() - new Date(s).getTime()) / 86400000 + 1;
                        el.textContent = days > 0 ? `共 ${days} 天` : '日期有误';
                      }
                    }}
                    style={{ ...inputStyle, opacity: confirmedDrafts.has(part.toolCallId) ? 0.5 : 1, cursor: confirmedDrafts.has(part.toolCallId) ? 'not-allowed' : 'default' }}
                    onFocus={e => Object.assign(e.target.style, inputFocus)}
                    onBlur={e => Object.assign(e.target.style, { borderColor: 'rgba(0,0,0,0.07)', boxShadow: 'none' })}
                  />
                </div>
                <div>
                  <label style={labelStyle}>结束日期</label>
                  <input
                    type="date" id={`${leaveId}-end`} defaultValue={leaveData.endDate}
                    disabled={confirmedDrafts.has(part.toolCallId)}
                    onChange={() => {
                      const s = (document.getElementById(`${leaveId}-start`) as HTMLInputElement)?.value;
                      const e = (document.getElementById(`${leaveId}-end`) as HTMLInputElement)?.value;
                      const el = document.getElementById(`${leaveId}-days`);
                      if (s && e && el) {
                        const days = (new Date(e).getTime() - new Date(s).getTime()) / 86400000 + 1;
                        el.textContent = days > 0 ? `共 ${days} 天` : '日期有误';
                      }
                    }}
                    style={{ ...inputStyle, opacity: confirmedDrafts.has(part.toolCallId) ? 0.5 : 1, cursor: confirmedDrafts.has(part.toolCallId) ? 'not-allowed' : 'default' }}
                    onFocus={e => Object.assign(e.target.style, inputFocus)}
                    onBlur={e => Object.assign(e.target.style, { borderColor: 'rgba(0,0,0,0.07)', boxShadow: 'none' })}
                  />
                </div>
              </div>
              <div id={`${leaveId}-days`} style={{ fontSize: '12px', fontWeight: '600', color: '#5e6ad2', marginTop: '-6px' }}>
                {leaveData.startDate && leaveData.endDate && (new Date(leaveData.endDate).getTime() - new Date(leaveData.startDate).getTime()) / 86400000 + 1 > 0
                  ? `共 ${(new Date(leaveData.endDate).getTime() - new Date(leaveData.startDate).getTime()) / 86400000 + 1} 天`
                  : ''}
              </div>
              <div>
                <label style={labelStyle}>请假事由</label>
                <input
                  type="text" id={`${leaveId}-reason`} defaultValue={leaveData.leaveReason}
                  disabled={confirmedDrafts.has(part.toolCallId)}
                  placeholder="如：个人事务"
                  style={{ ...inputStyle, opacity: confirmedDrafts.has(part.toolCallId) ? 0.5 : 1, cursor: confirmedDrafts.has(part.toolCallId) ? 'not-allowed' : 'default' }}
                  onFocus={e => Object.assign(e.target.style, inputFocus)}
                  onBlur={e => Object.assign(e.target.style, { borderColor: 'rgba(0,0,0,0.07)', boxShadow: 'none' })}
                />
              </div>
              <div>
                <label style={labelStyle}>附加说明</label>
                <textarea
                  id={`${leaveId}-note`} defaultValue={leaveData.leaveNote}
                  disabled={confirmedDrafts.has(part.toolCallId)}
                  rows={2} placeholder="选填"
                  style={{ ...inputStyle, resize: 'none', opacity: confirmedDrafts.has(part.toolCallId) ? 0.5 : 1, cursor: confirmedDrafts.has(part.toolCallId) ? 'not-allowed' : 'default' }}
                  onFocus={e => Object.assign(e.target.style, inputFocus)}
                  onBlur={e => Object.assign(e.target.style, { borderColor: 'rgba(0,0,0,0.07)', boxShadow: 'none' })}
                />
              </div>
            </div>

            {confirmedDrafts.has(part.toolCallId) ? (
              <div style={{ width: '100%', borderRadius: '10px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', padding: '10px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: '#10b981' }}>
                ✅ 已确认提交
              </div>
            ) : (
              <button
                disabled={isLoading}
                onClick={() => {
                  const lt = (document.getElementById(`${leaveId}-type`) as HTMLSelectElement)?.value || leaveData.leaveType;
                  const sd = (document.getElementById(`${leaveId}-start`) as HTMLInputElement)?.value || leaveData.startDate;
                  const ed = (document.getElementById(`${leaveId}-end`) as HTMLInputElement)?.value || leaveData.endDate;
                  const rs = (document.getElementById(`${leaveId}-reason`) as HTMLInputElement)?.value || leaveData.leaveReason;
                  const nt = (document.getElementById(`${leaveId}-note`) as HTMLTextAreaElement)?.value || '';
                  const typeLabel = LEAVE_TYPES.find(t => t.value === lt)?.label || lt;
                  setConfirmedDrafts(prev => new Set(prev).add(part.toolCallId));
                  quickSend(`我确认提交请假申请：${typeLabel}，${sd} 至 ${ed}，事由：${rs}${nt ? '，备注：' + nt : ''}。信息无误。`);
                }}
                style={{
                  width: '100%', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #5e6ad2, #5e6ad2)',
                  color: '#fff', padding: '10px', fontSize: '14px', fontWeight: '600',
                  border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.5 : 1,
                }}
              >
                {isLoading ? '处理中...' : '确认发起审批流'}
              </button>
            )}
          </div>
        );
      }

      return (
        <div key={`tool-${index}`} {...card({ padding: '20px', width: '288px', maxWidth: '100%' })} className="animate-fade-up">
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>{icons[d.workflowType] || '📄'}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</span>
            </span>
            <Badge colorClass="indigo">待确认</Badge>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', marginBottom: '16px' }}>
            {[d.field1Label, d.field2Label, d.field3Label].filter(Boolean).map((label, i) => {
              const val = [d.field1Value, d.field2Value, d.field3Value][i];
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                  <span style={{ color: '#6b7280', whiteSpace: 'nowrap', flexShrink: 0 }}>{label}：</span>
                  <span style={{ color: '#111827', fontWeight: '500', textAlign: 'right', wordBreak: 'break-word' }}>{val}</span>
                </div>
              );
            })}
            {d.reason && (
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: '#9ca3af' }}>附加说明：</span>
                <span style={{ fontSize: '12px', color: '#374151', background: 'rgba(0,0,0,0.03)', padding: '8px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)', lineHeight: 1.5 }}>{d.reason}</span>
              </div>
            )}
          </div>
          {confirmedDrafts.has(part.toolCallId) ? (
            <div style={{ width: '100%', borderRadius: '10px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', padding: '10px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: '#10b981' }}>
              ✅ 已确认提交
            </div>
          ) : (
            <button
              disabled={isLoading}
              onClick={() => { setConfirmedDrafts(prev => new Set(prev).add(part.toolCallId)); quickSend(`我确认提交【${args.title}】，信息无误。`); }}
              style={{
                width: '100%', borderRadius: '10px',
                background: 'rgba(94,106,210,0.2)', border: '1px solid rgba(94,106,210,0.4)',
                color: '#5e6ad2', padding: '10px', fontSize: '14px', fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.5 : 1,
              }}
            >
              {isLoading ? '处理中...' : '确认发起审批流'}
            </button>
          )}
        </div>
      );
    }

    // ── escalateToHuman ────────────────────────────────
    if (toolName === 'escalateToHuman') {
      return (
        <div key={`tool-${index}`} {...card({ padding: '20px', maxWidth: '340px', position: 'relative', overflow: 'hidden' })} className="animate-fade-up">
          <div style={{ position: 'absolute', top: 0, left: 0, width: '3px', height: '100%', background: '#f43f5e' }} />
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#f43f5e', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ position: 'relative', display: 'inline-flex', height: '10px', width: '10px' }}>
              <span style={{ position: 'absolute', display: 'inline-flex', height: '100%', width: '100%', borderRadius: '9999px', background: '#f43f5e', opacity: 0.4, animation: 'ping 1s cubic-bezier(0,0,0.2,1) infinite' }} />
              <span style={{ position: 'relative', display: 'inline-flex', height: '10px', width: '10px', borderRadius: '9999px', background: '#f43f5e' }} />
            </span>
            智能降级 · 已流转至人工专家
          </h3>
          <div style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)', padding: '10px', borderRadius: '10px', marginBottom: '12px', fontSize: '13px', color: '#6b7280' }}>
            触发判定：<span style={{ color: '#374151', fontWeight: '600' }}>{args.reason || '业务评估流转'}</span>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '10px', padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(0,0,0,0.09)', flexShrink: 0 }}>
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=support&backgroundColor=ef4444" alt="Agent" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>高级专家支持组</span>
              <span style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                工单建立中，请稍候...
              </span>
            </div>
          </div>
        </div>
      );
    }

    // ── queryEmployeeSalary ─────────────────────────────
    if (toolName === 'queryEmployeeSalary') {
      if (!hasResult) return <div key={`tool-${index}`} style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic', padding: '12px' }}>正在越权扫描 HR 数据总线...</div>;
      if (result.error) return (
        <div key={`tool-${index}`} {...card({ padding: '16px', maxWidth: '340px', display: 'flex', gap: '12px', alignItems: 'flex-start' })} className="animate-fade-up">
          <div style={{ color: '#f97316', marginTop: '2px' }}><Shield size={16} /></div>
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#f43f5e', marginBottom: '4px' }}>拦截生效 (Hard RBAC)</h4>
            <p style={{ fontSize: '12px', color: '#f97316', fontFamily: 'monospace', lineHeight: 1.5 }}>{result.message}</p>
          </div>
        </div>
      );
      return (
        <div key={`tool-${index}`} {...card({ padding: '16px', maxWidth: '340px' })} className="animate-fade-up">
          <span style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', color: '#f43f5e', fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', marginBottom: '8px' }}>高度机密</span>
          <div style={{ fontSize: '13px', color: '#111827', fontFamily: 'monospace' }}>查询到 {args.employeeName} 薪资档位: {result.salary}</div>
        </div>
      );
    }

    // ── submitWorkflowApplication ───────────────────────
    if (toolName === 'submitWorkflowApplication') {
      if (!hasResult) return <div key={`tool-${index}`} style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic', padding: '12px' }}>正在提交审批流...</div>;
      if (result.status === 'error') return (
        <div key={`tool-${index}`} {...card({ padding: '20px', maxWidth: '340px' })} className="animate-fade-up">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ color: '#f43f5e', fontWeight: '700' }}>❌ 提交失败</span>
          </div>
          <p style={{ fontSize: '13px', color: '#f43f5e' }}>{result.message}</p>
        </div>
      );
      const ticket = result.ticket;
      return (
        <div key={`tool-${index}`} {...card({ padding: '20px', maxWidth: '340px' })} className="animate-fade-up">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <CheckCircle2 size={18} style={{ color: '#10b981' }} />
            <span style={{ fontWeight: '700', color: '#10b981', fontSize: '14px' }}>申请已提交成功</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280' }}>标题</span>
              <span style={{ color: '#111827', fontWeight: '500' }}>{ticket?.title}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280' }}>状态</span>
              <span style={{ color: '#f59e0b', fontWeight: '600' }}>{ticket?.status}</span>
            </div>
          </div>
          {ticket?.id && (
            <button
              onClick={() => {
                if (toolName === 'submitWorkflowApplication' && onApprovalClick) {
                  onApprovalClick(ticket.id, ticket.title || '审批详情', ticket.status || '审批中');
                } else {
                  router.push(`/approvals/${ticket.id}`);
                }
              }}
              style={{ width: '100%', marginTop: '12px', padding: '8px', fontSize: '12px', fontWeight: '500', background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '8px', color: '#6b7280', cursor: 'pointer' }}
            >
              查看审批详情 →
            </button>
          )}
        </div>
      );
    }

    // ── getLeaveBalance ──────────────────────────────────
    if (toolName === 'getLeaveBalance') {
      if (!hasResult) return <div key={`tool-${index}`} style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic', padding: '12px' }}>正在查询假期余额...</div>;
      if (result.error) return <div key={`tool-${index}`} style={{ fontSize: '13px', color: '#f43f5e', padding: '12px' }}>{result.error}</div>;
      const r = result;
      const balItems = r.balance !== undefined
        ? [{ label: r.leaveType === 'annual' ? '年假' : r.leaveType === 'sick' ? '病假' : '调休', value: r.balance }]
        : [{ label: '年假', value: r.annual }, { label: '病假', value: r.sick }, { label: '调休', value: r.lieu }];
      return (
        <div key={`tool-${index}`} {...card({ padding: '20px', maxWidth: '340px' })} className="animate-fade-up">
          <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#111827', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            🏖️ {r.name}的假期余额
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {balItems.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>{item.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '96px', height: '6px', background: 'rgba(0,0,0,0.07)', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: '#5e6ad2', borderRadius: '9999px', width: `${Math.min(100, ((item.value as number) / 15) * 100)}%` }} />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#5e6ad2', width: '40px', textAlign: 'right' }}>{item.value}天</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // ── getAttendanceRecords ────────────────────────────
    if (toolName === 'getAttendanceRecords') {
      if (!hasResult) return <div key={`tool-${index}`} style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic', padding: '12px' }}>正在查询考勤记录...</div>;
      if (result.error) return <div key={`tool-${index}`} style={{ fontSize: '13px', color: '#f43f5e', padding: '12px' }}>{result.error}</div>;
      const r = result;
      const statusMap: Record<string, string> = { late: '迟到', early_leave: '早退', missed: '缺卡', absent: '缺勤' };
      return (
        <div key={`tool-${index}`} {...card({ padding: '20px', maxWidth: '360px' })} className="animate-fade-up">
          <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#111827', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>📋 {r.month} 考勤概览</span>
            <span style={{ background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.09)', color: '#6b7280', borderRadius: '9999px', padding: '2px 8px', fontSize: '11px' }}>{r.totalDays}天</span>
          </h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
            <div style={{ flex: 1, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#10b981' }}>{r.normalDays}</div>
              <div style={{ fontSize: '10px', color: '#10b981' }}>正常</div>
            </div>
            <div style={{ flex: 1, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.15)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#f43f5e' }}>{r.abnormalCount}</div>
              <div style={{ fontSize: '10px', color: '#f43f5e' }}>异常</div>
            </div>
          </div>
          {r.abnormalRecords?.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '500' }}>异常明细：</div>
              {r.abnormalRecords.map((rec: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '8px', padding: '6px 10px' }}>
                  <span style={{ color: '#374151' }}>{rec.date}</span>
                  <span style={{ color: '#f43f5e', fontWeight: '600' }}>{statusMap[rec.status] || rec.status}</span>
                  {rec.remark && <span style={{ color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80px' }}>{rec.remark}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // ── getSalaryBreakdown ───────────────────────────────
    if (toolName === 'getSalaryBreakdown') {
      if (!hasResult) return <div key={`tool-${index}`} style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic', padding: '12px' }}>正在查询薪资明细...</div>;
      if (result.error) return <div key={`tool-${index}`} style={{ fontSize: '13px', color: '#f43f5e', padding: '12px' }}>{result.error}</div>;
      const r = result;
      return (
        <div key={`tool-${index}`} {...card({ padding: '20px', maxWidth: '340px' })} className="animate-fade-up">
          <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>💰 {r.name}的薪资构成</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
            {[
              { label: '基本工资', value: r.base_salary, color: '#111827' },
              { label: '住房公积金', value: -r.housing_fund, color: '#f97316' },
              { label: '社会保险', value: -r.social_insurance, color: '#f97316' },
              { label: '个人所得税', value: -r.tax, color: '#f97316' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6b7280' }}>{item.label}</span>
                <span style={{ fontFamily: 'monospace', fontWeight: '500', color: item.color }}>
                  {Math.abs(item.value).toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' })}
                </span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '8px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '700', color: '#111827' }}>实发工资</span>
              <span style={{ fontWeight: '700', fontSize: '16px', color: '#10b981' }}>¥{r.net_salary?.toLocaleString()}</span>
            </div>
          </div>
        </div>
      );
    }

    // ── getWorkflowApplications ─────────────────────────
    if (toolName === 'getWorkflowApplications') {
      if (!hasResult) return <div key={`tool-${index}`} style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic', padding: '12px' }}>正在查询全域表单记录...</div>;
      const requests = result.requests || [];
      return (
        <div key={`tool-${index}`} {...card({ padding: 0, overflow: 'hidden', maxWidth: '340px' })} className="animate-fade-up">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.05)', background: 'rgba(255,255,255,0.02)' }}>
            <span style={{ fontWeight: '700', fontSize: '13px', color: '#111827' }}>我的办事追踪台</span>
            <span style={{ background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.09)', color: '#6b7280', borderRadius: '9999px', padding: '2px 8px', fontSize: '11px' }}>{requests.length} 项</span>
          </div>
          {requests.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', fontSize: '13px', color: '#9ca3af' }}>目前没有发起过任何流程...</div>
          ) : (
            <ul>
              {requests.map((req: any, i: number) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '60%' }}>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.title}</span>
                    <span style={{ fontSize: '11px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}><Shield size={10} />发起于: {req.submitTime}</span>
                  </div>
                  <span style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b', borderRadius: '9999px', padding: '2px 10px', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap' }}>{req.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    }

    // ── submitITTicket ───────────────────────────────────
    if (toolName === 'submitITTicket') {
      if (!hasResult) return (
        <div key={`tool-${index}`} {...card({ padding: '20px', maxWidth: '340px' })} className="animate-fade-up">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#0ea5e9' }}>
            <span style={{ fontSize: '16px' }}>🔧</span>
            <span style={{ fontSize: '13px', fontWeight: '600' }}>正在创建 IT 工单...</span>
          </div>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0ea5e9', display: 'inline-block', animation: 'pulse-dot 1s infinite' }} />
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0ea5e9', display: 'inline-block', animation: 'pulse-dot 1s 0.15s infinite' }} />
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0ea5e9', display: 'inline-block', animation: 'pulse-dot 1s 0.3s infinite' }} />
          </div>
        </div>
      );
      return (
        <div key={`tool-${index}`} {...card({ padding: '20px', maxWidth: '340px' })} className="animate-fade-up">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '16px' }}>🔧</span>
            <span style={{ fontWeight: '700', color: '#111827', fontSize: '14px' }}>IT 工单已创建</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280' }}>工单号</span>
              <span style={{ fontFamily: 'monospace', fontWeight: '500', color: '#5e6ad2' }}>{result.ticketId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280' }}>问题类型</span>
              <span style={{ color: '#111827', fontWeight: '500' }}>{args.issueType}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280' }}>状态</span>
              <span style={{ color: '#f59e0b', fontWeight: '600' }}>{result.status}</span>
            </div>
          </div>
          {result.resolution && (
            <p style={{ marginTop: '12px', fontSize: '12px', color: '#6b7280', background: 'rgba(0,0,0,0.03)', padding: '8px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)', lineHeight: 1.5 }}>{result.resolution}</p>
          )}
        </div>
      );
    }

    // ── getTeamLeaveCalendar ─────────────────────────────
    if (toolName === 'getTeamLeaveCalendar') {
      if (!hasResult) return <div key={`tool-${index}`} style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic', padding: '12px' }}>🏖️ 正在查询团队请假情况...</div>;
      if (result.error) return <div key={`tool-${index}`} style={{ fontSize: '13px', color: '#f43f5e', padding: '12px' }}>{result.error}</div>;
      const leaves = result.leaves || [];
      return (
        <div key={`tool-${index}`} {...card({ padding: 0, overflow: 'hidden', maxWidth: '380px' })} className="animate-fade-up">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.05)', background: 'rgba(255,255,255,0.02)' }}>
            <span style={{ fontWeight: '700', fontSize: '13px', color: '#111827' }}>🏖️ 团队请假日历</span>
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>{result.period}</span>
          </div>
          {leaves.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', fontSize: '13px', color: '#9ca3af' }}>近期没有人请假</div>
          ) : (
            <ul>
              {leaves.map((l: any, i: number) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', fontSize: '13px', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                  <div>
                    <span style={{ color: '#111827', fontWeight: '500' }}>{l.name}</span>
                    <span style={{ color: '#9ca3af', fontSize: '11px', marginLeft: '6px' }}>{l.type}</span>
                  </div>
                  <span style={{ color: '#9ca3af', fontSize: '11px' }}>{l.start} ~ {l.end}{l.days ? ` · ${l.days}天` : ''}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    }

    // ── getTeamAttendance ────────────────────────────────
    if (toolName === 'getTeamAttendance') {
      if (!hasResult) return <div key={`tool-${index}`} style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic', padding: '12px' }}>📊 正在查询团队考勤...</div>;
      if (result.error) return <div key={`tool-${index}`} style={{ fontSize: '13px', color: '#f43f5e', padding: '12px' }}>{result.error}</div>;
      const r = result;
      return (
        <div key={`tool-${index}`} {...card({ padding: '20px', maxWidth: '360px' })} className="animate-fade-up">
          <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#111827', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>📊 {r.deptName} · {r.month} 考勤</span>
            <span style={{ background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.09)', color: '#6b7280', borderRadius: '9999px', padding: '2px 8px', fontSize: '11px' }}>{r.totalMembers}人</span>
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '10px' }}>
            <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.15)', borderRadius: '10px', padding: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#f43f5e' }}>{r.late}</div>
              <div style={{ fontSize: '10px', color: '#f43f5e' }}>迟到</div>
            </div>
            <div style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: '10px', padding: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#f97316' }}>{r.earlyLeave}</div>
              <div style={{ fontSize: '10px', color: '#f97316' }}>早退</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.09)', borderRadius: '10px', padding: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#6b7280' }}>{r.absence}</div>
              <div style={{ fontSize: '10px', color: '#9ca3af' }}>缺勤</div>
            </div>
          </div>
          <div style={{ fontSize: '11px', color: '#9ca3af' }}>已提交考勤 {r.reported}/{r.totalMembers} 人 · 平均出勤 {r.avgAttendanceDays} 天</div>
        </div>
      );
    }

    // ── getTeamMembers ───────────────────────────────────
    if (toolName === 'getTeamMembers') {
      if (!hasResult) return <div key={`tool-${index}`} style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic', padding: '12px' }}>👥 正在查询团队成员...</div>;
      if (result.error) return <div key={`tool-${index}`} style={{ fontSize: '13px', color: '#f43f5e', padding: '12px' }}>{result.error}</div>;
      return (
        <div key={`tool-${index}`} {...card({ padding: 0, overflow: 'hidden', maxWidth: '360px' })} className="animate-fade-up">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.05)', background: 'rgba(255,255,255,0.02)' }}>
            <span style={{ fontWeight: '700', fontSize: '13px', color: '#111827' }}>👥 {result.deptName}</span>
            <span style={{ background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.09)', color: '#6b7280', borderRadius: '9999px', padding: '2px 8px', fontSize: '11px' }}>{result.members?.length || 0} 人</span>
          </div>
          <ul>
            {(result.members || []).map((m: any, i: number) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', fontSize: '13px', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                <span style={{ color: '#111827', fontWeight: '500' }}>{m.name}</span>
                <span style={{ color: '#9ca3af', fontSize: '11px' }}>{m.jobTitle}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    }

    // ── searchEmployee ──────────────────────────────────
    if (toolName === 'searchEmployee') {
      if (!hasResult) return <div key={`tool-${index}`} style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic', padding: '12px' }}>🔍 正在搜索员工...</div>;
      if (result.error || result.message) return <div key={`tool-${index}`} style={{ fontSize: '13px', color: '#9ca3af', padding: '12px' }}>{result.error || result.message}</div>;
      return (
        <div key={`tool-${index}`} {...card({ padding: 0, overflow: 'hidden', maxWidth: '380px' })} className="animate-fade-up">
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.05)', background: 'rgba(255,255,255,0.02)' }}>
            <span style={{ fontWeight: '700', fontSize: '13px', color: '#111827' }}>🔍 搜索结果</span>
          </div>
          <ul>
            {(result.results || []).map((e: any, i: number) => (
              <li key={i} style={{ padding: '10px 16px', fontSize: '13px', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: '#111827', fontWeight: '500' }}>{e.name}</span>
                  <span style={{ background: e.active ? 'rgba(16,185,129,0.12)' : 'rgba(0,0,0,0.05)', border: `1px solid ${e.active ? 'rgba(16,185,129,0.25)' : 'rgba(0,0,0,0.09)'}`, color: e.active ? '#10b981' : '#9ca3af', borderRadius: '9999px', padding: '2px 8px', fontSize: '11px' }}>
                    {e.active ? '在职' : '离职'}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>{e.department} · {e.jobTitle}{e.phone ? ` · ${e.phone}` : ''}</div>
              </li>
            ))}
          </ul>
        </div>
      );
    }

    // ── updateEmployee ──────────────────────────────────
    if (toolName === 'updateEmployee') {
      if (!hasResult) return <div key={`tool-${index}`} style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic', padding: '12px' }}>✏️ 正在修改员工信息...</div>;
      if (result.error) return <div key={`tool-${index}`} style={{ fontSize: '13px', color: '#f43f5e', padding: '12px' }}>❌ {result.error}</div>;
      return (
        <div key={`tool-${index}`} {...card({ padding: '20px', maxWidth: '340px' })} className="animate-fade-up">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ color: '#10b981', fontWeight: '700' }}>✅ 修改成功</span>
          </div>
          <div style={{ fontSize: '13px', color: '#374151' }}>{result.message}</div>
        </div>
      );
    }

    // ── getCompanyStats ─────────────────────────────────
    if (toolName === 'getCompanyStats') {
      if (!hasResult) return <div key={`tool-${index}`} style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic', padding: '12px' }}>📊 正在统计全公司数据...</div>;
      if (result.error) return <div key={`tool-${index}`} style={{ fontSize: '13px', color: '#f43f5e', padding: '12px' }}>{result.error}</div>;
      const r = result;
      return (
        <div key={`tool-${index}`} {...card({ padding: '20px', maxWidth: '360px' })} className="animate-fade-up">
          <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>📊 全公司统计 · {r.month}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '12px' }}>
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#10b981' }}>{r.totalActive}</div>
              <div style={{ fontSize: '10px', color: '#10b981' }}>在职</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.09)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#9ca3af' }}>{r.totalInactive}</div>
              <div style={{ fontSize: '10px', color: '#9ca3af' }}>离职/禁用</div>
            </div>
          </div>
          <div style={{ fontSize: '11px', color: '#9ca3af', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div>考勤已提交：{r.attendanceReported} 人 · 异常合计：{r.totalAnomalies} 次 · 人均 {r.anomalyRate}</div>
            {r.departmentDistribution && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                {Object.entries(r.departmentDistribution).map(([dept, count]) => (
                  <span key={dept} style={{ background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.09)', borderRadius: '4px', padding: '2px 6px' }}>{dept} {count as number}人</span>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    // ── searchCompanyPolicies ───────────────────────────
    if (toolName === 'searchCompanyPolicies') {
      if (!hasResult) return <div key={`tool-${index}`} style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic', padding: '12px' }}>📚 正在检索公司政策文档...</div>;
      if (result.error) return <div key={`tool-${index}`} style={{ fontSize: '13px', color: '#f43f5e', padding: '12px' }}>{result.error}</div>;
      if (result.documents?.length > 0) return (
        <div key={`tool-${index}`} style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
          {result.documents.map((doc: any, i: number) => (
            <span key={i} style={{ background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.09)', color: '#6b7280', borderRadius: '6px', padding: '3px 8px', fontSize: '12px' }}>
              📖 {doc.title}
            </span>
          ))}
        </div>
      );
      return null;
    }

    // ── Fallback ────────────────────────────────────────
    return (
      <div key={`tool-${index}`} {...card({ padding: '16px' })} className="animate-fade-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', color: '#6b7280' }}>
          <Bot size={14} style={{ color: '#5e6ad2' }} />
          <span style={{ fontSize: '13px', fontWeight: '500' }}>正在处理你的请求...</span>
        </div>
        {hasResult
          ? <div style={{ marginTop: '8px', fontSize: '13px', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '6px 12px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>✅ 处理完成</div>
          : <div style={{ marginTop: '8px', fontSize: '13px', color: '#9ca3af', fontStyle: 'italic' }}>请稍候...</div>}
      </div>
    );
  });
}
