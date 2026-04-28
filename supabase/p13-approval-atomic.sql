-- ============================================
-- P13: 审批链原子化 — 用 RPC 事务替代两步插入
-- ============================================

create or replace function public.create_approval_request_atomic(
  p_type text,
  p_applicant_id uuid,
  p_payload jsonb
) returns uuid as $$
declare
  v_request_id uuid;
  v_step_number integer := 0;
  v_dept_id uuid;
  v_manager_id uuid;
  v_parent_id uuid;
  v_hr_dept_id uuid;
  v_fin_dept_id uuid;
  v_hr_manager_id uuid;
  v_fin_manager_id uuid;
  v_admins uuid[];
  v_days numeric;
  v_amount numeric;
begin
  -- 1. 查询申请人部门
  select department_id into v_dept_id
  from profiles
  where id = p_applicant_id;

  -- 2. 查询部门经理
  if v_dept_id is not null then
    select manager_id, parent_id into v_manager_id, v_parent_id
    from departments
    where id = v_dept_id;

    -- 如果申请人是经理自己，向上找父部门经理
    if v_manager_id = p_applicant_id and v_parent_id is not null then
      select manager_id into v_manager_id
      from departments
      where id = v_parent_id;
    end if;
  end if;

  -- 3. 查询 HR 和 Finance 部门经理
  select manager_id into v_hr_manager_id
  from departments
  where code = 'HR'
  limit 1;

  select manager_id into v_fin_manager_id
  from departments
  where code = 'FIN'
  limit 1;

  -- 4. 创建 request（事务内）
  insert into approval_requests (type, applicant_id, status, current_step, total_steps, payload)
  values (p_type, p_applicant_id, 'pending', 1, 0, p_payload)
  returning id into v_request_id;

  -- 5. 根据类型构建审批链并批量插入 steps
  if p_type = 'leave' then
    v_days := (p_payload->>'days')::numeric;
    if v_manager_id is not null then
      v_step_number := v_step_number + 1;
      insert into approval_steps (request_id, step, approver_id) values (v_request_id, v_step_number, v_manager_id);
    end if;
    if v_days > 3 and v_hr_manager_id is not null and v_hr_manager_id != v_manager_id then
      v_step_number := v_step_number + 1;
      insert into approval_steps (request_id, step, approver_id) values (v_request_id, v_step_number, v_hr_manager_id);
    end if;

  elsif p_type = 'expense' then
    v_amount := (p_payload->>'amount')::numeric;
    if v_manager_id is not null then
      v_step_number := v_step_number + 1;
      insert into approval_steps (request_id, step, approver_id) values (v_request_id, v_step_number, v_manager_id);
    end if;
    if v_amount > 5000 and v_fin_manager_id is not null and v_fin_manager_id != v_manager_id then
      v_step_number := v_step_number + 1;
      insert into approval_steps (request_id, step, approver_id) values (v_request_id, v_step_number, v_fin_manager_id);
    end if;

  elsif p_type = 'overtime' or p_type = 'attendance_fix' then
    if v_manager_id is not null then
      v_step_number := v_step_number + 1;
      insert into approval_steps (request_id, step, approver_id) values (v_request_id, v_step_number, v_manager_id);
    end if;

  elsif p_type = 'transfer' or p_type = 'salary_adjust' then
    -- 先由申请人确认
    v_step_number := v_step_number + 1;
    insert into approval_steps (request_id, step, approver_id) values (v_request_id, v_step_number, p_applicant_id);
    if v_manager_id is not null then
      v_step_number := v_step_number + 1;
      insert into approval_steps (request_id, step, approver_id) values (v_request_id, v_step_number, v_manager_id);
    end if;

  elsif p_type = 'resignation' then
    if v_manager_id is not null then
      v_step_number := v_step_number + 1;
      insert into approval_steps (request_id, step, approver_id) values (v_request_id, v_step_number, v_manager_id);
    end if;
    if v_hr_manager_id is not null and v_hr_manager_id != v_manager_id then
      v_step_number := v_step_number + 1;
      insert into approval_steps (request_id, step, approver_id) values (v_request_id, v_step_number, v_hr_manager_id);
    end if;

  elsif p_type = 'onboard' then
    v_step_number := v_step_number + 1;
    insert into approval_steps (request_id, step, approver_id) values (v_request_id, v_step_number, p_applicant_id);

  elsif p_type = 'promotion' or p_type = 'recruitment' or p_type = 'other' then
    -- 这些类型需要经理和HR审批
    if v_manager_id is not null then
      v_step_number := v_step_number + 1;
      insert into approval_steps (request_id, step, approver_id) values (v_request_id, v_step_number, v_manager_id);
    end if;
    if v_hr_manager_id is not null and v_hr_manager_id != v_manager_id then
      v_step_number := v_step_number + 1;
      insert into approval_steps (request_id, step, approver_id) values (v_request_id, v_step_number, v_hr_manager_id);
    end if;
  end if;

  -- 兜底：没有任何审批人时由 admin 处理
  if v_step_number = 0 then
    select array_agg(id) into v_admins
    from profiles
    where role = 'admin'
    limit 1;
    if array_length(v_admins, 1) is not null then
      v_step_number := v_step_number + 1;
      insert into approval_steps (request_id, step, approver_id) values (v_request_id, v_step_number, v_admins[1]);
    end if;
  end if;

  -- 6. 回写 total_steps
  update approval_requests set total_steps = v_step_number where id = v_request_id;

  return v_request_id;
