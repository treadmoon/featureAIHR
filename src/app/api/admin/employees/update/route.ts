import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { requireAdminUser, parseBody } from '@/lib/api-helpers';

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminUser();
  if ('error' in auth) return auth.error;

  const parsed = await parseBody(req);
  if ('error' in parsed) return parsed.error;
  const { id, ...fields } = parsed.data as { id: string; [key: string]: unknown };
  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 });

  // Whitelist allowed fields
  const allowed = ['name','gender','birthday','id_number','phone','emergency_contact','emergency_phone',
    'hire_date','department','job_title','job_level','work_location','contract_type','contract_end_date',
    'base_salary','social_insurance_base','housing_fund_base','is_active',
    'department_id','position_id','job_level_id','employee_status'];
  const update: Record<string, unknown> = {};
  for (const k of allowed) {
    if (k in fields) update[k] = fields[k] === '' ? null : fields[k];
  }

  if (Object.keys(update).length === 0) return NextResponse.json({ error: '没有可更新的字段' }, { status: 400 });

  const sb = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { error } = await sb.from('profiles').update(update).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
