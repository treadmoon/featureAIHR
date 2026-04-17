-- ============================================
-- P14: 知识库修复 — 版本记录级联 + 索引优化
-- ============================================

-- 1. knowledge_versions 补级联删除
alter table public.knowledge_versions
  drop constraint if exists knowledge_versions_doc_id_fkey,
  add constraint knowledge_versions_doc_id_fkey
    foreign key (doc_id) references public.knowledge_docs(id) on delete cascade;

-- 2. knowledge_docs 补分类索引（列表查询高频）
create index if not exists idx_knowledge_docs_category
  on public.knowledge_docs(category_id, status, updated_at desc);

-- 3. knowledge_chunks 补内容搜索索引（无需向量时全文搜索）
create index if not exists idx_knowledge_chunks_content
  on public.knowledge_chunks using gin(to_tsvector('zhcfg', content));

-- 4. 修正 match_policies 阈值（0.1 → 0.65，更合理）
create or replace function match_policies(
  query_embedding vector(2048),
  match_threshold float default 0.65,  -- 提高阈值避免垃圾召回
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
