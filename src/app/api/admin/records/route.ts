import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdminUser, parseBody } from '@/lib/api-helpers';

const TABLES = ['employee_transfers', 'performance', 'attendance', 'tickets', 'expenses', 'employee_positions'] as const;
type TableName = typeof TABLES[number];

// POST — Create record
export async function POST(req: NextRequest) {
  const auth = await requireAdminUser();
  if ('error' in auth) return auth.error;

  const parsed = await parseBody(req);
  if ('error' in parsed) return parsed.error;
  const { table, ...fields } = parsed.data as { table: string; [key: string]: unknown };
  if (!TABLES.includes(table as TableName)) return NextResponse.json({ error: '无效表名' }, { status: 400 });

  const { data, error } = await supabaseAdmin!.from(table as TableName).insert(fields).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// PATCH — Update record
export async function PATCH(req: NextRequest) {
  const auth = await requireAdminUser();
  if ('error' in auth) return auth.error;

  const parsed = await parseBody(req);
  if ('error' in parsed) return parsed.error;
  const { table, id, ...fields } = parsed.data as { table: string; id: string; [key: string]: unknown };
  if (!TABLES.includes(table as TableName)) return NextResponse.json({ error: '无效表名' }, { status: 400 });

  const { error } = await supabaseAdmin!.from(table as TableName).update(fields).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

// DELETE — Delete record
export async function DELETE(req: NextRequest) {
  const auth = await requireAdminUser();
  if ('error' in auth) return auth.error;

  const parsed = await parseBody(req);
  if ('error' in parsed) return parsed.error;
  const { table, id } = parsed.data as { table: string; id: string };
  if (!TABLES.includes(table as TableName)) return NextResponse.json({ error: '无效表名' }, { status: 400 });

  const { error } = await supabaseAdmin!.from(table as TableName).delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
