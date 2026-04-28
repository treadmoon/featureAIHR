import { rateLimit } from '@/lib/rate-limit';
import type { ChatContext, Middleware } from './types';
import { errorResponse } from './types';

export const rateLimitMiddleware: Middleware = async (ctx, next) => {
  const { ok } = rateLimit(`chat:${ctx.userId}`, 20, 60000);
  if (!ok) return errorResponse('请求过于频繁，请稍后再试', 429);
  return next();
};
