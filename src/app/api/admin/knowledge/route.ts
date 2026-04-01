import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import { createOpenAI } from '@ai-sdk/openai';
import { embed } from 'ai';
import { NextRequest } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

const volcengine = createOpenAI({
  apiKey: process.env.VOLCENGINE_API_KEY || '',
  baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
});

const MAX_TITLE_LEN = 100;
const MAX_CONTENT_LEN = 50000;
const MAX_CHUNKS = 50;

// 检测文档内容是否包含 prompt 注入指令
const CONTENT_INJECTION_PATTERNS = [
  /忽略.{0,10}(之前|所有|全部).{0,10}(指令|规则)/,
  /ignore.{0,15}(previous|all).{0,15}instructions?/i,
  /you are now/i, /你现在是/,
  /system\s*prompt/i,
];

function hasContentInjection(text: string): boolean {
  return CONTENT_INJECTION_PATTERNS.some(p => p.test(text));
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  return data?.role === 'admin' ? user : null;
}

// 文本切片：按段落切，每片 ~500 字
function chunkText(text: string, maxLen = 500): string[] {
  const paragraphs = text.split(/\n{2,}/);
  const chunks: string[] = [];
  let buf = '';
  for (const p of paragraphs) {
    if (buf.length + p.length > maxLen && buf) {
      chunks.push(buf.trim());
      buf = '';
    }
    buf += p + '\n\n';
  }
  if (buf.trim()) chunks.push(buf.trim());
  return chunks.length ? chunks : [text.slice(0, maxLen)];
}

// 向量化切片并写入
async function embedChunks(docId: string, chunks: string[]) {
  const embedModelId = process.env.VOLCENGINE_EMBEDDING_MODEL_ID;
  if (!embedModelId || !supabaseAdmin) return;

  // 删除旧切片
  await supabaseAdmin.from('knowledge_chunks').delete().eq('doc_id', docId);

  for (let i = 0; i < chunks.length; i++) {
    try {
      const { embedding } = await embed({ model: volcengine.textEmbeddingModel(embedModelId), value: chunks[i] });
      await supabaseAdmin.from('knowledge_chunks').insert({
        doc_id: docId, chunk_index: i, content: chunks[i], embedding,
      });
    } catch (e) {
      // embedding 失败时仍保存文本，不存向量
      await supabaseAdmin.from('knowledge_chunks').insert({
        doc_id: docId, chunk_index: i, content: chunks[i],
      });
    }
  }
}

// GET: 列表
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return new Response('无权限', { status: 403 });

  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  if (action === 'categories') {
    const { data } = await supabaseAdmin!.from('knowledge_categories').select('*').order('sort_order');
    return Response.json(data || []);
  }

  if (action === 'versions' && searchParams.get('docId')) {
    const { data } = await supabaseAdmin!.from('knowledge_versions').select('version, updated_by, created_at').eq('doc_id', searchParams.get('docId')!).order('version', { ascending: false });
    return Response.json(data || []);
  }

  // 默认：文档列表
  const categoryId = searchParams.get('categoryId');
  let query = supabaseAdmin!.from('knowledge_docs').select('id, title, category_id, version, status, updated_at, content');
  if (categoryId) query = query.eq('category_id', categoryId);
  const { data } = await query.order('updated_at', { ascending: false });
  return Response.json(data || []);
}

// POST: 创建/更新/删除
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return new Response('无权限', { status: 403 });

  const { ok } = rateLimit(`knowledge:${admin.id}`, 10, 60000);
  if (!ok) return Response.json({ error: '操作过于频繁，请稍后再试' }, { status: 429 });

  const body = await req.json();

  // 创建文档
  if (body.action === 'create') {
    const title = String(body.title || '').trim().slice(0, MAX_TITLE_LEN);
    const content = String(body.content || '').trim().slice(0, MAX_CONTENT_LEN);
    if (!title || !content) return Response.json({ error: '标题和内容不能为空' }, { status: 400 });
    if (hasContentInjection(content)) return Response.json({ error: '文档内容包含可疑指令文本，请检查后重新提交' }, { status: 400 });
    const { data: doc } = await supabaseAdmin!.from('knowledge_docs').insert({
      title, content, category_id: body.categoryId || null, updated_by: admin.id,
    }).select('id').single();
    if (doc) {
      const chunks = chunkText(content).slice(0, MAX_CHUNKS);
      await embedChunks(doc.id, chunks);
      await supabaseAdmin!.from('knowledge_versions').insert({ doc_id: doc.id, version: 1, content, updated_by: admin.id });
    }
    return Response.json(doc || { error: '创建失败' });
  }

  // 更新文档
  if (body.action === 'update' && body.id) {
    const title = String(body.title || '').trim().slice(0, MAX_TITLE_LEN);
    const content = String(body.content || '').trim().slice(0, MAX_CONTENT_LEN);
    if (!title || !content) return Response.json({ error: '标题和内容不能为空' }, { status: 400 });
    if (hasContentInjection(content)) return Response.json({ error: '文档内容包含可疑指令文本，请检查后重新提交' }, { status: 400 });
    const { data: old } = await supabaseAdmin!.from('knowledge_docs').select('version').eq('id', body.id).single();
    const newVersion = (old?.version || 0) + 1;
    await supabaseAdmin!.from('knowledge_docs').update({
      title, content, category_id: body.categoryId, version: newVersion, updated_by: admin.id,
    }).eq('id', body.id);
    const chunks = chunkText(content).slice(0, MAX_CHUNKS);
    await embedChunks(body.id, chunks);
    await supabaseAdmin!.from('knowledge_versions').insert({ doc_id: body.id, version: newVersion, content, updated_by: admin.id });
    return Response.json({ ok: true, version: newVersion });
  }

  // 删除文档
  if (body.action === 'delete' && body.id) {
    await supabaseAdmin!.from('knowledge_docs').delete().eq('id', body.id);
    return Response.json({ ok: true });
  }

  // 归档
  if (body.action === 'archive' && body.id) {
    await supabaseAdmin!.from('knowledge_docs').update({ status: 'archived' }).eq('id', body.id);
    return Response.json({ ok: true });
  }

  return Response.json({ error: '未知操作' }, { status: 400 });
}
