import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import AdminEmployeesClient from './AdminEmployeesClient';

export default async function AdminEmployeesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') redirect('/');

  const { data: employees } = await supabase
    .from('profiles')
    .select('id, name, role, department, job_title, phone, is_active, created_at')
    .order('created_at', { ascending: false });

  return <AdminEmployeesClient employees={employees || []} />;
}
