-- 企业 RAG 知识库

-- 启用向量扩展
create extension if not exists vector;

-- 1. 知识分类
create table if not exists public.knowledge_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  icon text default '📄',
  sort_order integer default 0,
  created_at timestamptz default now()
);

insert into knowledge_categories (name, icon, sort_order) values
  ('人事制度', '👥', 1), ('IT 规范', '💻', 2), ('行政管理', '🏢', 3),
  ('财务制度', '💰', 4), ('安全合规', '🔒', 5)
on conflict (name) do nothing;

-- 2. 知识文档
create table if not exists public.knowledge_docs (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references knowledge_categories(id) on delete set null,
  title text not null,
  content text not null default '',
  version integer not null default 1,
  status text not null default 'active' check (status in ('active', 'archived')),
  updated_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_docs_category on knowledge_docs(category_id);
create index if not exists idx_docs_status on knowledge_docs(status);

alter table knowledge_docs enable row level security;
create policy "admin_docs" on knowledge_docs for all using (public.is_admin());
create policy "read_active_docs" on knowledge_docs for select using (status = 'active');

drop trigger if exists knowledge_docs_updated_at on knowledge_docs;
create trigger knowledge_docs_updated_at
  before update on knowledge_docs
  for each row execute function public.update_updated_at();

-- 3. 文档切片 + 向量
create table if not exists public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  doc_id uuid not null references knowledge_docs(id) on delete cascade,
  chunk_index integer not null default 0,
  content text not null,
  embedding vector(2048),
  created_at timestamptz default now()
);

create index if not exists idx_chunks_doc on knowledge_chunks(doc_id);
create index if not exists idx_chunks_embedding on knowledge_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 20);

alter table knowledge_chunks enable row level security;
create policy "admin_chunks" on knowledge_chunks for all using (public.is_admin());
create policy "read_chunks" on knowledge_chunks for select using (true);

-- 4. 向量检索函数
create or replace function match_policies(
  query_embedding vector(2048),
  match_threshold float default 0.1,
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

-- 5. 文档版本记录
create table if not exists public.knowledge_versions (
  id uuid primary key default gen_random_uuid(),
  doc_id uuid not null references knowledge_docs(id) on delete cascade,
  version integer not null,
  content text not null,
  updated_by uuid references profiles(id),
  created_at timestamptz default now()
);

create index if not exists idx_versions_doc on knowledge_versions(doc_id, version desc);

alter table knowledge_versions enable row level security;
create policy "admin_versions" on knowledge_versions for all using (public.is_admin());
