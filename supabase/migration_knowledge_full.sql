-- ============================================
-- 知识库完整迁移（一次性执行）
-- 在 Supabase SQL Editor 中粘贴执行
-- ============================================

-- 1. 扩展 profiles.role 支持 hr 和 manager
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin', 'hr', 'manager', 'employee'));

-- 2. 创建 is_hr() 和 is_manager() 安全定义函数（p12）
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

-- 3. 知识分类表
create table if not exists public.knowledge_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  icon text default '📄',
  sort_order integer default 0,
  created_at timestamptz default now()
);

alter table public.knowledge_categories enable row level security;
drop policy if exists "admin_knowledge_categories" on public.knowledge_categories;
drop policy if exists "read_knowledge_categories" on public.knowledge_categories;
create policy "admin_knowledge_categories" on public.knowledge_categories
  for all using (public.is_admin());
create policy "read_knowledge_categories" on public.knowledge_categories
  for select using (true);

insert into public.knowledge_categories (name, icon, sort_order) values
  ('人事制度', '👥', 1), ('IT 规范', '💻', 2), ('行政管理', '🏢', 3),
  ('财务制度', '💰', 4), ('安全合规', '🔒', 5)
on conflict (name) do nothing;

-- 4. 知识文档表
create table if not exists public.knowledge_docs (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.knowledge_categories(id) on delete set null,
  title text not null,
  content text not null default '',
  version integer not null default 1,
  status text not null default 'active' check (status in ('active', 'archived')),
  updated_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_docs_category on public.knowledge_docs(category_id);
create index if not exists idx_docs_status on public.knowledge_docs(status);

alter table public.knowledge_docs enable row level security;
drop policy if exists "admin_docs" on public.knowledge_docs;
drop policy if exists "manager_docs_read" on public.knowledge_docs;
create policy "admin_docs" on public.knowledge_docs for all using (public.is_admin());
create policy "manager_docs_read" on public.knowledge_docs
  for select using (status = 'active' and (public.is_admin() or public.is_hr() or public.is_manager()));

drop trigger if exists knowledge_docs_updated_at on public.knowledge_docs;
create trigger knowledge_docs_updated_at
  before update on public.knowledge_docs
  for each row execute function public.update_updated_at();

-- 5. 文档切片 + 向量（p10）
create extension if not exists vector;

-- 注意：IVFFlat 索引最大支持 2000 维，请确保 embedding 模型输出 ≤ 2000 维
create table if not exists public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  doc_id uuid not null references public.knowledge_docs(id) on delete cascade,
  chunk_index integer not null default 0,
  content text not null,
  embedding vector(1536),
  created_at timestamptz default now()
);

create index if not exists idx_chunks_doc on public.knowledge_chunks(doc_id);
create index if not exists idx_chunks_embedding on public.knowledge_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 20);

alter table public.knowledge_chunks enable row level security;
drop policy if exists "admin_chunks" on public.knowledge_chunks;
drop policy if exists "read_chunks" on public.knowledge_chunks;
create policy "admin_chunks" on public.knowledge_chunks for all using (public.is_admin());
create policy "read_chunks" on public.knowledge_chunks for select using (true);

-- 6. 文档版本记录（含 cascade FK，p14）
create table if not exists public.knowledge_versions (
  id uuid primary key default gen_random_uuid(),
  doc_id uuid not null references public.knowledge_docs(id) on delete cascade,
  version integer not null,
  content text not null,
  updated_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create index if not exists idx_versions_doc on public.knowledge_versions(doc_id, version desc);

alter table public.knowledge_versions enable row level security;
drop policy if exists "admin_versions" on public.knowledge_versions;
create policy "admin_versions" on public.knowledge_versions for all using (public.is_admin());

-- 7. 向量检索函数（阈值 0.65，p14）
create or replace function match_policies(
  query_embedding vector(1536),
  match_threshold float default 0.65,
  match_count int default 3
) returns table (id uuid, title text, content text, similarity float) as $$
  select c.id, d.title, c.content,
    1 - (c.embedding <=> query_embedding) as similarity
  from knowledge_chunks c
  join knowledge_docs d on d.id = c.doc_id
  where d.status = 'active'
    and 1 - (c.embedding <=> query_embedding) > match_threshold
  order by c.embedding <=> query_embedding
  limit match_count;
$$ language sql stable;

-- 8. 全文搜索索引（p14，无需向量时的降级方案）
create index if not exists idx_knowledge_chunks_content
  on public.knowledge_chunks using gin(to_tsvector('simple', content));

-- 9. knowledge_docs 分类复合索引（p14）
create index if not exists idx_knowledge_docs_category
  on public.knowledge_docs(category_id, status, updated_at desc);
