import { supabaseAdmin } from '@/lib/supabase';

export type DiagEntry = {
  level: 'warn' | 'error';
  source: string;
  message: string;
  context?: Record<string, unknown>;
  userId?: string;
};

const mem: (DiagEntry & { ts: string })[] = [];

export async function logDiag(entry: DiagEntry) {
  const row = { ...entry, ts: new Date().toISOString() };
  mem.push(row);
  if (mem.length > 200) mem.shift();
  console.warn(`[DIAG][${entry.level}][${entry.source}] ${entry.message}`);
  if (supabaseAdmin) {
    await supabaseAdmin.from('diagnosis_logs').insert({
      level: entry.level, source: entry.source,
      message: entry.message, context: entry.context ?? {},
      user_id: entry.userId ?? null,
    }).then(r => r, () => null);
  }
}

export async function readDiagLogs(limit = 50) {
  if (!supabaseAdmin) return mem.slice(-limit);
  const { data } = await supabaseAdmin
    .from('diagnosis_logs')
    .select('id, level, source, message, context, user_id, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  return data?.length ? data : mem.slice(-limit);
}
