'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Field, EditField, StatusBadge, SectionHeader, EmptyState, RecordModal, apiRecord, apiProfile, R } from './components';

const TABS = [
  { key: 'basic', label: '基本信息', icon: '👤' },
  { key: 'position', label: '职位信息', icon: '💼' },
  { key: 'salary', label: '薪酬考勤', icon: '💰' },
  { key: 'transfer', label: '调动记录', icon: '🔄' },
  { key: 'performance', label: '主要业绩', icon: '📊' },
  { key: 'ticket', label: '提单记录', icon: '🎫' },
  { key: 'expense', label: '费用报销', icon: '🧾' },
] as const;
type TabKey = typeof TABS[number]['key'];

interface Props {
  employee: R; transfers: R[]; performance: R[]; attendance: R[]; tickets: R[]; expenses: R[];
  empPositions: R[]; departments: R[]; positions: R[]; jobLevels: R[];
  isAdmin: boolean;
}

export default function EmployeeDetailClient({ employee, transfers, performance, attendance, tickets, expenses, empPositions, departments, positions, jobLevels, isAdmin }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>('basic');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<{ type: string; data?: R } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const e = employee as Record<string, string>;
  const eid = e.id;

  const handleRefresh = () => {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 600);
  };

  const startEdit = () => { setForm({ ...e }); setEditing(true); };
  const onChange = (n: string, v: string) => setForm(f => ({ ...f, [n]: v }));
  const saveProfile = async () => {
    setSaving(true);
    const fields = tab === 'basic'
      ? ['name','gender','birthday','id_number','phone','emergency_contact','emergency_phone','hire_date']
      : tab === 'position'
      ? ['department_id','position_id','job_level_id','employee_status','work_location','contract_type','contract_end_date']
      : ['base_salary','social_insurance_base','housing_fund_base'];
    const body: Record<string, string> = { id: eid };
    fields.forEach(f => { if (form[f] !== undefined) body[f] = form[f]; });
    try {
      await apiProfile(body);
      setEditing(false);
      router.refresh();
    } catch (err: any) {
      alert('保存失败: ' + (err.message || '未知错误'));
    } finally {
      setSaving(false);
    }
  };

  const saveRecord = async (table: string, data: Record<string, unknown>) => {
    if (modal?.data?.id) {
      await apiRecord('PATCH', { table, id: modal.data.id, ...data });
    } else {
      await apiRecord('POST', { table, employee_id: eid, ...data });
    }
    setModal(null); router.refresh();
  };

  const deleteRecord = async (table: string, id: string) => {
    if (!confirm('确认删除？')) return;
    await apiRecord('DELETE', { table, id });
    router.refresh();
  };

  const editBtn = !editing
    ? <button onClick={startEdit} className="text-sm text-blue-600 hover:underline">编辑</button>
    : <div className="flex gap-2">
        <button onClick={() => setEditing(false)} className="text-sm text-gray-500 hover:underline">取消</button>
        <button onClick={saveProfile} disabled={saving} className="text-sm text-blue-600 hover:underline disabled:opacity-50">{saving ? '保存中...' : '保存'}</button>
      </div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-sm">← 返回</button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">{(e.name || '?')[0]}</div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">{e.name || '未命名'}</h1>
              <p className="text-xs text-gray-500">{e.department || ''} · {e.job_title || ''}</p>
            </div>
          </div>
        </div>
        <button onClick={handleRefresh} disabled={refreshing} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50" title="刷新数据">
          <span className={refreshing ? 'inline-block animate-spin' : ''}>↻</span> {refreshing ? '刷新中…' : '刷新'}
        </button>
      </header>

      <div className="bg-white border-b overflow-x-auto">
        <div className="flex px-4 md:px-8 gap-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setEditing(false); }}
              className={`px-3 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${tab === t.key ? 'border-blue-600 text-blue-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8">

        {/* ===== 基本信息 ===== */}
        {tab === 'basic' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4"><h2 className="font-semibold text-gray-800">基本信息</h2>{isAdmin && editBtn}</div>
            {editing ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <EditField label="姓名" name="name" value={form.name||''} onChange={onChange} />
                <EditField label="性别" name="gender" value={form.gender||''} onChange={onChange} options={[{value:'',label:'请选择'},{value:'男',label:'男'},{value:'女',label:'女'}]} />
                <EditField label="生日" name="birthday" value={form.birthday||''} type="date" onChange={onChange} />
                <EditField label="身份证号" name="id_number" value={form.id_number||''} onChange={onChange} />
                <EditField label="手机号" name="phone" value={form.phone||''} onChange={onChange} />
                <EditField label="入职日期" name="hire_date" value={form.hire_date||''} type="date" onChange={onChange} />
                <EditField label="紧急联系人" name="emergency_contact" value={form.emergency_contact||''} onChange={onChange} />
                <EditField label="紧急联系人电话" name="emergency_phone" value={form.emergency_phone||''} onChange={onChange} />
              </div>
            ) : (
              <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Field label="姓名" value={e.name} /><Field label="性别" value={e.gender} /><Field label="生日" value={e.birthday} />
                <Field label="身份证号" value={e.id_number} /><Field label="手机号" value={e.phone} /><Field label="入职日期" value={e.hire_date} />
                <Field label="紧急联系人" value={e.emergency_contact} /><Field label="紧急联系人电话" value={e.emergency_phone} />
              </dl>
            )}
          </div>
        )}

        {/* ===== 职位信息 ===== */}
        {tab === 'position' && (
          <div className="space-y-6">
            {/* 主职位信息（profiles 上的 FK） */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4"><h2 className="font-semibold text-gray-800">主职位信息</h2>{isAdmin && editBtn}</div>
              {editing ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <EditField label="部门" name="department_id" value={form.department_id||''} onChange={onChange}
                    options={[{value:'',label:'请选择'}, ...departments.map((d:R) => ({value:String(d.id),label:String(d.name)}))]} />
                  <EditField label="职位" name="position_id" value={form.position_id||''} onChange={onChange}
                    options={[{value:'',label:'请选择'}, ...positions.filter((p:R) => !form.department_id || p.department_id === form.department_id || !p.department_id).map((p:R) => ({value:String(p.id),label:String(p.name)}))]} />
                  <EditField label="职级" name="job_level_id" value={form.job_level_id||''} onChange={onChange}
                    options={[{value:'',label:'请选择'}, ...jobLevels.map((l:R) => ({value:String(l.id),label:`${l.code} ${l.name}`}))]} />
                  <EditField label="员工状态" name="employee_status" value={form.employee_status||'active'} onChange={onChange}
                    options={[{value:'probation',label:'试用期'},{value:'active',label:'正式在职'},{value:'suspended',label:'停职'},{value:'on_leave',label:'长期休假'},{value:'resigned',label:'已离职'},{value:'terminated',label:'被辞退'}]} />
                  <EditField label="工作地点" name="work_location" value={form.work_location||''} onChange={onChange} />
                  <EditField label="合同类型" name="contract_type" value={form.contract_type||''} onChange={onChange} options={[{value:'',label:'请选择'},{value:'固定期限',label:'固定期限'},{value:'无固定期限',label:'无固定期限'},{value:'实习',label:'实习'}]} />
                  <EditField label="合同到期日" name="contract_end_date" value={form.contract_end_date||''} type="date" onChange={onChange} />
                </div>
              ) : (
                <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Field label="部门" value={departments.find((d:R) => d.id === e.department_id)?.name || e.department || '-'} />
                  <Field label="职位" value={positions.find((p:R) => p.id === e.position_id)?.name || e.job_title || '-'} />
                  <Field label="职级" value={jobLevels.find((l:R) => l.id === e.job_level_id) ? `${jobLevels.find((l:R) => l.id === e.job_level_id)!.code} ${jobLevels.find((l:R) => l.id === e.job_level_id)!.name}` : e.job_level || '-'} />
                  <Field label="员工状态" value={({probation:'试用期',active:'正式在职',suspended:'停职',on_leave:'长期休假',resigned:'已离职',terminated:'被辞退'} as Record<string,string>)[String(e.employee_status)] || '正式在职'} />
                  <Field label="工作地点" value={e.work_location} />
                  <Field label="合同类型" value={e.contract_type} /><Field label="合同到期日" value={e.contract_end_date} />
                </dl>
              )}
            </div>

            {/* 兼职列表 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <SectionHeader title="任职记录（含兼职）" isAdmin={isAdmin} onAdd={() => setModal({ type: 'emp_position' })} />
              {empPositions.length === 0 ? <EmptyState text="暂无任职记录" /> : (
                <table className="w-full text-sm"><thead className="bg-gray-50 text-gray-500 text-left"><tr>
                  <th className="px-3 py-2 font-medium">类型</th>
                  <th className="px-3 py-2 font-medium">部门</th>
                  <th className="px-3 py-2 font-medium">职位</th>
                  <th className="px-3 py-2 font-medium">开始日期</th>
                  <th className="px-3 py-2 font-medium">结束日期</th>
                  <th className="px-3 py-2 font-medium hidden md:table-cell">备注</th>
                  {isAdmin && <th className="px-3 py-2 font-medium">操作</th>}
                </tr></thead><tbody className="divide-y divide-gray-100">
                  {empPositions.map((ep: R) => (
                    <tr key={String(ep.id)} className={ep.end_date ? 'opacity-50' : ''}>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${ep.is_primary ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                          {ep.is_primary ? '主职位' : '兼职'}
                        </span>
                      </td>
                      <td className="px-3 py-2">{String(departments.find((d:R) => d.id === ep.department_id)?.name || '-')}</td>
                      <td className="px-3 py-2">{String(positions.find((p:R) => p.id === ep.position_id)?.name || '-')}</td>
                      <td className="px-3 py-2">{String(ep.start_date || '-')}</td>
                      <td className="px-3 py-2">{ep.end_date ? String(ep.end_date) : '至今'}</td>
                      <td className="px-3 py-2 text-gray-400 hidden md:table-cell">{String(ep.remark || '-')}</td>
                      {isAdmin && <td className="px-3 py-2 space-x-2">
                        <button onClick={() => setModal({ type: 'emp_position', data: ep })} className="text-xs text-blue-600">编辑</button>
                        <button onClick={() => deleteRecord('employee_positions', String(ep.id))} className="text-xs text-red-500">删除</button>
                      </td>}
                    </tr>
                  ))}
                </tbody></table>
              )}
            </div>
          </div>
        )}

        {/* ===== 薪酬考勤 ===== */}
        {tab === 'salary' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4"><h2 className="font-semibold text-gray-800">薪酬信息</h2>{isAdmin && editBtn}</div>
              {editing ? (
                <div className="grid grid-cols-3 gap-4">
                  <EditField label="基本工资" name="base_salary" value={form.base_salary||''} type="number" onChange={onChange} />
                  <EditField label="社保基数" name="social_insurance_base" value={form.social_insurance_base||''} type="number" onChange={onChange} />
                  <EditField label="公积金基数" name="housing_fund_base" value={form.housing_fund_base||''} type="number" onChange={onChange} />
                </div>
              ) : (
                <dl className="grid grid-cols-3 gap-4">
                  <Field label="基本工资" value={e.base_salary ? `¥${Number(e.base_salary).toLocaleString()}` : ''} />
                  <Field label="社保基数" value={e.social_insurance_base ? `¥${Number(e.social_insurance_base).toLocaleString()}` : ''} />
                  <Field label="公积金基数" value={e.housing_fund_base ? `¥${Number(e.housing_fund_base).toLocaleString()}` : ''} />
                </dl>
              )}
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <SectionHeader title="考勤记录" isAdmin={isAdmin} onAdd={() => setModal({ type: 'attendance' })} />
              {attendance.length === 0 ? <EmptyState text="暂无考勤记录" /> : (
                <table className="w-full text-sm"><thead className="bg-gray-50 text-gray-500 text-left"><tr>
                  <th className="px-3 py-2 font-medium">月份</th><th className="px-3 py-2 font-medium">应出勤</th><th className="px-3 py-2 font-medium">实出勤</th>
                  <th className="px-3 py-2 font-medium">迟到</th><th className="px-3 py-2 font-medium">加班(h)</th><th className="px-3 py-2 font-medium">请假</th>
                  {isAdmin && <th className="px-3 py-2 font-medium">操作</th>}
                </tr></thead><tbody className="divide-y divide-gray-100">
                  {attendance.map((a: R) => (
                    <tr key={String(a.id)}>
                      <td className="px-3 py-2 font-medium">{String(a.month)}</td><td className="px-3 py-2">{String(a.work_days)}</td>
                      <td className="px-3 py-2">{String(a.actual_days)}</td><td className="px-3 py-2">{String(a.late_count)}</td>
                      <td className="px-3 py-2">{String(a.overtime_hours)}</td><td className="px-3 py-2">{String(a.leave_days)}天</td>
                      {isAdmin && <td className="px-3 py-2">
                        <button onClick={() => setModal({ type: 'attendance', data: a })} className="text-xs text-blue-600 mr-2">编辑</button>
                        <button onClick={() => deleteRecord('attendance', String(a.id))} className="text-xs text-red-500">删除</button>
                      </td>}
                    </tr>
                  ))}
                </tbody></table>
              )}
            </div>
          </div>
        )}

        {/* ===== 调动记录 ===== */}
        {tab === 'transfer' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <SectionHeader title="调动记录" isAdmin={isAdmin} onAdd={() => setModal({ type: 'transfer' })} />
            {transfers.length === 0 ? <EmptyState text="暂无调动记录" /> : (
              <div className="space-y-3">{transfers.map((t: R) => (
                <div key={String(t.id)} className="flex items-start gap-3 border-l-2 border-blue-200 pl-4 py-2">
                  <div className="flex-1">
                    <div className="text-sm">
                      <span className="text-gray-500">{({department:'部门',position:'职位',level:'职级',location:'地点'} as Record<string,string>)[String(t.transfer_type)] || String(t.transfer_type)}：</span>
                      <span className="text-gray-400 line-through mr-1">{String(t.from_value)}</span> → <span className="font-medium text-gray-800">{String(t.to_value)}</span>
                    </div>
                    {t.remark ? <p className="text-xs text-gray-400 mt-0.5">{String(t.remark)}</p> : null}
                  </div>
                  <div className="text-xs text-gray-400 whitespace-nowrap flex items-center gap-2">
                    {String(t.effective_date)}
                    {isAdmin && <button onClick={() => setModal({ type: 'transfer', data: t })} className="text-blue-600">编辑</button>}
                    {isAdmin && <button onClick={() => deleteRecord('employee_transfers', String(t.id))} className="text-red-500">删除</button>}
                  </div>
                </div>
              ))}</div>
            )}
          </div>
        )}

        {/* ===== 主要业绩 ===== */}
        {tab === 'performance' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <SectionHeader title="绩效记录" isAdmin={isAdmin} onAdd={() => setModal({ type: 'performance' })} />
            {performance.length === 0 ? <EmptyState text="暂无绩效记录" /> : (
              <div className="space-y-4">{performance.map((p: R) => (
                <div key={String(p.id)} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{String(p.period)}</span>
                    <div className="flex items-center gap-2">
                      {p.score ? <span className="text-lg font-bold text-blue-600">{String(p.score)}</span> : null}
                      {p.rating ? <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{String(p.rating)}</span> : null}
                      {isAdmin && <button onClick={() => setModal({ type: 'performance', data: p })} className="text-xs text-blue-600 ml-2">编辑</button>}
                      {isAdmin && <button onClick={() => deleteRecord('performance', String(p.id))} className="text-xs text-red-500">删除</button>}
                    </div>
                  </div>
                  {p.goals ? <p className="text-xs text-gray-500 mb-1">目标: {String(p.goals)}</p> : null}
                  {p.comment ? <p className="text-sm text-gray-600">{String(p.comment)}</p> : null}
                </div>
              ))}</div>
            )}
          </div>
        )}

        {/* ===== 提单记录 ===== */}
        {tab === 'ticket' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <SectionHeader title="提单记录" isAdmin={isAdmin} onAdd={() => setModal({ type: 'ticket' })} />
            {tickets.length === 0 ? <EmptyState text="暂无工单记录" /> : (
              <div className="space-y-3">{tickets.map((t: R) => (
                <div key={String(t.id)} className="flex items-center justify-between border rounded-lg p-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{t.type === 'it' ? 'IT' : t.type === 'hr' ? 'HR' : '其他'}</span>
                      <span className="text-sm font-medium">{String(t.title)}</span>
                    </div>
                    {t.description ? <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{String(t.description)}</p> : null}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={String(t.status)} />
                    <span className="text-xs text-gray-400">{String(t.created_at).slice(0, 10)}</span>
                    {isAdmin && <button onClick={() => setModal({ type: 'ticket', data: t })} className="text-xs text-blue-600">编辑</button>}
                    {isAdmin && <button onClick={() => deleteRecord('tickets', String(t.id))} className="text-xs text-red-500">删除</button>}
                  </div>
                </div>
              ))}</div>
            )}
          </div>
        )}

        {/* ===== 费用报销 ===== */}
        {tab === 'expense' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <SectionHeader title="费用报销" isAdmin={isAdmin} onAdd={() => setModal({ type: 'expense' })} />
            {expenses.length === 0 ? <EmptyState text="暂无报销记录" /> : (
              <table className="w-full text-sm"><thead className="bg-gray-50 text-gray-500 text-left"><tr>
                <th className="px-3 py-2 font-medium">日期</th><th className="px-3 py-2 font-medium">类型</th><th className="px-3 py-2 font-medium">金额</th>
                <th className="px-3 py-2 font-medium">说明</th><th className="px-3 py-2 font-medium">状态</th>
                {isAdmin && <th className="px-3 py-2 font-medium">操作</th>}
              </tr></thead><tbody className="divide-y divide-gray-100">
                {expenses.map((ex: R) => (
                  <tr key={String(ex.id)}>
                    <td className="px-3 py-2">{String(ex.created_at).slice(0, 10)}</td>
                    <td className="px-3 py-2">{String(ex.expense_type)}</td>
                    <td className="px-3 py-2 font-medium">¥{Number(ex.amount).toLocaleString()}</td>
                    <td className="px-3 py-2 text-gray-500 max-w-[200px] truncate">{String(ex.description)}</td>
                    <td className="px-3 py-2"><StatusBadge status={String(ex.status)} /></td>
                    {isAdmin && <td className="px-3 py-2">
                      <button onClick={() => setModal({ type: 'expense', data: ex })} className="text-xs text-blue-600 mr-2">编辑</button>
                      <button onClick={() => deleteRecord('expenses', String(ex.id))} className="text-xs text-red-500">删除</button>
                    </td>}
                  </tr>
                ))}
              </tbody></table>
            )}
          </div>
        )}
      </div>

      {/* ===== Modals ===== */}
      {modal?.type === 'transfer' && (
        <RecordModal title={modal.data ? '编辑调动' : '新增调动'} onClose={() => setModal(null)}
          initial={{ transfer_type: String(modal.data?.transfer_type||'department'), from_value: String(modal.data?.from_value||''), to_value: String(modal.data?.to_value||''), effective_date: String(modal.data?.effective_date||''), approved_by: String(modal.data?.approved_by||''), remark: String(modal.data?.remark||'') }}
          fields={[
            { name: 'transfer_type', label: '类型', options: [{value:'department',label:'部门'},{value:'position',label:'职位'},{value:'level',label:'职级'},{value:'location',label:'地点'}] },
            { name: 'from_value', label: '原值' }, { name: 'to_value', label: '新值' },
            { name: 'effective_date', label: '生效日期', type: 'date' }, { name: 'approved_by', label: '审批人' }, { name: 'remark', label: '备注' },
          ]}
          onSave={data => saveRecord('employee_transfers', data)} />
      )}
      {modal?.type === 'performance' && (
        <RecordModal title={modal.data ? '编辑绩效' : '新增绩效'} onClose={() => setModal(null)}
          initial={{ period: String(modal.data?.period||''), score: String(modal.data?.score||''), rating: String(modal.data?.rating||''), goals: String(modal.data?.goals||''), comment: String(modal.data?.comment||''), reviewer: String(modal.data?.reviewer||'') }}
          fields={[
            { name: 'period', label: '考核周期' }, { name: 'score', label: '评分', type: 'number' },
            { name: 'rating', label: '等级', options: [{value:'',label:'请选择'},{value:'S',label:'S 卓越'},{value:'A',label:'A 优秀'},{value:'B',label:'B 良好'},{value:'C',label:'C 合格'},{value:'D',label:'D 待改进'}] },
            { name: 'goals', label: '目标', type: 'textarea' }, { name: 'comment', label: '评语', type: 'textarea' }, { name: 'reviewer', label: '评审人' },
          ]}
          onSave={data => saveRecord('performance', data)} />
      )}
      {modal?.type === 'attendance' && (
        <RecordModal title={modal.data ? '编辑考勤' : '新增考勤'} onClose={() => setModal(null)}
          initial={{ month: String(modal.data?.month||''), work_days: String(modal.data?.work_days||''), actual_days: String(modal.data?.actual_days||''), late_count: String(modal.data?.late_count||''), early_leave_count: String(modal.data?.early_leave_count||''), absence_days: String(modal.data?.absence_days||''), overtime_hours: String(modal.data?.overtime_hours||''), leave_days: String(modal.data?.leave_days||'') }}
          fields={[
            { name: 'month', label: '月份 (如 2026-03)' }, { name: 'work_days', label: '应出勤天数', type: 'number' },
            { name: 'actual_days', label: '实出勤天数', type: 'number' }, { name: 'late_count', label: '迟到次数', type: 'number' },
            { name: 'early_leave_count', label: '早退次数', type: 'number' }, { name: 'absence_days', label: '缺勤天数', type: 'number' },
            { name: 'overtime_hours', label: '加班小时', type: 'number' }, { name: 'leave_days', label: '请假天数', type: 'number' },
          ]}
          onSave={data => saveRecord('attendance', data)} />
      )}
      {modal?.type === 'ticket' && (
        <RecordModal title={modal.data ? '编辑工单' : '新增工单'} onClose={() => setModal(null)}
          initial={{ type: String(modal.data?.type||'it'), title: String(modal.data?.title||''), description: String(modal.data?.description||''), status: String(modal.data?.status||'open'), handler: String(modal.data?.handler||'') }}
          fields={[
            { name: 'type', label: '类型', options: [{value:'it',label:'IT'},{value:'hr',label:'HR'},{value:'other',label:'其他'}] },
            { name: 'title', label: '标题' }, { name: 'description', label: '描述', type: 'textarea' },
            { name: 'status', label: '状态', options: [{value:'open',label:'待处理'},{value:'in_progress',label:'处理中'},{value:'resolved',label:'已解决'},{value:'closed',label:'已关闭'}] },
            { name: 'handler', label: '处理人' },
          ]}
          onSave={data => saveRecord('tickets', data)} />
      )}
      {modal?.type === 'expense' && (
        <RecordModal title={modal.data ? '编辑报销' : '新增报销'} onClose={() => setModal(null)}
          initial={{ expense_type: String(modal.data?.expense_type||''), amount: String(modal.data?.amount||''), description: String(modal.data?.description||''), status: String(modal.data?.status||'pending'), approved_by: String(modal.data?.approved_by||'') }}
          fields={[
            { name: 'expense_type', label: '报销类型' }, { name: 'amount', label: '金额', type: 'number' },
            { name: 'description', label: '说明', type: 'textarea' },
            { name: 'status', label: '状态', options: [{value:'pending',label:'待审批'},{value:'approved',label:'已批准'},{value:'rejected',label:'已拒绝'},{value:'paid',label:'已打款'}] },
            { name: 'approved_by', label: '审批人' },
          ]}
          onSave={data => saveRecord('expenses', data)} />
      )}
      {modal?.type === 'emp_position' && (
        <RecordModal title={modal.data ? '编辑任职' : '新增任职'} onClose={() => setModal(null)}
          initial={{
            department_id: String(modal.data?.department_id||''),
            position_id: String(modal.data?.position_id||''),
            is_primary: String(modal.data?.is_primary ?? false),
            start_date: String(modal.data?.start_date||''),
            end_date: String(modal.data?.end_date||''),
            remark: String(modal.data?.remark||''),
          }}
          fields={[
            { name: 'department_id', label: '部门', options: [{value:'',label:'请选择'}, ...departments.map((d:R) => ({value:String(d.id),label:String(d.name)}))] },
            { name: 'position_id', label: '职位', options: [{value:'',label:'请选择'}, ...positions.map((p:R) => ({value:String(p.id),label:String(p.name)}))] },
            { name: 'is_primary', label: '类型', options: [{value:'false',label:'兼职'},{value:'true',label:'主职位'}] },
            { name: 'start_date', label: '开始日期', type: 'date' },
            { name: 'end_date', label: '结束日期（留空=至今）', type: 'date' },
            { name: 'remark', label: '备注' },
          ]}
          onSave={data => saveRecord('employee_positions', { ...data, is_primary: data.is_primary === 'true', end_date: data.end_date || null })} />
      )}
    </div>
  );
}
