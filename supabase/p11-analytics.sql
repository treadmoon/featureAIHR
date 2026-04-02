-- 用户行为埋点 + 错误上报

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  event_type text not null, -- page_view, feature_use, error, api_slow
  event_name text not null, -- 具体事件名
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create index if not exists idx_events_type on analytics_events(event_type, created_at desc);
create index if not exists idx_events_user on analytics_events(user_id, created_at desc);
create index if not exists idx_events_name on analytics_events(event_name, created_at desc);

alter table analytics_events enable row level security;
create policy "admin_events" on analytics_events for all using (public.is_admin());
create policy "insert_own_events" on analytics_events for insert with check (user_id = auth.uid());
