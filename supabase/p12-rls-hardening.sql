-- ============================================
-- P12: RLS Hardening — 补全缺失 RLS + 角色体系
-- ============================================

-- 1. 扩展 profiles.role 支持 hr 和 manager（原有策略用 is_admin() 不受影响）
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin', 'hr', 'manager', 'employee'));

-- 2. 新增 is_hr() 和 is_manager() 安全定义函数
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

create or replace function public.is_hr()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'hr'
  );
$$ language sql security definer stable;

create or replace function public.is_manager()
returns boolean as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and (
      p.role = 'admin'
      or p.role = 'hr'
      or p.role = 'manager'
      or exists (select 1 from public.departments d where d.manager_id = p.id)
    )
  );
$$ language sql security definer stable;

-- 3. 知识分类表补 RLS（之前遗漏）
alter table public.knowledge_categories enable row level security;
drop policy if exists "admin_knowledge_categories" on public.knowledge_categories;
drop policy if exists "read_knowledge_categories" on public.knowledge_categories;
create policy "admin_knowledge_categories" on public.knowledge_categories
  for all using (public.is_admin());
create policy "read_knowledge_categories" on public.knowledge_categories
  for select using (true);

-- 4. profiles 表 RLS 精细化
drop policy if exists "admin_full_access" on public.profiles;
drop policy if exists "user_read_own" on public.profiles;
drop policy if exists "user_update_own" on public.profiles;

-- Admin: 读写所有
create policy "admin_profiles_all" on public.profiles
  for all using (public.is_admin());

-- HR: 读写所有（HR 需要看全体员工档案）
create policy "hr_profiles_all" on public.profiles
  for all using (public.is_hr());

-- 经理: 只读自己团队的（通过 report_to 或 departments.manager_id 关联）
create policy "manager_profiles_read" on public.profiles
  for select using (
    id = auth.uid()
    or exists (select 1 from public.profiles p2 where p2.id = auth.uid() and p2.report_to = profiles.id)
    or exists (select 1 from public.departments d where d.manager_id = auth.uid())
  );

-- 员工: 只读自己和直接下属
create policy "employee_profiles_own" on public.profiles
  for select using (
    id = auth.uid()
    or exists (select 1 from public.profiles p2 where p2.report_to = auth.uid() and p2.id = profiles.id)
  );

-- 所有人可更新自己的基本信息
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

-- 5. attendance 表 RLS 精细化
drop policy if exists "admin_attendance" on public.attendance;
drop policy if exists "own_attendance" on public.attendance;
create policy "admin_attendance_all" on public.attendance
  for all using (public.is_admin());
create policy "hr_attendance_all" on public.attendance
  for all using (public.is_hr());
-- 经理: 读本部门考勤
create policy "manager_attendance_read" on public.attendance
  for select using (
    employee_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      join public.departments d on d.manager_id = auth.uid()
      where p.id = attendance.employee_id
    )
  );
-- 员工: 只读自己
create policy "employee_attendance_own" on public.attendance
  for select using (employee_id = auth.uid());

-- 6. performance 表 RLS 精细化
drop policy if exists "admin_performance" on public.performance;
drop policy if exists "own_performance" on public.performance;
create policy "admin_performance_all" on public.performance
  for all using (public.is_admin());
create policy "hr_performance_all" on public.performance
  for all using (public.is_hr());
create policy "manager_performance_read" on public.performance
  for select using (
    employee_id = auth.uid()
    or exists (select 1 from public.profiles p2 where p2.report_to = auth.uid() and p2.id = performance.employee_id)
  );
create policy "employee_performance_own" on public.performance
  for select using (employee_id = auth.uid());

-- 7. expenses 表 RLS 精细化
drop policy if exists "admin_expenses" on public.expenses;
drop policy if exists "own_expenses" on public.expenses;
create policy "admin_expenses_all" on public.expenses
  for all using (public.is_admin());
create policy "hr_expenses_all" on public.expenses
  for all using (public.is_hr());
create policy "manager_expenses_read" on public.expenses
  for select using (
    employee_id = auth.uid()
    or exists (select 1 from public.profiles p2 where p2.report_to = auth.uid() and p2.id = expenses.employee_id)
  );
create policy "employee_expenses_own" on public.expenses
  for all using (employee_id = auth.uid());

-- 8. tickets 表 RLS 精细化（IT 工单）
drop policy if exists "admin_tickets" on public.tickets;
drop policy if exists "own_tickets" on public.tickets;
create policy "admin_tickets_all" on public.tickets
  for all using (public.is_admin());
create policy "hr_tickets_all" on public.tickets
  for all using (public.is_hr());
create policy "it_handler_tickets" on public.tickets
  for select using (
    employee_id = auth.uid()
    or exists (select 1 from public.profiles p2 where p2.report_to = auth.uid() and p2.id = tickets.employee_id)
  );
create policy "employee_tickets_own" on public.tickets
  for all using (employee_id = auth.uid());

-- 9. employee_transfers 表 RLS
drop policy if exists "admin_transfers" on public.employee_transfers;
drop policy if exists "own_transfers" on public.employee_transfers;
create policy "admin_transfers_all" on public.employee_transfers
  for all using (public.is_admin());
create policy "hr_transfers_all" on public.employee_transfers
  for all using (public.is_hr());
create policy "employee_transfers_own" on public.employee_transfers
  for select using (employee_id = auth.uid());

-- 10. diagnosis_logs 和 analytics_events 仅 admin 可读写
drop policy if exists "admin_diagnosis" on public.diagnosis_logs;
drop policy if exists "admin_analytics" on public.analytics_events;

alter table public.diagnosis_logs enable row level security;
create policy "admin_diagnosis_logs" on public.diagnosis_logs
  for all using (public.is_admin());

alter table public.analytics_events enable row level security;
create policy "admin_analytics_events" on public.analytics_events
  for all using (public.is_admin());
