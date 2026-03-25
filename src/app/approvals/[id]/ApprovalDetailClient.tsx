'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type R = Record<string, any>;

const TYPE_LABELS: R = { leave: '请假', expense: '报销', overtime: '加班', attendance_fix: '补卡', transfer: '调岗', salary_adjust: '调薪', resignation: '离职', onboard: '入职确认' };
const TYPE_ICONS: R = { leave: '🏖️', expense: '🧾', overtime: '⏰', attendance_fix: '📋', transfer: '🔄', salary_adjust: '💰', resignation: '👋', onboard: '🎉' };
const STATUS_MAP: R = {
  pending: { label: '审批中', cls: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
  approved: { label: '已通过', cls: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  rejected: { label: '已驳回', cls: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  cancelled: { label: '已撤销', cls: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' },
  skipped: { label: '已跳过', cls: 'bg-gray-100 text-gray-400', dot: 'bg-gray-300' },
};
const LEAVE_TYPES: R = { annual: '年假', sick: '病假', personal: '事假', lieu: '调休', maternity: '产假', marriage: '婚假', bereavement: '丧假', other: '其他' };

function PayloadInfo({ type, payload }: { type: string; payload: R }) {
  const rows: [string, string][] = [];
  switch (type) {
    case 'leave':
      if (payload.leave_type || payload['假期类型']) rows.push(['假期类型', LEAVE_TYPES[payload.leave_type] || payload['假期类型'] || payload.leave_type || '']);
      if (payload.start_date || payload['开始日期']) rows.push(['开始日期', payload.start_date || payload['开始日期'] || '']);
      if (payload.end_date || payload['结束日期']) rows.push(['结束日期', payload.end_date || payload['结束日期'] || '']);
      if (payload.days || payload['天数']) rows.push(['天数', `${payload.days || payload['天数'] || ''}天`]);
      if (payload.reason || payload['请假事由'] || payload.title) rows.push(['事由', payload.reason || payload['请假事由'] || payload.title || '']);
      break;
    case 'expense':
      if (payload.expense_type) rows.push(['报销类型', payload.expense_type]);
      if (payload.amount) rows.push(['金额', `¥${Number(payload.amount).toLocaleString()}`]);
      if (payload.description) rows.push(['说明', payload.description]);
      break;
    case 'overtime':
      if (payload.date) rows.push(['加班日期', payload.date]);
      if (payload.hours) rows.push(['时长', `${payload.hours}小时`]);
      if (payload.reason) rows.push(['事由', payload.reason]);
      break;
    case 'attendance_fix':
      if (payload.date) rows.push(['补卡日期', payload.date]);
      if (payload.type) rows.push(['类型', payload.type === 'clock_in' ? '补签到' : '补签退']);
      if (payload.reason) rows.push(['原因', payload.reason]);
      break;
    default:
      Object.entries(payload).filter(([k]) => k !== 'title').forEach(([k, v]) => { if (v) rows.push([k, String(v)]); });
  }
  if (!rows.length) return null;
  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
      {rows.map(([label, value], i) => (
        <div key={i} className="flex justify-between text-sm">
          <span className="text-gray-500">{label}</span>
          <span className="text-gray-800 font-medium text-right max-w-[60%]">{value}</span>
        </div>
      ))}
    </div>
  );
}

function StepTimeline({ steps, currentStep, requestStatus }: { steps: R[]; currentStep: number; requestStatus: string }) {
  return (
    <div className="relative">
      {steps.map((s, i) => {
        const isLast = i === steps.length - 1;
        const isCurrent = s.step === currentStep && requestStatus === 'pending';
        const st = STATUS_MAP[s.status] || STATUS_MAP.pending;

        return (
          <div key={s.id} className="flex gap-3 relative">
            {/* 竖线 */}
            {!isLast && (
              <div className="absolute left-[11px] top-7 bottom-0 w-0.5 bg-gray-200" />
            )}
            {/* 圆点 */}
            <div className="relative z-10 mt-1 shrink-0">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                isCurrent ? 'border-blue-500 bg-blue-50 text-blue-600 ring-4 ring-blue-100' :
                s.status === 'approved' ? 'border-green-500 bg-green-50 text-green-600' :
                s.status === 'rejected' ? 'border-red-500 bg-red-50 text-red-600' :
                'border-gray-300 bg-gray-50 text-gray-400'
              }`}>
                {s.status === 'approved' ? '✓' : s.status === 'rejected' ? '✗' : s.step}
              </div>
            </div>
            {/* 内容 */}
            <div className={`flex-1 pb-6 ${isLast ? 'pb-0' : ''}`}>
              <div className={`rounded-xl p-3 ${isCurrent ? 'bg-blue-50 border border-blue-200' : 'bg-white border border-gray-100'}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800">{s.approver_name || '未知'}</span>
                    {isCurrent && <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full font-medium animate-pulse">当前审批人</span>}
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                </div>
                {s.comment && <p className="text-xs text-gray-600 mt-1 bg-gray-50 rounded-lg px-2 py-1">💬 {s.comment}</p>}
                {s.acted_at && <p className="text-[11px] text-gray-400 mt-1">{new Date(s.acted_at).toLocaleString('zh-CN')}</p>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ApprovalDetailClient({ id, userId }: { id: string; userId: string }) {
  const router = useRouter();
  const [data, setData] = useState<R | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [acting, setActing] = useState(false);

  useEffect(() => {
    fetch(`/api/approvals?id=${id}`).then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  const handleAction = async (action: string) => {
    setActing(true);
    const res = await fetch('/api/approvals', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id: id, action, comment }),
    });
    if (res.ok) {
      // 刷新数据
      const d = await fetch(`/api/approvals?id=${id}`).then(r => r.json());
      setData(d);
      setComment('');
    } else {
      const err = await res.json();
      alert(err.error || '操作失败');
    }
    setActing(false);
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">加载中...</div>;
  if (!data || data.error) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">{data?.error || '未找到'}</div>;

  const st = STATUS_MAP[data.status] || STATUS_MAP.pending;
  const steps: R[] = data.steps || [];
  const currentStepObj = steps.find((s: R) => s.step === data.current_step && s.status === 'pending');
  const isMyTurn = currentStepObj?.approver_id === userId && data.status === 'pending';
  const isApplicant = data.applicant_id === userId;
  const canCancel = isApplicant && data.status === 'pending';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 md:px-8 py-4 flex items-center gap-3">
        <Link href="/approvals" className="text-gray-400 hover:text-gray-600 text-sm">← 返回</Link>
        <h1 className="text-lg font-bold text-gray-800">审批详情</h1>
      </header>

      <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-4">
        {/* 头部 */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{TYPE_ICONS[data.type] || '📄'}</span>
              <span className="text-lg font-bold text-gray-800">{TYPE_LABELS[data.type] || data.type}申请</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${st.cls}`}>{st.label}</span>
          </div>
          <div className="flex gap-4 text-sm text-gray-500">
            <span>申请人：<span className="text-gray-800 font-medium">{data.applicant_name}</span></span>
            {data.applicant_dept && <span>部门：<span className="text-gray-800">{data.applicant_dept}</span></span>}
          </div>
          <p className="text-xs text-gray-400 mt-2">提交于 {new Date(data.created_at).toLocaleString('zh-CN')}</p>
          {data.completed_at && <p className="text-xs text-gray-400">完成于 {new Date(data.completed_at).toLocaleString('zh-CN')}</p>}
        </div>

        {/* 申请内容 */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">📋 申请内容</h3>
          <PayloadInfo type={data.type} payload={data.payload || {}} />
        </div>

        {/* 审批流程 */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">🔄 审批流程（{data.current_step}/{data.total_steps}）</h3>
          <StepTimeline steps={steps} currentStep={data.current_step} requestStatus={data.status} />
        </div>

        {/* 审批操作区 */}
        {isMyTurn && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">✍️ 审批操作</h3>
            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={2} placeholder="审批意见（可选）"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3" />
            <div className="flex gap-2">
              <button onClick={() => handleAction('reject')} disabled={acting}
                className="flex-1 py-2.5 text-sm font-medium bg-red-50 text-red-600 rounded-xl hover:bg-red-100 disabled:opacity-50 transition-colors">
                驳回
              </button>
              <button onClick={() => handleAction('approve')} disabled={acting}
                className="flex-1 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {acting ? '处理中...' : '同意'}
              </button>
            </div>
          </div>
        )}

        {/* 撤回 */}
        {canCancel && (
          <button onClick={() => { if (confirm('确定撤回此申请？')) handleAction('cancel'); }} disabled={acting}
            className="w-full py-2.5 text-sm text-gray-500 bg-white rounded-2xl shadow-sm hover:bg-gray-50 border border-gray-200 disabled:opacity-50 transition-colors">
            撤回申请
          </button>
        )}
      </div>
    </div>
  );
}
