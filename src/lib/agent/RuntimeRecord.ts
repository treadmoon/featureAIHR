/**
 * RuntimeRecord - 任务运行时记录
 *
 * 记录 Agent 执行过程中的关键节点，用于：
 * 1. 调试和问题排查
 * 2. 性能分析
 * 3. 循环检测
 */

import { logDiag } from '@/lib/diagnosis-log';

export interface StepRecord {
  step: number;
  timestamp: Date;
  action: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface ToolCallRecord {
  toolName: string;
  args: unknown;
  result?: unknown;
  error?: string;
  duration?: number;
  timestamp: Date;
}

export interface RuntimeRecordData {
  sessionId: string;
  userId: string;
  role: string;
  startTime: Date;
  endTime?: Date;
  totalSteps: number;
  currentStep: number;
  steps: StepRecord[];
  toolCalls: ToolCallRecord[];
  tokenUsage?: {
    input?: number;
    output?: number;
  };
  error?: string;
  context: Record<string, unknown>;
}

/**
 * RuntimeRecord - 追踪 Agent 执行过程
 */
export class RuntimeRecord {
  private data: RuntimeRecordData;
  private stepStartTime: number = Date.now();
  private toolStartTime: number = 0;
  private currentToolName: string = '';
  private currentToolArgs: unknown = null;

  constructor(sessionId: string, userId: string, role: string, context: Record<string, unknown> = {}) {
    this.data = {
      sessionId,
      userId,
      role,
      startTime: new Date(),
      totalSteps: 0,
      currentStep: 0,
      steps: [],
      toolCalls: [],
      context,
    };
  }

  /**
   * 记录步骤开始
   */
  startStep(action: string): void {
    this.stepStartTime = Date.now();
    this.data.currentStep++;
    this.data.totalSteps++;
  }

  /**
   * 记录步骤完成
   */
  completeStep(action: string, metadata?: Record<string, unknown>): void {
    const duration = Date.now() - this.stepStartTime;
    this.data.steps.push({
      step: this.data.currentStep,
      timestamp: new Date(),
      action,
      duration,
      metadata,
    });

    logDiag({
      level: 'info',
      source: 'runtime:step',
      message: `Step ${this.data.currentStep} completed: ${action}`,
      context: { sessionId: this.data.sessionId, duration, ...metadata },
      userId: this.data.userId,
    });
  }

  /**
   * 记录工具调用开始
   */
  startToolCall(toolName: string, args: unknown): void {
    this.toolStartTime = Date.now();
    this.currentToolName = toolName;
    this.currentToolArgs = args;
  }

  /**
   * 记录工具调用完成
   */
  completeToolCall(result?: unknown, error?: string): void {
    const duration = Date.now() - this.toolStartTime;
    this.data.toolCalls.push({
      toolName: this.currentToolName,
      args: this.currentToolArgs,
      result,
      error,
      duration,
      timestamp: new Date(),
    });

    // Clear current tool state
    this.currentToolName = '';
    this.currentToolArgs = null;

    logDiag({
      level: 'info',
      source: 'runtime:tool',
      message: `Tool ${this.currentToolName} ${error ? 'failed' : 'completed'}`,
      context: {
        sessionId: this.data.sessionId,
        toolName: this.currentToolName,
        duration,
        hasError: !!error,
      },
      userId: this.data.userId,
    });
  }

  /**
   * 记录 token 使用量
   */
  setTokenUsage(input?: number, output?: number): void {
    this.data.tokenUsage = { input, output };
  }

  /**
   * 记录错误
   */
  setError(error: string): void {
    this.data.error = error;
  }

  /**
   * 标记结束
   */
  finish(): void {
    this.data.endTime = new Date();
    const totalDuration = this.data.endTime.getTime() - this.data.startTime.getTime();

    logDiag({
      level: 'info',
      source: 'runtime:finish',
      message: `Agent session completed`,
      context: {
        sessionId: this.data.sessionId,
        totalSteps: this.data.totalSteps,
        totalDuration,
        toolCalls: this.data.toolCalls.length,
        tokenUsage: this.data.tokenUsage,
        error: this.data.error,
      },
      userId: this.data.userId,
    });
  }

  /**
   * 获取记录数据
   */
  getData(): RuntimeRecordData {
    return { ...this.data };
  }

  /**
   * 检测循环（同一工具被调用多次且无进展）
   */
  detectLoop(maxSameToolCalls: number = 3): string | null {
    const toolCallCounts = new Map<string, number>();
    const lastResults = new Map<string, unknown>();

    for (const call of this.data.toolCalls) {
      const count = (toolCallCounts.get(call.toolName) || 0) + 1;
      toolCallCounts.set(call.toolName, count);

      if (count > maxSameToolCalls) {
        return call.toolName;
      }
    }

    return null;
  }
}

/**
 * 创建运行时记录
 */
export function createRuntimeRecord(
  sessionId: string,
  userId: string,
  role: string,
  context?: Record<string, unknown>
): RuntimeRecord {
  return new RuntimeRecord(sessionId, userId, role, context);
}
