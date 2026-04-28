import { getMemoryForPrompt } from '@/lib/agent/memory';
import type { ChatContext, Middleware } from './types';

/**
 * Memory Injection Middleware
 *
 * 在 LLM 调用前获取用户长期记忆，挂到 ctx 上供 system prompt 使用。
 * 放在 ContextPrepare 之后、Stream 之前。
 */
export const memoryMiddleware: Middleware = async (ctx, next) => {
  ctx.memoryPrompt = await getMemoryForPrompt(ctx.userId);
  return next();
};
