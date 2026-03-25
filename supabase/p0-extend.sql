-- ============================================
-- P0: Extend profiles + create related tables
-- ============================================

-- 1. Extend profiles with more fields
alter table public.profiles
  add column if not exists gender text default '',
  add column if not exists birthday date,
  add column if not exists id_number text default '',
  add column if not exists emergency_contact text default '',
  add column if not exists emergency_phone text default '',
  add column if not exists hire_date date,
  add column if not exists avatar_url text default '',
  add column if not exists job_level text default '',
  add column if not exists report_to uuid references public.profiles(id),
  add column if not exists work_location text default '',
  add column if not exists contract_type text default '',
  add column if not exists contract_end_date date,
  add column if not exists base_salary numeric(12,2),
  add column if not exists social_insurance_base numeric(12,2),
  add column if not exists housing_fund_base numeric(12,2);

-- 2. Employee transfers (调动记录)
create table if not exists public.employee_transfers (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  transfer_type text not null default 'department' check (transfer_type in ('department','position','level','location')),
  from_value text not null default '',
  to_value text not null default '',
  effective_date date not null default current_date,
  approved_by text default '',
  remark text default '',
  created_at timestamptz not null default now()
);

alter table public.employee_transfers enable row level security;
create policy "admin_transfers" on public.employee_transfers for all using (public.is_admin());
create policy "own_transfers" on public.employee_transfers for select using (employee_id = auth.uid());

-- 3. Performance records (绩效记录)
create table if not exists public.performance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  period text not null default '',
  score numeric(4,1),
  rating text default '',
  comment text default '',
  goals text default '',
  reviewer text default '',
  created_at timestamptz not null default now()
);

alter table public.performance enable row level security;
create policy "admin_performance" on public.performance for all using (public.is_admin());
create policy "own_performance" on public.performance for select using (employee_id = auth.uid());

-- 4. Attendance monthly summary (考勤月度汇总)
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  month text not null default '',
  work_days integer default 0,
  actual_days numeric(5,1) default 0,
  late_count integer default 0,
  early_leave_count integer default 0,
  absence_days numeric(5,1) default 0,
  overtime_hours numeric(6,1) default 0,
  leave_days numeric(5,1) default 0,
  created_at timestamptz not null default now()
);

alter table public.attendance enable row level security;
create policy "admin_attendance" on public.attendance for all using (public.is_admin());
create policy "own_attendance" on public.attendance for select using (employee_id = auth.uid());

-- 5. Tickets (工单)
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  type text not null default 'it' check (type in ('it','hr','other')),
  title text not null default '',
  description text default '',
  status text not null default 'open' check (status in ('open','in_progress','resolved','closed')),
  handler text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tickets enable row level security;
create policy "admin_tickets" on public.tickets for all using (public.is_admin());
create policy "own_tickets" on public.tickets for select using (employee_id = auth.uid());

-- 6. Expenses (费用报销)
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  expense_type text not null default '' ,
  amount numeric(12,2) not null default 0,
  description text default '',
  status text not null default 'pending' check (status in ('pending','approved','rejected','paid')),
  approved_by text default '',
  receipt_url text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.expenses enable row level security;
create policy "admin_expenses" on public.expenses for all using (public.is_admin());
create policy "own_expenses" on public.expenses for select using (employee_id = auth.uid());
