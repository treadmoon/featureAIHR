-- 对话会话表
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default '新对话',
  message_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.chat_sessions enable row level security;
create policy "own_sessions" on public.chat_sessions for all using (user_id = auth.uid());

create index if not exists idx_sessions_user on chat_sessions(user_id, updated_at desc);

drop trigger if exists chat_sessions_updated_at on public.chat_sessions;
create trigger chat_sessions_updated_at
  before update on public.chat_sessions
  for each row execute function public.update_updated_at();

-- 对话消息表
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null default '',
  parts jsonb default '[]',
  created_at timestamptz not null default now()
);

alter table public.chat_messages enable row level security;
create policy "own_messages" on public.chat_messages for all using (
  exists (select 1 from chat_sessions s where s.id = session_id and s.user_id = auth.uid())
);

create index if not exists idx_messages_session on chat_messages(session_id, created_at);
