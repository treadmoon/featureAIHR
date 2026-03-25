import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createApprovalRequest } from '@/lib/approval-chain';

function sb() {
  return createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

async function getAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('id, role, name, department_id').eq('id', user.id).single();
  return profile ? { ...profile, userId: user.id } : null;
}

// 批量附加姓名/部门
async function attachNames(admin: ReturnType<typeof sb>, requests: Record<string, any>[]) {
  if (!requests.length) return [];
  const ids = [...new Set(requests.map(r => r.applicant_id))];
  const { data: profiles } = await admin.from('profiles').select('id, name, department_id').in('id', ids);
  const pMap = new Map((profiles || []).map(p => [p.id, p]));
  const deptIds = [...new Set((profiles || []).map(p => p.department_id).filter(Boolean))];
  const { data: depts } = deptIds.length ? await admin.from('departments').select('id, name').in('id', deptIds) : { data: [] };
  const dMap = new Map((depts || []).map(d => [d.id, d.name]));
  return requests.map(r => {
    const p = pMap.get(r.applicant_id);
    return { ...r, applicant_name: p?.name || '', applicant_dept: dMap.get(p?.department_id) || '' };
  });
}

// GET — 列表 or 详情
export async function GET(req: NextRequest) {
  const auth = await getAuth();
  if (!auth) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const admin = sb();

  // ── 详情模式：?id=xxx ──
  const id = req.nextUrl.searchParams.get('id');
  if (id) {
    const { data: request } = await admin.from('approval_requests').select('*').eq('id', id).single();
    if (!request) return NextResponse.json({ error: '未找到' }, { status: 404 });

    // 所有步骤 + 审批人姓名
    const { data: steps } = await admin.from('approval_steps')
      .select('*').eq('request_id', id).order('step');
    const approverIds = [...new Set((steps || []).map(s => s.approver_id))];
    const { data: approvers } = approverIds.length
      ? await admin.from('profiles').select('id, name').in('id', approverIds) : { data: [] };
    const nameMap = new Map((approvers || []).map(a => [a.id, a.name]));

    const stepsWithNames = (steps || []).map(s => ({
      ...s, approver_name: nameMap.get(s.approver_id) || '',
    }));

    // 申请人信息
    const { data: applicant } = await admin.from('profiles').select('id, name, department_id').eq('id', request.applicant_id).single();
    let deptName = '';
    if (applicant?.department_id) {
      const { data: dept } = await admin.from('departments').select('name').eq('id', applicant.department_id).single();
      deptName = dept?.name || '';
    }

    return NextResponse.json({
      ...request,
      applicant_name: applicant?.name || '',
      applicant_dept: deptName,
      steps: stepsWithNames,
    });
  }

  // ── 列表模式：?tab=pending|mine|done ──
  const tab = req.nextUrl.searchParams.get('tab') || 'pending';

  if (tab === 'pending') {
    // 关键修复：只查 step = request.current_step 的 pending 节点
    const { data: allSteps } = await admin.from('approval_steps')
      .select('request_id, step').eq('approver_id', auth.userId).eq('status', 'pending');
    if (!allSteps?.length) return NextResponse.json([]);

    const requestIds = allSteps.map(s => s.request_id);
    const { data: requests } = await admin.from('approval_requests')
      .select('*').in('id', requestIds).eq('status', 'pending').order('created_at', { ascending: false });

    // 过滤：只保留 step === current_step 的
    const stepMap = new Map(allSteps.map(s => [s.request_id, s.step]));
    const filtered = (requests || []).filter(r => stepMap.get(r.id) === r.current_step);
    return NextResponse.json(await attachNames(admin, filtered));
  }

  if (tab === 'mine') {
    const { data } = await admin.from('approval_requests')
      .select('*').eq('applicant_id', auth.userId).order('created_at', { ascending: false });
    return NextResponse.json(await attachNames(admin, data || []));
  }

  if (tab === 'done') {
    const { data: steps } = await admin.from('approval_steps')
      .select('request_id').eq('approver_id', auth.userId).in('status', ['approved', 'rejected']);
    const ids = [...new Set((steps || []).map(s => s.request_id))];
    if (!ids.length) return NextResponse.json([]);
    const { data } = await admin.from('approval_requests')
      .select('*').in('id', ids).order('created_at', { ascending: false });
    return NextResponse.json(await attachNames(admin, data || []));
  }

  return NextResponse.json([]);
}

