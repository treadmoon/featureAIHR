import { supabaseAdmin } from '@/lib/supabase';
import { logDiag } from '@/lib/diagnosis-log';

/**
 * Build approval steps logic — returns step definitions without writing to DB.
 * The actual atomic write is done by create_approval_request_atomic RPC.
 */
export async function buildSteps(type: string, applicantId: string, payload: Record<string, unknown>) {
  const admin = supabaseAdmin!;
  const { data: applicant } = await admin.from('profiles').select('department_id').eq('id', applicantId).single();
  let managerId: string | null = null;
  if (applicant?.department_id) {
    const { data: dept } = await admin.from('departments').select('manager_id, parent_id').eq('id', applicant.department_id).single();
    managerId = dept?.manager_id || null;
    if (managerId === applicantId && dept?.parent_id) {
      const { data: parentDept } = await admin.from('departments').select('manager_id').eq('id', dept.parent_id).single();
      managerId = parentDept?.manager_id || null;
    }
  }

  // 并行查询 HR 和 Finance 部门经理
  const [hrDept, finDept] = await Promise.all([
    admin.from('departments').select('manager_id').eq('code', 'HR').maybeSingle(),
    admin.from('departments').select('manager_id').eq('code', 'FIN').maybeSingle(),
  ]);
  const hrManagerId = hrDept?.data?.manager_id || null;
  const finManagerId = finDept?.data?.manager_id || null;

  const steps: { step: number; approver_id: string }[] = [];

  switch (type) {
    case 'leave': {
      const days = Number(payload.days) || 1;
      if (managerId) steps.push({ step: 1, approver_id: managerId });
      if (days > 3 && hrManagerId && hrManagerId !== managerId) steps.push({ step: steps.length + 1, approver_id: hrManagerId });
      break;
    }
    case 'expense': {
      const amount = Number(payload.amount) || 0;
      if (managerId) steps.push({ step: 1, approver_id: managerId });
      if (amount > 5000 && finManagerId && finManagerId !== managerId) steps.push({ step: steps.length + 1, approver_id: finManagerId });
      break;
    }
    case 'overtime':
    case 'attendance_fix':
      if (managerId) steps.push({ step: 1, approver_id: managerId });
      break;
    case 'transfer':
    case 'salary_adjust':
      steps.push({ step: 1, approver_id: applicantId });
      if (managerId) steps.push({ step: 2, approver_id: managerId });
      break;
    case 'resignation':
      if (managerId) steps.push({ step: 1, approver_id: managerId });
      if (hrManagerId && hrManagerId !== managerId) steps.push({ step: steps.length + 1, approver_id: hrManagerId });
      break;
    case 'onboard':
      steps.push({ step: 1, approver_id: applicantId });
      break;
  }

  if (steps.length === 0) {
    const { data: admins } = await admin.from('profiles').select('id').eq('role', 'admin').limit(1);
    if (admins?.[0]) steps.push({ step: 1, approver_id: admins[0].id });
    logDiag({ level: 'warn', source: 'approval:chain', message: `审批链为空，回退到admin`, context: { type, applicantId, managerId, hrManagerId, finManagerId }, userId: applicantId });
  }

  return steps;
}

/**
 * Create an approval request atomically using RPC transaction.
 * This ensures request + steps are written together or not at all.
 */
export async function createApprovalRequest(
  type: string,
  applicantId: string,
  payload: Record<string, unknown>
): Promise<{ request?: any; error?: string }> {
  try {
    const { data, error } = await (supabaseAdmin!)
      .rpc('create_approval_request_atomic', {
        p_type: type,
        p_applicant_id: applicantId,
        p_payload: payload,
      });

    if (error) {
      logDiag({ level: 'error', source: 'approval:create', message: error.message, context: { type, payload }, userId: applicantId });
      return { error: error.message };
    }

    // Validate UUID response
    if (typeof data !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data)) {
      logDiag({ level: 'error', source: 'approval:create', message: `Invalid RPC response: ${JSON.stringify(data)}`, context: { type, payload }, userId: applicantId });
      return { error: '创建申请失败，请重试' };
    }

    return { request: { id: data } };
  } catch (err: any) {
    logDiag({ level: 'error', source: 'approval:create', message: err.message, context: { type, payload }, userId: applicantId });
    return { error: err.message };
  }
}
