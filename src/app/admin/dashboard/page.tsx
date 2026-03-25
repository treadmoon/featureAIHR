import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/');

  const now = new Date();
  const curMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [profilesRes, attRes, approvalsRes, feedbackRes] = await Promise.all([
    supabase.from('profiles').select('id, name, department, is_active, hire_date'),
    supabase.from('attendance').select('employee_id, late_count, absence_days, early_leave_count, actual_days, work_days').eq('month', curMonth),
    supabase.from('approval_requests').select('id, type, status, created_at').gte('created_at', new Date(now.getFullYear(), now.getMonth(), 1).toISOString()),
    supabase.from('diagnosis_logs').select('id, context, created_at').eq('source', 'chat:feedback').order('created_at', { ascending: false }).limit(200),
  ]);

  return <DashboardClient profiles={profilesRes.data || []} attendance={attRes.data || []} approvals={approvalsRes.data || []} feedback={feedbackRes.data || []} month={curMonth} />;
}
