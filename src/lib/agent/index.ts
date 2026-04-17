/**
 * Agent 模块导出
 *
 * 重构后的 Agent 架构：
 * - AgentCore: 核心编排层（Ingress、Context、Streaming）
 * - CapabilityRegistry: 工具注册中心
 * - SelfHealing: 重试与降级
 * - ContextAssembler: 上下文装配与压缩
 * - TokenBudget: Token 预算中间件
 * - HookDispatcher: 切面调度器
 * - RuntimeRecord: 运行时记录
 * - tools/: 工具定义（模块化）
 */

export { capabilityRegistry } from './CapabilityRegistry';
export { CapabilityRegistry } from './CapabilityRegistry';
export { retry, withGracefulDegradation } from './SelfHealing';
export { buildAgentContext, compressContext, needsCompression } from './ContextAssembler';
export { checkTokenBudget, withTokenBudget } from './TokenBudget';
export { HookDispatcher, getHookDispatcher, createDefaultDispatcher } from './HookDispatcher';
export type { HookType, HookContext, HookResult } from './HookDispatcher';
export { RuntimeRecord, createRuntimeRecord } from './RuntimeRecord';
export type { StepRecord, ToolCallRecord, RuntimeRecordData } from './RuntimeRecord';
export { LoopController, createLoopController } from './LoopController';
export type { LoopCheckResult, ToolCallEntry } from './LoopController';
export { createTools } from './tools/index';
export type { AgentContext, ToolResult, DbQueryFn } from './tools/types';
