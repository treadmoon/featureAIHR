-- 1. 开启 Supabase 的 pgvector 向量扩展
create extension if not exists vector;

-- 2. 创建企业政策与知识库表
create table if not exists company_policies (
  id bigserial primary key,
  title text not null,
  content text not null,
  -- 火山引擎的通用文本向量模型（如 Doubao-embedding）通常是 1024 维，如果您的具体模型不同请修改括号中的数字
  embedding vector(1024) 
);

-- 3. 创建基于余弦相似度 (Cosine Similarity) 的向量搜索函数
create or replace function match_policies(
  query_embedding vector(1024),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  title text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    company_policies.id,
    company_policies.title,
    company_policies.content,
    1 - (company_policies.embedding <=> query_embedding) as similarity
  from company_policies
  where 1 - (company_policies.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;
