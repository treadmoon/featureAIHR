import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as globalAdmin } from '@/lib/supabase';
import { requireAdminUser, parseBody } from '@/lib/api-helpers';

// POST — Create new employee (uses service role to create auth user)
export async function POST(req: NextRequest) {
  const auth = await requireAdminUser();
  if ('error' in auth) return auth.error;

  const parsed = await parseBody(req);
  if ('error' in parsed) return parsed.error;
  const { name, email, password, role, department, job_title, phone } = parsed.data as Record<string, string>;
  if (!email || !password || !name) {
    return NextResponse.json({ error: '姓名、邮箱、密码必填' }, { status: 400 });
  }

  // Use service role to create user in auth.users
  const supabaseAdmin = globalAdmin!;

  const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // auto-confirm
    user_metadata: { name, role: role || 'employee' },
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // Update profile with extra fields (trigger already created the row)
  if (newUser.user) {
    await supabaseAdmin.from('profiles').update({
      department: department || '',
      job_title: job_title || '',
      phone: phone || '',
    }).eq('id', newUser.user.id);
  }

  return NextResponse.json({ id: newUser.user?.id, email });
}

// PATCH — Toggle employee active status
export async function PATCH(req: NextRequest) {
  const auth = await requireAdminUser();
  if ('error' in auth) return auth.error;

  const parsed = await parseBody(req);
  if ('error' in parsed) return parsed.error;
  const { id, is_active } = parsed.data as { id: string; is_active: boolean };

  const supabaseAdmin = globalAdmin!;

  await supabaseAdmin.from('profiles').update({ is_active }).eq('id', id);

  return NextResponse.json({ ok: true });
}
