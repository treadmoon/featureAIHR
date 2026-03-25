-- ============================================
-- P7: 补全所有员工档案信息
-- 前置：先执行 p6-seed-org.sql
-- 通过 email 匹配 auth.users → profiles，批量更新
-- ============================================

-- 临时表存放员工数据
create temp table _emp (
  email text primary key,
  name text, gender text, phone text,
  dept_code text, position_code text, level_code text,
  hire_date date, birthday date,
  contract_type text, contract_end_date date,
  base_salary numeric, social_insurance_base numeric, housing_fund_base numeric,
  emergency_contact text, emergency_phone text,
  work_location text, employee_status text default 'active'
);

insert into _emp values
-- 总裁办
('admin@star.dev',     '陈星辰','男','13800000001','CEO','ceo','M5','2018-03-01','1975-06-15','无固定期限',null,85000,28000,5000,'陈明华','13900000001','总部28F','active'),
('liwei@star.dev',     '李薇',  '女','13800000002','CEO','ceo-asst','P3','2020-07-15','1992-11-20','固定期限','2027-07-14',22000,18000,3000,'李建国','13900000002','总部28F','active'),
-- 人力资源部
('zhanghr@star.dev',   '张慧茹','女','13800000003','HR','hr-dir','M3','2019-01-10','1983-04-08','无固定期限',null,45000,25000,4500,'张伟','13900000003','总部25F','active'),
('wangling@star.dev',  '王玲',  '女','13800000004','HR','hrbp','P3','2020-09-01','1990-08-22','固定期限','2026-08-31',20000,16000,2800,'王强','13900000004','总部25F','active'),
('liuxc@star.dev',     '刘晓晨','女','13800000005','HR','hr-comp','P2','2021-03-15','1993-12-05','固定期限','2027-03-14',14000,12000,2200,'刘芳','13900000005','总部25F','active'),
('sunzr@star.dev',     '孙子瑞','男','13800000006','HR','hr-recruit','P2','2022-06-01','1995-03-18','固定期限','2025-05-31',13000,11000,2000,'孙丽','13900000006','总部25F','active'),
-- 财务部
('zhaoqf@star.dev',    '赵清芳','女','13800000007','FIN','fin-mgr','M2','2019-05-20','1985-09-12','无固定期限',null,35000,22000,4000,'赵刚','13900000007','总部26F','active'),
('qianhy@star.dev',    '钱海燕','女','13800000008','FIN','accountant','P3','2020-04-01','1988-07-30','固定期限','2026-03-31',21000,17000,3000,'钱伟','13900000008','总部26F','active'),
('zhoujl@star.dev',    '周金玲','女','13800000009','FIN','cashier','P1','2023-01-09','1997-02-14','固定期限','2026-01-08',9000,8000,1500,'周明','13900000009','总部26F','active'),
-- 技术研发部
('wutech@star.dev',    '吴铁柱','男','13800000010','TECH','tech-dir','M3','2019-02-18','1982-10-25','无固定期限',null,52000,28000,5000,'吴芳','13900000010','总部20F','active'),
('zhengkj@star.dev',   '郑凯杰','男','13800000011','TECH','architect','P5','2019-08-01','1984-05-03','无固定期限',null,48000,28000,5000,'郑丽','13900000011','总部20F','active'),
('fengyl@star.dev',    '冯宇龙','男','13800000012','TECH','be-dev','P4','2020-03-01','1989-01-17','固定期限','2026-02-28',32000,22000,4000,'冯梅','13900000012','总部20F','active'),
('chuxm@star.dev',     '褚晓明','男','13800000013','TECH','be-dev','P3','2021-07-01','1991-06-28','固定期限','2027-06-30',24000,18000,3200,'褚华','13900000013','总部20F','active'),
('weijh@star.dev',     '卫嘉豪','男','13800000014','TECH','fe-dev','P3','2021-04-15','1993-09-10','固定期限','2027-04-14',23000,18000,3200,'卫红','13900000014','总部20F','active'),
('jiangmn@star.dev',   '蒋梦妮','女','13800000015','TECH','fe-dev','P2','2022-08-01','1996-04-22','固定期限','2025-07-31',16000,13000,2400,'蒋伟','13900000015','总部20F','active'),
('hanxl@star.dev',     '韩晓龙','男','13800000016','TECH','qa','P2','2022-01-10','1994-11-08','固定期限','2025-01-09',15000,12000,2200,'韩芳','13900000016','总部20F','active'),
('yangrf@star.dev',    '杨瑞峰','男','13800000017','TECH','devops','P3','2020-11-01','1990-07-19','固定期限','2026-10-31',25000,18000,3200,'杨丽','13900000017','总部20F','active'),
-- 产品部
('zhupm@star.dev',     '朱品墨','男','13800000018','PROD','prod-dir','M2','2019-11-01','1986-03-25','无固定期限',null,38000,24000,4200,'朱华','13900000018','总部22F','active'),
('xujy@star.dev',      '许静怡','女','13800000019','PROD','pm','P3','2021-02-01','1991-12-15','固定期限','2027-01-31',22000,17000,3000,'许强','13900000019','总部22F','active'),
('hesl@star.dev',      '何诗琳','女','13800000020','PROD','ui','P2','2022-05-01','1995-08-30','固定期限','2025-04-30',15000,12000,2200,'何明','13900000020','总部22F','active'),
-- 市场营销部
('lvmkt@star.dev',     '吕明凯','男','13800000021','MKT','mkt-mgr','M2','2020-01-15','1987-11-02','固定期限','2026-01-14',30000,20000,3600,'吕芳','13900000021','总部23F','active'),
('shiyq@star.dev',     '施雨晴','女','13800000022','MKT','brand','P2','2021-09-01','1994-06-18','固定期限','2027-08-31',14000,11000,2000,'施伟','13900000022','总部23F','active'),
('tangxm@star.dev',    '唐晓梦','女','13800000023','MKT','social','P1','2023-03-01','1998-01-25','固定期限','2026-02-28',9500,8000,1500,'唐华','13900000023','总部23F','active'),
-- 销售部
('caosales@star.dev',  '曹胜利','男','13800000024','SALES','sales-mgr','M2','2019-09-01','1986-08-14','无固定期限',null,32000,22000,4000,'曹丽','13900000024','总部24F','active'),
('yuanke@star.dev',    '袁可欣','女','13800000025','SALES','account-mgr','P3','2020-06-01','1990-02-28','固定期限','2026-05-31',20000,16000,2800,'袁强','13900000025','总部24F','active'),
('dengxf@star.dev',    '邓晓峰','男','13800000026','SALES','sales-rep','P2','2021-11-01','1993-10-05','固定期限','2027-10-31',12000,10000,1800,'邓芳','13900000026','总部24F','active'),
('xiaojr@star.dev',    '萧嘉瑞','男','13800000027','SALES','sales-rep','P1','2023-07-01','1999-05-12','固定期限','2026-06-30',8500,7000,1300,'萧华','13900000027','总部24F','active'),
-- 运营部
('panops@star.dev',    '潘运达','男','13800000028','OPS','ops-mgr','M2','2020-02-01','1988-04-20','固定期限','2026-01-31',28000,20000,3600,'潘丽','13900000028','总部21F','active'),
('duanxy@star.dev',    '段晓雨','女','13800000029','OPS','data-analyst','P2','2022-03-01','1995-07-08','固定期限','2025-02-28',15000,12000,2200,'段伟','13900000029','总部21F','active'),
-- 行政部
('songadm@star.dev',   '宋安冬','女','13800000030','ADMIN','admin-mgr','M1','2020-08-01','1989-09-16','固定期限','2026-07-31',18000,14000,2600,'宋强','13900000030','总部1F','active'),
('majie@star.dev',     '马洁',  '女','13800000031','ADMIN','reception','P1','2023-09-01','2000-03-22','固定期限','2026-08-31',7000,6000,1100,'马华','13900000031','总部1F','active'),
-- 法务部
('guolegal@star.dev',  '郭立安','男','13800000032','LEGAL','legal-mgr','M2','2020-05-01','1985-12-10','固定期限','2026-04-30',33000,22000,4000,'郭芳','13900000032','总部27F','active'),
('linff@star.dev',     '林菲菲','女','13800000033','LEGAL','legal-spec','P2','2022-09-01','1994-02-18','固定期限','2025-08-31',14000,11000,2000,'林伟','13900000033','总部27F','active');

