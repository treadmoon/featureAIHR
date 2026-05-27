/**
 * ProviderRoute Middleware
 *
 * 对请求进行意图分类，记录路由决策用于可观测性。
 * 主聊天代理始终使用云端（需要工具调用能力），
 * 此中间件的分类结果供诊断日志和未来扩展使用。
 *
 * 插入 tokenBudget 和 contextPrepare 之间。
 */

import { logDiag } from '@/lib/diagnosis-log';
import type { ChatContext, Middleware } from './types';

// ── Simple intent patterns (edge-eligible) ──
const GREETING_PATTERN = /^(你好|hi|hello|hey|嗨|早|早上好|下午好|晚上好|在吗|在不在)[!！。.？?]*$/i;

const SIMPLE_QUERY_PATTERNS = [
  /^.{0,10}(年假|事假|病假|调休|加班|工资|薪水|考勤|打卡).{0,10}$/,
  /^.{0,10}(多少天|几天|余额|剩).{0,10}$/,
];

// Action keywords that should never be classified as "simple"
const ACTION_KEYWORDS = /提交|申请|请假|报销|删除|修改|更新|创建|新建|审批|批准|拒绝|取消|变更|调岗|转正|离职|入职|补签|打卡/;

function isSimpleIntent(text: string): boolean {
  const trimmed = text.trim();
  // Action requests are never simple, regardless of length
  if (ACTION_KEYWORDS.test(trimmed)) return false;
  // Greetings
  if (GREETING_PATTERN.test(trimmed)) return true;
  // Very short messages (≤4 chars) that aren't actions
  if (trimmed.length <= 4) return true;
  // Simple FAQ-style queries
  return SIMPLE_QUERY_PATTERNS.some(p => p.test(trimmed));
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
  // Default to cloud (main chat always uses cloud for tool calling)
  ctx.selectedProvider = 'cloud';

  // Check if edge task provider is configured
  const taskProvider = process.env.LLM_TASK_PROVIDER;
  if (!taskProvider || taskProvider === 'volcengine') {
    return next();
  }

  // Classify intent for observability
  const simple = isSimpleIntent(ctx.userText);
  const rolloutHit = shouldRouteToEdge();

  if (simple && rolloutHit) {
    ctx.selectedProvider = 'edge';
    logDiag({
      level: 'info',
      source: 'provider:route',
      message: 'Simple intent → edge',
      context: { textLength: ctx.userText.length },
      userId: ctx.userId,
    });
  } else {
    logDiag({
      level: 'info',
      source: 'provider:route',
      message: `${simple ? 'Simple' : 'Complex'} intent → cloud${simple ? ' (rollout miss)' : ''}`,
      context: { textLength: ctx.userText.length },
      userId: ctx.userId,
    });
  }

  return next();
};
