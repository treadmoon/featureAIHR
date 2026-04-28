/**
 * Chat Middleware Pipeline
 *
 * 借鉴 DeerFlow 中间件链设计，将 chat route 的过程式逻辑拆分为
 * 可组合、可测试、可独立开关的中间件管线。
 *
 * 执行顺序：
 * Auth → RateLimit → PromptGuard → RoleResolve → Cache
 * → PreHooks → TokenBudget → ContextPrepare → LoopDetection
 * → Stream → PostHooks
 */

import type { AgentContext } from '@/lib/agent/tools/types';

/** 贯穿整个管线的请求上下文 */
export interface ChatContext {
  // Auth
  userId: string;
  userEmail: string;

  // Input
  messages: any[];
  userText: string;

  // Role & Profile
  role: string;
  profile: { name?: string; department?: string; job_title?: string } | null;
  userName: string;

  // Agent
  agentContext: AgentContext | null;

  // Processed messages for LLM
  cleanedMessages: any[] | null;

  // Memory
  memoryPrompt: string;

  // Runtime tracking
  runtimeRecord: any;

  // Metadata
  timeStr: string;
  curMonth: string;
}

export type NextFn = () => Promise<Response>;
export type Middleware = (ctx: ChatContext, next: NextFn) => Promise<Response>;

/** JSON error response helper */
export function errorResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** 组合中间件为单一处理函数 */
export function compose(middlewares: Middleware[], finalHandler: (ctx: ChatContext) => Promise<Response>): (ctx: ChatContext) => Promise<Response> {
  return (ctx: ChatContext) => {
    let index = 0;
    const dispatch = (): Promise<Response> => {
      if (index >= middlewares.length) return finalHandler(ctx);
      const mw = middlewares[index++];
      return mw(ctx, dispatch);
    };
    return dispatch();
  };
}
