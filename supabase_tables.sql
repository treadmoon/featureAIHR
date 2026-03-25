-- ========================================
-- 员工档案表（含年假/调休余额、薪资）
-- ========================================
create table if not exists employee_profiles (
  id bigserial primary key,
  employee_id text unique not null,
  name text not null,
  department text not null,
  role text not null default 'employee',
  annual_leave_balance numeric(4,1) not null default 10,
  sick_leave_balance numeric(4,1) not null default 5,
  lieu_leave_balance numeric(4,1) not null default 0,
  base_salary numeric(10,2) not null default 0,
  housing_fund numeric(10,2) not null default 0,
  social_insurance numeric(10,2) not null default 0,
  tax numeric(10,2) not null default 0,
  created_at timestamptz default now()
);

-- ========================================
-- 考勤记录表
-- ========================================
create table if not exists attendance_records (
  id bigserial primary key,
  employee_id text not null references employee_profiles(employee_id),
  date date not null,
  clock_in time,
  clock_out time,
  status text not null default 'normal', -- normal / late / early_leave / absent / missed
  remark text,
  unique(employee_id, date)
);

-- ========================================
-- 工作流申请表（请假、报销等）
-- ========================================
create table if not exists workflow_applications (
  id bigserial primary key,
  ticket_id text unique not null,
  employee_id text not null references employee_profiles(employee_id),
  title text not null,
  workflow_type text not null,
  field1_label text, field1_value text,
  field2_label text, field2_value text,
  field3_label text, field3_value text,
  reason text,
  status text not null default '部门经理审批中',
  submitted_at timestamptz default now()
);

-- ========================================
-- 播种：模拟员工 demo_001
-- ========================================
insert into employee_profiles (employee_id, name, department, role, annual_leave_balance, sick_leave_balance, lieu_leave_balance, base_salary, housing_fund, social_insurance, tax)
values ('demo_001', '张三', '产品研发部', 'employee', 7.5, 4, 2, 18500.00, 1850.00, 1200.00, 680.00)
on conflict (employee_id) do nothing;

-- 播种：本月考勤记录
insert into attendance_records (employee_id, date, clock_in, clock_out, status, remark) values
  ('demo_001', '2026-03-02', '09:02', '18:30', 'normal', null),
  ('demo_001', '2026-03-03', '09:45', '18:20', 'late', '迟到45分钟'),
  ('demo_001', '2026-03-04', '08:55', '18:00', 'normal', null),
  ('demo_001', '2026-03-05', '09:00', '17:15', 'early_leave', '早退45分钟'),
  ('demo_001', '2026-03-06', '09:01', '18:35', 'normal', null),
  ('demo_001', '2026-03-09', '08:58', '18:10', 'normal', null),
  ('demo_001', '2026-03-10', null, null, 'missed', '全天未打卡'),
  ('demo_001', '2026-03-11', '09:00', '18:00', 'normal', null),
  ('demo_001', '2026-03-12', '09:03', '18:25', 'normal', null),
  ('demo_001', '2026-03-13', '08:50', '18:00', 'normal', null),
  ('demo_001', '2026-03-16', '09:00', '18:30', 'normal', null),
  ('demo_001', '2026-03-17', '09:10', '18:00', 'normal', null),
  ('demo_001', '2026-03-18', '09:00', '18:15', 'normal', null),
  ('demo_001', '2026-03-19', '08:55', '18:00', 'normal', null),
  ('demo_001', '2026-03-20', '09:00', '18:30', 'normal', null)
on conflict (employee_id, date) do nothing;
