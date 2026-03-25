import { createClient } from '@supabase/supabase-js';
import { logDiag } from '@/lib/diagnosis-log';

function sb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export async function buildSteps(type: string, applicantId: string, payload: Record<string, unknown>) {
  const admin = sb();
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

  const { data: hrDept } = await admin.from('departments').select('manager_id').eq('code', 'HR').maybeSingle();
  const hrManagerId = hrDept?.manager_id || null;
  const { data: finDept } = await admin.from('departments').select('manager_id').eq('code', 'FIN').maybeSingle();
  const finManagerId = finDept?.manager_id || null;

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

/** Create an approval request with auto-generated chain. Returns { request } or { error }. */
export async function createApprovalRequest(type: string, applicantId: string, payload: Record<string, unknown>): Promise<{ request?: any; error?: string }> {
  const admin = sb();
  const steps = await buildSteps(type, applicantId, payload);

  const { data: request, error } = await admin.from('approval_requests').insert({
    type, applicant_id: applicantId, status: 'pending',
    current_step: 1, total_steps: steps.length,
    payload,
  }).select().single();

  if (error) { logDiag({ level: 'error', source: 'approval:create', message: error.message, context: { type, payload }, userId: applicantId }); return { error: error.message }; }
  if (!request) return { error: '创建失败' };

  for (const s of steps) {
    await admin.from('approval_steps').insert({ request_id: request.id, ...s });
  }

  return { request };
}
