/**
 * SelfHealing - 轻量级自愈机制
 *
 * 适用场景：瞬时失败（网络超时、503）的自动重试。
 */

import { logDiag } from '@/lib/diagnosis-log';

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableErrors?: (err: unknown) => boolean;
}

/**
 * 判断错误是否可重试
 */
export function isRetryableError(err: unknown, retryableErrors?: (err: unknown) => boolean): boolean {
  if (retryableErrors) {
    return retryableErrors(err);
  }
  // 默认：网络错误、503、429 可重试
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return msg.includes('timeout') ||
           msg.includes('network') ||
           msg.includes('503') ||
           msg.includes('429') ||
           msg.includes('ECONNRESET') ||
           msg.includes('econnreset') ||
           msg.includes('socket');
  }
  return false;
}

/**
 * 带指数退避的异步重试
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    backoffMultiplier = 2,
    retryableErrors,
  } = options;

  let lastError: unknown;
  let delay = initialDelayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (attempt === maxAttempts) {
        break;
      }

      if (!isRetryableError(err, retryableErrors)) {
        throw err;
      }

      logDiag({
        level: 'warn',
        source: 'selfhealing:retry',
        message: `Attempt ${attempt}/${maxAttempts} failed, retrying in ${delay}ms`,
        context: { error: err instanceof Error ? err.message : String(err) },
      });

      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * backoffMultiplier, maxDelayMs);
    }
  }

  throw lastError;
}

/**
 * 降级处理：当工具不可用时返回部分结果而非整个请求失败
 */
export async function withGracefulDegradation<T>(
  fn: () => Promise<T>,
  fallback: T,
  errorMessage?: string
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (err) {
    logDiag({
      level: 'error',
      source: 'selfhealing:degradation',
      message: errorMessage || 'Operation failed, returning fallback',
      context: { error: err instanceof Error ? err.message : String(err) },
    });
    return { success: false, data: fallback, error: err instanceof Error ? err.message : String(err) };
  }
}