end;
$$ language plpgsql;

-- ============================================
-- P13b: 审批操作原子化 — 审批/驳回/撤回
-- ============================================

create or replace function public.approve_step_atomic(
  p_request_id uuid,
  p_approver_id uuid,
  p_action text,  -- 'approve' | 'reject'
  p_comment text default ''
) returns jsonb as $$
declare
  v_request record;
  v_step record;
  v_new_status text;
  v_completed_at timestamptz := now();
begin
  -- 获取申请单
  select * into v_request
  from approval_requests
  where id = p_request_id and status = 'pending'
  for update;

  if not found then
    return jsonb_build_object('error', '申请单不存在或状态异常');
  end if;

  -- 获取当前审批步骤
  select * into v_step
  from approval_steps
  where request_id = p_request_id
    and step = v_request.current_step
    and approver_id = p_approver_id
    and status = 'pending'
  for update;

  if not found then
    return jsonb_build_object('error', '你不是当前审批人');
  end if;

  -- 确定新状态
  if p_action = 'reject' then
    v_new_status := 'rejected';
  else
    v_new_status := 'approved';
  end if;

  -- 更新当前步骤
  update approval_steps
  set status = v_new_status, comment = p_comment, acted_at = v_completed_at
  where id = v_step.id;

  -- 处理申请单状态
  if p_action = 'reject' then
    -- 驳回：直接完成，跳过剩余步骤
    update approval_requests
    set status = 'rejected', result_note = p_comment, completed_at = v_completed_at
    where id = p_request_id;

    update approval_steps
    set status = 'skipped'
    where request_id = p_request_id and step > v_request.current_step and status = 'pending';

  else
    -- 批准：检查是否还有下一步
    if v_request.current_step < v_request.total_steps then
      -- 还有下一步，流转
      update approval_requests
      set current_step = v_request.current_step + 1
      where id = p_request_id;
    else
      -- 最后一步，审批完成
      update approval_requests
      set status = 'approved', completed_at = v_completed_at
      where id = p_request_id;
    end if;
  end if;

  return jsonb_build_object('ok', true, 'action', p_action, 'new_status', v_new_status);
end;
$$ language plpgsql;

create or replace function public.cancel_request_atomic(
  p_request_id uuid,
  p_user_id uuid
) returns jsonb as $$
declare
  v_request record;
begin
  select * into v_request
  from approval_requests
  where id = p_request_id and status = 'pending'
  for update;

  if not found then
    return jsonb_build_object('error', '申请单不存在或状态异常');
  end if;

  if v_request.applicant_id != p_user_id then
    return jsonb_build_object('error', '只有申请人可以撤回');
  end if;

  update approval_requests
  set status = 'cancelled', completed_at = now()
  where id = p_request_id;

  update approval_steps
  set status = 'skipped'
  where request_id = p_request_id and status = 'pending';

  return jsonb_build_object('ok', true);
end;
$$ language plpgsql;
