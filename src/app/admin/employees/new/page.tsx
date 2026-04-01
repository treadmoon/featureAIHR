'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewEmployeePage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee', department: '', job_title: '', phone: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const res = await fetch('/api/admin/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || '创建失败');
      setLoading(false);
    } else {
      setSuccess(`员工 ${form.name} 创建成功！账号: ${form.email}`);
      setLoading(false);
      setTimeout(() => router.push('/admin/employees'), 1500);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 md:px-8 py-4">
        <Link href="/admin/employees" className="text-gray-400 hover:text-gray-600 text-sm">← 返回列表</Link>
        <h1 className="text-lg font-bold text-gray-800 mt-1">录入新员工</h1>
      </header>

      <div className="max-w-lg mx-auto p-4 md:p-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
              <input required value={form.name} onChange={e => set('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">角色 *</label>
              <select value={form.role} onChange={e => set('role', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="employee">员工</option>
                <option value="admin">管理员</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">邮箱（登录账号）*</label>
            <input type="email" required value={form.email} onChange={e => set('email', e.target.value)}
              placeholder="employee@company.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">初始密码 *</label>
            <input type="password" required minLength={6} value={form.password} onChange={e => set('password', e.target.value)}
              placeholder="至少6位"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">部门</label>
              <input value={form.department} onChange={e => set('department', e.target.value)}
                placeholder="如：技术部"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">职位</label>
              <input value={form.job_title} onChange={e => set('job_title', e.target.value)}
                placeholder="如：前端工程师"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
            <input value={form.phone} onChange={e => set('phone', e.target.value)}
              placeholder="可选"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          {success && <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">{success}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {loading ? '创建中...' : '创建员工账号'}
          </button>
        </form>
      </div>
    </div>
  );
}
