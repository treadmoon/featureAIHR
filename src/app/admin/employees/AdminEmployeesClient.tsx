'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Employee = {
  id: string;
  name: string;
  role: string;
  department: string;
  job_title: string;
  phone: string;
  is_active: boolean;
  created_at: string;
};

export default function AdminEmployeesClient({ employees }: { employees: Employee[] }) {
  const router = useRouter();
  const [toggling, setToggling] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 600);
  };

  const toggleActive = async (id: string, current: boolean) => {
    setToggling(id);
    await fetch('/api/admin/employees', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !current }),
    });
    setToggling(null);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← 返回聊天</Link>
          <h1 className="text-lg font-bold text-gray-800">员工管理</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/org" className="px-3 py-2 text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">🏢 组织架构</Link>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="刷新数据"
          >
            <span className={refreshing ? 'inline-block animate-spin' : ''}>↻</span> {refreshing ? '刷新中…' : '刷新'}
          </button>
          <Link
            href="/admin/employees/new"
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            + 录入员工
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 md:p-8">
        {employees.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">👥</p>
            <p>暂无员工，点击右上角录入</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">姓名</th>
                  <th className="px-4 py-3 font-medium">角色</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">部门</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">职位</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                  <th className="px-4 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employees.map(emp => (
                  <tr key={emp.id} className={emp.is_active ? '' : 'opacity-50'}>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      <button onClick={() => router.push(`/admin/employees/${emp.id}`)} className="text-blue-600 hover:text-blue-800 hover:underline text-left">
                        {emp.name} <span className="text-xs text-gray-400 ml-1">查看 →</span>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        emp.role === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {emp.role === 'admin' ? '管理员' : '员工'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{emp.department || '-'}</td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{emp.job_title || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs ${emp.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                        {emp.is_active ? '在职' : '已禁用'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(emp.id, emp.is_active)}
                        disabled={toggling === emp.id}
                        className="text-xs text-gray-500 hover:text-gray-800 disabled:opacity-50"
                      >
                        {toggling === emp.id ? '...' : emp.is_active ? '禁用' : '启用'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
