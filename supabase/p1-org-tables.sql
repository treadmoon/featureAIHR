-- ============================================
-- P1: 组织架构枚举表 — departments / positions / job_levels
-- ============================================

-- 1. 部门表
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null default '',
  parent_id uuid references public.departments(id) on delete set null,
  manager_id uuid references public.profiles(id) on delete set null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(name, parent_id)
);

alter table public.departments enable row level security;
create policy "admin_departments" on public.departments for all using (public.is_admin());
create policy "read_departments" on public.departments for select using (true);

drop trigger if exists departments_updated_at on public.departments;
create trigger departments_updated_at
  before update on public.departments
  for each row execute function public.update_updated_at();

-- 2. 职位表
create table if not exists public.positions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null default '',
  department_id uuid references public.departments(id) on delete set null,
  description text default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.positions enable row level security;
create policy "admin_positions" on public.positions for all using (public.is_admin());
create policy "read_positions" on public.positions for select using (true);

drop trigger if exists positions_updated_at on public.positions;
create trigger positions_updated_at
  before update on public.positions
  for each row execute function public.update_updated_at();

-- 3. 职级表
create table if not exists public.job_levels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  track text not null default 'professional' check (track in ('professional', 'management')),
  level integer not null default 1,
  salary_min numeric(12,2),
  salary_max numeric(12,2),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.job_levels enable row level security;
create policy "admin_job_levels" on public.job_levels for all using (public.is_admin());
create policy "read_job_levels" on public.job_levels for select using (true);

drop trigger if exists job_levels_updated_at on public.job_levels;
create trigger job_levels_updated_at
  before update on public.job_levels
  for each row execute function public.update_updated_at();
