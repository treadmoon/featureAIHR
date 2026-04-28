import { needsCompression, compressContext } from '@/lib/agent/ContextAssembler';
import { logDiag } from '@/lib/diagnosis-log';
import type { ChatContext, Middleware } from './types';

/**
 * Summarization Middleware
 *
 * 借鉴 DeerFlow 的 SummarizationMiddleware：
 * 当对话接近 token 上限时，用 LLM 摘要替代粗暴截断。
 */
export const summarizationMiddleware: Middleware = async (ctx, next) => {
  if (needsCompression(ctx.messages)) {
    const original = ctx.messages.length;
    ctx.messages = await compressContext(ctx.messages);
    logDiag({
      level: 'info',
      source: 'agent:summarize',
      message: `Context compressed: ${original} → ${ctx.messages.length} messages`,
      userId: ctx.userId,
    });
  }
  return next();
};
