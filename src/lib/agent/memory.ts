/**
 * Long-Term Memory System
 *
 * 借鉴 DeerFlow 的 Memory 设计：
 * - 对话结束后异步提取 facts
 * - 下次对话时注入系统 prompt
 * - 去重写入，避免重复记忆
 */

import { supabaseAdmin } from '@/lib/supabase';
import { logDiag } from '@/lib/diagnosis-log';
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

const MAX_FACTS_PER_USER = 50;
const MAX_INJECTION_FACTS = 10;

interface MemoryFact {
  category: 'preference' | 'context' | 'knowledge' | 'behavior';
  content: string;
  confidence: number;
}

/**
 * 从对话中提取记忆 facts（异步，对话结束后调用）
 */
export async function extractMemory(userId: string, role: string, conversation: { role: string; text: string }[]): Promise<void> {
  if (!supabaseAdmin || !process.env.VOLCENGINE_API_KEY) return;

  // Only process if there's meaningful conversation (at least 1 user + 1 assistant message)
  const userMsgs = conversation.filter(m => m.role === 'user');
  const assistantMsgs = conversation.filter(m => m.role === 'assistant');
  if (userMsgs.length === 0 || assistantMsgs.length === 0) return;

  try {
    const volcengine = createOpenAI({
      apiKey: process.env.VOLCENGINE_API_KEY,
      baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
    });

    const conversationText = conversation
      .slice(-10) // Last 10 messages
      .map(m => `${m.role === 'user' ? '用户' : 'AI'}: ${m.text}`)
      .join('\n');

    const { object } = await generateObject({
      model: volcengine.chat(process.env.VOLCENGINE_MODEL_ID || ''),
      schema: z.object({
        facts: z.array(z.object({
          category: z.enum(['preference', 'context', 'knowledge', 'behavior']),
          content: z.string().describe('简洁的一句话事实描述'),
          confidence: z.number().min(0).max(1),
        })).describe('从对话中提取的用户相关事实，最多5条'),
      }),
      prompt: `分析以下企业HR助手与用户的对话，提取值得长期记住的用户事实。

规则：
- preference: 用户偏好（如语言、沟通风格、常用功能）
- context: 用户背景（如部门、项目、工作习惯）
- knowledge: 用户关心的知识点（如特定政策、流程）
- behavior: 用户行为模式（如经常查询的内容）
- 只提取明确的事实，不要推测
- confidence 0.7-1.0，越确定越高
- 忽略一次性的查询（如"今天天气"），只保留有长期价值的信息
- 如果对话没有值得记住的内容，返回空数组

用户角色: ${role}

对话内容:
${conversationText}`,
    });

    if (!object.facts || object.facts.length === 0) return;

    // Filter by confidence threshold
    const validFacts = object.facts.filter(f => f.confidence >= 0.7);
    if (validFacts.length === 0) return;

    // Deduplicate against existing memory
    const { data: existing } = await supabaseAdmin
      .from('user_memory')
      .select('content')
      .eq('user_id', userId);

    const existingContents = new Set((existing || []).map((e: any) => e.content.trim().toLowerCase()));
    const newFacts = validFacts.filter(f => !existingContents.has(f.content.trim().toLowerCase()));

    if (newFacts.length === 0) return;

    // Enforce max facts limit — remove oldest low-confidence ones if needed
    const currentCount = existing?.length || 0;
    if (currentCount + newFacts.length > MAX_FACTS_PER_USER) {
      const toRemove = currentCount + newFacts.length - MAX_FACTS_PER_USER;
      const { data: oldest } = await supabaseAdmin
        .from('user_memory')
        .select('id')
        .eq('user_id', userId)
        .order('confidence', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(toRemove);
      if (oldest?.length) {
        await supabaseAdmin.from('user_memory').delete().in('id', oldest.map((o: any) => o.id));
      }
    }

    // Insert new facts
    await supabaseAdmin.from('user_memory').insert(
      newFacts.map(f => ({
        user_id: userId,
        category: f.category,
        content: f.content,
        confidence: f.confidence,
        source: 'chat',
      }))
    );

    logDiag({ level: 'info', source: 'memory:extract', message: `Extracted ${newFacts.length} facts`, userId });
  } catch (err) {
    logDiag({ level: 'warn', source: 'memory:extract', message: `Memory extraction failed: ${err}`, userId });
  }
}

/**
 * 获取用户记忆，用于注入系统 prompt
 */
export async function getMemoryForPrompt(userId: string): Promise<string> {
  if (!supabaseAdmin) return '';

  try {
    const { data } = await supabaseAdmin
      .from('user_memory')
      .select('category, content')
      .eq('user_id', userId)
      .order('confidence', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(MAX_INJECTION_FACTS);

    if (!data || data.length === 0) return '';

    const grouped: Record<string, string[]> = {};
    for (const fact of data) {
      if (!grouped[fact.category]) grouped[fact.category] = [];
      grouped[fact.category].push(fact.content);
    }

    const labels: Record<string, string> = {
      preference: '偏好',
      context: '背景',
      knowledge: '关注点',
      behavior: '习惯',
    };

    const lines = Object.entries(grouped)
      .map(([cat, facts]) => `${labels[cat] || cat}: ${facts.join('；')}`)
      .join('\n');

    return `\n<memory>\n${lines}\n</memory>`;
  } catch {
    return '';
  }
}
