import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import OrgClient from './OrgClient';

export default async function OrgPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/');

  const [{ data: departments }, { data: positions }, { data: jobLevels }, { data: employees }] = await Promise.all([
    supabase.from('departments').select('*').order('sort_order'),
    supabase.from('positions').select('*').order('created_at'),
    supabase.from('job_levels').select('*').order('level'),
    supabase.from('profiles').select('id, name, department_id, position_id, job_title, is_active').eq('is_active', true),
  ]);

  return <OrgClient
    departments={departments || []}
    positions={positions || []}
    jobLevels={jobLevels || []}
    employees={employees || []}
  />;
}
