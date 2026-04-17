import { z } from 'zod';
import { ToolDefinition, AgentContext, ToolResult } from './types';

export const getTeamAttendanceTool: ToolDefinition = {
  name: 'getTeamAttendance',
  description: '查询当前经理所管辖部门的团队考勤汇总（仅 manager/admin 可用）',
  inputSchema: z.object({ month: z.string().optional() }),
  execute: async (args: unknown, ctx: AgentContext): Promise<ToolResult> => {
    const { month } = args as { month?: string };
    if (ctx.role !== 'manager' && ctx.role !== 'admin') {
      return { error: '仅经理或管理员可查看团队考勤' };
    }
    const m = month || ctx.curMonth;
    let empIds: string[] = [];
    let deptName = '';

    if (ctx.role === 'admin') {
      const all = await ctx.db(sb => sb.from('profiles').select('id').eq('is_active', true));
      empIds = (all || []).map((p: any) => p.id) as string[];
      deptName = '全公司';
    } else {
      // 经理：并行查询部门成员和直属下属
      const [depts, subs] = await Promise.all([
        ctx.db(sb => sb.from('departments').select('id, name').eq('manager_id', ctx.uid)),
        ctx.db(sb => sb.from('profiles').select('id').eq('report_to', ctx.uid).eq('is_active', true)),
      ]);
      if (depts?.length) {
        deptName = depts.map((d: any) => d.name).join('、');
        const deptIds = depts.map((d: any) => d.id);
        const members = await ctx.db(sb => sb.from('employee_positions').select('employee_id').in('department_id', deptIds));
        empIds = [...new Set((members || []).map((m: any) => m.employee_id))] as string[];
      }
      if (!empIds.length && subs?.length) {
        empIds = subs.map((s: any) => s.id) as string[];
        deptName = '直属团队';
      }
    }

    if (!empIds.length) return { error: '未找到你管辖的团队成员' };
    const att = await ctx.db(sb => sb.from('attendance').select('*').in('employee_id', empIds).eq('month', m));
    const rows = att || [];
    const totalLate = rows.reduce((s: number, r: any) => s + (r.late_count || 0), 0);
    const totalAbsence = rows.reduce((s: number, r: any) => s + (r.absence_days || 0), 0);
    const totalEarly = rows.reduce((s: number, r: any) => s + (r.early_leave_count || 0), 0);
    const avgActual = rows.length ? (rows.reduce((s: number, r: any) => s + (r.actual_days || 0), 0) / rows.length).toFixed(1) : '0';
    return { month: m, deptName, totalMembers: empIds.length, reported: rows.length, late: totalLate, earlyLeave: totalEarly, absence: totalAbsence, avgAttendanceDays: avgActual };
  },
};

export const getTeamLeaveCalendarTool: ToolDefinition = {
  name: 'getTeamLeaveCalendar',
  description: '查看团队近期请假情况：谁请假了、什么时间、什么类型（仅 manager/admin 可用）',
  inputSchema: z.object({}),
  execute: async (_args: unknown, ctx: AgentContext): Promise<ToolResult> => {
    if (ctx.role !== 'manager' && ctx.role !== 'admin') {
      return { error: '仅经理或管理员可查看' };
    }
    const today = new Date().toISOString().slice(0, 10);
    const in14 = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
    const ago7 = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

    const reqs = await ctx.db(sb => sb.from('approval_requests').select('applicant_id, payload, created_at').eq('type', 'leave').eq('status', 'approved').gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()).limit(100));
    if (!reqs?.length) return { leaves: [], message: '近期没有已批准的请假记录' };

    const leaveLabels: Record<string, string> = { annual: '年假', sick: '病假', personal: '事假', lieu: '调休', marriage: '婚假', maternity: '产假', bereavement: '丧假' };
    const empIds = [...new Set(reqs.map((r: any) => r.applicant_id))];
    const profiles = await ctx.db(sb => sb.from('profiles').select('id, name, department').in('id', empIds));
    const nameMap = new Map((profiles || []).map((p: any) => [p.id, p.name]));

    const leaves = reqs.filter((r: any) => {
      const start = r.payload?.start_date || r.payload?.['开始日期'] || '';
      const end = r.payload?.end_date || r.payload?.['结束日期'] || '';
      return (start >= ago7 && start <= in14) || (end >= ago7 && end <= in14);
    }).map((r: any) => ({
      name: nameMap.get(r.applicant_id) || '未知',
      type: leaveLabels[r.payload?.leave_type] || r.payload?.['假期类型'] || '请假',
      start: r.payload?.start_date || r.payload?.['开始日期'] || '',
      end: r.payload?.end_date || r.payload?.['结束日期'] || '',
      days: r.payload?.days || r.payload?.['天数'] || '',
    })).sort((a: any, b: any) => a.start.localeCompare(b.start));

    return { leaves, period: `${ago7} ~ ${in14}` };
  },
};

export const getTeamMembersTool: ToolDefinition = {
  name: 'getTeamMembers',
  description: '查看当前经理管辖部门的团队花名册（仅 manager/admin 可用）',
  inputSchema: z.object({}),
  execute: async (_args: unknown, ctx: AgentContext): Promise<ToolResult> => {
    if (ctx.role !== 'manager' && ctx.role !== 'admin') {
      return { error: '仅经理或管理员可查看' };
    }
    let members: any[] = [];
    let deptName = '';

    if (ctx.role === 'admin') {
      members = await ctx.db(sb => sb.from('profiles').select('id, name, job_title, department, phone, is_active').eq('is_active', true).order('department').limit(100)) || [];
      deptName = '全公司';
    } else {
      const depts = await ctx.db(sb => sb.from('departments').select('id, name').eq('manager_id', ctx.uid));
      if (depts?.length) {
        deptName = depts.map((d: any) => d.name).join('、');
        const deptIds = depts.map((d: any) => d.id);
        const positions = await ctx.db(sb => sb.from('employee_positions').select('employee_id').in('department_id', deptIds));
        if (positions?.length) {
          const empIds = [...new Set(positions.map((p: any) => p.employee_id))];
          members = await ctx.db(sb => sb.from('profiles').select('id, name, job_title, phone, is_active').in('id', empIds)) || [];
        }
      }
      if (!members.length) {
        const subs = await ctx.db(sb => sb.from('profiles').select('id, name, job_title, phone, is_active').eq('report_to', ctx.uid).eq('is_active', true));
        if (subs?.length) { members = subs; deptName = '直属下属'; }
      }
    }

    if (!members.length) return { members: [], message: '未找到你管辖的团队成员' };
    return { deptName, members: members.map((p: any) => ({ name: p.name, jobTitle: p.job_title, department: p.department, phone: p.phone, active: p.is_active })) };
  },
};
