import { z } from 'zod';

/** 数据库查询函数类型 */
export type DbQueryFn = (query: (sb: any) => PromiseLike<{ data: any; error: any }>) => Promise<any>;

/** 当前用户上下文 */
export interface AgentContext {
  uid: string;
  role: string;
  userName: string;
  profile?: {
    name?: string;
    department?: string;
    job_title?: string;
  };
  curMonth: string;
  db: DbQueryFn;
}

/** 工具执行结果 */
export interface ToolResult {
  [key: string]: unknown;
}

/** 工具定义 */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodSchema;
  execute: (args: unknown, ctx: AgentContext) => Promise<ToolResult>;
  requiredRoles?: string[];
}

/** 工具注册表项 */
export interface RegisteredTool {
  name: string;
  definition: ToolDefinition;
}
