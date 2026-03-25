-- ============================================
-- 审批流：approval_requests + approval_steps
-- 先建表，再加 RLS（避免交叉引用报错）
-- ============================================

-- 1. 建表
create table if not exists public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('leave','expense','overtime','attendance_fix','transfer','salary_adjust','resignation','onboard')),
  applicant_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('draft','pending','approved','rejected','cancelled')),
  current_step integer not null default 1,
  total_steps integer not null default 1,
  payload jsonb not null default '{}',
  result_note text default '',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.approval_steps (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.approval_requests(id) on delete cascade,
  step integer not null default 1,
  approver_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected','skipped')),
  comment text default '',
  acted_at timestamptz,
  created_at timestamptz not null default now()
);

-- 2. RLS
alter table public.approval_requests enable row level security;
alter table public.approval_steps enable row level security;

create policy "admin_approval_requests" on public.approval_requests for all using (public.is_admin());
create policy "own_approval_requests" on public.approval_requests for select using (applicant_id = auth.uid());
create policy "approver_approval_requests" on public.approval_requests for select using (
  exists (select 1 from public.approval_steps s where s.request_id = id and s.approver_id = auth.uid())
);
create policy "insert_own_requests" on public.approval_requests for insert with check (applicant_id = auth.uid());

create policy "admin_approval_steps" on public.approval_steps for all using (public.is_admin());
create policy "own_approval_steps" on public.approval_steps for select using (approver_id = auth.uid());
create policy "applicant_approval_steps" on public.approval_steps for select using (
  exists (select 1 from public.approval_requests r where r.id = request_id and r.applicant_id = auth.uid())
);
create policy "approver_update_steps" on public.approval_steps for update using (approver_id = auth.uid());

-- 3. 触发器 + 索引
drop trigger if exists approval_requests_updated_at on public.approval_requests;
create trigger approval_requests_updated_at
  before update on public.approval_requests
  for each row execute function public.update_updated_at();

create index if not exists idx_approval_steps_approver on public.approval_steps(approver_id, status);
create index if not exists idx_approval_requests_applicant on public.approval_requests(applicant_id, status);
