-- ============================================
-- P3: 迁移 profiles 中的 text 字段到 FK 关联
-- 逻辑：从现有 text 值自动创建枚举记录，再回填 FK
-- ============================================

-- 1. 从 profiles.department 去重，插入 departments 表（跳过已存在的）
insert into public.departments (name, code)
select distinct trim(department), lower(replace(trim(department), ' ', '-'))
from public.profiles
where department is not null and trim(department) != ''
on conflict (name, parent_id) do nothing;

-- 2. 从 profiles.job_title 去重，插入 positions 表
insert into public.positions (name, code)
select distinct trim(job_title), lower(replace(trim(job_title), ' ', '-'))
from public.profiles
where job_title is not null and trim(job_title) != ''
and not exists (select 1 from public.positions where name = trim(job_title));

-- 3. 从 profiles.job_level 去重，插入 job_levels 表
insert into public.job_levels (name, code)
select distinct trim(job_level), lower(replace(trim(job_level), ' ', '-'))
from public.profiles
where job_level is not null and trim(job_level) != ''
and not exists (select 1 from public.job_levels where name = trim(job_level));

-- 4. 回填 FK
update public.profiles p
set department_id = d.id
from public.departments d
where trim(p.department) = d.name
  and p.department is not null and trim(p.department) != ''
  and p.department_id is null;

update public.profiles p
set position_id = pos.id
from public.positions pos
where trim(p.job_title) = pos.name
  and p.job_title is not null and trim(p.job_title) != ''
  and p.position_id is null;

update public.profiles p
set job_level_id = jl.id
from public.job_levels jl
where trim(p.job_level) = jl.name
  and p.job_level is not null and trim(p.job_level) != ''
  and p.job_level_id is null;

-- 5. 同时为有主职位信息的员工创建 employee_positions 主职位记录
insert into public.employee_positions (employee_id, department_id, position_id, is_primary, start_date)
select p.id, p.department_id, p.position_id, true, coalesce(p.hire_date, current_date)
from public.profiles p
where p.department_id is not null
  and p.position_id is not null
  and not exists (
    select 1 from public.employee_positions ep
    where ep.employee_id = p.id and ep.is_primary = true and ep.end_date is null
  );
