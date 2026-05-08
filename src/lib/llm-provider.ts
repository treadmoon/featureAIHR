/**
 * LLM Provider Abstraction Layer
 *
 * 按任务类型路由到不同 LLM 提供商：
 * - chat: 主聊天代理（需要强工具调用能力）
 * - task: 轻量任务（上下文压缩、记忆提取、分析洞察）
 * - embedding: 向量嵌入
 *
 * 支持提供商：volcengine（默认）、cloudflare、ollama
 */

import { createOpenAI, type OpenAIProvider } from '@ai-sdk/openai';

// ── Provider type ──
type ProviderName = 'volcengine' | 'cloudflare' | 'ollama';

// ── Lazy-initialized singletons ──
const providerCache = new Map<string, OpenAIProvider>();

function getProvider(name: ProviderName): OpenAIProvider {
  const cacheKey = name;
  const cached = providerCache.get(cacheKey);
  if (cached) return cached;

  let provider: OpenAIProvider;

  switch (name) {
    case 'cloudflare': {
      const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
      const apiToken = process.env.CLOUDFLARE_API_TOKEN;
      if (!accountId || !apiToken) {
        throw new Error('CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN are required for cloudflare provider');
      }
      provider = createOpenAI({
        apiKey: apiToken,
        baseURL: `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1`,
      });
      break;
    }
    case 'ollama': {
      const baseURL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1';
      provider = createOpenAI({
        apiKey: 'ollama', // Ollama doesn't require auth
        baseURL,
      });
      break;
    }
    case 'volcengine':
    default: {
      provider = createOpenAI({
        apiKey: process.env.VOLCENGINE_API_KEY || '',
        baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
      });
      break;
    }
  }

  providerCache.set(cacheKey, provider);
  return provider;
}

// ── Resolve provider name from env ──
function resolveProviderName(envVar: string | undefined, fallback: ProviderName): ProviderName {
  if (!envVar) return fallback;
  const normalized = envVar.toLowerCase().trim();
  if (normalized === 'cloudflare' || normalized === 'ollama' || normalized === 'volcengine') {
    return normalized;
  }
  return fallback;
}

// ── Public API ──

/**
 * 获取主聊天模型（需要强工具调用能力，默认 Volcengine）
 */
export function getChatModel() {
  const providerName = resolveProviderName(process.env.LLM_CHAT_PROVIDER, 'volcengine');
  const modelId = process.env.LLM_CHAT_MODEL || process.env.VOLCENGINE_MODEL_ID || '';
  return getProvider(providerName).chat(modelId);
}

/**
 * 获取轻量任务模型（上下文压缩、记忆提取、分析洞察，可配置为边缘提供商）
 */
export function getTaskModel() {
  const providerName = resolveProviderName(process.env.LLM_TASK_PROVIDER, 'volcengine');
  const modelId = process.env.LLM_TASK_MODEL || process.env.VOLCENGINE_MODEL_ID || '';
  return getProvider(providerName).chat(modelId);
}

/**
 * 获取 Embedding 模型（默认 Volcengine，暂不建议切换到边缘）
 */
export function getEmbeddingModel() {
  const providerName = resolveProviderName(process.env.LLM_EMBEDDING_PROVIDER, 'volcengine');
  const modelId = process.env.LLM_EMBEDDING_MODEL || process.env.VOLCENGINE_EMBEDDING_MODEL_ID || '';
  return getProvider(providerName).textEmbeddingModel(modelId);
}

/**
 * 获取指定提供商的实例（用于 fallback 场景）
 */
export function getProviderInstance(name: ProviderName): OpenAIProvider {
  return getProvider(name);
}

/**
 * 获取当前 chat provider 名称（用于日志/诊断）
 */
export function getChatProviderName(): ProviderName {
  return resolveProviderName(process.env.LLM_CHAT_PROVIDER, 'volcengine');
}

/**
 * 获取当前 task provider 名称（用于日志/诊断）
 */
export function getTaskProviderName(): ProviderName {
  return resolveProviderName(process.env.LLM_TASK_PROVIDER, 'volcengine');
}
