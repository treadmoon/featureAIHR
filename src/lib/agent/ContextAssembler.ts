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
 * 压缩上下文 — 用 LLM 摘要替代粗暴截断
 *
 * 策略：
 * 1. 保留 system prompt
 * 2. 如果超阈值，将旧消息交给 LLM 生成摘要
 * 3. 用 [摘要] 消息替换旧消息，保留最近 6 条原文
 * 4. 如果 LLM 摘要失败，降级为截断（保留最近 8 条）
 */
export async function compressContext(messages: Message[], maxTokens: number = 8192): Promise<Message[]> {
  const systemMessages = messages.filter(m => m.role === 'system');
  const otherMessages = messages.filter(m => m.role !== 'system');

  if (otherMessages.length <= 8) {
    return [...systemMessages, ...otherMessages];
  }

  const recentCount = 6;
  const oldMessages = otherMessages.slice(0, -recentCount);
  const recentMessages = otherMessages.slice(-recentCount);

  // Try LLM summarization
  try {
    const apiKey = process.env.VOLCENGINE_API_KEY;
    const modelId = process.env.VOLCENGINE_MODEL_ID;
    if (!apiKey || !modelId) throw new Error('no config');

    const { createOpenAI } = await import('@ai-sdk/openai');
    const { generateText } = await import('ai');
    const volcengine = createOpenAI({ apiKey, baseURL: 'https://ark.cn-beijing.volces.com/api/v3' });

    const oldText = oldMessages
      .map(m => {
        const text = m.content || m.parts?.filter(p => p.type === 'text').map(p => p.text || '').join(' ') || '';
        return `${m.role === 'user' ? '用户' : 'AI'}: ${text}`;
      })
      .join('\n')
      .slice(0, 3000); // Cap input to avoid token explosion

    const { text: summary } = await generateText({
      model: volcengine.chat(modelId),
      prompt: `请用2-3句话概括以下对话的要点，保留关键信息（如数字、日期、工单号、操作结果）：\n\n${oldText}`,
      maxOutputTokens: 200,
    });

    return [
      ...systemMessages,
      { role: 'assistant' as const, content: `[之前的对话摘要] ${summary}` },
      ...recentMessages,
    ];
  } catch {
    // Fallback: simple truncation
    return [...systemMessages, ...otherMessages.slice(-8)];
  }
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
