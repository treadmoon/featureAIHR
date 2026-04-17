/**
 * LoopController - 循环检测控制器
 *
 * 检测 Agent 执行过程中的循环调用模式：
 * 1. 同一工具被连续调用多次（如 searchEmployee 循环）
 * 2. 无进展循环（工具返回相似结果）
 * 3. 达到最大步数限制
 */

import { logDiag } from '@/lib/diagnosis-log';

export interface LoopCheckResult {
  isLooping: boolean;
  reason?: string;
  suggestedAction?: string;
}

export interface ToolCallEntry {
  toolName: string;
  args: unknown;
  result?: unknown;
  timestamp: number;
}

/**
 * LoopController - 检测和处理循环调用
 */
export class LoopController {
  private toolCallHistory: ToolCallEntry[] = [];
  private stepCount: number = 0;
  private maxSteps: number;
  private maxSameToolCalls: number;
  private resultSimilarityThreshold: number;

  constructor(options?: {
    maxSteps?: number;
    maxSameToolCalls?: number;
    resultSimilarityThreshold?: number;
  }) {
    this.maxSteps = options?.maxSteps ?? 20;
    this.maxSameToolCalls = options?.maxSameToolCalls ?? 3;
    this.resultSimilarityThreshold = options?.resultSimilarityThreshold ?? 0.9;
  }

  /**
   * 记录工具调用
   */
  recordToolCall(toolName: string, args: unknown, result?: unknown): void {
    this.toolCallHistory.push({
      toolName,
      args,
      result,
      timestamp: Date.now(),
    });

    // 保持历史在合理范围内（最近 50 条）
    while (this.toolCallHistory.length > 50) {
      this.toolCallHistory.shift();
    }
  }

  /**
   * 增加步数计数
   */
  incrementSteps(): void {
    this.stepCount++;
  }

  /**
   * 检查是否超过最大步数
   */
  checkMaxSteps(): LoopCheckResult {
    if (this.stepCount >= this.maxSteps) {
      return {
        isLooping: true,
        reason: `已达到最大步数限制 (${this.maxSteps})`,
        suggestedAction: '请尝试简化您的问题或开启新对话',
      };
    }
    return { isLooping: false };
  }

  /**
   * 检查同一工具的连续调用
   */
  checkSameToolLoop(): LoopCheckResult {
    if (this.toolCallHistory.length < this.maxSameToolCalls) {
      return { isLooping: false };
    }

    // 获取最近 N 次调用
    const recentCalls = this.toolCallHistory.slice(-this.maxSameToolCalls);
    const lastToolName = recentCalls[recentCalls.length - 1].toolName;

    // 检查是否所有最近调用都是同一工具
    const allSameTool = recentCalls.every(call => call.toolName === lastToolName);

    if (allSameTool) {
      // 检查参数是否相似（可能是同样的查询）
      const argsStrs = recentCalls.map(call => JSON.stringify(call.args));
      const uniqueArgs = new Set(argsStrs);

      if (uniqueArgs.size === 1) {
        return {
          isLooping: true,
          reason: `工具 ${lastToolName} 被连续调用 ${this.maxSameToolCalls} 次，参数相同`,
          suggestedAction: `建议更换搜索条件或直接告知结果`,
        };
      }
    }

    return { isLooping: false };
  }

  /**
   * 检查结果相似性（简化版）
   */
  checkResultSimilarity(): LoopCheckResult {
    if (this.toolCallHistory.length < 2) {
      return { isLooping: false };
    }

    // 获取最近两次工具调用
    const lastTwo = this.toolCallHistory.slice(-2);

    try {
      const lastResult = JSON.stringify(lastTwo[1].result || '');
      const prevResult = JSON.stringify(lastTwo[0].result || '');

      // 简单的相似度检查：长度相同且包含相似内容
      if (lastResult.length === prevResult.length && lastResult === prevResult) {
        return {
          isLooping: true,
          reason: '工具返回结果完全相同',
          suggestedAction: '检测到重复查询，请尝试其他问题',
        };
      }
    } catch {
      // JSON 序列化失败，忽略
    }

    return { isLooping: false };
  }

  /**
   * 执行所有循环检查
   */
  check(): LoopCheckResult {
    // 1. 检查最大步数
    const maxStepsResult = this.checkMaxSteps();
    if (maxStepsResult.isLooping) {
      logDiag({
        level: 'warn',
        source: 'loop:max_steps',
        message: maxStepsResult.reason || 'Max steps reached',
        context: { stepCount: this.stepCount, maxSteps: this.maxSteps },
      });
      return maxStepsResult;
    }

    // 2. 检查同一工具循环
    const sameToolResult = this.checkSameToolLoop();
    if (sameToolResult.isLooping) {
      logDiag({
        level: 'warn',
        source: 'loop:same_tool',
        message: sameToolResult.reason || 'Same tool loop detected',
        context: { recentCalls: this.toolCallHistory.slice(-this.maxSameToolCalls).map(c => c.toolName) },
      });
      return sameToolResult;
    }

    // 3. 检查结果相似性
    const similarityResult = this.checkResultSimilarity();
    if (similarityResult.isLooping) {
      logDiag({
        level: 'warn',
        source: 'loop:similarity',
        message: similarityResult.reason || 'Similar results detected',
        context: {},
      });
      return similarityResult;
    }

    return { isLooping: false };
  }

  /**
   * 获取当前状态摘要
   */
  getSummary(): {
    stepCount: number;
    toolCallCount: number;
    recentTools: string[];
    maxSteps: number;
  } {
    return {
      stepCount: this.stepCount,
      toolCallCount: this.toolCallHistory.length,
      recentTools: this.toolCallHistory.slice(-5).map(c => c.toolName),
      maxSteps: this.maxSteps,
    };
  }

  /**
   * 重置控制器
   */
  reset(): void {
    this.toolCallHistory = [];
    this.stepCount = 0;
  }
}

/**
 * 创建 LoopController 实例
 */
export function createLoopController(options?: {
  maxSteps?: number;
  maxSameToolCalls?: number;
  resultSimilarityThreshold?: number;
}): LoopController {
  return new LoopController(options);
}