// POST — 发起申请
export async function POST(req: NextRequest) {
  const auth = await getAuth();
  if (!auth) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const { type, payload } = await req.json();
  const validTypes = ['leave', 'expense', 'overtime', 'attendance_fix', 'transfer', 'salary_adjust', 'resignation', 'onboard'];
  if (!validTypes.includes(type)) return NextResponse.json({ error: '无效申请类型' }, { status: 400 });

  const { request, error } = await createApprovalRequest(type, auth.userId, payload || {});
  if (!request) return NextResponse.json({ error: error || '创建失败' }, { status: 500 });

  return NextResponse.json(request);
}

// PATCH — 审批操作 or 撤回
export async function PATCH(req: NextRequest) {
  const auth = await getAuth();
  if (!auth) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const { request_id, action, comment } = await req.json();
  if (!['approve', 'reject', 'cancel'].includes(action)) return NextResponse.json({ error: '无效操作' }, { status: 400 });

  const admin = sb();
  const { data: request } = await admin.from('approval_requests').select('*').eq('id', request_id).single();
  if (!request || request.status !== 'pending') return NextResponse.json({ error: '申请单状态异常' }, { status: 400 });

  // 撤回：仅申请人本人
  if (action === 'cancel') {
    if (request.applicant_id !== auth.userId) return NextResponse.json({ error: '只有申请人可以撤回' }, { status: 403 });
    await admin.from('approval_requests').update({ status: 'cancelled', completed_at: new Date().toISOString() }).eq('id', request_id);
    await admin.from('approval_steps').update({ status: 'skipped' }).eq('request_id', request_id).eq('status', 'pending');
    return NextResponse.json({ ok: true });
  }

  // 审批：必须是当前步骤的审批人
  const { data: step } = await admin.from('approval_steps')
    .select('*').eq('request_id', request_id).eq('step', request.current_step).eq('approver_id', auth.userId).eq('status', 'pending').single();
  if (!step) return NextResponse.json({ error: '你不是当前审批人' }, { status: 403 });

  await admin.from('approval_steps').update({
    status: action === 'approve' ? 'approved' : 'rejected',
    comment: comment || '', acted_at: new Date().toISOString(),
  }).eq('id', step.id);

  if (action === 'reject') {
    await admin.from('approval_requests').update({
      status: 'rejected', result_note: comment || '', completed_at: new Date().toISOString(),
    }).eq('id', request_id);
    await admin.from('approval_steps').update({ status: 'skipped' })
      .eq('request_id', request_id).gt('step', request.current_step).eq('status', 'pending');
  } else {
    if (request.current_step < request.total_steps) {
      await admin.from('approval_requests').update({ current_step: request.current_step + 1 }).eq('id', request_id);
    } else {
      await admin.from('approval_requests').update({
        status: 'approved', completed_at: new Date().toISOString(),
      }).eq('id', request_id);
      await onApproved(admin, request);
    }
  }

  return NextResponse.json({ ok: true });
}

async function onApproved(admin: ReturnType<typeof sb>, request: Record<string, any>) {
  const payload = request.payload || {};
  const uid = request.applicant_id;
  switch (request.type) {
    case 'transfer': {
      const u: Record<string, any> = {};
      if (payload.new_department_id) u.department_id = payload.new_department_id;
      if (payload.new_position_id) u.position_id = payload.new_position_id;
      if (Object.keys(u).length) await admin.from('profiles').update(u).eq('id', uid);
      break;
    }
    case 'salary_adjust':
      if (payload.new_salary) await admin.from('profiles').update({ base_salary: payload.new_salary }).eq('id', uid);
      break;
    case 'resignation':
      await admin.from('profiles').update({ employee_status: 'resigned', is_active: false }).eq('id', uid);
      break;
  }
}
