'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// ---- Shared types ----
export type R = Record<string, unknown>;

// ---- Reusable components ----
export function Field({ label, value }: { label: string; value: unknown }) {
  return <div><dt className="text-xs text-gray-500 mb-0.5">{label}</dt><dd className="text-sm text-gray-800">{String(value || '') || '-'}</dd></div>;
}

export function EditField({ label, name, value, type, onChange, options }: {
  label: string; name: string; value: string; type?: string;
  onChange: (n: string, v: string) => void; options?: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-0.5">{label}</label>
      {options ? (
        <select value={value} onChange={e => onChange(name, e.target.value)}
          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea value={value} onChange={e => onChange(name, e.target.value)} rows={2}
          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      ) : (
        <input type={type || 'text'} value={value} onChange={e => onChange(name, e.target.value)}
          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      )}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    open: 'bg-yellow-100 text-yellow-700', in_progress: 'bg-blue-100 text-blue-700',
    resolved: 'bg-green-100 text-green-700', closed: 'bg-gray-100 text-gray-500',
    pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700', paid: 'bg-emerald-100 text-emerald-700',
  };
  const labels: Record<string, string> = {
    open: '待处理', in_progress: '处理中', resolved: '已解决', closed: '已关闭',
    pending: '待审批', approved: '已批准', rejected: '已拒绝', paid: '已打款',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs ${colors[status] || 'bg-gray-100'}`}>{labels[status] || status}</span>;
}

export function SectionHeader({ title, isAdmin, onAdd }: { title: string; isAdmin: boolean; onAdd?: () => void }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-semibold text-gray-800">{title}</h2>
      {isAdmin && onAdd && <button onClick={onAdd} className="text-sm text-blue-600 hover:underline">+ 新增</button>}
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-gray-400 text-center py-8">{text}</p>;
}

// ---- Modal for adding/editing records ----
export function RecordModal({ title, fields, initial, onSave, onClose }: {
  title: string;
  fields: { name: string; label: string; type?: string; options?: { value: string; label: string }[] }[];
  initial: Record<string, string>;
  onSave: (data: Record<string, string>) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Record<string, string>>(initial);
  const [saving, setSaving] = useState(false);
  const onChange = (n: string, v: string) => setForm(f => ({ ...f, [n]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <h3 className="font-semibold text-gray-800 mb-4">{title}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          {fields.map(f => (
            <EditField key={f.name} label={f.label} name={f.name} value={form[f.name] || ''} type={f.type} options={f.options} onChange={onChange} />
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">取消</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---- API helper ----
export async function apiRecord(method: string, body: Record<string, unknown>) {
  const res = await fetch('/api/admin/records', {
    method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  return res.json();
}

export async function apiProfile(body: Record<string, unknown>) {
  const res = await fetch('/api/admin/employees/update', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json.error || '保存失败');
  return json;
}
