/**
 * Agent Tools Registry
 *
 * 按角色动态过滤工具，避免给 LLM 暴露不该使用的工具（减少幻觉）。
 */

import { tool } from 'ai';
import { z } from 'zod';
import { AgentContext, ToolDefinition } from './types';

import { getLeaveBalanceTool, getAttendanceRecordsTool, getSalaryBreakdownTool, queryEmployeeSalaryTool } from './employee-tools';
import { getWorkflowApplicationsTool, draftWorkflowApplicationTool, submitWorkflowApplicationTool, submitITTicketTool, escalateToHumanTool } from './workflow-tools';
import { searchCompanyPoliciesTool } from './knowledge-tools';
import { getTeamAttendanceTool, getTeamLeaveCalendarTool, getTeamMembersTool } from './manager-tools';
import { searchEmployeeTool, updateEmployeeTool, getCompanyStatsTool } from './admin-tools';

/** All tool definitions with their names */
const ALL_TOOLS: [string, ToolDefinition][] = [
  // Employee — everyone
  ['getLeaveBalance', getLeaveBalanceTool],
  ['getAttendanceRecords', getAttendanceRecordsTool],
  ['getSalaryBreakdown', getSalaryBreakdownTool],
  ['queryEmployeeSalary', queryEmployeeSalaryTool],
  // Workflow — everyone
  ['getWorkflowApplications', getWorkflowApplicationsTool],
  ['draftWorkflowApplication', draftWorkflowApplicationTool],
  ['submitWorkflowApplication', submitWorkflowApplicationTool],
  ['submitITTicket', submitITTicketTool],
  ['escalateToHuman', escalateToHumanTool],
  // Knowledge — everyone
  ['searchCompanyPolicies', searchCompanyPoliciesTool],
  // Manager — manager, hr, admin
  ['getTeamAttendance', getTeamAttendanceTool],
  ['getTeamLeaveCalendar', getTeamLeaveCalendarTool],
  ['getTeamMembers', getTeamMembersTool],
  // Admin — admin only
  ['searchEmployee', searchEmployeeTool],
  ['updateEmployee', updateEmployeeTool],
  ['getCompanyStats', getCompanyStatsTool],
];

function wrapTool(def: ToolDefinition, ctx: AgentContext) {
  return tool({
    description: def.description,
    inputSchema: def.inputSchema,
    execute: async (args: unknown) => def.execute(args, ctx),
  });
}

/** Check if a role can access a tool */
function canAccess(def: ToolDefinition, role: string): boolean {
  if (!def.requiredRoles || def.requiredRoles.length === 0) return true;
  return def.requiredRoles.includes(role);
}

/**
 * Creates tools filtered by user role.
 * Manager/admin tools are hidden from employees at the LLM level.
 */
export function createTools(ctx: AgentContext) {
  const result: Record<string, any> = {};
  for (const [name, def] of ALL_TOOLS) {
    if (canAccess(def, ctx.role)) {
      result[name] = wrapTool(def, ctx);
    }
  }
  return result;
}

export type { AgentContext, ToolResult } from './types';
