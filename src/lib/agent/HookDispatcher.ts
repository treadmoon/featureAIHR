/**
 * HookDispatcher - 切面调度器
 *
 * 在不修改核心逻辑的情况下，注入审计、安全扫描、业务逻辑。
 *
 * Hook 类型:
 * - pre: 推理前执行（如权限检查、安全扫描）
 * - post: 推理后执行（如结果记录、通知触发）
 */

import { logDiag } from '@/lib/diagnosis-log';
import { detectInjection } from '@/lib/prompt-guard';

export type HookType = 'pre' | 'post';

export interface HookContext {
  userId: string;
  role: string;
  timestamp: Date;
  [key: string]: unknown;
}

export interface HookResult {
  allowed: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Pre-Hook: 权限检查
 */
export async function permissionCheckHook(ctx: HookContext): Promise<HookResult> {
  // 权限已在 getServerRole 中验证，这里仅做日志记录
  if (ctx.role === 'employee' || ctx.role === 'manager' || ctx.role === 'hr' || ctx.role === 'admin') {
    return { allowed: true };
  }
  logDiag({
    level: 'warn',
    source: 'hook:permission',
    message: `Unknown role: ${ctx.role}`,
    context: ctx,
    userId: ctx.userId,
  });
  return { allowed: true }; // 不阻止，降级到最小权限
}

/**
 * Pre-Hook: Prompt 注入检测
 */
export async function injectionDetectionHook(ctx: HookContext): Promise<HookResult> {
  const userInput = ctx.userInput as string || '';
  const injection = detectInjection(userInput);

  if (injection.blocked) {
    logDiag({
      level: 'warn',
      source: 'hook:injection',
      message: injection.reason || 'Prompt injection blocked',
      context: { input: userInput.slice(0, 200) },
      userId: ctx.userId,
    });
    return {
      allowed: false,
      error: '检测到异常输入，请正常提问',
    };
  }

  return { allowed: true };
}

/**
 * Post-Hook: 操作审计日志
 */
export async function auditLogHook(ctx: HookContext, result?: unknown): Promise<void> {
  const metadata = result ? { resultType: typeof result } : undefined;
  logDiag({
    level: 'info',
    source: 'hook:audit',
    message: `Agent execution completed`,
    context: { ...ctx, ...metadata },
    userId: ctx.userId,
  });
}

/**
 * Post-Hook: 敏感操作告警
 */
export async function sensitiveOperationAlertHook(ctx: HookContext, result?: unknown): Promise<void> {
  const sensitiveActions = ctx.sensitiveActions as string[] || [];
  if (sensitiveActions.length === 0) return;

  logDiag({
    level: 'warn',
    source: 'hook:sensitive',
    message: `Sensitive operations performed: ${sensitiveActions.join(', ')}`,
    context: { ...ctx, sensitiveActions },
    userId: ctx.userId,
  });
}

type HookFn = (ctx: HookContext, result?: unknown) => Promise<HookResult | void>;

/**
 * Hook 调度器
 */
export class HookDispatcher {
  private preHooks: HookFn[] = [];
  private postHooks: HookFn[] = [];

  /**
   * 注册 Pre-Hook（在推理前执行）
   */
  registerPreHook(hook: HookFn): void {
    this.preHooks.push(hook);
  }

  /**
   * 注册 Post-Hook（在推理后执行）
   */
  registerPostHook(hook: HookFn): void {
    this.postHooks.push(hook);
  }

  /**
   * 执行 Pre-Hooks（任一失败则阻止）
   */
  async executePreHooks(ctx: HookContext): Promise<{ allowed: boolean; error?: string }> {
    for (const hook of this.preHooks) {
      try {
        const result = await hook(ctx);
        if (result && !result.allowed) {
          return { allowed: false, error: result.error };
        }
      } catch (err) {
        logDiag({
          level: 'error',
          source: 'hook:pre:error',
          message: `Pre-hook error: ${err instanceof Error ? err.message : String(err)}`,
          context: ctx,
          userId: ctx.userId,
        });
        // Pre-hook 错误不阻止流程，仅记录
      }
    }
    return { allowed: true };
  }

  /**
   * 执行 Post-Hooks（即使失败也继续）
   */
  async executePostHooks(ctx: HookContext, result?: unknown): Promise<void> {
    for (const hook of this.postHooks) {
      try {
        await hook(ctx, result);
      } catch (err) {
        logDiag({
          level: 'error',
          source: 'hook:post:error',
          message: `Post-hook error: ${err instanceof Error ? err.message : String(err)}`,
          context: ctx,
          userId: ctx.userId,
        });
        // Post-hook 错误不阻塞，仅记录
      }
    }
  }
}

/**
 * 创建默认 Hook 调度器
 */
export function createDefaultDispatcher(): HookDispatcher {
  const dispatcher = new HookDispatcher();

  // 注册默认 Pre-Hooks
  dispatcher.registerPreHook(permissionCheckHook);
  dispatcher.registerPreHook(injectionDetectionHook);

  // 注册默认 Post-Hooks
  dispatcher.registerPostHook(auditLogHook);
  dispatcher.registerPostHook(sensitiveOperationAlertHook);

  return dispatcher;
}

// 默认调度器单例
let defaultDispatcher: HookDispatcher | null = null;

export function getHookDispatcher(): HookDispatcher {
  if (!defaultDispatcher) {
    defaultDispatcher = createDefaultDispatcher();
  }
  return defaultDispatcher;
}
