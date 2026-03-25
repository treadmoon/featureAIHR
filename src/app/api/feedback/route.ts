import { createClient } from '@/lib/supabase-server';
import { logDiag } from '@/lib/diagnosis-log';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('未登录', { status: 401 });

  const { messageId, rating, userMessage, assistantMessage, reason } = await req.json();

  await logDiag({
    level: rating === 'bad' ? 'warn' : 'warn',
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
