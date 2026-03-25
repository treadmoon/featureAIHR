'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type R = Record<string, any>;

const TYPE_LABELS: R = { leave: '请假', expense: '报销', overtime: '加班', attendance_fix: '补卡', transfer: '调岗', salary_adjust: '调薪', resignation: '离职', onboard: '入职确认' };
const TYPE_ICONS: R = { leave: '🏖️', expense: '🧾', overtime: '⏰', attendance_fix: '📋', transfer: '🔄', salary_adjust: '💰', resignation: '👋', onboard: '🎉' };
const STATUS_STYLES: R = {
  pending: { label: '审批中', cls: 'bg-yellow-100 text-yellow-700' },
  approved: { label: '已通过', cls: 'bg-green-100 text-green-700' },
  rejected: { label: '已驳回', cls: 'bg-red-100 text-red-700' },
  cancelled: { label: '已撤销', cls: 'bg-gray-100 text-gray-500' },
};
const LEAVE_TYPES: R = { annual: '年假', sick: '病假', personal: '事假', lieu: '调休', other: '其他' };

const TABS = [
  { key: 'pending', label: '待我审批', icon: '📥' },
  { key: 'mine', label: '我发起的', icon: '📤' },
  { key: 'done', label: '已处理', icon: '✅' },
] as const;

function formatPayload(type: string, p: R) {
  switch (type) {
    case 'leave': return `${LEAVE_TYPES[p.leave_type] || p['假期类型'] || p.leave_type || ''} ${p.start_date || p['开始日期'] || ''} ~ ${p.end_date || p['结束日期'] || ''}`;
    case 'expense': return `¥${Number(p.amount || 0).toLocaleString()} · ${p.expense_type || ''}`;
    case 'overtime': return `${p.date || ''} · ${p.hours || ''}小时`;
    case 'attendance_fix': return `${p.date || ''} · ${p.type === 'clock_in' ? '补签到' : '补签退'}`;
    default: return '';
  }
}

