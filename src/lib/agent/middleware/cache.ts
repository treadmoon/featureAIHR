import { cacheKey, getCache, shouldCache } from '@/lib/llm-cache';
import type { ChatContext, Middleware } from './types';

export const cacheMiddleware: Middleware = async (ctx, next) => {
  if (!shouldCache(ctx.userText)) return next();

  const ck = cacheKey(ctx.userId, ctx.role, ctx.userText);
  const cached = getCache(ck);
  if (cached) {
    const streamParts = [`0:${JSON.stringify({ role: 'assistant', content: cached.response })}\n`];
    return new Response(streamParts.join(''), {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Cache': 'HIT' },
    });
  }

  return next();
};
