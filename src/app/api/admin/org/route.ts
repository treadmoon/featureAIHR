import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  return profile?.role === 'admin' ? { user, supabase } : null;
}

const TABLES = ['departments', 'positions', 'job_levels'] as const;
type Table = typeof TABLES[number];

function validTable(t: string): t is Table {
  return TABLES.includes(t as Table);
}

// GET — list all rows for a table
export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: '无权限' }, { status: 403 });

  const table = req.nextUrl.searchParams.get('table') || '';
  if (!validTable(table)) return NextResponse.json({ error: '无效表名' }, { status: 400 });

  const { data, error } = await auth.supabase.from(table).select('*').order('created_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST — create
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: '无权限' }, { status: 403 });

  const { table, ...fields } = await req.json();
  if (!validTable(table)) return NextResponse.json({ error: '无效表名' }, { status: 400 });

  const { data, error } = await auth.supabase.from(table).insert(fields).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH — update
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: '无权限' }, { status: 403 });

  const { table, id, ...fields } = await req.json();
  if (!validTable(table)) return NextResponse.json({ error: '无效表名' }, { status: 400 });

  const { data, error } = await auth.supabase.from(table).update(fields).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE — delete
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: '无权限' }, { status: 403 });

  const { table, id } = await req.json();
  if (!validTable(table)) return NextResponse.json({ error: '无效表名' }, { status: 400 });

  const { error } = await auth.supabase.from(table).delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
