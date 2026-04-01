-- 性能优化索引
-- attendance 表高频查询索引
create index if not exists idx_attendance_emp_month on attendance(employee_id, month);

-- approval_requests 常用查询索引
create index if not exists idx_approval_req_applicant on approval_requests(applicant_id, status);
create index if not exists idx_approval_req_type_status on approval_requests(type, status);
create index if not exists idx_approval_req_created on approval_requests(created_at desc);

-- approval_steps 审批人查询索引
create index if not exists idx_approval_steps_approver on approval_steps(approver_id, status);

-- profiles 常用查询索引
create index if not exists idx_profiles_report_to on profiles(report_to) where report_to is not null;
create index if not exists idx_profiles_active on profiles(is_active);
create index if not exists idx_profiles_dept on profiles(department);

-- chat_messages session 查询索引（p8 已有，确认）
create index if not exists idx_messages_session on chat_messages(session_id, created_at);
