import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin as globalAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth-permissions';

// POST — Create new employee (uses service role to create auth user)
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  try {
    await requireAdmin(supabase, user.id);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || '无权限' }, { status: e.status || 403 });
  }

  const { name, email, password, role, department, job_title, phone } = await req.json();
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  try {
    await requireAdmin(supabase, user.id);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || '无权限' }, { status: e.status || 403 });
  }

  const { id, is_active } = await req.json();

  const supabaseAdmin = globalAdmin!;

  await supabaseAdmin.from('profiles').update({ is_active }).eq('id', id);

  return NextResponse.json({ ok: true });
}
