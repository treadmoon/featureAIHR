import { createClient } from '@/lib/supabase-server';
import { NextRequest } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('未登录', { status: 401 });

  const { data } = await supabase
    .from('chat_sessions')
    .select('id, title, message_count, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(50);

  return Response.json(data || []);
}

// 创建新会话 / 保存消息 / 删除
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('未登录', { status: 401 });

  const body = await req.json();

  // 创建新会话
  if (body.action === 'create') {
    const { data } = await supabase
      .from('chat_sessions')
      .insert({ user_id: user.id, title: body.title || '新对话' })
      .select('id')
      .single();
    return Response.json(data);
  }

  // 保存消息（批量）
  if (body.action === 'save' && body.sessionId && body.messages?.length) {
    const rows = body.messages.map((m: any) => ({
      session_id: body.sessionId,
      role: m.role,
      content: m.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('') || '',
      parts: m.parts || [],
    }));
    await supabase.from('chat_messages').insert(rows);
    await supabase
      .from('chat_sessions')
      .update({ message_count: body.totalCount || body.messages.length })
      .eq('id', body.sessionId);
    return Response.json({ ok: true });
  }

  // 加载会话消息
  if (body.action === 'load' && body.sessionId) {
    const { data } = await supabase
      .from('chat_messages')
      .select('role, content, parts, created_at')
      .eq('session_id', body.sessionId)
      .order('created_at');
    return Response.json(data || []);
  }

  // 删除单个会话
  if (body.action === 'delete' && body.sessionId) {
    await supabase.from('chat_sessions').delete().eq('id', body.sessionId);
    return Response.json({ ok: true });
  }

  // 按日期范围删除
  if (body.action === 'deleteByDate' && body.before) {
    await supabase.from('chat_sessions').delete().eq('user_id', user.id).lt('created_at', body.before);
    return Response.json({ ok: true });
  }

  // 压缩：保留每个会话的首尾各2条消息，删除中间的
  if (body.action === 'compress' && body.before) {
    const { data: sessions } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('user_id', user.id)
      .lt('created_at', body.before);
    for (const s of sessions || []) {
      const { data: msgs } = await supabase
        .from('chat_messages')
        .select('id')
        .eq('session_id', s.id)
        .order('created_at');
      if (msgs && msgs.length > 4) {
        const keepIds = [msgs[0].id, msgs[1].id, msgs[msgs.length - 2].id, msgs[msgs.length - 1].id];
        const deleteIds = msgs.filter(m => !keepIds.includes(m.id)).map(m => m.id);
        await supabase.from('chat_messages').delete().in('id', deleteIds);
        await supabase.from('chat_sessions').update({ message_count: 4 }).eq('id', s.id);
      }
    }
    return Response.json({ ok: true });
  }

  return Response.json({ error: '未知操作' }, { status: 400 });
}
