'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

type R = Record<string, any>;

export default function KnowledgeClient() {
  const [categories, setCategories] = useState<R[]>([]);
  const [docs, setDocs] = useState<R[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
  const [selCat, setSelCat] = useState<string>('');
  const [editing, setEditing] = useState<R | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [versionDocId, setVersionDocId] = useState<string | null>(null);
  const [versions, setVersions] = useState<R[]>([]);

  const loadCats = () => fetch('/api/admin/knowledge?action=categories').then(r => r.json()).then(setCategories);

  const loadDocs = useCallback((page = 1) => {
    setLoading(true);
    setError(null);
    const url = `/api/admin/knowledge?page=${page}${selCat ? `&categoryId=${selCat}` : ''}`;
    fetch(url).then(r => r.json()).then(res => {
      if (res.error) { setError(res.error); return; }
      setDocs(res.docs || []);
      setPagination(res.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 1 });
    }).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [selCat]);

  useEffect(() => { loadCats(); }, []);
  useEffect(() => { loadDocs(1); }, [loadDocs]);

  const save = async () => {
    if (!editing?.title?.trim() || !editing?.content?.trim()) return;
    setSaving(true);
    setError(null);
    const res = await fetch('/api/admin/knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: editing.id ? 'update' : 'create',
        id: editing.id,
        title: editing.title,
        content: editing.content,
        categoryId: editing.category_id || null,
      }),
    });
    const result = await res.json();
    setSaving(false);
    if (!res.ok) { setError(result.error); return; }
    setEditing(null);
    loadDocs(pagination.page);
  };

  const del = async (id: string) => {
    if (!confirm('确定删除？切片和版本记录将一并删除。')) return;
    setError(null);
    const res = await fetch('/api/admin/knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    });
    const result = await res.json();
    if (!res.ok) { setError(result.error); return; }
    loadDocs(pagination.page);
  };

  const archive = async (id: string) => {
    const res = await fetch('/api/admin/knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'archive', id }),
    });
    if (res.ok) loadDocs(pagination.page);
  };

  const loadVersions = async (docId: string) => {
    setVersionDocId(docId);
    const res = await fetch(`/api/admin/knowledge?action=versions&docId=${docId}`);
    const data = await res.json();
    setVersions(data || []);
  };

  // ── 版本历史视图 ──
  if (versionDocId) {
    const doc = docs.find(d => d.id === versionDocId);
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setVersionDocId(null)} className="text-gray-400 hover:text-gray-600 text-sm">← 返回</button>
            <h1 className="text-lg font-bold text-gray-800">📋 版本历史</h1>
            {doc && <span className="text-sm text-gray-500">《{doc.title}》</span>}
          </div>
        </header>
        <div className="max-w-2xl mx-auto p-4 md:p-8">
          {versions.length === 0 ? (
            <p className="text-center text-gray-400 py-8">暂无版本记录</p>
          ) : (
            <div className="space-y-3">
              {versions.map(v => (
                <div key={v.version} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-gray-800">v{v.version}</span>
                    <span className="ml-3 text-xs text-gray-400">{new Date(v.created_at).toLocaleDateString('zh-CN')}</span>
                  </div>
                  <span className="text-xs text-gray-400">{v.updated_by}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── 编辑视图 ──
  if (editing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600 text-sm">← 返回</button>
            <h1 className="text-lg font-bold text-gray-800">{editing.id ? '编辑文档' : '新建文档'}</h1>
          </div>
          <button onClick={save} disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? '保存中...' : '保存并向量化'}
          </button>
        </header>
        <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-4">
          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg">{error}</div>}
          <input value={editing.title || ''} onChange={e => setEditing({ ...editing, title: e.target.value })}
            placeholder="文档标题，如《员工手册》"
            className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
          <select value={editing.category_id || ''} onChange={e => setEditing({ ...editing, category_id: e.target.value || null })}
            className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30">
            <option value="">未分类</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
          <textarea value={editing.content || ''} onChange={e => setEditing({ ...editing, content: e.target.value })}
            rows={20} placeholder="粘贴文档全文内容..."
            className="w-full px-4 py-3 border rounded-xl text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-y" />
          <p className="text-xs text-gray-400">保存后系统自动按段落切片（~400字/片），调用 Embedding 生成向量索引。</p>
        </div>
      </div>
    );
  }

  // ── 列表视图 ──
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← 返回</Link>
          <h1 className="text-lg font-bold text-gray-800">📚 知识库管理</h1>
          <span className="text-xs text-gray-400">{pagination.total} 篇文档</span>
        </div>
        <button onClick={() => setEditing({ title: '', content: '', category_id: selCat || null })}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">+ 新建文档</button>
      </header>

      {/* 分类筛选 */}
      <div className="bg-white border-b overflow-x-auto">
        <div className="flex px-4 md:px-8 gap-1">
          <button onClick={() => { setSelCat(''); setPagination(p => ({ ...p, page: 1 })); }}
            className={`px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${!selCat ? 'border-blue-600 text-blue-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            全部
          </button>
          {categories.map(c => (
            <button key={c.id} onClick={() => { setSelCat(c.id); setPagination(p => ({ ...p, page: 1 })); }}
              className={`px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${selCat === c.id ? 'border-blue-600 text-blue-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {c.icon} {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 md:p-8">
        {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

        {loading ? (
          <div className="text-center py-16 text-gray-400">加载中...</div>
        ) : docs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-3xl mb-2">📚</p>
            <p>暂无文档，点击右上角新建</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {docs.map(doc => {
                const cat = categories.find(c => c.id === doc.category_id);
                return (
                  <div key={doc.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-800">{doc.title}</span>
                        {cat && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{cat.icon} {cat.name}</span>}
                        <span className="text-xs text-gray-400">v{doc.version}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 truncate">{doc.content?.slice(0, 80)}...</p>
                      <p className="text-xs text-gray-300 mt-0.5">{new Date(doc.updated_at).toLocaleDateString('zh-CN')}</p>
                    </div>
                    <div className="flex gap-1 ml-3 shrink-0">
                      <button onClick={() => loadVersions(doc.id)} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-50">版本</button>
                      <button onClick={() => setEditing(doc)} className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50">编辑</button>
                      <button onClick={() => archive(doc.id)} className="text-xs text-yellow-600 hover:text-yellow-800 px-2 py-1 rounded hover:bg-yellow-50">归档</button>
                      <button onClick={() => del(doc.id)} className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50">删除</button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 分页 */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button disabled={pagination.page <= 1}
                  onClick={() => loadDocs(pagination.page - 1)}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-40 hover:bg-gray-50">上一页</button>
                <span className="text-sm text-gray-500">{pagination.page} / {pagination.totalPages}</span>
                <button disabled={pagination.page >= pagination.totalPages}
                  onClick={() => loadDocs(pagination.page + 1)}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-40 hover:bg-gray-50">下一页</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
