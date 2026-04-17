/**
 * CapabilityRegistry - 轻量级工具注册中心
 *
 * 替代硬编码工具定义，提供动态注册和基于角色的工具可见性。
 * 这是 MCP 的简化版本，适合单应用 16 工具的场景。
 */

import { z } from 'zod';
import { AgentContext, ToolResult } from './tools/types';

export type Role = 'employee' | 'manager' | 'hr' | 'admin';

export interface ToolCapability {
  name: string;
  description: string;
  inputSchema: z.ZodSchema;
  requiredRoles: Role[];
  execute: (args: unknown, ctx: AgentContext) => Promise<ToolResult>;
}

export class CapabilityRegistry {
  private capabilities = new Map<string, ToolCapability>();

  register(cap: ToolCapability): void {
    if (this.capabilities.has(cap.name)) {
      console.warn(`[CapabilityRegistry] Tool ${cap.name} already registered, overwriting`);
    }
    this.capabilities.set(cap.name, cap);
  }

  get(name: string): ToolCapability | undefined {
    return this.capabilities.get(name);
  }

  getAvailableTools(role: Role): ToolCapability[] {
    const tools: ToolCapability[] = [];
    for (const cap of this.capabilities.values()) {
      if (cap.requiredRoles.includes(role as Role) || cap.requiredRoles.length === 0) {
        tools.push(cap);
      }
    }
    return tools;
  }

  hasTool(name: string, role: Role): boolean {
    const cap = this.capabilities.get(name);
    if (!cap) return false;
    return cap.requiredRoles.includes(role as Role) || cap.requiredRoles.length === 0;
  }

  listAllTools(): string[] {
    return Array.from(this.capabilities.keys());
  }
}

// 全局单例
export const capabilityRegistry = new CapabilityRegistry();

export { capabilityRegistry as registry };
