'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type R = Record<string, any>;

const TABS = [
  { key: 'chart', label: '组织架构图', icon: '🗂️' },
  { key: 'departments', label: '部门管理', icon: '🏢' },
  { key: 'positions', label: '职位管理', icon: '💼' },
  { key: 'job_levels', label: '职级管理', icon: '📊' },
] as const;
type TabKey = typeof TABS[number]['key'];

interface Props {
  departments: R[];
  positions: R[];
  jobLevels: R[];
  employees: R[];
}

async function api(method: string, body: R) {
  const opts: RequestInit = method === 'GET'
    ? {}
    : { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
  if (method === 'GET') {
    const res = await fetch(`/api/admin/org?table=${body.table}`);
    return res.json();
  }
  const res = await fetch('/api/admin/org', opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '操作失败');
  return data;
}

// ─── Modal ───
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', placeholder = '' }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ─── Department Form ───
function DeptForm({ initial, departments, employees, onSave, onClose }: { initial?: R; departments: R[]; employees: R[]; onSave: (d: R) => void; onClose: () => void }) {
  const [f, setF] = useState({
    name: initial?.name || '', code: initial?.code || '',
    parent_id: initial?.parent_id || '', manager_id: initial?.manager_id || '',
    sort_order: String(initial?.sort_order ?? 0),
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!f.name.trim()) return alert('部门名称必填');
    setSaving(true);
    try {
      await onSave({ ...f, parent_id: f.parent_id || null, manager_id: f.manager_id || null, sort_order: Number(f.sort_order) });
    } finally { setSaving(false); }
  };

  // 排除自身及其子部门，防止循环引用
  const parentOptions = [{ value: '', label: '无（顶级部门）' },
    ...departments.filter(d => d.id !== initial?.id).map(d => ({ value: d.id, label: d.name }))];
  const managerOptions = [{ value: '', label: '暂无' },
    ...employees.map(e => ({ value: e.id, label: e.name }))];

  return (
    <div className="space-y-3">
      <Input label="部门名称 *" value={f.name} onChange={v => set('name', v)} />
      <Input label="部门编码" value={f.code} onChange={v => set('code', v)} placeholder="如 TECH-FE" />
      <Select label="上级部门" value={f.parent_id} onChange={v => set('parent_id', v)} options={parentOptions} />
      <Select label="部门经理" value={f.manager_id} onChange={v => set('manager_id', v)} options={managerOptions} />
      <Input label="排序" value={f.sort_order} onChange={v => set('sort_order', v)} type="number" />
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">取消</button>
        <button onClick={submit} disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
}

// ─── Position Form ───
function PosForm({ initial, departments, onSave, onClose }: { initial?: R; departments: R[]; onSave: (d: R) => void; onClose: () => void }) {
  const [f, setF] = useState({
    name: initial?.name || '', code: initial?.code || '',
    department_id: initial?.department_id || '', description: initial?.description || '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!f.name.trim()) return alert('职位名称必填');
    setSaving(true);
    try {
      await onSave({ ...f, department_id: f.department_id || null });
    } finally { setSaving(false); }
  };

  const deptOptions = [{ value: '', label: '通用（不限部门）' },
    ...departments.filter(d => d.is_active).map(d => ({ value: d.id, label: d.name }))];

  return (
    <div className="space-y-3">
      <Input label="职位名称 *" value={f.name} onChange={v => set('name', v)} />
      <Input label="职位编码" value={f.code} onChange={v => set('code', v)} placeholder="如 FE-ENG" />
      <Select label="所属部门" value={f.department_id} onChange={v => set('department_id', v)} options={deptOptions} />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">职位描述</label>
        <textarea value={f.description} onChange={e => set('description', e.target.value)} rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">取消</button>
        <button onClick={submit} disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
}

// ─── Job Level Form ───
function LevelForm({ initial, onSave, onClose }: { initial?: R; onSave: (d: R) => void; onClose: () => void }) {
  const [f, setF] = useState({
    name: initial?.name || '', code: initial?.code || '',
    track: initial?.track || 'professional', level: String(initial?.level ?? 1),
    salary_min: String(initial?.salary_min ?? ''), salary_max: String(initial?.salary_max ?? ''),
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!f.name.trim() || !f.code.trim()) return alert('名称和编码必填');
    setSaving(true);
    try {
      await onSave({
        ...f, level: Number(f.level),
        salary_min: f.salary_min ? Number(f.salary_min) : null,
        salary_max: f.salary_max ? Number(f.salary_max) : null,
      });
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-3">
      <Input label="职级名称 *" value={f.name} onChange={v => set('name', v)} placeholder="如 P6 高级工程师" />
      <Input label="职级编码 *" value={f.code} onChange={v => set('code', v)} placeholder="如 P6" />
      <Select label="序列" value={f.track} onChange={v => set('track', v)} options={[
        { value: 'professional', label: 'P — 专业序列' },
        { value: 'management', label: 'M — 管理序列' },
      ]} />
      <Input label="等级数值" value={f.level} onChange={v => set('level', v)} type="number" />
      <div className="grid grid-cols-2 gap-3">
        <Input label="薪资下限" value={f.salary_min} onChange={v => set('salary_min', v)} type="number" />
        <Input label="薪资上限" value={f.salary_max} onChange={v => set('salary_max', v)} type="number" />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">取消</button>
        <button onClick={submit} disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
}

// ─── Org Chart ───
function OrgChart({ departments, employees, positions, getManagerName }: { departments: R[]; employees: R[]; positions: R[]; getManagerName: (id: string) => string }) {
  // 构建树
  const roots = departments.filter(d => !d.parent_id && d.is_active);
  const childrenOf = (pid: string) => departments.filter(d => d.parent_id === pid && d.is_active);
  const membersOf = (did: string) => employees.filter(e => e.department_id === did);
  const posName = (pid: string) => positions.find(p => p.id === pid)?.name || '';

  const DeptNode = ({ dept, depth = 0 }: { dept: R; depth?: number }) => {
    const children = childrenOf(dept.id);
    const members = membersOf(dept.id);
    const manager = dept.manager_id ? employees.find(e => e.id === dept.manager_id) : null;

    return (
      <div className={depth > 0 ? 'ml-6 border-l-2 border-blue-100 pl-4' : ''}>
        <div className="bg-white rounded-xl shadow-sm p-4 mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏢</span>
              <h3 className="font-semibold text-gray-800">{String(dept.name)}</h3>
              {dept.code && <span className="text-xs font-mono text-gray-400">{String(dept.code)}</span>}
            </div>
            <span className="text-xs text-gray-400">{members.length} 人</span>
          </div>

          {manager && (
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
              <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-bold">{String(manager.name)[0]}</div>
              <div>
                <span className="text-sm font-medium text-gray-800">{String(manager.name)}</span>
                <span className="text-xs text-amber-600 ml-1.5">经理</span>
              </div>
            </div>
          )}

          {members.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {members.filter(m => m.id !== dept.manager_id).map((m: R) => (
                <div key={String(m.id)} className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[10px] font-bold">{String(m.name)[0]}</div>
                  <span className="text-xs text-gray-700">{String(m.name)}</span>
                  {(m.position_id || m.job_title) && <span className="text-[10px] text-gray-400">{posName(m.position_id) || String(m.job_title || '')}</span>}
                </div>
              ))}
            </div>
          )}
          {members.length === 0 && !manager && <p className="text-xs text-gray-400">暂无成员</p>}
        </div>

        {children.map(c => <DeptNode key={c.id} dept={c} depth={depth + 1} />)}
      </div>
    );
  };

  if (roots.length === 0) {
    return <div className="text-center py-16 text-gray-400"><p className="text-3xl mb-2">🗂️</p><p>暂无部门数据，请先在「部门管理」中创建部门</p></div>;
  }

  const unassigned = employees.filter(e => !e.department_id);

  return (
    <div className="space-y-3">
      {roots.map(d => <DeptNode key={d.id} dept={d} />)}
      {unassigned.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">👥</span>
            <h3 className="font-semibold text-gray-500">未分配部门</h3>
            <span className="text-xs text-gray-400">{unassigned.length} 人</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {unassigned.map((m: R) => (
              <div key={String(m.id)} className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5">
                <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-[10px] font-bold">{String(m.name)[0]}</div>
                <span className="text-xs text-gray-700">{String(m.name)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main ───
export default function OrgClient({ departments, positions, jobLevels, employees }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>('chart');
  const [modal, setModal] = useState<{ action: 'add' | 'edit'; data?: R } | null>(null);

  const save = async (table: string, data: R, editId?: string) => {
    if (editId) {
      await api('PATCH', { table, id: editId, ...data });
    } else {
      await api('POST', { table, ...data });
    }
    setModal(null);
    router.refresh();
  };

  const toggleActive = async (table: string, id: string, current: boolean) => {
    await api('PATCH', { table, id, is_active: !current });
    router.refresh();
  };

  const del = async (table: string, id: string, label: string) => {
    if (!confirm(`确认删除「${label}」？`)) return;
    try {
      await api('DELETE', { table, id });
      router.refresh();
    } catch (e: any) {
      alert('删除失败: ' + e.message);
    }
  };

  // 构建部门树形缩进
  const deptMap = new Map(departments.map(d => [d.id, d]));
  const getDepth = (d: R): number => d.parent_id && deptMap.has(d.parent_id) ? getDepth(deptMap.get(d.parent_id)!) + 1 : 0;
  const getParentName = (pid: string) => deptMap.get(pid)?.name || '-';
  const getManagerName = (mid: string) => employees.find(e => e.id === mid)?.name || '-';
  const getDeptName = (did: string) => deptMap.get(did)?.name || '通用';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/employees" className="text-gray-400 hover:text-gray-600 text-sm">← 返回员工管理</Link>
          <h1 className="text-lg font-bold text-gray-800">组织架构管理</h1>
        </div>
        {tab !== 'chart' && <button onClick={() => setModal({ action: 'add' })}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
          + 新增{tab === 'departments' ? '部门' : tab === 'positions' ? '职位' : '职级'}
        </button>}
      </header>

      <div className="bg-white border-b overflow-x-auto">
        <div className="flex px-4 md:px-8 gap-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setModal(null); }}
              className={`px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${tab === t.key ? 'border-blue-600 text-blue-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-8">
        {/* ── 架构图 ── */}
        {tab === 'chart' && (
          <OrgChart departments={departments} employees={employees} positions={positions} getManagerName={getManagerName} />
        )}

        {/* ── 部门 ── */}
        {tab === 'departments' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {departments.length === 0 ? (
              <div className="text-center py-16 text-gray-400"><p className="text-3xl mb-2">🏢</p><p>暂无部门，点击右上角新增</p></div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">部门名称</th>
                    <th className="px-4 py-3 font-medium">编码</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">上级部门</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">经理</th>
                    <th className="px-4 py-3 font-medium">状态</th>
                    <th className="px-4 py-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {departments.map(d => (
                    <tr key={d.id} className={d.is_active ? '' : 'opacity-50'}>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        <span style={{ paddingLeft: `${getDepth(d) * 20}px` }}>{getDepth(d) > 0 ? '└ ' : ''}{d.name}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{d.code || '-'}</td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{d.parent_id ? getParentName(d.parent_id) : '-'}</td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{d.manager_id ? getManagerName(d.manager_id) : '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs ${d.is_active ? 'text-green-600' : 'text-gray-400'}`}>{d.is_active ? '启用' : '停用'}</span>
                      </td>
                      <td className="px-4 py-3 space-x-2">
                        <button onClick={() => setModal({ action: 'edit', data: d })} className="text-xs text-blue-600 hover:underline">编辑</button>
                        <button onClick={() => toggleActive('departments', d.id, d.is_active)} className="text-xs text-gray-500 hover:underline">{d.is_active ? '停用' : '启用'}</button>
                        <button onClick={() => del('departments', d.id, d.name)} className="text-xs text-red-500 hover:underline">删除</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── 职位 ── */}
        {tab === 'positions' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {positions.length === 0 ? (
              <div className="text-center py-16 text-gray-400"><p className="text-3xl mb-2">💼</p><p>暂无职位，点击右上角新增</p></div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">职位名称</th>
                    <th className="px-4 py-3 font-medium">编码</th>
                    <th className="px-4 py-3 font-medium">所属部门</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">描述</th>
                    <th className="px-4 py-3 font-medium">状态</th>
                    <th className="px-4 py-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {positions.map(p => (
                    <tr key={p.id} className={p.is_active ? '' : 'opacity-50'}>
                      <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.code || '-'}</td>
                      <td className="px-4 py-3 text-gray-500">{p.department_id ? getDeptName(p.department_id) : '通用'}</td>
                      <td className="px-4 py-3 text-gray-400 hidden md:table-cell max-w-[200px] truncate">{p.description || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs ${p.is_active ? 'text-green-600' : 'text-gray-400'}`}>{p.is_active ? '启用' : '停用'}</span>
                      </td>
                      <td className="px-4 py-3 space-x-2">
                        <button onClick={() => setModal({ action: 'edit', data: p })} className="text-xs text-blue-600 hover:underline">编辑</button>
                        <button onClick={() => toggleActive('positions', p.id, p.is_active)} className="text-xs text-gray-500 hover:underline">{p.is_active ? '停用' : '启用'}</button>
                        <button onClick={() => del('positions', p.id, p.name)} className="text-xs text-red-500 hover:underline">删除</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── 职级 ── */}
        {tab === 'job_levels' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {jobLevels.length === 0 ? (
              <div className="text-center py-16 text-gray-400"><p className="text-3xl mb-2">📊</p><p>暂无职级，点击右上角新增</p></div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">职级名称</th>
                    <th className="px-4 py-3 font-medium">编码</th>
                    <th className="px-4 py-3 font-medium">序列</th>
                    <th className="px-4 py-3 font-medium">等级</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">薪资范围</th>
                    <th className="px-4 py-3 font-medium">状态</th>
                    <th className="px-4 py-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {jobLevels.map(l => (
                    <tr key={l.id} className={l.is_active ? '' : 'opacity-50'}>
                      <td className="px-4 py-3 font-medium text-gray-800">{l.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{l.code}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${l.track === 'management' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {l.track === 'management' ? 'M 管理' : 'P 专业'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{l.level}</td>
                      <td className="px-4 py-3 text-gray-400 hidden md:table-cell">
                        {l.salary_min || l.salary_max
                          ? `¥${(l.salary_min || 0).toLocaleString()} ~ ¥${(l.salary_max || 0).toLocaleString()}`
                          : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs ${l.is_active ? 'text-green-600' : 'text-gray-400'}`}>{l.is_active ? '启用' : '停用'}</span>
                      </td>
                      <td className="px-4 py-3 space-x-2">
                        <button onClick={() => setModal({ action: 'edit', data: l })} className="text-xs text-blue-600 hover:underline">编辑</button>
                        <button onClick={() => toggleActive('job_levels', l.id, l.is_active)} className="text-xs text-gray-500 hover:underline">{l.is_active ? '停用' : '启用'}</button>
                        <button onClick={() => del('job_levels', l.id, l.name)} className="text-xs text-red-500 hover:underline">删除</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {modal && tab === 'departments' && (
        <Modal title={modal.action === 'edit' ? '编辑部门' : '新增部门'} onClose={() => setModal(null)}>
          <DeptForm initial={modal.data} departments={departments} employees={employees}
            onSave={d => save('departments', d, modal.data?.id)} onClose={() => setModal(null)} />
        </Modal>
      )}
      {modal && tab === 'positions' && (
        <Modal title={modal.action === 'edit' ? '编辑职位' : '新增职位'} onClose={() => setModal(null)}>
          <PosForm initial={modal.data} departments={departments}
            onSave={d => save('positions', d, modal.data?.id)} onClose={() => setModal(null)} />
        </Modal>
      )}
      {modal && tab === 'job_levels' && (
        <Modal title={modal.action === 'edit' ? '编辑职级' : '新增职级'} onClose={() => setModal(null)}>
          <LevelForm initial={modal.data}
            onSave={d => save('job_levels', d, modal.data?.id)} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}
