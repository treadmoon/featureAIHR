import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { logDiag } from '@/lib/diagnosis-log';
import { parseBody } from '@/lib/api-helpers';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const parsed = await parseBody(req);
  if ('error' in parsed) return parsed.error;
  const { messageId, rating, userMessage, assistantMessage, reason } = parsed.data as Record<string, string>;

  await logDiag({
    level: rating === 'bad' ? 'warn' : 'info',
    source: 'chat:feedback',
    message: `用户反馈: ${rating}`,
    context: {
      messageId,
      rating,
      reason: reason || '',
      userMessage: (userMessage || '').slice(0, 500),
      assistantMessage: (assistantMessage || '').slice(0, 1000),
    },
    userId: user.id,
  });

  return Response.json({ ok: true });
}
