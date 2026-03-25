'use client';

import { Bot, Shield, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ToolCardsProps {
  message: any;
  confirmedDrafts: Set<string>;
  setConfirmedDrafts: (fn: (prev: Set<string>) => Set<string>) => void;
  isLoading: boolean;
  quickSend: (text: string) => void;
}

export default function ToolCards({ message, confirmedDrafts, setConfirmedDrafts, isLoading, quickSend }: ToolCardsProps) {
  const router = useRouter();

  return message.parts?.filter((p: any) => typeof p.type === 'string' && p.type.startsWith('tool-') && p.type !== 'tool-invocation').map((part: any, index: number) => {
    const toolName = part.type.replace('tool-', '');
    const args = part.input || {};
    const hasResult = part.state === 'output-available';
    const result = part.output || {};

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
          <div key={`tool-${index}`} className="my-4 w-80 md:w-[380px] rounded-2xl border border-indigo-200 bg-white p-5 shadow-md animate-fade-up">
            <h3 className="text-base font-bold text-indigo-900 mb-1 flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">🏖️ {leaveData.title || '请假申请'}</span>
              <span className="text-[10px] font-normal bg-indigo-100 px-2 py-0.5 rounded-full text-indigo-600 border border-indigo-200 shrink-0">
                {confirmedDrafts.has(part.toolCallId) ? '已提交' : '可编辑'}
              </span>
            </h3>
            {recommendation && <p className="text-xs text-indigo-600 bg-indigo-50 rounded-lg px-3 py-1.5 mb-4 mt-2 border border-indigo-100">💡 {recommendation}</p>}
            {balance && (
              <div className="flex gap-2 mb-4 text-[11px]">
                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-100">调休 {balance.lieu}天</span>
                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100">年假 {balance.annual}天</span>
                <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-100">病假 {balance.sick}天</span>
              </div>
            )}
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs text-slate-500 mb-1 font-medium">假期类型</label>
                <select id={`${leaveId}-type`} defaultValue={leaveData.leaveType} disabled={confirmedDrafts.has(part.toolCallId)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none disabled:bg-slate-50 disabled:text-slate-500">
                  {LEAVE_TYPES.map(lt => <option key={lt.value} value={lt.value}>{lt.label}（{lt.desc}）</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1 font-medium">开始日期</label>
                  <input type="date" id={`${leaveId}-start`} defaultValue={leaveData.startDate} disabled={confirmedDrafts.has(part.toolCallId)}
                    onChange={() => { const s = (document.getElementById(`${leaveId}-start`) as HTMLInputElement)?.value; const e = (document.getElementById(`${leaveId}-end`) as HTMLInputElement)?.value; const el = document.getElementById(`${leaveId}-days`); if (s && e && el) { const d = (new Date(e).getTime() - new Date(s).getTime()) / 86400000 + 1; el.textContent = d > 0 ? `共 ${d} 天` : '日期有误'; } }}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none disabled:bg-slate-50 disabled:text-slate-500" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1 font-medium">结束日期</label>
                  <input type="date" id={`${leaveId}-end`} defaultValue={leaveData.endDate} disabled={confirmedDrafts.has(part.toolCallId)}
                    onChange={() => { const s = (document.getElementById(`${leaveId}-start`) as HTMLInputElement)?.value; const e = (document.getElementById(`${leaveId}-end`) as HTMLInputElement)?.value; const el = document.getElementById(`${leaveId}-days`); if (s && e && el) { const d = (new Date(e).getTime() - new Date(s).getTime()) / 86400000 + 1; el.textContent = d > 0 ? `共 ${d} 天` : '日期有误'; } }}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none disabled:bg-slate-50 disabled:text-slate-500" />
                </div>
              </div>
              <div id={`${leaveId}-days`} className="text-xs font-semibold text-indigo-600 -mt-1">
                {leaveData.startDate && leaveData.endDate && (new Date(leaveData.endDate).getTime() - new Date(leaveData.startDate).getTime()) / 86400000 + 1 > 0
                  ? `共 ${(new Date(leaveData.endDate).getTime() - new Date(leaveData.startDate).getTime()) / 86400000 + 1} 天`
                  : ''}
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1 font-medium">请假事由</label>
                <input type="text" id={`${leaveId}-reason`} defaultValue={leaveData.leaveReason} disabled={confirmedDrafts.has(part.toolCallId)} placeholder="如：个人事务"
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none placeholder:text-slate-300 disabled:bg-slate-50 disabled:text-slate-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1 font-medium">附加说明</label>
                <textarea id={`${leaveId}-note`} defaultValue={leaveData.leaveNote} disabled={confirmedDrafts.has(part.toolCallId)} rows={2} placeholder="选填"
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none resize-none placeholder:text-slate-300 disabled:bg-slate-50 disabled:text-slate-500" />
              </div>
            </div>
            {confirmedDrafts.has(part.toolCallId) ? (
              <div className="w-full rounded-xl bg-green-50 border border-green-200 py-2.5 text-sm font-semibold text-green-700 text-center">✅ 已确认提交</div>
            ) : (
              <button disabled={isLoading} onClick={() => {
                const lt = (document.getElementById(`${leaveId}-type`) as HTMLSelectElement)?.value || leaveData.leaveType;
                const sd = (document.getElementById(`${leaveId}-start`) as HTMLInputElement)?.value || leaveData.startDate;
                const ed = (document.getElementById(`${leaveId}-end`) as HTMLInputElement)?.value || leaveData.endDate;
                const rs = (document.getElementById(`${leaveId}-reason`) as HTMLInputElement)?.value || leaveData.leaveReason;
                const nt = (document.getElementById(`${leaveId}-note`) as HTMLTextAreaElement)?.value || '';
                const typeLabel = LEAVE_TYPES.find(t => t.value === lt)?.label || lt;
                setConfirmedDrafts(prev => new Set(prev).add(part.toolCallId));
                quickSend(`我确认提交请假申请：${typeLabel}，${sd} 至 ${ed}，事由：${rs}${nt ? '，备注：' + nt : ''}。信息无误。`);
              }} className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200/50 hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all">
                {isLoading ? '处理中...' : '确认发起审批流'}
              </button>
            )}
          </div>
        );
      }

      return (
        <div key={`tool-${index}`} className="my-4 w-72 md:w-[340px] rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5 shadow-sm">
          <h3 className="text-base font-bold text-indigo-900 mb-4 border-b pb-3 border-indigo-100 flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 truncate"><span className="text-lg shrink-0">{icons[d.workflowType] || '📄'}</span> <span className="truncate">{d.title}</span></span>
            <span className="text-[10px] font-normal bg-indigo-100 px-2 py-0.5 rounded-full text-indigo-600 border border-indigo-200 shrink-0">待确认</span>
          </h3>
          <div className="space-y-2.5 text-sm text-gray-700 mb-5">
            {[{label:d.field1Label,value:d.field1Value},{label:d.field2Label,value:d.field2Value},{label:d.field3Label,value:d.field3Value}].filter((f: any)=>f.label&&f.value).map((field: any,i: number) => (
              <div key={i} className="flex justify-between items-start gap-4">
                <span className="text-gray-500 whitespace-nowrap shrink-0">{field.label}：</span>
                <span className="font-medium text-gray-900 text-right break-words">{field.value}</span>
              </div>
            ))}
            {d.reason && <div className="mt-4 flex flex-col gap-1.5 pt-3 border-t border-indigo-100 border-dashed"><span className="text-gray-500 text-xs">附加说明：</span><span className="font-medium text-gray-800 bg-white p-2.5 text-xs rounded-lg border border-gray-100 leading-relaxed shadow-sm">{d.reason}</span></div>}
          </div>
          {confirmedDrafts.has(part.toolCallId) ? (
            <div className="w-full rounded-xl bg-green-50 border border-green-200 py-2.5 text-sm font-semibold text-green-700 text-center">✅ 已确认提交</div>
          ) : (
            <button disabled={isLoading} onClick={() => { setConfirmedDrafts(prev => new Set(prev).add(part.toolCallId)); quickSend(`我确认提交【${args.title}】，信息无误。`); }} className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all">
              {isLoading ? '处理中...' : '确认发起审批流'}
            </button>
          )}
        </div>
      );
    }

    if (toolName === 'escalateToHuman') {
      return (
        <div key={`tool-${index}`} className="my-5 w-full max-w-sm rounded-[1.25rem] border border-red-200 bg-gradient-to-br from-red-50 to-white p-5 shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
          <h3 className="text-base font-extrabold text-red-800 mb-2 flex items-center gap-2">
            <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>
            智能降级 · 已流转至人工专家
          </h3>
          <p className="text-sm text-gray-600 mb-4 bg-white/50 p-3 rounded-xl border border-red-100/50">触发判定：<span className="font-semibold text-gray-800">{args.reason || '业务评估流转'}</span></p>
          <div className="flex bg-white rounded-xl p-3 border border-gray-100 items-center gap-3">
            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-100 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=support&backgroundColor=ef4444" alt="Agent" className="h-full w-full object-cover"/>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900">高级专家支持组</span>
              <span className="text-xs text-green-600 font-medium flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>工单建立中，请稍候...</span>
            </div>
          </div>
        </div>
      );
    }

    if (toolName === 'queryEmployeeSalary') {
      if (!hasResult) return <div key={`tool-${index}`} className="text-sm text-gray-500 italic p-3">正在越权扫描 HR 数据总线...</div>;
      if (result.error) return (
        <div key={`tool-${index}`} className="my-4 w-72 md:w-full max-w-sm rounded-2xl border border-orange-200 bg-orange-50 p-4 shadow-sm flex gap-3 items-start">
          <div className="text-orange-500 mt-0.5"><Shield size={18} /></div>
          <div><h4 className="text-sm font-bold text-orange-900 mb-1">拦截生效 (Hard RBAC)</h4><p className="text-xs text-orange-700 leading-relaxed font-mono">{result.message}</p></div>
        </div>
      );
      return <div key={`tool-${index}`} className="my-4 w-72 md:w-full max-w-sm rounded-2xl border border-green-200 bg-green-50 p-4 shadow-sm"><span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded font-bold mb-2 inline-block">高度机密</span><div className="text-sm text-gray-800 font-mono">查询到 {args.employeeName} 薪资档位: {result.salary}</div></div>;
    }

    if (toolName === 'submitWorkflowApplication') {
      if (!hasResult) return <div key={`tool-${index}`} className="text-sm text-gray-500 italic p-3">正在提交审批流...</div>;
      if (result.status === 'error') return (
        <div key={`tool-${index}`} className="my-4 w-72 md:w-[340px] rounded-2xl border border-red-200 bg-red-50/50 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2"><span className="text-red-600 font-bold">❌ 提交失败</span></div>
          <p className="text-sm text-red-700">{result.message}</p>
        </div>
      );
      const ticket = result.ticket;
      return (
        <div key={`tool-${index}`} className="my-4 w-72 md:w-[340px] rounded-2xl border border-green-200 bg-green-50/50 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3"><CheckCircle2 size={20} className="text-green-600" /><span className="font-bold text-green-900">申请已提交成功</span></div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">标题</span><span className="font-medium">{ticket?.title}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">状态</span><span className="text-amber-600 font-semibold">{ticket?.status}</span></div>
          </div>
          {ticket?.id && (
            <button onClick={() => router.push(`/approvals/${ticket.id}`)}
              className="w-full mt-3 py-2 text-xs font-medium text-green-700 bg-white rounded-lg border border-green-200 hover:bg-green-50 transition-colors">
              查看审批详情 →
            </button>
          )}
        </div>
      );
    }

    if (toolName === 'getLeaveBalance') {
      if (!hasResult) return <div key={`tool-${index}`} className="text-sm text-gray-500 italic p-3">正在查询假期余额...</div>;
      if (result.error) return <div key={`tool-${index}`} className="text-sm text-red-500 p-3">{result.error}</div>;
      const r = result;
      const balItems = r.balance !== undefined
        ? [{ label: r.leaveType === 'annual' ? '年假' : r.leaveType === 'sick' ? '病假' : '调休', value: r.balance }]
        : [{ label: '年假', value: r.annual }, { label: '病假', value: r.sick }, { label: '调休', value: r.lieu }];
      return (
        <div key={`tool-${index}`} className="my-4 w-72 md:w-[340px] rounded-2xl border border-blue-200 bg-blue-50/40 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">🏖️ {r.name}的假期余额</h3>
          <div className="space-y-2.5">
            {balItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-blue-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, ((item.value as number) / 15) * 100)}%` }} /></div>
                  <span className="text-sm font-bold text-blue-800 w-12 text-right">{item.value}天</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (toolName === 'getAttendanceRecords') {
      if (!hasResult) return <div key={`tool-${index}`} className="text-sm text-gray-500 italic p-3">正在查询考勤记录...</div>;
      if (result.error) return <div key={`tool-${index}`} className="text-sm text-red-500 p-3">{result.error}</div>;
      const r = result;
      const statusMap: Record<string, string> = { late: '迟到', early_leave: '早退', missed: '缺卡', absent: '缺勤' };
      return (
        <div key={`tool-${index}`} className="my-4 w-72 md:w-[360px] rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-amber-900 mb-3 flex items-center justify-between"><span>📋 {r.month} 考勤概览</span><span className="text-xs font-normal bg-white border px-2 py-0.5 rounded-full">{r.totalDays}天</span></h3>
          <div className="flex gap-3 mb-3">
            <div className="flex-1 bg-green-50 border border-green-100 rounded-xl p-2.5 text-center"><div className="text-lg font-bold text-green-700">{r.normalDays}</div><div className="text-[10px] text-green-600">正常</div></div>
            <div className="flex-1 bg-red-50 border border-red-100 rounded-xl p-2.5 text-center"><div className="text-lg font-bold text-red-600">{r.abnormalCount}</div><div className="text-[10px] text-red-500">异常</div></div>
          </div>
          {r.abnormalRecords?.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs text-gray-500 font-medium">异常明细：</div>
              {r.abnormalRecords.map((rec: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs bg-white rounded-lg px-3 py-2 border">
                  <span className="text-gray-700">{rec.date}</span>
                  <span className="font-semibold text-red-600">{statusMap[rec.status] || rec.status}</span>
                  {rec.remark && <span className="text-gray-400 truncate max-w-[100px]">{rec.remark}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (toolName === 'getSalaryBreakdown') {
      if (!hasResult) return <div key={`tool-${index}`} className="text-sm text-gray-500 italic p-3">正在查询薪资明细...</div>;
      if (result.error) return <div key={`tool-${index}`} className="text-sm text-red-500 p-3">{result.error}</div>;
      const r = result;
      return (
        <div key={`tool-${index}`} className="my-4 w-72 md:w-[340px] rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-emerald-900 mb-3">💰 {r.name}的薪资构成</h3>
          <div className="space-y-2 text-sm">
            {[{label:'基本工资',value:r.base_salary,color:'text-gray-900'},{label:'住房公积金',value:-r.housing_fund,color:'text-orange-600'},{label:'社会保险',value:-r.social_insurance,color:'text-orange-600'},{label:'个人所得税',value:-r.tax,color:'text-orange-600'}].map((item,i) => (
              <div key={i} className="flex justify-between items-center"><span className="text-gray-500">{item.label}</span><span className={`font-mono font-medium ${item.color}`}>{Math.abs(item.value).toLocaleString('zh-CN',{style:'currency',currency:'CNY'})}</span></div>
            ))}
            <div className="border-t border-emerald-200 pt-2 mt-2 flex justify-between items-center"><span className="font-bold text-emerald-900">实发工资</span><span className="font-bold text-lg text-emerald-700">¥{r.net_salary?.toLocaleString()}</span></div>
          </div>
        </div>
      );
    }

    if (toolName === 'getWorkflowApplications') {
      if (!hasResult) return <div key={`tool-${index}`} className="text-sm text-gray-500 italic p-3">正在查询全域表单记录...</div>;
      const requests = result.requests || [];
      return (
        <div key={`tool-${index}`} className="my-4 w-72 md:w-full max-w-sm rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between"><span className="font-bold text-sm text-gray-700">我的办事追踪台</span><span className="text-xs bg-white border px-2 py-0.5 rounded-full text-gray-500 shadow-sm">{requests.length} 项</span></div>
          {requests.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">目前没有发起过任何流程...</div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {requests.map((req: any, i: number) => (
                <li key={i} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col gap-1 w-2/3"><span className="font-medium text-sm text-gray-900 truncate">{req.title}</span><span className="text-xs text-gray-400 flex items-center gap-1"><Shield size={10}/>发起于: {req.submitTime}</span></div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 border border-amber-100 text-amber-600 rounded-full whitespace-nowrap">{req.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    }

    if (toolName === 'submitITTicket') {
      if (!hasResult) return (
        <div key={`tool-${index}`} className="my-4 w-72 md:w-[340px] rounded-2xl border border-sky-200 bg-sky-50/40 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sky-700 mb-2"><span className="text-lg">🔧</span><span className="text-sm font-semibold">正在创建 IT 工单...</span></div>
          <div className="flex gap-1.5 items-center"><span className="h-2 w-2 animate-bounce rounded-full bg-sky-300"></span><span className="h-2 w-2 animate-bounce rounded-full bg-sky-400" style={{ animationDelay: '0.15s' }}></span><span className="h-2 w-2 animate-bounce rounded-full bg-sky-500" style={{ animationDelay: '0.3s' }}></span></div>
        </div>
      );
      return (
        <div key={`tool-${index}`} className="my-4 w-72 md:w-[340px] rounded-2xl border border-sky-200 bg-sky-50/40 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3"><span className="text-lg">🔧</span><span className="font-bold text-sky-900">IT 工单已创建</span></div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">工单号</span><span className="font-mono font-medium text-sky-700">{result.ticketId}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">问题类型</span><span className="font-medium">{args.issueType}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">状态</span><span className="text-amber-600 font-semibold">{result.status}</span></div>
          </div>
          {result.resolution && <p className="mt-3 text-xs text-gray-600 bg-white rounded-lg p-2.5 border border-gray-100">{result.resolution}</p>}
        </div>
      );
    }

    if (toolName === 'getTeamAttendance') {
      if (!hasResult) return <div key={`tool-${index}`} className="text-sm text-gray-500 italic p-3">📊 正在查询团队考勤...</div>;
      if (result.error) return <div key={`tool-${index}`} className="text-sm text-red-500 p-3">{result.error}</div>;
      const r = result;
      return (
        <div key={`tool-${index}`} className="my-4 w-72 md:w-[360px] rounded-2xl border border-violet-200 bg-violet-50/40 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-violet-900 mb-3 flex items-center justify-between"><span>📊 {r.deptName} · {r.month} 考勤</span><span className="text-xs font-normal bg-white border px-2 py-0.5 rounded-full">{r.totalMembers}人</span></h3>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="bg-red-50 border border-red-100 rounded-xl p-2 text-center"><div className="text-lg font-bold text-red-600">{r.late}</div><div className="text-[10px] text-red-500">迟到</div></div>
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-2 text-center"><div className="text-lg font-bold text-orange-600">{r.earlyLeave}</div><div className="text-[10px] text-orange-500">早退</div></div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-2 text-center"><div className="text-lg font-bold text-gray-700">{r.absence}</div><div className="text-[10px] text-gray-500">缺勤</div></div>
          </div>
          <div className="text-xs text-gray-500">已提交考勤 {r.reported}/{r.totalMembers} 人 · 平均出勤 {r.avgAttendanceDays} 天</div>
        </div>
      );
    }

    if (toolName === 'getTeamMembers') {
      if (!hasResult) return <div key={`tool-${index}`} className="text-sm text-gray-500 italic p-3">👥 正在查询团队成员...</div>;
      if (result.error) return <div key={`tool-${index}`} className="text-sm text-red-500 p-3">{result.error}</div>;
      return (
        <div key={`tool-${index}`} className="my-4 w-72 md:w-[360px] rounded-2xl border border-purple-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-purple-50 px-4 py-3 border-b border-purple-100 flex items-center justify-between"><span className="font-bold text-sm text-purple-800">👥 {result.deptName}</span><span className="text-xs bg-white border px-2 py-0.5 rounded-full text-gray-500">{result.members?.length || 0} 人</span></div>
          <ul className="divide-y divide-gray-50">
            {(result.members || []).map((m: any, i: number) => (
              <li key={i} className="px-4 py-2.5 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-800">{m.name}</span>
                <span className="text-xs text-gray-400">{m.jobTitle}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    }

    if (toolName === 'searchEmployee') {
      if (!hasResult) return <div key={`tool-${index}`} className="text-sm text-gray-500 italic p-3">🔍 正在搜索员工...</div>;
      if (result.error || result.message) return <div key={`tool-${index}`} className="text-sm text-gray-500 p-3">{result.error || result.message}</div>;
      return (
        <div key={`tool-${index}`} className="my-4 w-72 md:w-[380px] rounded-2xl border border-indigo-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100"><span className="font-bold text-sm text-indigo-800">🔍 搜索结果</span></div>
          <ul className="divide-y divide-gray-50">
            {(result.results || []).map((e: any, i: number) => (
              <li key={i} className="px-4 py-2.5 text-sm">
                <div className="flex items-center justify-between"><span className="font-medium text-gray-800">{e.name}</span><span className={`text-xs px-1.5 py-0.5 rounded ${e.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>{e.active ? '在职' : '离职'}</span></div>
                <div className="text-xs text-gray-400 mt-0.5">{e.department} · {e.jobTitle}{e.phone ? ` · ${e.phone}` : ''}</div>
              </li>
            ))}
          </ul>
        </div>
      );
    }

    if (toolName === 'updateEmployee') {
      if (!hasResult) return <div key={`tool-${index}`} className="text-sm text-gray-500 italic p-3">✏️ 正在修改员工信息...</div>;
      if (result.error) return <div key={`tool-${index}`} className="text-sm text-red-500 p-3">❌ {result.error}</div>;
      return (
        <div key={`tool-${index}`} className="my-4 w-72 md:w-[340px] rounded-2xl border border-green-200 bg-green-50/50 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2"><span className="text-green-600 font-bold">✅ 修改成功</span></div>
          <div className="text-sm text-gray-700">{result.message}</div>
        </div>
      );
    }

    if (toolName === 'getCompanyStats') {
      if (!hasResult) return <div key={`tool-${index}`} className="text-sm text-gray-500 italic p-3">📊 正在统计全公司数据...</div>;
      if (result.error) return <div key={`tool-${index}`} className="text-sm text-red-500 p-3">{result.error}</div>;
      const r = result;
      return (
        <div key={`tool-${index}`} className="my-4 w-72 md:w-[360px] rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-indigo-900 mb-3">📊 全公司统计 · {r.month}</h3>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-green-50 border border-green-100 rounded-xl p-2.5 text-center"><div className="text-lg font-bold text-green-700">{r.totalActive}</div><div className="text-[10px] text-green-600">在职</div></div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-center"><div className="text-lg font-bold text-gray-500">{r.totalInactive}</div><div className="text-[10px] text-gray-400">离职/禁用</div></div>
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            <div>考勤已提交：{r.attendanceReported} 人 · 异常合计：{r.totalAnomalies} 次 · 人均 {r.anomalyRate}</div>
            {r.departmentDistribution && <div className="flex flex-wrap gap-1 mt-1">{Object.entries(r.departmentDistribution).map(([dept, count]) => <span key={dept} className="bg-white border rounded px-1.5 py-0.5">{dept} {count as number}人</span>)}</div>}
          </div>
        </div>
      );
    }

    if (toolName === 'searchCompanyPolicies') {
      if (!hasResult) return <div key={`tool-${index}`} className="text-sm text-gray-500 italic p-3">📚 正在检索公司政策文档...</div>;
      if (result.error) return <div key={`tool-${index}`} className="text-sm text-red-500 p-3">{result.error}</div>;
      return null;
    }

    // 兜底：未知工具，用友好文案
    return (
      <div key={`tool-${index}`} className="my-3 rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
        <div className="flex items-center gap-2 text-slate-600 mb-1"><Bot size={16} className="text-indigo-400" /><span className="text-sm font-medium">正在处理你的请求...</span></div>
        {hasResult ? <div className="mt-2 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5">✅ 处理完成</div> : <div className="mt-2 text-sm text-slate-400 italic">请稍候...</div>}
      </div>
    );
  });
}
