/**
 * ProviderRoute Middleware
 *
 * 根据请求复杂度和运行时条件，选择 edge 或 cloud 提供商。
 * 插入 tokenBudget 和 contextPrepare 之间。
 */

import { logDiag } from '@/lib/diagnosis-log';
import type { ChatContext, Middleware } from './types';

// ── Simple intent patterns (edge-eligible) ──
const GREETING_PATTERN = /^(你好|hi|hello|hey|嗨|早|早上好|下午好|晚上好|在吗|在不在)[!！。.？?]*$/i;

const SIMPLE_QUERY_PATTERNS = [
  /^.{0,10}(年假|事假|病假|调休|加班|工资|薪水|考勤|打卡).{0,10}$/,
  /^.{0,10}(多少天|几天|余额|剩).{0,10}$/,
  /^.{0,10}(怎么|如何|在哪|哪里).{0,20}$/,
];

function isSimpleIntent(text: string): boolean {
  const trimmed = text.trim();
  // Very short messages are likely simple
  if (trimmed.length <= 10) return true;
  // Greetings
  if (GREETING_PATTERN.test(trimmed)) return true;
  // Simple FAQ-style queries
  return SIMPLE_QUERY_PATTERNS.some(p => p.test(trimmed));
}

// ── Edge provider health cache ──
let edgeHealthy: boolean | null = null;
let edgeHealthCheckedAt = 0;
const HEALTH_CACHE_TTL = 60_000; // 1 minute

async function checkEdgeHealth(): Promise<boolean> {
  const now = Date.now();
  if (edgeHealthy !== null && now - edgeHealthCheckedAt < HEALTH_CACHE_TTL) {
    return edgeHealthy;
  }

  try {
    const { getTaskModel } = await import('@/lib/llm-provider');
    const { generateText } = await import('ai');

    const model = getTaskModel();
    await generateText({
      model,
      prompt: 'ping',
      maxOutputTokens: 5,
    });

    edgeHealthy = true;
    edgeHealthCheckedAt = now;
    return true;
  } catch {
    edgeHealthy = false;
    edgeHealthCheckedAt = now;
    logDiag({ level: 'warn', source: 'provider:health', message: 'Edge provider health check failed, falling back to cloud' });
    return false;
  }
}

// ── Rollout percentage ──
function shouldRouteToEdge(): boolean {
  const pct = parseInt(process.env.EDGE_ROLLOUT_PERCENT || '0', 10);
  if (pct <= 0) return false;
  if (pct >= 100) return true;
  return Math.random() * 100 < pct;
}

// ── Middleware ──
export const providerRouteMiddleware: Middleware = async (ctx, next) => {
  // Default to cloud (safe)
  ctx.selectedProvider = 'cloud';

  // Check if edge is configured
  const taskProvider = process.env.LLM_TASK_PROVIDER;
  if (!taskProvider || taskProvider === 'volcengine') {
    return next();
  }

  // Check rollout percentage
  if (!shouldRouteToEdge()) {
    return next();
  }

  // Check if request is simple enough for edge
  if (!isSimpleIntent(ctx.userText)) {
    logDiag({
      level: 'info',
      source: 'provider:route',
      message: 'Complex intent → cloud',
      userId: ctx.userId,
    });
    return next();
  }

  // Check edge health
  const healthy = await checkEdgeHealth();
  if (!healthy) {
    ctx.selectedProvider = 'cloud';
    return next();
  }

  ctx.selectedProvider = 'edge';
  logDiag({
    level: 'info',
    source: 'provider:route',
    message: 'Simple intent → edge',
    userId: ctx.userId,
  });

  return next();
};
