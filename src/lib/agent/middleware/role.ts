import { supabaseAdmin } from '@/lib/supabase';
import { logDiag } from '@/lib/diagnosis-log';
import { getServerRole } from '@/lib/auth-permissions';
import { isDemoMode } from '@/lib/llm-provider';
import type { ChatContext, Middleware } from './types';

export const roleMiddleware: Middleware = async (ctx, next) => {
  // Demo mode: use hardcoded role and profile, skip DB queries
  if (isDemoMode()) {
    ctx.role = 'employee';
    ctx.profile = { name: '演示用户', department: '技术部', job_title: '前端工程师' };
    ctx.userName = '演示用户';
    return next();
  }

  ctx.role = await getServerRole(ctx.userId);

  // Fetch profile
  if (supabaseAdmin) {
    const { data } = await supabaseAdmin.from('profiles').select('name, department, job_title').eq('id', ctx.userId).single();
    ctx.profile = data;
  }
  ctx.userName = ctx.profile?.name || ctx.userEmail.split('@')[0] || '用户';

  return next();
};