-- ============================================
-- 批量更新 profiles
-- ============================================
update public.profiles p set
  name = e.name,
  gender = e.gender,
  phone = e.phone,
  department = (select name from public.departments where code = e.dept_code),
  department_id = (select id from public.departments where code = e.dept_code),
  job_title = (select name from public.positions where code = e.position_code),
  position_id = (select id from public.positions where code = e.position_code),
  job_level = (select name from public.job_levels where code = e.level_code),
  job_level_id = (select id from public.job_levels where code = e.level_code),
  hire_date = e.hire_date,
  birthday = e.birthday,
  contract_type = e.contract_type,
  contract_end_date = e.contract_end_date,
  base_salary = e.base_salary,
  social_insurance_base = e.social_insurance_base,
  housing_fund_base = e.housing_fund_base,
  emergency_contact = e.emergency_contact,
  emergency_phone = e.emergency_phone,
  work_location = e.work_location,
  employee_status = e.employee_status,
  is_active = true
from _emp e
join auth.users u on u.email = e.email
where p.id = u.id;

-- 设置 admin 角色
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'admin@star.dev');

-- ============================================
-- 设置部门经理（用 auth.users email 反查 id）
-- ============================================
update public.departments set manager_id = (select u.id from auth.users u where u.email = 'admin@star.dev')   where code = 'ROOT';
update public.departments set manager_id = (select u.id from auth.users u where u.email = 'admin@star.dev')   where code = 'CEO';
update public.departments set manager_id = (select u.id from auth.users u where u.email = 'zhanghr@star.dev') where code = 'HR';
update public.departments set manager_id = (select u.id from auth.users u where u.email = 'zhaoqf@star.dev')  where code = 'FIN';
update public.departments set manager_id = (select u.id from auth.users u where u.email = 'wutech@star.dev')  where code = 'TECH';
update public.departments set manager_id = (select u.id from auth.users u where u.email = 'zhupm@star.dev')   where code = 'PROD';
update public.departments set manager_id = (select u.id from auth.users u where u.email = 'lvmkt@star.dev')   where code = 'MKT';
update public.departments set manager_id = (select u.id from auth.users u where u.email = 'caosales@star.dev') where code = 'SALES';
update public.departments set manager_id = (select u.id from auth.users u where u.email = 'panops@star.dev')  where code = 'OPS';
update public.departments set manager_id = (select u.id from auth.users u where u.email = 'songadm@star.dev') where code = 'ADMIN';
update public.departments set manager_id = (select u.id from auth.users u where u.email = 'guolegal@star.dev') where code = 'LEGAL';

-- ============================================
-- 创建 employee_positions 主职位记录
-- ============================================
insert into public.employee_positions (employee_id, department_id, position_id, is_primary, start_date)
select p.id, p.department_id, p.position_id, true, coalesce(p.hire_date, current_date)
from public.profiles p
where p.department_id is not null and p.position_id is not null
  and not exists (
    select 1 from public.employee_positions ep
    where ep.employee_id = p.id and ep.is_primary = true and ep.end_date is null
  );

-- ============================================
-- 设置 report_to（直属上级 = 部门经理，经理的上级 = CEO）
-- ============================================
update public.profiles p set report_to = d.manager_id
from public.departments d
where p.department_id = d.id
  and d.manager_id is not null
  and d.manager_id != p.id;

-- 部门经理的上级 = CEO
update public.profiles p set report_to = (select u.id from auth.users u where u.email = 'admin@star.dev')
from public.departments d
where p.department_id = d.id
  and d.manager_id = p.id
  and d.code != 'CEO' and d.code != 'ROOT';

drop table _emp;
