import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: '无权限' }, { status: 403 });

  const { id, ...fields } = await req.json();
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
