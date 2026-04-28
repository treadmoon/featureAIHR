import { z } from 'zod';
import { ToolDefinition, AgentContext, ToolResult } from './types';
import { supabaseAdmin } from '@/lib/supabase';

function escapeIlike(input: string): string {
  return input.replace(/[%_]/g, '\\\\$&');
}

export const searchEmployeeTool: ToolDefinition = {
  name: 'searchEmployee',
  description: '按姓名、部门或职位模糊搜索员工信息（仅 admin 可用）',
  requiredRoles: ['admin'],
  inputSchema: z.object({ keyword: z.string() }),
  execute: async (args: unknown, ctx: AgentContext): Promise<ToolResult> => {
    const { keyword } = args as { keyword: string };
    if (ctx.role !== 'admin') {
      return { error: '仅管理员可搜索员工信息' };
    }
    const k = escapeIlike(keyword);
    const results = await ctx.db(sb => sb.from('profiles').select('id, name, department, job_title, phone, is_active, hire_date').or(`name.ilike.%${k}%,department.ilike.%${k}%,job_title.ilike.%${k}%`).limit(10));
    if (!results?.length) return { results: [], message: `未找到匹配"${keyword}"的员工` };
    return { results: results.map((p: any) => ({ name: p.name, department: p.department, jobTitle: p.job_title, phone: p.phone, active: p.is_active, hireDate: p.hire_date })) };
  },
};

export const updateEmployeeTool: ToolDefinition = {
  name: 'updateEmployee',
  description: '修改员工的部门、职位、职级或状态（仅 admin 可用）。修改前必须先用 searchEmployee 确认员工存在。',
  requiredRoles: ['admin'],
  inputSchema: z.object({
    employeeName: z.string(),
    field: z.enum(['department', 'job_title', 'job_level', 'is_active', 'phone']),
    newValue: z.string()
  }),
  execute: async (args: unknown, ctx: AgentContext): Promise<ToolResult> => {
    const { employeeName, field, newValue } = args as {
      employeeName: string;
      field: 'department' | 'job_title' | 'job_level' | 'is_active' | 'phone';
      newValue: string;
    };
    if (ctx.role !== 'admin') {
      return { error: '仅管理员可修改员工信息' };
    }
    const safeName = escapeIlike(employeeName);
    const emp = await ctx.db(sb => sb.from('profiles').select('id, name').ilike('name', `%${safeName}%`).limit(1).single());
    if (!emp) return { error: `未找到员工"${employeeName}"` };
    const updateData: Record<string, unknown> = {};
    if (field === 'is_active') updateData[field] = newValue === 'true' || newValue === '启用';
    else updateData[field] = newValue;
    const { error: updateErr } = await supabaseAdmin!.from('profiles').update(updateData).eq('id', emp.id);
    if (updateErr) return { error: `修改失败: ${updateErr.message}` };
    return { success: true, name: emp.name, field, newValue, message: `已将${emp.name}的${field}修改为"${newValue}"` };
  },
};

export const getCompanyStatsTool: ToolDefinition = {
  name: 'getCompanyStats',
  description: '查询全公司统计数据：在职人数、部门分布、考勤异常率等（仅 admin 可用）',
  requiredRoles: ['admin'],
  inputSchema: z.object({ month: z.string().optional() }),
  execute: async (args: unknown, ctx: AgentContext): Promise<ToolResult> => {
    const { month } = args as { month?: string };
    if (ctx.role !== 'admin') {
      return { error: '仅管理员可查看全公司统计' };
    }
    const m = month || ctx.curMonth;
    const allProfiles = await ctx.db(sb => sb.from('profiles').select('id, department, is_active').limit(1000));
    const active = (allProfiles || []).filter((p: any) => p.is_active);
    const deptDist: Record<string, number> = {};
    active.forEach((p: any) => { const d = p.department || '未分配'; deptDist[d] = (deptDist[d] || 0) + 1; });
    const att = await ctx.db(sb => sb.from('attendance').select('late_count, absence_days, early_leave_count').eq('month', m));
    const rows = att || [];
    const totalAnomalies = rows.reduce((s: number, r: any) => s + (r.late_count || 0) + (r.absence_days || 0) + (r.early_leave_count || 0), 0);
    return {
      month: m,
      totalActive: active.length,
      totalInactive: (allProfiles || []).length - active.length,
      departmentDistribution: deptDist,
      attendanceReported: rows.length,
      totalAnomalies,
      anomalyRate: rows.length ? (totalAnomalies / rows.length).toFixed(1) + '次/人' : 'N/A'
    };
  },
};
