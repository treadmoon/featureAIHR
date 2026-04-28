import { getHookDispatcher } from '@/lib/agent/HookDispatcher';
import type { ChatContext, Middleware } from './types';
import { errorResponse } from './types';

export const preHooksMiddleware: Middleware = async (ctx, next) => {
  const dispatcher = getHookDispatcher();
  const result = await dispatcher.executePreHooks({
    userId: ctx.userId,
    role: ctx.role,
    timestamp: new Date(),
    userInput: ctx.userText,
  });

  if (!result.allowed) {
    ctx.runtimeRecord?.setError?.(`Pre-hook blocked: ${result.error}`);
    ctx.runtimeRecord?.finish?.();
    return errorResponse(result.error || '请求被安全策略拦截', 403);
  }

  return next();
};
