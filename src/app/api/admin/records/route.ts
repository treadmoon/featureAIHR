import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const TABLES = ['employee_transfers', 'performance', 'attendance', 'tickets', 'expenses', 'employee_positions'] as const;
type TableName = typeof TABLES[number];

function sb() {
  return createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  return data?.role === 'admin' ? user : null;
}

// POST — Create record
export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: '无权限' }, { status: 403 });
  const { table, ...fields } = await req.json();
  if (!TABLES.includes(table)) return NextResponse.json({ error: '无效表名' }, { status: 400 });

  const { data, error } = await sb().from(table as TableName).insert(fields).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// PATCH — Update record
export async function PATCH(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: '无权限' }, { status: 403 });
  const { table, id, ...fields } = await req.json();
  if (!TABLES.includes(table)) return NextResponse.json({ error: '无效表名' }, { status: 400 });

  const { error } = await sb().from(table as TableName).update(fields).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

// DELETE — Delete record
export async function DELETE(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: '无权限' }, { status: 403 });
  const { table, id } = await req.json();
  if (!TABLES.includes(table)) return NextResponse.json({ error: '无效表名' }, { status: 400 });

  const { error } = await sb().from(table as TableName).delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
