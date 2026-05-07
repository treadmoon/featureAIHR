import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-permissions';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

/**
 * Get the authenticated user from Supabase session.
 * Returns null user if not authenticated.
 */
export async function getAuthUser(): Promise<{ supabase: SupabaseClient; user: User | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

/**
 * Require authentication. Returns 401 response if not authenticated.
 * On success, returns the supabase client and user.
 */
export async function requireAuthUser(): Promise<
  | { supabase: SupabaseClient; user: User; error?: never }
  | { error: NextResponse }
> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { error: NextResponse.json({ error: '未登录' }, { status: 401 }) };
  return { supabase, user };
}

/**
 * Require admin authentication. Returns 401/403 response on failure.
 * On success, returns the supabase client and user.
 */
export async function requireAdminUser(): Promise<
  | { supabase: SupabaseClient; user: User; error?: never }
  | { error: NextResponse }
> {
  const result = await requireAuthUser();
  if ('error' in result) return result;
  try {
    await requireAdmin(result.supabase, result.user.id);
    return result;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '无权限';
    const status = (e && typeof e === 'object' && 'status' in e) ? (e as { status: number }).status : 403;
    return { error: NextResponse.json({ error: message }, { status }) };
  }
}

/**
 * Safely parse JSON body from a request. Returns 400 response on parse failure.
 */
export async function parseBody(req: Request): Promise<
  | { data: unknown; error?: never }
  | { error: NextResponse }
> {
  try {
    const data = await req.json();
    return { data };
  } catch {
    return { error: NextResponse.json({ error: '无效的请求体' }, { status: 400 }) };
  }
}
