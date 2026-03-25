import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import ApprovalsClient from './ApprovalsClient';

export default async function ApprovalsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('id, role, name, department_id').eq('id', user.id).single();
  if (!profile) redirect('/login');

  // 获取部门列表和职位列表（用于调岗申请）
  const [{ data: departments }, { data: positions }] = await Promise.all([
    supabase.from('departments').select('id, name').eq('is_active', true).order('sort_order'),
    supabase.from('positions').select('id, name').eq('is_active', true).order('name'),
  ]);

  return <ApprovalsClient
    userId={user.id}
    isAdmin={profile.role === 'admin'}
    departments={departments || []}
    positions={positions || []}
  />;
}
