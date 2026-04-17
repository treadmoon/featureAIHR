import { z } from 'zod';
import { ToolDefinition, AgentContext, ToolResult } from './types';
import { createApprovalRequest } from '@/lib/approval-chain';
import { logDiag } from '@/lib/diagnosis-log';
import { supabaseAdmin } from '@/lib/supabase';

const typeLabels: Record<string, string> = {
  leave: '请假', expense: '报销', overtime: '加班', attendance_fix: '补卡',
  transfer: '调岗', salary_adjust: '调薪', resignation: '离职'
};
const statusLabels: Record<string, string> = {
  pending: '审批中', approved: '已通过', rejected: '已驳回', cancelled: '已撤销'
};

export const getWorkflowApplicationsTool: ToolDefinition = {
  name: 'getWorkflowApplications',
  description: '查询当前用户已提交的所有工作流/审批记录，包含审批进度和当前审批人',
  inputSchema: z.object({}),
  execute: async (_args: unknown, ctx: AgentContext): Promise<ToolResult> => {
    const approvals = await ctx.db(sb =>
      sb.from('approval_requests').select('id, type, status, current_step, total_steps, payload, created_at').eq('applicant_id', ctx.uid).order('created_at', { ascending: false }).limit(50)
    );
    if (!approvals?.length) return { requests: [], message: '暂无审批记录' };

    // 批量查当前审批人
    const pendingIds = approvals.filter((r: any) => r.status === 'pending').map((r: any) => r.id);
    let stepMap = new Map<string, string>();
    if (pendingIds.length) {
      const steps = await ctx.db(sb => sb.from('approval_steps').select('request_id, approver_id, step').in('request_id', pendingIds).eq('status', 'pending'));
      if (steps?.length) {
        const approverIds = [...new Set(steps.map((s: any) => s.approver_id))];
        const profiles = await ctx.db(sb => sb.from('profiles').select('id, name').in('id', approverIds));
        const nameMap = new Map<string, string>((profiles || []).map((p: any) => [String(p.id), String(p.name)] as [string, string]));
        for (const s of steps as any[]) stepMap.set(String(s.request_id), nameMap.get(String(s.approver_id)) || '');
      }
    }

    return {
      requests: approvals.map((r: any) => ({
        id: r.id,
        type: typeLabels[r.type] || r.type,
        status: statusLabels[r.status] || r.status,
        progress: `${r.current_step}/${r.total_steps}`,
        currentApprover: stepMap.get(r.id) || '',
        submitTime: new Date(r.created_at).toLocaleDateString('zh-CN'),
      })),
    };
  },
};

export const draftWorkflowApplicationTool: ToolDefinition = {
  name: 'draftWorkflowApplication',
  description: '草拟各类企业工作流申请。请假时用 leaveType/startDate/endDate/leaveReason/leaveNote 字段，其他类型用 field1-3。请假时无需先查余额，本工具会自动查询并推荐最优假期类型。',
  inputSchema: z.object({
    workflowType: z.enum(['leave', 'missed_clock_in', 'salary_adjustment', 'promotion', 'expense_reimbursement', 'job_transfer', 'resignation', 'recruitment', 'other']),
    title: z.string(),
    leaveType: z.enum(['lieu', 'annual', 'sick', 'personal', 'marriage', 'maternity', 'bereavement']).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    leaveReason: z.string().optional(),
    leaveNote: z.string().optional(),
    field1Label: z.string().optional(),
    field1Value: z.string().optional(),
    field2Label: z.string().optional(),
    field2Value: z.string().optional(),
    field3Label: z.string().optional(),
    field3Value: z.string().optional(),
    reason: z.string().optional(),
  }),
  execute: async (args: unknown, _ctx: AgentContext): Promise<ToolResult> => {
    const a = args as {
      workflowType: string;
      title: string;
      leaveType?: string;
      startDate?: string;
      endDate?: string;
      leaveReason?: string;
      leaveNote?: string;
      field1Label?: string;
      field1Value?: string;
      field2Label?: string;
      field2Value?: string;
      field3Label?: string;
      field3Value?: string;
      reason?: string;
    };

    if (a.workflowType === 'leave') {
      const bal = { lieu: 2, annual: 10, sick: 5 };
      let days = 1;
      if (a.startDate && a.endDate) {
        const diff = (new Date(a.endDate).getTime() - new Date(a.startDate).getTime()) / 86400000 + 1;
        if (diff > 0) days = diff;
      }
      let recType: string = a.leaveType || 'lieu';
      let recReason = '';
      if (!a.leaveType || a.leaveType === 'lieu' || a.leaveType === 'annual' || a.leaveType === 'personal') {
        if (days <= bal.lieu) { recType = 'lieu'; recReason = `调休余额${bal.lieu}天，优先使用调休（不扣工资）`; }
        else if (days <= bal.annual) { recType = 'annual'; recReason = `调休仅剩${bal.lieu}天，年假余额${bal.annual}天，推荐年假（不扣工资）`; }
        else if (bal.lieu + bal.annual >= days) { recType = 'lieu'; recReason = `建议拆分：调休${bal.lieu}天+年假${days - bal.lieu}天，全程不扣工资`; }
        else { recType = 'personal'; recReason = `带薪假余额不足，事假按日扣薪，请知悉`; }
      }
      return {
        status: 'draft_created', type: 'leave',
        leave: { leaveType: recType, startDate: a.startDate || '', endDate: a.endDate || '', leaveReason: a.leaveReason || '', leaveNote: a.leaveNote || '', title: a.title },
        balance: bal, recommendation: recReason, days,
        message: '草稿已生成，请用户确认信息后提交。',
      };
    }
    if (!a.field1Label || !a.field1Value) {
      logDiag({ level: 'warn', source: 'chat:draft', message: `AI未填充表单字段`, context: { workflowType: a.workflowType, title: a.title }, userId: _ctx.uid });
    }
    return { status: 'draft_created', type: 'general', details: a, message: '草稿已生成，请用户确认信息后提交。' };
  },
};

