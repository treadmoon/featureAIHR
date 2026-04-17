/**
 * Agent Tools Registry
 *
 * All tools are registered here and can be passed to Vercel AI SDK's streamText.
 * Tools are extracted from route.ts into modular files for better maintainability.
 */

import { tool } from 'ai';
import { z } from 'zod';
import { AgentContext } from './types';

// Employee tools
import {
  getLeaveBalanceTool,
  getAttendanceRecordsTool,
  getSalaryBreakdownTool,
  queryEmployeeSalaryTool,
} from './employee-tools';

// Workflow tools
import {
  getWorkflowApplicationsTool,
  draftWorkflowApplicationTool,
  submitWorkflowApplicationTool,
  submitITTicketTool,
  escalateToHumanTool,
} from './workflow-tools';

// Knowledge tools
import { searchCompanyPoliciesTool } from './knowledge-tools';

// Manager tools
import {
  getTeamAttendanceTool,
  getTeamLeaveCalendarTool,
  getTeamMembersTool,
} from './manager-tools';

// Admin tools
import {
  searchEmployeeTool,
  updateEmployeeTool,
  getCompanyStatsTool,
} from './admin-tools';

/**
 * Wraps a tool definition with the agent context for execution.
 * Returns a Vercel AI SDK compatible tool.
 */
function wrapTool(definition: { description: string; inputSchema: z.ZodSchema; execute: (args: unknown, ctx: AgentContext) => Promise<unknown> }, ctx: AgentContext) {
  return tool({
    description: definition.description,
    inputSchema: definition.inputSchema,
    execute: async (args: unknown) => {
      return definition.execute(args, ctx);
    },
  });
}

/**
 * Creates all tools for a given agent context.
 * Used by the chat route to pass tools to streamText.
 */
export function createTools(ctx: AgentContext) {
  return {
    getLeaveBalance: wrapTool(getLeaveBalanceTool, ctx),
    getAttendanceRecords: wrapTool(getAttendanceRecordsTool, ctx),
    getSalaryBreakdown: wrapTool(getSalaryBreakdownTool, ctx),
    queryEmployeeSalary: wrapTool(queryEmployeeSalaryTool, ctx),
    getWorkflowApplications: wrapTool(getWorkflowApplicationsTool, ctx),
    draftWorkflowApplication: wrapTool(draftWorkflowApplicationTool, ctx),
    submitWorkflowApplication: wrapTool(submitWorkflowApplicationTool, ctx),
    submitITTicket: wrapTool(submitITTicketTool, ctx),
    escalateToHuman: wrapTool(escalateToHumanTool, ctx),
    searchCompanyPolicies: wrapTool(searchCompanyPoliciesTool, ctx),
    getTeamAttendance: wrapTool(getTeamAttendanceTool, ctx),
    getTeamLeaveCalendar: wrapTool(getTeamLeaveCalendarTool, ctx),
    getTeamMembers: wrapTool(getTeamMembersTool, ctx),
    searchEmployee: wrapTool(searchEmployeeTool, ctx),
    updateEmployee: wrapTool(updateEmployeeTool, ctx),
    getCompanyStats: wrapTool(getCompanyStatsTool, ctx),
  };
}

export type { AgentContext, ToolResult } from './types';
