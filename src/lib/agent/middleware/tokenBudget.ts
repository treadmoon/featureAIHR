import { checkTokenBudget } from '@/lib/agent/TokenBudget';
import { logDiag } from '@/lib/diagnosis-log';
import type { ChatContext, Middleware } from './types';
import { errorResponse } from './types';

export const tokenBudgetMiddleware: Middleware = async (ctx, next) => {
  const budget = checkTokenBudget(ctx.messages);
  if (!budget.allowed) {
    logDiag({ level: 'error', source: 'agent:budget', message: budget.reason || 'Token budget exceeded', context: { ...budget }, userId: ctx.userId });
    return errorResponse(budget.reason || '请求过长，请开启新对话', 400);
  }
  return next();
};
