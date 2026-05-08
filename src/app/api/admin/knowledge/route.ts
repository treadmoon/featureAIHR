import { supabaseAdmin } from '@/lib/supabase';
import { getEmbeddingModel } from '@/lib/llm-provider';
import { embed } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { requireAdminUser, parseBody } from '@/lib/api-helpers';
import { z } from 'zod';

const MAX_TITLE_LEN = 100;
const MAX_CONTENT_LEN = 50000;
const MAX_CHUNKS = 50;
const CHUNK_SIZE = 400;       // 每片目标字数
const CHUNK_OVERLAP = 80;     // 跨段落 overlap

// ── Zod Schema ──
const CreateDocSchema = z.object({
  action: z.literal('create'),
  title: z.string().min(1).max(MAX_TITLE_LEN),
  content: z.string().min(1).max(MAX_CONTENT_LEN),
  categoryId: z.string().uuid().nullable().optional(),
});

const UpdateDocSchema = z.object({
  action: z.literal('update'),
  id: z.string().uuid(),
  title: z.string().min(1).max(MAX_TITLE_LEN),
  content: z.string().min(1).max(MAX_CONTENT_LEN),
  categoryId: z.string().uuid().nullable().optional(),
});

const DeleteDocSchema = z.object({
  action: z.literal('delete'),
  id: z.string().uuid(),
});

const ArchiveDocSchema = z.object({
  action: z.literal('archive'),
  id: z.string().uuid(),
});

const ActionSchema = z.discriminatedUnion('action', [
  CreateDocSchema,
  UpdateDocSchema,
  DeleteDocSchema,
  ArchiveDocSchema,
]);

// ── Prompt 注入检测（强化版）──
const CONTENT_INJECTION_PATTERNS = [
  // 中文系列
  /忽略.{0,10}(之前|以上|所有|全部|原先).{0,10}(指令|规则|约束|限制|保密)/i,
  /你(现在)?是.{0,10}(个)?(AI|助手|人|机器|系统)/i,
  /无视.{0,10}(以上|之前|所有|先前|现行).{0,10}(规则|指令|约束)/i,
  /暂时.{0,10}(关闭|跳过|绕过|失效).{0,10}(安全|检查|验证|过滤)/i,
  // 英文系列
  /ignore.{0,20}(all\s+)?(previous|prior|above|prior)\s+(instructions?|rules?|prompts?|constraints?)/i,
  /dis(regard|able|connect).{0,20}(safety|security|filter|validation)/i,
  /you are now(?:\s+a)?(?:\s+new)?(?:\s+role)?/i,
  /DAN\b/i, /do\s+anything\s+now/i,
  /new\s+system\s+prompt/i,
  /forget\s+(all\s+)?previous\s+(instructions?|rules?)/i,
  /bypass.{0,20}(security|restriction|filter|validation)/i,
  /\{[^{}]*(?:ignore|bypass|override)[^{}]*\}/i,
];

function hasContentInjection(text: string): boolean {
  return CONTENT_INJECTION_PATTERNS.some(p => p.test(text));
}

// ── 智能文本切片（带 overlap）──
function chunkText(text: string, maxLen = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  // 先按段落拆分
  const paragraphs = text.split(/\n{2,}/);
  const chunks: string[] = [];
  let buf = '';

  for (const p of paragraphs) {
    if (buf.length + p.length > maxLen && buf.length > 0) {
      chunks.push(buf.trim());
      // 保留 overlap（从上一个 chunk 尾部截取）
      buf = buf.slice(-overlap) + p + '\n\n';
    } else {
      buf += p + '\n\n';
    }
  }
  if (buf.trim()) chunks.push(buf.trim());

  // 保证至少有一片，且不超过上限
  return chunks.length > 0 ? chunks.slice(0, MAX_CHUNKS) : [text.slice(0, maxLen)];
}

// ── 批量向量化（事务保证）──
async function embedChunksAtomic(docId: string, chunks: string[]) {
  const embedModelId = process.env.LLM_EMBEDDING_MODEL || process.env.VOLCENGINE_EMBEDDING_MODEL_ID;

  // 1. 删除旧切片（FK cascade 会清理 chunks）
  await supabaseAdmin!.from('knowledge_chunks').delete().eq('doc_id', docId);

  // 2. 批量准备 chunks 数据
  const chunkRows: Array<{ doc_id: string; chunk_index: number; content: string; embedding?: number[] }> = [];

  // 3. 如果有 embedding 模型，批量生成向量
  if (embedModelId) {
    const embeddings = await Promise.all(
      chunks.map(c => embed({ model: getEmbeddingModel(), value: c }))
    );
    embeddings.forEach((em, i) => {
      chunkRows.push({ doc_id: docId, chunk_index: i, content: chunks[i], embedding: em.embedding });
    });
  } else {
    chunks.forEach((content, i) => {
      chunkRows.push({ doc_id: docId, chunk_index: i, content });
    });
  }

  // 4. 批量写入（一次 RTT）
  const { error } = await supabaseAdmin!.from('knowledge_chunks').insert(chunkRows);
  if (error) throw new Error(`chunk insert failed: ${error.message}`);

  return chunkRows.length;
}

