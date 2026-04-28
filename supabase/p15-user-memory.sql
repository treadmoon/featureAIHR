-- User Memory: 长期记忆系统
-- 借鉴 DeerFlow 的 fact-based memory 设计，存储用户偏好、上下文和知识

create table if not exists public.user_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in ('preference', 'context', 'knowledge', 'behavior')),
  content text not null,
  confidence real not null default 0.8 check (confidence >= 0 and confidence <= 1),
  source text not null default 'chat',  -- 'chat' | 'manual' | 'system'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index idx_memory_user on public.user_memory(user_id);
create index idx_memory_user_cat on public.user_memory(user_id, category);
create index idx_memory_confidence on public.user_memory(confidence desc);

-- Auto-update updated_at
create trigger user_memory_updated_at
  before update on public.user_memory
  for each row execute function public.update_updated_at();

-- RLS
alter table public.user_memory enable row level security;

create policy "Users can read own memory"
  on public.user_memory for select
  using (auth.uid() = user_id);

create policy "Admin full access to memory"
  on public.user_memory for all
  using (public.is_admin());

-- Service role (supabaseAdmin) bypasses RLS automatically
