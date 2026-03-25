'use client';

import Link from 'next/link';

type R = Record<string, any>;

interface Props { profiles: R[]; attendance: R[]; approvals: R[]; feedback: R[]; month: string; }

export default function DashboardClient({ profiles, attendance, approvals, feedback, month }: Props) {
  const active = profiles.filter(p => p.is_active);
  const deptDist: R = {};
  active.forEach(p => { const d = p.department || '未分配'; deptDist[d] = (deptDist[d] || 0) + 1; });

  const totalLate = attendance.reduce((s, r) => s + (r.late_count || 0), 0);
  const totalAbsence = attendance.reduce((s, r) => s + (r.absence_days || 0), 0);
  const totalEarly = attendance.reduce((s, r) => s + (r.early_leave_count || 0), 0);
  const avgRate = attendance.length ? (attendance.reduce((s, r) => s + ((r.actual_days || 0) / Math.max(r.work_days || 1, 1)), 0) / attendance.length * 100).toFixed(1) : 'N/A';

  const approvalByType: R = {};
  approvals.forEach(a => { approvalByType[a.type] = (approvalByType[a.type] || 0) + 1; });
  const approvalByStatus: R = {};
  approvals.forEach(a => { approvalByStatus[a.status] = (approvalByStatus[a.status] || 0) + 1; });

  const badFeedback = feedback.filter(f => f.context?.rating === 'bad');
  const reasonCount: R = {};
  badFeedback.forEach(f => { const r = f.context?.reason || '未知'; reasonCount[r] = (reasonCount[r] || 0) + 1; });

  const TYPE_LABELS: R = { leave: '请假', expense: '报销', overtime: '加班', attendance_fix: '补卡', transfer: '调岗', salary_adjust: '调薪' };
  const STATUS_LABELS: R = { pending: '审批中', approved: '已通过', rejected: '已驳回', cancelled: '已撤销' };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← 返回</Link>
          <h1 className="text-lg font-bold text-gray-800">📊 数据看板</h1>
        </div>
        <span className="text-sm text-gray-400">{month}</span>
      </header>

      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
        {/* 人员概览 */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">👥 人员概览</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card label="在职" value={active.length} color="green" />
            <Card label="离职/禁用" value={profiles.length - active.length} color="gray" />
            <Card label="部门数" value={Object.keys(deptDist).length} color="indigo" />
            <Card label="本月入职" value={profiles.filter(p => p.hire_date?.startsWith(month)).length} color="sky" />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {Object.entries(deptDist).sort((a: any, b: any) => b[1] - a[1]).map(([dept, count]) => (
              <span key={dept} className="text-xs bg-white border rounded-lg px-2.5 py-1 text-gray-600">{dept} <b>{count as number}</b></span>
            ))}
          </div>
        </section>

        {/* 考勤统计 */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">⏰ 考勤统计（{month}）</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card label="已提交" value={attendance.length} color="indigo" />
            <Card label="迟到" value={totalLate} color="red" />
            <Card label="早退" value={totalEarly} color="orange" />
            <Card label="缺勤" value={totalAbsence} color="red" />
            <Card label="平均出勤率" value={`${avgRate}%`} color="green" />
          </div>
        </section>

        {/* 审批统计 */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">📋 本月审批（{approvals.length} 条）</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-400 mb-2">按类型</p>
              <div className="space-y-1.5">{Object.entries(approvalByType).map(([k, v]) => <Bar key={k} label={TYPE_LABELS[k] || k} value={v as number} total={approvals.length} />)}</div>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-400 mb-2">按状态</p>
              <div className="space-y-1.5">{Object.entries(approvalByStatus).map(([k, v]) => <Bar key={k} label={STATUS_LABELS[k] || k} value={v as number} total={approvals.length} />)}</div>
            </div>
          </div>
        </section>

        {/* AI 反馈 */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">👎 AI 差评分析（近 200 条反馈）</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Card label="总反馈" value={feedback.length} color="indigo" />
            <Card label="差评" value={badFeedback.length} color="red" />
            <Card label="差评率" value={feedback.length ? `${(badFeedback.length / feedback.length * 100).toFixed(1)}%` : 'N/A'} color="amber" />
          </div>
          {Object.keys(reasonCount).length > 0 && (
            <div className="mt-3 bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-400 mb-2">差评原因分布</p>
              <div className="space-y-1.5">{Object.entries(reasonCount).sort((a: any, b: any) => b[1] - a[1]).map(([k, v]) => <Bar key={k} label={k} value={v as number} total={badFeedback.length} />)}</div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Card({ label, value, color }: { label: string; value: number | string; color: string }) {
  const bg: R = { green: 'bg-green-50 border-green-100', red: 'bg-red-50 border-red-100', gray: 'bg-gray-50 border-gray-200', indigo: 'bg-indigo-50 border-indigo-100', sky: 'bg-sky-50 border-sky-100', orange: 'bg-orange-50 border-orange-100', amber: 'bg-amber-50 border-amber-100' };
  const text: R = { green: 'text-green-700', red: 'text-red-600', gray: 'text-gray-500', indigo: 'text-indigo-700', sky: 'text-sky-700', orange: 'text-orange-600', amber: 'text-amber-600' };
  return <div className={`${bg[color] || bg.indigo} border rounded-xl p-3 text-center`}><div className={`text-xl font-bold ${text[color] || text.indigo}`}>{value}</div><div className="text-[10px] text-gray-500">{label}</div></div>;
}

function Bar({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total ? (value / total * 100) : 0;
  return <div className="flex items-center gap-2 text-xs"><span className="w-16 text-gray-600 shrink-0 truncate">{label}</span><div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-400 rounded-full" style={{ width: `${pct}%` }} /></div><span className="w-8 text-right text-gray-500 font-medium">{value}</span></div>;
}
