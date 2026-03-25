import { readDiagLogs } from '@/lib/diagnosis-log';
import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  // 仅 admin 可读
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: '无权限' }, { status: 403 });

  const limit = Number(req.nextUrl.searchParams.get('limit')) || 50;
  const source = req.nextUrl.searchParams.get('source') || undefined;

  let logs: any[] = await readDiagLogs(limit);
  if (source) logs = logs.filter((l: any) => l.source?.includes(source));

  // 按 source+message 聚合频次
  const freq: Record<string, { count: number; source: string; message: string; lastSeen: string; level: string; sample: any }> = {};
  for (const l of logs) {
    const key = `${l.source}::${l.message}`;
    if (!freq[key]) freq[key] = { count: 0, source: l.source, message: l.message, lastSeen: (l as any).created_at || l.ts, level: l.level, sample: (l as any).context };
    freq[key].count++;
  }
  const summary = Object.values(freq).sort((a, b) => b.count - a.count);

  return NextResponse.json({ total: logs.length, summary, logs });
}
