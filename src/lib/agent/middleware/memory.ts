import { getMemoryForPrompt } from '@/lib/agent/memory';
import { isDemoMode } from '@/lib/llm-provider';
import type { ChatContext, Middleware } from './types';

/**
 * Memory Injection Middleware
 *
 * 在 LLM 调用前获取用户长期记忆，挂到 ctx 上供 system prompt 使用。
 * 放在 ContextPrepare 之后、Stream 之前。
 */
export const memoryMiddleware: Middleware = async (ctx, next) => {
  if (isDemoMode()) {
    ctx.memoryPrompt = '<memory>\n- 用户偏好使用调休优先于年假\n- 用户在技术部工作，是一名前端工程师\n</memory>';
    return next();
  }
  ctx.memoryPrompt = await getMemoryForPrompt(ctx.userId);
  return next();
};
