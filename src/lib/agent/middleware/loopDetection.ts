import { createLoopController } from '@/lib/agent/LoopController';
import { logDiag } from '@/lib/diagnosis-log';
import type { ChatContext, Middleware } from './types';
import { errorResponse } from './types';

/**
 * Loop Detection Middleware
 *
 * 分析历史消息中的工具调用模式，检测是否存在循环调用。
 * 接入之前未使用的 LoopController 模块。
 */
export const loopDetectionMiddleware: Middleware = async (ctx, next) => {
  const controller = createLoopController();

  // Replay tool calls from message history
  for (const m of ctx.messages) {
    if (m.role === 'assistant' && Array.isArray(m.parts)) {
      for (const p of m.parts) {
        if (p.type === 'tool-invocation' || p.type === 'tool-call') {
          controller.recordToolCall(p.toolName || p.name || 'unknown', p.args || {});
          controller.incrementSteps();
        }
      }
    }
  }

  const check = controller.check();
  if (check.isLooping) {
    logDiag({ level: 'warn', source: 'agent:loop', message: check.reason || 'Loop detected', userId: ctx.userId });
    return errorResponse('检测到对话循环，请换个方式提问或开启新对话', 400);
  }

  return next();
};
