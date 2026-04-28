import { detectInjection } from '@/lib/prompt-guard';
import { logDiag } from '@/lib/diagnosis-log';
import type { ChatContext, Middleware } from './types';
import { errorResponse } from './types';

export const promptGuardMiddleware: Middleware = async (ctx, next) => {
  const injection = detectInjection(ctx.userText);
  if (injection.blocked) {
    logDiag({ level: 'warn', source: 'chat:injection', message: injection.reason || 'prompt injection blocked', context: { input: ctx.userText.slice(0, 200) }, userId: ctx.userId });
    return errorResponse('检测到异常输入，请正常提问', 400);
  }
  return next();
};
