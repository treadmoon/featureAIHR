import { supabaseAdmin } from '@/lib/supabase';

export type Role = 'employee' | 'manager' | 'hr' | 'admin';

export class AuthError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Get user role from database (server-side only).
 * Never trust role from client — always compute server-side.
 */
export async function getServerRole(userId: string): Promise<Role> {
  const { data: profile } = await (supabaseAdmin!)
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (!profile) return 'employee';
  if (profile.role === 'admin') return 'admin';
  if (profile.role === 'hr') return 'hr';
  if (profile.role === 'manager') return 'manager';

  // Check if user is a department manager (via departments.manager_id)
  const { data: managed } = await (supabaseAdmin!)
    .from('departments')
    .select('id')
    .eq('manager_id', userId)
    .limit(1);

  if (managed && managed.length > 0) return 'manager';

  return 'employee';
}

/**
 * Verify user is authenticated. Throws AuthError if not.
 */
export async function requireAuth(userId: string | null): Promise<string> {
  if (!userId) throw new AuthError('未登录', 401);
  return userId;
}

/**
 * Verify user has one of the allowed roles. Throws AuthError if not.
 */
export async function requireRole(
  supabase: any,
  userId: string,
  ...allowed: Role[]
): Promise<Role> {
  const role = await getServerRole(userId);
  if (!allowed.includes(role)) {
    throw new AuthError(`无权限，需要 [${allowed.join('/')}] 角色`, 403);
  }
  return role;
}

/**
 * Verify user is admin. Throws AuthError if not.
 * Returns userId on success.
 */
export async function requireAdmin(supabase: any, userId: string): Promise<string> {
  const role = await getServerRole(userId);
  if (role !== 'admin') {
    throw new AuthError('无权限，需要管理员权限', 403);
  }
  return userId;
}

/**
 * Check if user can access a specific employee's data.
 * - Admin/HR can access anyone
 * - Manager can access their subordinates
 * - Employee can only access themselves
 */
export async function canAccessEmployee(
  viewerId: string,
  targetEmployeeId: string
): Promise<boolean> {
  if (viewerId === targetEmployeeId) return true;

  const role = await getServerRole(viewerId);
  if (role === 'admin' || role === 'hr') return true;

  if (role === 'manager') {
    // Check if target is in viewer's team
    const { data: subordinate } = await (supabaseAdmin!)
      .from('profiles')
      .select('id')
      .eq('id', targetEmployeeId)
      .eq('report_to', viewerId)
      .limit(1);
    return !!subordinate && subordinate.length > 0;
  }

  return false;
}
