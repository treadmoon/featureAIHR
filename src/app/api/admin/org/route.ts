import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser, parseBody } from '@/lib/api-helpers';
import { getAuthUser } from '@/lib/api-helpers';

const TABLES = ['departments', 'positions', 'job_levels'] as const;
type Table = typeof TABLES[number];

function validTable(t: string): t is Table {
  return TABLES.includes(t as Table);
}

// GET — list all rows for a table
export async function GET(req: NextRequest) {
  const auth = await requireAdminUser();
  if ('error' in auth) return auth.error;
  const { supabase } = auth;

  const table = req.nextUrl.searchParams.get('table') || '';
  if (!validTable(table)) return NextResponse.json({ error: '无效表名' }, { status: 400 });

  const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST — create
export async function POST(req: NextRequest) {
  const auth = await requireAdminUser();
  if ('error' in auth) return auth.error;
  const { supabase } = auth;

  const parsed = await parseBody(req);
  if ('error' in parsed) return parsed.error;
  const { table, ...fields } = parsed.data as { table: string; [key: string]: unknown };
  if (!validTable(table)) return NextResponse.json({ error: '无效表名' }, { status: 400 });

  const { data, error } = await supabase.from(table).insert(fields).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH — update
export async function PATCH(req: NextRequest) {
  const auth = await requireAdminUser();
  if ('error' in auth) return auth.error;
  const { supabase } = auth;

  const parsed = await parseBody(req);
  if ('error' in parsed) return parsed.error;
  const { table, id, ...fields } = parsed.data as { table: string; id: string; [key: string]: unknown };
  if (!validTable(table)) return NextResponse.json({ error: '无效表名' }, { status: 400 });

  const { data, error } = await supabase.from(table).update(fields).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE — delete
export async function DELETE(req: NextRequest) {
  const auth = await requireAdminUser();
  if ('error' in auth) return auth.error;
  const { supabase } = auth;

  const parsed = await parseBody(req);
  if ('error' in parsed) return parsed.error;
  const { table, id } = parsed.data as { table: string; id: string };
  if (!validTable(table)) return NextResponse.json({ error: '无效表名' }, { status: 400 });

  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