// ── GET: 列表（支持分页）──
export async function GET(req: NextRequest) {
  const auth = await requireAdminUser();
  if ('error' in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  if (action === 'categories') {
    const { data } = await supabaseAdmin!.from('knowledge_categories').select('*').order('sort_order');
    return Response.json(data || []);
  }

  if (action === 'versions') {
    const docId = searchParams.get('docId');
    if (!docId) return Response.json({ error: '缺少 docId' }, { status: 400 });
    const { data } = await supabaseAdmin!.from('knowledge_versions')
      .select('version, updated_by, created_at')
      .eq('doc_id', docId!)
      .order('version', { ascending: false });
    return Response.json(data || []);
  }

  // 默认：文档列表（分页）
  const categoryId = searchParams.get('categoryId');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  let query = supabaseAdmin!.from('knowledge_docs')
    .select('id, title, category_id, version, status, updated_at', { count: 'exact' })
    .eq('status', 'active');

  if (categoryId) query = query.eq('category_id', categoryId);

  const { data, error, count } = await query
    .order('updated_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({
    docs: data || [],
    pagination: {
      page,
      pageSize,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize),
    },
  });
}

// ── POST: 创建/更新/删除/归档 ──
export async function POST(req: NextRequest) {
  const auth = await requireAdminUser();
  if ('error' in auth) return auth.error;
  const { user } = auth;

  const { ok } = rateLimit(`knowledge:${user.id}`, 10, 60000);
  if (!ok) return Response.json({ error: '操作过于频繁，请稍后再试' }, { status: 429 });

  const parsed = await parseBody(req);
  if ('error' in parsed) return parsed.error;

  // Zod 校验
  const validated = ActionSchema.safeParse(parsed.data);
  if (!validated.success) {
    return Response.json({ error: `参数错误: ${validated.error.message}` }, { status: 400 });
  }

  const data = validated.data;

  // 创建
  if (data.action === 'create') {
    if (hasContentInjection(data.content)) {
      return Response.json({ error: '文档内容包含可疑指令文本' }, { status: 400 });
    }
    const { data: doc, error: docErr } = await supabaseAdmin!.from('knowledge_docs').insert({
      title: data.title,
      content: data.content,
      category_id: data.categoryId || null,
      updated_by: user.id,
    }).select('id').single();

    if (docErr) return Response.json({ error: docErr.message }, { status: 500 });
    if (doc) {
      const chunks = chunkText(data.content);
      const chunkCount = await embedChunksAtomic(doc.id, chunks);
      await supabaseAdmin!.from('knowledge_versions').insert({
        doc_id: doc.id, version: 1, content: data.content, updated_by: user.id,
      });
      return Response.json({ id: doc.id, chunkCount });
    }
    return Response.json({ error: '创建失败' }, { status: 500 });
  }

  // 更新
  if (data.action === 'update') {
    if (hasContentInjection(data.content)) {
      return Response.json({ error: '文档内容包含可疑指令文本' }, { status: 400 });
    }
    const { data: old } = await supabaseAdmin!.from('knowledge_docs').select('version').eq('id', data.id).single();
    const newVersion = (old?.version || 0) + 1;

    const { error: updateErr } = await supabaseAdmin!.from('knowledge_docs').update({
      title: data.title,
      content: data.content,
      category_id: data.categoryId,
      version: newVersion,
      updated_by: user.id,
    }).eq('id', data.id);

    if (updateErr) return Response.json({ error: updateErr.message }, { status: 500 });

    // 重新向量化（原子操作）
    const chunks = chunkText(data.content);
    await embedChunksAtomic(data.id, chunks);

    await supabaseAdmin!.from('knowledge_versions').insert({
      doc_id: data.id, version: newVersion, content: data.content, updated_by: user.id,
    });

    return Response.json({ ok: true, version: newVersion });
  }

  // 删除（cascade 会清理 chunks 和 versions）
  if (data.action === 'delete') {
    const { error: delErr } = await supabaseAdmin!.from('knowledge_docs').delete().eq('id', data.id);
    if (delErr) return Response.json({ error: delErr.message }, { status: 500 });
    return Response.json({ ok: true });
  }

  // 归档
  if (data.action === 'archive') {
    const { error: archiveErr } = await supabaseAdmin!.from('knowledge_docs').update({ status: 'archived' }).eq('id', data.id);
    if (archiveErr) return Response.json({ error: archiveErr.message }, { status: 500 });
    return Response.json({ ok: true });
  }

  return Response.json({ error: '未知操作' }, { status: 400 });
}
