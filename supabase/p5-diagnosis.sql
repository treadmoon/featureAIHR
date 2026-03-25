-- 诊断日志表：记录系统运行异常，供开发者读取修复
create table if not exists diagnosis_logs (
  id uuid primary key default gen_random_uuid(),
  level text not null default 'warn',
  source text not null,
  message text not null,
  context jsonb default '{}',
  user_id uuid,
  created_at timestamptz default now()
);

create index if not exists idx_diag_created on diagnosis_logs(created_at desc);
create index if not exists idx_diag_source on diagnosis_logs(source);
