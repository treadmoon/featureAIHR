import { createClient } from '@/lib/supabase-server';
import { isDemoMode } from '@/lib/llm-provider';
import type { ChatContext, Middleware } from './types';
import { errorResponse } from './types';

export const authMiddleware: Middleware = async (ctx, next) => {
  // Demo mode: use a fixed demo user, skip Supabase auth
  if (isDemoMode()) {
    ctx.userId = 'demo-user-001';
    ctx.userEmail = 'demo@star.dev';
    return next();
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return errorResponse('未登录', 401);

  ctx.userId = user.id;
  ctx.userEmail = user.email || '';
  return next();
};
