import { createClient } from '@/lib/supabase-server';
import type { ChatContext, Middleware } from './types';
import { errorResponse } from './types';

export const authMiddleware: Middleware = async (ctx, next) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return errorResponse('未登录', 401);

  ctx.userId = user.id;
  ctx.userEmail = user.email || '';
  return next();
};
