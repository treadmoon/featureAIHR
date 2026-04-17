/**
 * TokenBudget - Token 预算中间件
 *
 * 在推理前检查 token 使用量，防止超出限制。
 */

import { estimateMessagesTokens } from './ContextAssembler';
import { logDiag } from '@/lib/diagnosis-log';

export interface TokenBudgetConfig {
  maxTokens: number;
  warningThreshold?: number; // 默认 0.8 (80%)
  criticalThreshold?: number; // 默认 0.95 (95%)
}

export interface TokenBudgetResult {
  allowed: boolean;
  currentTokens: number;
  maxTokens: number;
  usagePercent: number;
  reason?: string;
}

/**
 * 检查 token 预算是否允许继续
 */
export function checkTokenBudget(
  messages: any[],
  config: TokenBudgetConfig = { maxTokens: 8192 }
): TokenBudgetResult {
  const { maxTokens, warningThreshold = 0.8, criticalThreshold = 0.95 } = config;

  // 清洗消息
  const cleanedMessages = messages.map((m: any) => {
    if (m.role === 'tool') return null;
    if (m.role === 'assistant' && Array.isArray(m.content)) {
      const textParts = m.content.filter((p: any) => p.type === 'text').map((p: any) => p.text || '');
      return { ...m, _cleanedText: textParts.join(' ') };
    }
    return m;
  }).filter(Boolean);

  const currentTokens = estimateMessagesTokens(cleanedMessages);
  const usagePercent = currentTokens / maxTokens;

  // 临界情况 - 直接拒绝
  if (usagePercent >= criticalThreshold) {
    return {
      allowed: false,
      currentTokens,
      maxTokens,
      usagePercent,
      reason: `Token 使用率已达 ${(usagePercent * 100).toFixed(0)}%，接近上限`,
    };
  }

  // 警告情况 - 允许但记录
  if (usagePercent >= warningThreshold) {
    logDiag({
      level: 'warn',
      source: 'agent:budget',
      message: `Token 使用率警告: ${(usagePercent * 100).toFixed(1)}%`,
      context: { currentTokens, maxTokens, usagePercent },
    });
  }

  return {
    allowed: true,
    currentTokens,
    maxTokens,
    usagePercent,
  };
}

/**
 * Token 预算中间件包装器
 */
export async function withTokenBudget<T>(
  messages: any[],
  config: TokenBudgetConfig,
  fn: () => Promise<T>
): Promise<{ result?: T; budget: TokenBudgetResult }> {
  const budget = checkTokenBudget(messages, config);

  if (!budget.allowed) {
    return { budget };
  }

  const result = await fn();
  return { result, budget };
}
