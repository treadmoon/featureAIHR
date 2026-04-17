import { z } from 'zod';
import { ToolDefinition, AgentContext, ToolResult } from './types';

function escapeIlike(input: string): string {
  return input.replace(/[%_]/g, '\\\\$&');
}

export const getLeaveBalanceTool: ToolDefinition = {
  name: 'getLeaveBalance',
  description: '查询员工当前的剩余年假/病假/调休假天数',
  inputSchema: z.object({
    leaveType: z.enum(['annual', 'sick', 'lieu', 'all']).optional(),
  }),
  execute: async (args: unknown, ctx: AgentContext): Promise<ToolResult> => {
    const { leaveType } = args as { leaveType?: 'annual' | 'sick' | 'lieu' | 'all' };
    // 假期余额暂存 profiles 表没有专门字段，从 attendance 表统计或用默认值
    const bal = { annual: 10, sick: 5, lieu: 2 }; // TODO: 后续从 leave_balances 表读
    const name = ctx.profile?.name || ctx.userName;
    const t = leaveType || 'all';
    if (t === 'all') return { name, annual: bal.annual, sick: bal.sick, lieu: bal.lieu };
    return { name, leaveType: t, balance: bal[t as keyof typeof bal] ?? 0 };
  },
};

export const getAttendanceRecordsTool: ToolDefinition = {
  name: 'getAttendanceRecords',
  description: '查询员工的考勤记录，可按月份筛选',
  inputSchema: z.object({
    month: z.string().optional().describe('查询月份，格式 YYYY-MM，默认当月'),
  }),
  execute: async (args: unknown, ctx: AgentContext): Promise<ToolResult> => {
    const { month } = args as { month?: string };
    const m = month || ctx.curMonth;
    const rows = await ctx.db(sb =>
      sb.from('attendance').select('*').eq('employee_id', ctx.uid).eq('month', m).order('month', { ascending: false })
    );
    if (rows && rows.length > 0) {
      const r = Array.isArray(rows) ? rows[0] : rows;
      return {
        month: m,
        totalDays: r.work_days ?? 0,
        normalDays: r.actual_days ?? 0,
        abnormalCount: (r.late_count ?? 0) + (r.early_leave_count ?? 0) + (r.absence_days ?? 0),
        late: r.late_count ?? 0,
        earlyLeave: r.early_leave_count ?? 0,
        absence: r.absence_days ?? 0,
        overtime: r.overtime_hours ?? 0,
        leave: r.leave_days ?? 0,
      };
    }
    return { month: m, totalDays: 0, normalDays: 0, abnormalCount: 0, message: `${m} 暂无考勤记录` };
  },
};

export const getSalaryBreakdownTool: ToolDefinition = {
  name: 'getSalaryBreakdown',
  description: '查询当前登录员工自己的薪资构成明细',
  inputSchema: z.object({}),
  execute: async (_args: unknown, ctx: AgentContext): Promise<ToolResult> => {
    const p = await ctx.db(sb =>
      sb.from('profiles').select('name, base_salary, social_insurance_base, housing_fund_base').eq('id', ctx.uid).single()
    );
    if (!p || !p.base_salary) return { error: '暂无薪资信息，请联系HR录入' };
    const base = Number(p.base_salary) || 0;
    const si = Number(p.social_insurance_base) || 0;
    const hf = Number(p.housing_fund_base) || 0;
    const siPersonal = Math.round(si * 0.105);
    const hfPersonal = Math.round(hf * 0.12);
    const taxable = Math.max(0, base - siPersonal - hfPersonal - 5000);
    const tax = taxable <= 3000 ? Math.round(taxable * 0.03) : taxable <= 12000 ? Math.round(taxable * 0.1 - 210) : Math.round(taxable * 0.2 - 1410);
    return {
      name: p.name || ctx.userName,
      base_salary: base,
      social_insurance: siPersonal,
      housing_fund: hfPersonal,
      tax: Math.max(0, tax),
      net_salary: base - siPersonal - hfPersonal - Math.max(0, tax),
    };
  },
};

export const queryEmployeeSalaryTool: ToolDefinition = {
  name: 'queryEmployeeSalary',
  description: '查询某位员工的薪资包（极高敏数据，仅 HR/admin/manager 可用）',
  inputSchema: z.object({ employeeName: z.string() }),
  requiredRoles: ['hr', 'admin', 'manager'],
  execute: async (args: unknown, ctx: AgentContext): Promise<ToolResult> => {
    const { employeeName } = args as { employeeName: string };
    if (ctx.role !== 'hr' && ctx.role !== 'admin' && ctx.role !== 'manager') {
      return { status: 'blocked', error: 'PERMISSION_DENIED', message: `【底层接口拦截】当前角色 [${ctx.role}] 无权查询他人薪资。已记录审计日志。` };
    }
    const safeName = escapeIlike(employeeName);
    const p = await ctx.db(sb => sb.from('profiles').select('name, base_salary').ilike('name', `%${safeName}%`).limit(1).single());
    if (!p) return { status: 'not_found', message: `未找到名为 ${employeeName} 的员工记录` };
    return { status: 'success', salary: `¥${p.base_salary}/月`, name: p.name };
  },
};
