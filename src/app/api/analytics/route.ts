import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth-permissions';

// POST: 批量写入埋点事件
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let body: any;
  try {
    const text = await req.text();
    body = JSON.parse(text);
  } catch { return Response.json({ ok: true }); }

  const events = body?.events;
  if (!Array.isArray(events) || !events.length) return Response.json({ ok: true });

  const rows = events.slice(0, 50).map((e: any) => ({
    user_id: user?.id || null,
    event_type: String(e.event_type || 'unknown').slice(0, 50),
    event_name: String(e.event_name || '').slice(0, 200),
    metadata: e.metadata || {},
  }));

  if (supabaseAdmin) {
    await supabaseAdmin.from('analytics_events').insert(rows);
  }

  return Response.json({ ok: true });
}

// GET: 查询统计（管理员）+ AI 分析
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('未登录', { status: 401 });
  try {
    await requireAdmin(supabase, user.id);
  } catch (e: any) {
    return new Response(e.message || '无权限', { status: e.status || 403 });
  }
  if (!supabaseAdmin) return Response.json({});

  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  const days = parseInt(searchParams.get('days') || '7');
  const since = new Date(Date.now() - days * 86400000).toISOString();

  if (action === 'summary') {
    const [eventsRes, errorsRes, slowRes, featuresRes] = await Promise.all([
      supabaseAdmin.from('analytics_events').select('id', { count: 'exact', head: true }).gte('created_at', since),
      supabaseAdmin.from('analytics_events').select('event_name, metadata').eq('event_type', 'error').gte('created_at', since).order('created_at', { ascending: false }).limit(50),
      supabaseAdmin.from('analytics_events').select('event_name, metadata').eq('event_type', 'api_slow').gte('created_at', since).order('created_at', { ascending: false }).limit(30),
      supabaseAdmin.from('analytics_events').select('event_name').eq('event_type', 'feature_use').gte('created_at', since),
    ]);

    // 功能使用频率统计
    const featureCount: Record<string, number> = {};
    (featuresRes.data || []).forEach((e: any) => { featureCount[e.event_name] = (featureCount[e.event_name] || 0) + 1; });

    // 错误聚合
    const errorCount: Record<string, number> = {};
    (errorsRes.data || []).forEach((e: any) => { errorCount[e.event_name] = (errorCount[e.event_name] || 0) + 1; });

    return Response.json({
      days,
      totalEvents: eventsRes.count || 0,
      errors: { total: errorsRes.data?.length || 0, top: Object.entries(errorCount).sort((a, b) => b[1] - a[1]).slice(0, 10) },
      slowApis: { total: slowRes.data?.length || 0, items: (slowRes.data || []).slice(0, 10) },
      features: Object.entries(featureCount).sort((a, b) => b[1] - a[1]).slice(0, 15),
    });
  }

  // AI 分析：把统计数据喂给 LLM 生成洞察
  if (action === 'ai-insights') {
    const summaryRes = await fetch(new URL(`/api/analytics?action=summary&days=${days}`, req.url));
    const summary = await summaryRes.json();

    const { data: feedbackData } = await supabaseAdmin.from('diagnosis_logs').select('context').eq('source', 'chat:feedback').gte('created_at', since).limit(100);
    const badFeedback = (feedbackData || []).filter((f: any) => f.context?.rating === 'bad');
    const feedbackReasons: Record<string, number> = {};
    badFeedback.forEach((f: any) => { const r = f.context?.reason || '未知'; feedbackReasons[r] = (feedbackReasons[r] || 0) + 1; });

    const prompt = `你是一个数据分析专家。以下是企业 AI HR 秘书系统最近 ${days} 天的运营数据，请给出 3-5 条关键洞察和优化建议，用中文回答，简洁直接。

数据：
- 总事件数：${summary.totalEvents}
- 前端错误：${summary.errors.total} 个，Top 错误：${JSON.stringify(summary.errors.top?.slice(0, 5))}
- 慢接口（>3s）：${summary.slowApis.total} 个
- 功能使用排行：${JSON.stringify(summary.features?.slice(0, 10))}
- AI 差评：${badFeedback.length} 条，原因分布：${JSON.stringify(feedbackReasons)}

请输出格式：
1. 【洞察标题】具体分析
2. ...`;

    const { createOpenAI } = await import('@ai-sdk/openai');
    const { generateText } = await import('ai');
    const volcengine = createOpenAI({ apiKey: process.env.VOLCENGINE_API_KEY || '', baseURL: 'https://ark.cn-beijing.volces.com/api/v3' });

    try {
      const { text } = await generateText({
        model: volcengine.chat(process.env.VOLCENGINE_MODEL_ID || ''),
        prompt,
      });
      return Response.json({ insights: text, summary });
    } catch (e: any) {
      return Response.json({ insights: 'AI 分析暂不可用: ' + e.message, summary });
    }
  }

  return Response.json({ error: '未知 action' }, { status: 400 });
}