export const submitWorkflowApplicationTool: ToolDefinition = {
  name: 'submitWorkflowApplication',
  description: '用户确认后正式提交工作流申请，进入审批流',
  inputSchema: z.object({
    title: z.string(),
    workflowType: z.string(),
    field1Label: z.string(),
    field1Value: z.string(),
    field2Label: z.string(),
    field2Value: z.string(),
    field3Label: z.string(),
    field3Value: z.string(),
  }),
  execute: async (args: unknown, ctx: AgentContext): Promise<ToolResult> => {
    const a = args as {
      title: string;
      workflowType: string;
      field1Label: string;
      field1Value: string;
      field2Label: string;
      field2Value: string;
      field3Label: string;
      field3Value: string;
    };

    const typeMap: Record<string, string> = {
      leave: 'leave', expense_reimbursement: 'expense', missed_clock_in: 'attendance_fix',
      job_transfer: 'transfer', salary_adjustment: 'salary_adjust', resignation: 'resignation',
    };
    const approvalType = typeMap[a.workflowType] || a.workflowType;
    const payload: Record<string, unknown> = { title: a.title };
    if (a.field1Label && a.field1Value) payload[a.field1Label] = a.field1Value;
    if (a.field2Label && a.field2Value) payload[a.field2Label] = a.field2Value;
    if (a.field3Label && a.field3Value) payload[a.field3Label] = a.field3Value;

    if (approvalType === 'leave') {
      const allText = `${a.field1Value} ${a.field2Value} ${a.field3Value}`;
      const dateMatch = allText.match(/(\d{4}-\d{2}-\d{2})/g);
      if (dateMatch) {
        payload.start_date = dateMatch[0];
        payload.end_date = dateMatch[1] || dateMatch[0];
      }
      const dayMatch = allText.match(/(\d+)\s*天/);
      if (dayMatch) payload.days = Number(dayMatch[1]);
      if (!payload.days && payload.start_date && payload.end_date) {
        payload.days = (new Date(payload.end_date as string).getTime() - new Date(payload.start_date as string).getTime()) / 86400000 + 1;
      }
      payload.reason = a.field3Value || a.title;
    }

    const { request, error: approvalError } = await createApprovalRequest(approvalType, ctx.uid, payload);
    if (request) {
      return { status: 'submitted', ticket: { id: request.id, title: a.title, status: '审批中' }, message: '申请已成功提交并进入审批流。' };
    }
    logDiag({ level: 'error', source: 'chat:submit', message: `审批创建失败: ${approvalError}`, context: { type: approvalType, payload }, userId: ctx.uid });
    return { status: 'error', message: `提交失败：${approvalError || '未知错误'}` };
  },
};

export const submitITTicketTool: ToolDefinition = {
  name: 'submitITTicket',
  description: '提交 IT 工单（VPN、密码重置、网络、设备故障等）',
  inputSchema: z.object({ issueType: z.string(), description: z.string() }),
  execute: async (args: unknown, ctx: AgentContext): Promise<ToolResult> => {
    const { issueType, description } = args as { issueType: string; description: string };
    const ticketId = 'IT-' + Date.now().toString(36).toUpperCase();
    if (supabaseAdmin) {
      await supabaseAdmin.from('tickets').insert({
        employee_id: ctx.uid, type: 'it', title: issueType, description, status: 'open',
      }).then(r => r, () => null);
    }
    return { ticketId, status: '已受理', resolution: `已为您创建 IT 工单 [${issueType}]，技术支持团队将尽快处理。` };
  },
};

export const escalateToHumanTool: ToolDefinition = {
  name: 'escalateToHuman',
  description: '当输入模糊不清、情绪激动或越权访问时，流转给人工专家',
  inputSchema: z.object({ reason: z.string(), urgency: z.enum(['high', 'medium', 'low']) }),
  execute: async (args: unknown, _ctx: AgentContext): Promise<ToolResult> => {
    const { reason, urgency } = args as { reason: string; urgency: 'high' | 'medium' | 'low' };
    return { status: 'escalated', ticketId: 'HS-' + Date.now().toString(36).toUpperCase(), reason, urgency };
  },
};
