import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('未登录', { status: 401 });
  if (!supabaseAdmin) return Response.json([]);

  const { data: profile } = await supabase.from('profiles').select('role, name, department, hire_date').eq('id', user.id).single();
  const role = profile?.role || 'employee';

  // admin/hr/manager 都能看团队类通知
  const isManager = role === 'admin' || role === 'hr' || role === 'manager';

  const notifications: { type: string; icon: string; title: string; desc: string; action?: string }[] = [];
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lmStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

  // 并行查询所有数据
  const [birthdayRes, contractRes, pendingRes, myResultsRes, attRes] = await Promise.all([
    supabaseAdmin.from('profiles').select('name, birthday, department').eq('is_active', true).not('birthday', 'is', null),
    isManager ? supabaseAdmin.from('profiles').select('name, contract_end_date').eq('is_active', true).not('contract_end_date', 'is', null).lte('contract_end_date', in30).gte('contract_end_date', todayStr) : Promise.resolve({ data: null }),
    isManager ? supabaseAdmin.from('approval_steps').select('id').eq('approver_id', user.id).eq('status', 'pending') : Promise.resolve({ data: null }),
    supabaseAdmin.from('approval_requests').select('id, type, status, updated_at').eq('applicant_id', user.id).in('status', ['approved', 'rejected']).gte('updated_at', threeDaysAgo),
    supabaseAdmin.from('attendance').select('late_count, absence_days').eq('employee_id', user.id).eq('month', lmStr).single(),
  ]);

  // 1. 今日生日
  const myDept = profile?.department || '';
  const todayBirthdays = (birthdayRes.data || []).filter((p: any) => {
    if (!p.birthday) return false;
    const bd = p.birthday.slice(5);
    if (bd !== todayStr.slice(5)) return false;
    return isManager || p.department === myDept;
  });
  if (todayBirthdays.length > 0) {
    notifications.push({
      type: 'birthday', icon: '🎂',
      title: `今天是${todayBirthdays.map((p: any) => p.name).join('、')}的生日`,
      desc: '送上一句祝福吧！',
    });
  }

  // 2. 合同即将到期（经理/管理员可见）
  if (isManager && contractRes.data && contractRes.data.length > 0) {
    const expiring = contractRes.data;
    notifications.push({
      type: 'contract', icon: '⚠️',
      title: `${expiring.length} 名员工合同将在 30 天内到期`,
      desc: expiring.slice(0, 3).map((p: any) => `${p.name}(${p.contract_end_date})`).join('、'),
      action: '查看详情',
    });
  }

  // 3. 待审批提醒（经理/管理员）
  if (isManager && pendingRes.data && pendingRes.data.length > 0) {
    notifications.push({
      type: 'approval', icon: '📋',
      title: `你有 ${pendingRes.data.length} 条待审批事项`,
      desc: '点击前往审批工作台',
      action: '/approvals',
    });
  }

  // 3b. 我发起的申请有新结果
  const myResults = myResultsRes.data;
  if (myResults && myResults.length > 0) {
    const typeLabels: Record<string, string> = { leave: '请假', expense: '报销', overtime: '加班', attendance_fix: '补卡', transfer: '调岗', salary_adjust: '调薪' };
    const approved = myResults.filter((r: any) => r.status === 'approved');
    const rejected = myResults.filter((r: any) => r.status === 'rejected');
    if (approved.length > 0) {
      notifications.push({ type: 'approval_approved', icon: '✅', title: `你的${approved.map((r: any) => typeLabels[r.type] || r.type).join('、')}申请已通过`, desc: `共 ${approved.length} 条`, action: '/approvals' });
    }
    if (rejected.length > 0) {
      notifications.push({ type: 'approval_rejected', icon: '❌', title: `你的${rejected.map((r: any) => typeLabels[r.type] || r.type).join('、')}申请被驳回`, desc: '点击查看详情', action: '/approvals' });
    }
  }

  // 4. 新员工入职提醒（入职 7 天内）
  const sevenAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  if (profile?.hire_date && profile.hire_date >= sevenAgo) {
    notifications.push({
      type: 'onboarding', icon: '🎉',
      title: '欢迎加入！完成入职清单',
      desc: '完善个人信息、阅读员工手册、设置 VPN',
      action: 'onboarding',
    });
  }

  // 5. 考勤异常提醒
  const att = attRes.data;
  if (att && ((att.late_count || 0) + (att.absence_days || 0) > 0)) {
    notifications.push({
      type: 'attendance', icon: '⏰',
      title: `上月考勤有 ${(att.late_count || 0) + (att.absence_days || 0)} 条异常`,
      desc: `迟到 ${att.late_count || 0} 次，缺勤 ${att.absence_days || 0} 天`,
    });
  }

  return Response.json(notifications);
}
