import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import EmployeeDetailClient from '../admin/employees/[id]/EmployeeDetailClient';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: employee } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!employee) redirect('/login');
  const isAdmin = employee.role === 'admin';

  const [transfers, performance, attendance, tickets, expenses, empPositions, departments, positions, jobLevels] = await Promise.all([
    supabase.from('employee_transfers').select('*').eq('employee_id', user.id).order('effective_date', { ascending: false }),
    supabase.from('performance').select('*').eq('employee_id', user.id).order('created_at', { ascending: false }),
    supabase.from('attendance').select('*').eq('employee_id', user.id).order('month', { ascending: false }),
    supabase.from('tickets').select('*').eq('employee_id', user.id).order('created_at', { ascending: false }),
    supabase.from('expenses').select('*').eq('employee_id', user.id).order('created_at', { ascending: false }),
    supabase.from('employee_positions').select('*').eq('employee_id', user.id).order('is_primary', { ascending: false }),
    supabase.from('departments').select('id, name').eq('is_active', true).order('sort_order'),
    supabase.from('positions').select('id, name, department_id').eq('is_active', true).order('name'),
    supabase.from('job_levels').select('id, name, code, track').eq('is_active', true).order('level'),
  ]);

  return (
    <EmployeeDetailClient
      employee={employee}
      transfers={transfers.data || []}
      performance={performance.data || []}
      attendance={attendance.data || []}
      tickets={tickets.data || []}
      expenses={expenses.data || []}
      empPositions={empPositions.data || []}
      departments={departments.data || []}
      positions={positions.data || []}
      jobLevels={jobLevels.data || []}
      isAdmin={isAdmin}
    />
  );
}
