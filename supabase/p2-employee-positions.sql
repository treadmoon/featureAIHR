-- ============================================
-- P2: employee_positions + profiles FK 关联
-- ============================================

-- 1. profiles 增加 FK 字段（保留原 text 字段做冗余展示）
alter table public.profiles
  add column if not exists department_id uuid references public.departments(id) on delete set null,
  add column if not exists position_id uuid references public.positions(id) on delete set null,
  add column if not exists job_level_id uuid references public.job_levels(id) on delete set null,
  add column if not exists employee_status text not null default 'active'
    check (employee_status in ('probation','active','suspended','on_leave','resigned','terminated'));

-- 2. 员工任职表（主职位 + 兼职）
create table if not exists public.employee_positions (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  department_id uuid not null references public.departments(id) on delete cascade,
  position_id uuid not null references public.positions(id) on delete cascade,
  is_primary boolean not null default false,
  start_date date not null default current_date,
  end_date date,
  remark text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 每人只能有一个主职位
create unique index if not exists idx_employee_primary_position
  on public.employee_positions(employee_id) where is_primary = true and end_date is null;

alter table public.employee_positions enable row level security;
create policy "admin_employee_positions" on public.employee_positions for all using (public.is_admin());
create policy "own_employee_positions" on public.employee_positions for select using (employee_id = auth.uid());

drop trigger if exists employee_positions_updated_at on public.employee_positions;
create trigger employee_positions_updated_at
  before update on public.employee_positions
  for each row execute function public.update_updated_at();