// ── 发起申请 Modal ──
function NewRequestModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (type: string, payload: R) => Promise<void> }) {
  const [type, setType] = useState('leave');
  const [f, setF] = useState<R>({});
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));

  const submit = async () => { setSaving(true); try { await onSubmit(type, f); } finally { setSaving(false); } };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">发起申请</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">申请类型</label>
          <div className="grid grid-cols-4 gap-2">
            {['leave', 'expense', 'overtime', 'attendance_fix'].map(t => (
              <button key={t} onClick={() => { setType(t); setF({}); }}
                className={`p-2 rounded-lg text-center text-xs transition-colors ${type === t ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                <span className="text-lg block">{TYPE_ICONS[t]}</span>{TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {type === 'leave' && <>
            <Sel label="请假类型" value={f.leave_type || ''} onChange={v => set('leave_type', v)}
              options={[['','请选择'],['annual','年假'],['sick','病假'],['personal','事假'],['other','其他']]} />
            <Inp label="开始日期" value={f.start_date || ''} onChange={v => set('start_date', v)} type="date" />
            <Inp label="结束日期" value={f.end_date || ''} onChange={v => set('end_date', v)} type="date" />
            <Inp label="天数" value={f.days || ''} onChange={v => set('days', v)} type="number" />
            <Txt label="事由" value={f.reason || ''} onChange={v => set('reason', v)} />
          </>}
          {type === 'expense' && <>
            <Inp label="报销类型" value={f.expense_type || ''} onChange={v => set('expense_type', v)} placeholder="如：差旅、餐饮" />
            <Inp label="金额" value={f.amount || ''} onChange={v => set('amount', v)} type="number" />
            <Txt label="说明" value={f.description || ''} onChange={v => set('description', v)} />
          </>}
          {type === 'overtime' && <>
            <Inp label="加班日期" value={f.date || ''} onChange={v => set('date', v)} type="date" />
            <Inp label="时长（小时）" value={f.hours || ''} onChange={v => set('hours', v)} type="number" />
            <Txt label="事由" value={f.reason || ''} onChange={v => set('reason', v)} />
          </>}
          {type === 'attendance_fix' && <>
            <Inp label="补卡日期" value={f.date || ''} onChange={v => set('date', v)} type="date" />
            <Sel label="补卡类型" value={f.type || ''} onChange={v => set('type', v)}
              options={[['','请选择'],['clock_in','补签到'],['clock_out','补签退']]} />
            <Txt label="原因" value={f.reason || ''} onChange={v => set('reason', v)} />
          </>}
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">取消</button>
          <button onClick={submit} disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? '提交中...' : '提交申请'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Inp({ label, value, onChange, type = 'text', placeholder = '' }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return <div><label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>;
}
function Sel({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[][] }) {
  return <div><label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select></div>;
}
function Txt({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <div><label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <textarea value={value} onChange={e => onChange(e.target.value)} rows={2}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>;
}

// ── Main ──
interface Props { userId: string; isAdmin: boolean; departments: R[]; positions: R[]; }

export default function ApprovalsClient({ userId, isAdmin, departments, positions }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<'pending' | 'mine' | 'done'>('pending');
  const [items, setItems] = useState<R[]>([]);
  const [loading, setLoading] = useState(true);
  const [newModal, setNewModal] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/approvals?tab=${tab}`);
    setItems(await res.json());
    setLoading(false);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const submitRequest = async (type: string, payload: R) => {
    const res = await fetch('/api/approvals', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, payload }),
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error || '提交失败'); return; }
    setNewModal(false);
    // 跳转到详情页
    router.push(`/approvals/${data.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← 返回</Link>
          <h1 className="text-lg font-bold text-gray-800">审批工作台</h1>
        </div>
        <button onClick={() => setNewModal(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
          + 发起申请
        </button>
      </header>

      <div className="bg-white border-b overflow-x-auto">
        <div className="flex px-4 md:px-8 gap-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
              className={`px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${tab === t.key ? 'border-blue-600 text-blue-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 pt-3 flex gap-2">
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30">
          <option value="">全部类型</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v as string}</option>)}
        </select>
        <input type="text" placeholder="搜索申请人..." value={search} onChange={e => setSearch(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-600 flex-1 max-w-[180px] focus:outline-none focus:ring-2 focus:ring-blue-500/30 placeholder:text-gray-400" />
      </div>

      <div className="max-w-3xl mx-auto p-4 md:px-8 md:pb-8">
        {(() => {
          const filtered = items.filter(item => {
            if (typeFilter && item.type !== typeFilter) return false;
            if (search && !(item.applicant_name || '').includes(search)) return false;
            return true;
          });
          if (loading) return <p className="text-center py-16 text-gray-400">加载中...</p>;
          if (filtered.length === 0) return (
          <div className="text-center py-16 text-gray-400">
            <p className="text-3xl mb-2">{tab === 'pending' ? '📥' : tab === 'mine' ? '📤' : '✅'}</p>
            <p className="mb-4">{tab === 'pending' ? '暂无待审批事项' : tab === 'mine' ? '暂无发起的申请' : '暂无已处理记录'}</p>
            {tab !== 'pending' && (
              <button onClick={() => setNewModal(true)} className="text-sm text-blue-600 hover:text-blue-700">发起一个申请 →</button>
            )}
          </div>
          );
          return (
          <div className="space-y-3">
            {filtered.map((item: R) => {
              const st = STATUS_STYLES[item.status] || STATUS_STYLES.pending;
              return (
                <div key={item.id} onClick={() => router.push(`/approvals/${item.id}`)}
                  className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0">{TYPE_ICONS[item.type] || '📄'}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-800">{TYPE_LABELS[item.type] || item.type}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${st.cls}`}>{st.label}</span>
                        {item.total_steps > 1 && item.status === 'pending' && (
                          <span className="text-xs text-gray-400">第{item.current_step}/{item.total_steps}步</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {item.applicant_name}{item.applicant_dept ? ` · ${item.applicant_dept}` : ''} · {formatPayload(item.type, item.payload || {})}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(item.created_at).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <span className="shrink-0 ml-3 text-gray-300 text-sm">›</span>
                </div>
              );
            })}
          </div>
          );
        })()}
      </div>

      {newModal && <NewRequestModal onClose={() => setNewModal(false)} onSubmit={submitRequest} />}
    </div>
  );
}
