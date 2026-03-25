import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('未登录', { status: 401 });
  if (!supabaseAdmin) return Response.json([]);

  const { data: profile } = await supabase.from('profiles').select('role, name').eq('id', user.id).single();
  const role = profile?.role || 'employee';

  // 判断是否经理
  const { data: managed } = await supabaseAdmin.from('departments').select('id').eq('manager_id', user.id).limit(1);
  const isManager = (managed && managed.length > 0) || role === 'admin';

  const notifications: { type: string; icon: string; title: string; desc: string; action?: string }[] = [];
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  // 1. 今日生日（经理/管理员可见全部，员工只看同部门）
  const { data: birthdays } = await supabaseAdmin
    .from('profiles')
    .select('name, birthday, department')
    .eq('is_active', true)
    .not('birthday', 'is', null);
  const todayBirthdays = (birthdays || []).filter((p: any) => {
    if (!p.birthday) return false;
    const bd = p.birthday.slice(5); // MM-DD
    return bd === todayStr.slice(5);
  });
  if (todayBirthdays.length > 0) {
    notifications.push({
      type: 'birthday', icon: '🎂',
      title: `今天是${todayBirthdays.map((p: any) => p.name).join('、')}的生日`,
      desc: '送上一句祝福吧！',
    });
  }

  // 2. 合同即将到期（经理/管理员可见）
  if (isManager) {
    const { data: expiring } = await supabaseAdmin
      .from('profiles')
      .select('name, contract_end_date')
      .eq('is_active', true)
      .not('contract_end_date', 'is', null)
      .lte('contract_end_date', in30)
      .gte('contract_end_date', todayStr);
    if (expiring && expiring.length > 0) {
      notifications.push({
        type: 'contract', icon: '⚠️',
        title: `${expiring.length} 名员工合同将在 30 天内到期`,
        desc: expiring.slice(0, 3).map((p: any) => `${p.name}(${p.contract_end_date})`).join('、'),
        action: '查看详情',
      });
    }
  }

  // 3. 待审批提醒（经理/管理员）
  if (isManager) {
    const { data: pending } = await supabaseAdmin
      .from('approval_steps')
      .select('id')
      .eq('approver_id', user.id)
      .eq('status', 'pending');
    if (pending && pending.length > 0) {
      notifications.push({
        type: 'approval', icon: '📋',
        title: `你有 ${pending.length} 条待审批事项`,
        desc: '点击前往审批工作台',
        action: '/approvals',
      });
    }
  }

  // 4. 新员工入职提醒（入职 7 天内）
  const sevenAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const { data: myProfile } = await supabaseAdmin.from('profiles').select('hire_date').eq('id', user.id).single();
  if (myProfile?.hire_date && myProfile.hire_date >= sevenAgo) {
    notifications.push({
      type: 'onboarding', icon: '🎉',
      title: '欢迎加入！完成入职清单',
      desc: '完善个人信息、阅读员工手册、设置 VPN',
      action: 'onboarding',
    });
  }

  // 5. 考勤异常提醒（员工自己上月有异常）
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lmStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
  const { data: att } = await supabaseAdmin
    .from('attendance')
    .select('late_count, absence_days')
    .eq('employee_id', user.id)
    .eq('month', lmStr)
    .single();
  if (att && ((att.late_count || 0) + (att.absence_days || 0) > 0)) {
    notifications.push({
      type: 'attendance', icon: '⏰',
      title: `上月考勤有 ${(att.late_count || 0) + (att.absence_days || 0)} 条异常`,
      desc: `迟到 ${att.late_count || 0} 次，缺勤 ${att.absence_days || 0} 天`,
    });
  }

  return Response.json(notifications);
}
