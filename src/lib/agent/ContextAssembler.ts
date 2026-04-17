/**
 * ContextAssembler - 上下文装配与压缩
 *
 * 功能：
 * 1. 装配用户上下文（profile、role、time）
 * 2. Token 计数（简单估算）
 * 3. 70% 阈值触发摘要
 */

import { AgentContext, DbQueryFn } from './tools/types';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  parts?: Array<{ type: string; text?: string }>;
}

/**
 * 简单 token 估算（中文约 1 token/字符，英文约 4 token/词）
 */
function estimateTokens(text: string): number {
  const cjkCount = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const otherCount = text.length - cjkCount;
  return Math.ceil(cjkCount + otherCount * 0.25);
}

/**
 * 估算消息数组的总 token 数
 */
export function estimateMessagesTokens(messages: Message[]): number {
  return messages.reduce((sum, msg) => {
    let text = '';
    if (msg.content) {
      text = msg.content;
    } else if (msg.parts) {
      text = msg.parts.filter(p => p.type === 'text').map(p => p.text || '').join(' ');
    }
    return sum + estimateTokens(text);
  }, 0);
}

/**
 * 检查是否需要上下文压缩（超过 70% 阈值）
 */
export function needsCompression(messages: Message[], maxTokens: number = 8192, threshold: number = 0.7): boolean {
  const total = estimateMessagesTokens(messages);
  return total > maxTokens * threshold;
}

/**
 * 压缩上下文 - 保留最近的消息和关键信息
 *
 * 策略：
 * 1. 保留 system prompt（不压缩）
 * 2. 保留最近 10 条消息
 * 3. 丢弃中间的冗余内容
 */
export function compressContext(messages: Message[], maxTokens: number = 8192): Message[] {
  const systemMessages = messages.filter(m => m.role === 'system');
  const otherMessages = messages.filter(m => m.role !== 'system');

  // 保留最近的 10 条
  const recentMessages = otherMessages.slice(-10);

  // 检查 token 数
  const currentTokens = estimateMessagesTokens(recentMessages);
  if (currentTokens <= maxTokens * 0.7) {
    return [...systemMessages, ...recentMessages];
  }

  // 进一步压缩：保留最近 5 条
  return [...systemMessages, ...otherMessages.slice(-5)];
}

/**
 * 装配 AgentContext
 */
export function buildAgentContext(
  uid: string,
  role: string,
  profile: { name?: string; department?: string; job_title?: string } | null,
  userName: string,
  db?: DbQueryFn
): AgentContext {
  const now = new Date();
  const weekDays = ['日','一','二','三','四','五','六'];
  const curMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  return {
    uid,
    role,
    userName,
    profile: profile || undefined,
    curMonth,
    db: db || (async () => null),
  };
}
