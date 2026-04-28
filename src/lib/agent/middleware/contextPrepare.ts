import { convertToModelMessages } from 'ai';
import { buildAgentContext } from '@/lib/agent/ContextAssembler';
import { supabaseAdmin } from '@/lib/supabase';
import { logDiag } from '@/lib/diagnosis-log';
import type { ChatContext, Middleware } from './types';
import { errorResponse } from './types';

/** Supabase admin query helper */
async function db(query: (sb: NonNullable<typeof supabaseAdmin>) => PromiseLike<{ data: any; error: any }>): Promise<any> {
  if (!supabaseAdmin) return null;
  try {
    const { data, error } = await query(supabaseAdmin);
    if (error) { console.error('[db]', error.message); logDiag({ level: 'warn', source: 'chat:db', message: error.message }); return null; }
    return data;
  } catch { return null; }
}

export const contextPrepareMiddleware: Middleware = async (ctx, next) => {
  // Build AgentContext
  ctx.agentContext = buildAgentContext(ctx.userId, ctx.role, ctx.profile, ctx.userName, db);

  // Sanitize messages
  const sanitized = ctx.messages.map((m: any) => {
    if (m.role === 'assistant' && Array.isArray(m.parts)) {
      return { ...m, parts: m.parts.filter((p: any) => p.type === 'text' || (typeof p.type === 'string' && p.type.startsWith('tool-'))) };
    }
    return m;
  });

  // Convert to model messages
  let modelMessages;
  try {
    modelMessages = await convertToModelMessages(sanitized);
  } catch (err: any) {
    return errorResponse('Message conversion failed: ' + err.message, 400);
  }

  // Volcengine rejects tool-result role — collapse into assistant text
  const toolResults = new Map<string, any>();
  for (const m of modelMessages) {
    if (m.role === 'tool') {
      for (const part of m.content) {
        if (part.type === 'tool-result') toolResults.set(part.toolCallId, part.output);
      }
    }
  }

  const cleaned: any[] = [];
  for (const m of modelMessages) {
    if (m.role === 'tool') continue;
    if (m.role === 'assistant' && Array.isArray(m.content)) {
      const newContent = [];
      for (const part of m.content) {
        if (part.type === 'tool-call') {
          const res = toolResults.get(part.toolCallId);
          newContent.push({ type: 'text' as const, text: `[已调用工具 ${part.toolName}，结果: ${JSON.stringify(res ?? '无')}]` });
        } else if (part.type === 'text' && part.text) {
          newContent.push(part);
        }
      }
      if (newContent.length > 0) cleaned.push({ ...m, content: newContent });
    } else {
      cleaned.push(m);
    }
  }

  ctx.cleanedMessages = cleaned;
  return next();
};
