import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin as globalAdmin } from '@/lib/supabase';

// Admin guard helper
async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  return profile?.role === 'admin' ? user : null;
}

// POST — Create new employee (uses service role to create auth user)
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: '无权限' }, { status: 403 });

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
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: '无权限' }, { status: 403 });

  const { id, is_active } = await req.json();

  const supabaseAdmin = globalAdmin!;

  await supabaseAdmin.from('profiles').update({ is_active }).eq('id', id);

  return NextResponse.json({ ok: true });
}
