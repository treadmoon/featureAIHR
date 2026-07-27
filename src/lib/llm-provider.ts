/**
 * LLM Provider Abstraction Layer
 *
 * 按任务类型路由到不同 LLM 提供商：
 * - chat: 主聊天代理（需要强工具调用能力）
 * - task: 轻量任务（上下文压缩、记忆提取、分析洞察）
 * - embedding: 向量嵌入
 *
 * 支持提供商：volcengine（默认）、cloudflare、ollama
 *
 * DEMO_MODE=true 时返回 mock 模型，不发起真实 LLM 请求
 */

import { createOpenAI, type OpenAIProvider } from '@ai-sdk/openai';
import { MOCK_SUMMARY, MOCK_MEMORY_FACTS, MOCK_ANALYTICS_INSIGHTS } from './mock-data';

// ── Demo mode ──
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === 'true';
}

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

// ── Mock models for DEMO_MODE ──

/** Pick the right mock response based on the messages in the prompt */
function pickMockResponseText(messages?: Array<{ role: string; content: string }>): string {
  if (!messages?.length) return MOCK_SUMMARY;
  const last = messages[messages.length - 1];
  const text = last?.content || '';
  if (/请假|假期|leave/i.test(text)) return MOCK_SUMMARY;
  if (/年假|余额|balance/i.test(text)) return '你的年假余额为 12 天，病假余额为 9 天。';
  if (/密码|password/i.test(text)) return '工单已创建，IT 团队将在 15 分钟内处理。';
  if (/洞察|insights|分析/i.test(text)) return MOCK_ANALYTICS_INSIGHTS;
  return MOCK_SUMMARY;
}

/** Mock LanguageModel — satisfies the AI SDK model interface */
function createMockLanguageModel(responseText?: string) {
  return {
    specificationVersion: 'v2' as const,
    provider: 'demo',
    modelId: 'demo-model',
    defaultObjectGenerationMode: 'json' as const,

    async doStream({ messages }: any) {
      const text = responseText ?? pickMockResponseText(messages);
      const chunks = text.split(/(?<=[。！？\n])/).filter(Boolean);
      if (chunks.length === 0) chunks.push(text);

      let i = 0;
      const stream = new ReadableStream({
        pull(controller) {
          if (i < chunks.length) {
            controller.enqueue({ type: 'text-delta' as const, textDelta: chunks[i] });
            i++;
          } else {
            controller.enqueue({
              type: 'finish' as const,
              finishReason: 'stop' as const,
              usage: { promptTokens: 10, completionTokens: chunks.length },
            });
            controller.close();
          }
        },
      });

      return {
        stream,
        rawCall: { rawPrompt: null, rawSettings: {} },
      };
    },

    async doGenerate({ messages }: any) {
      const text = responseText ?? pickMockResponseText(messages);
      return {
        text,
        finishReason: 'stop' as const,
        usage: { promptTokens: 10, completionTokens: 50 },
        rawCall: { rawPrompt: null, rawSettings: {} },
        response: { id: `demo-${Date.now()}`, timestamp: new Date(), modelId: 'demo-model' },
      };
    },
  };
}

/** Mock EmbeddingModel — returns deterministic vectors */
function createMockEmbeddingModel() {
  return {
    specificationVersion: 'v1' as const,
    provider: 'demo',
    modelId: 'demo-embedding',

    async doEmbed({ values }: { values: string[] }) {
      return {
        embeddings: values.map((_, idx) => {
          // Deterministic pseudo-random vector (1536 dimensions, same as OpenAI ada-002)
          const vec = new Array(1536);
          for (let i = 0; i < 1536; i++) {
            vec[i] = Math.sin(idx * 1000 + i) * 0.1;
          }
          return vec;
        }),
        usage: { tokens: values.length * 10 },
        rawResponse: { headers: {} },
      };
    },
  };
}

// ── Pre-built mock instances ──
const mockChatModel = createMockLanguageModel();
const mockTaskModel = createMockLanguageModel();
const mockEmbeddingModel = createMockEmbeddingModel();

// ── Public API ──

/**
 * 获取主聊天模型（需要强工具调用能力，默认 Volcengine）
 */
export function getChatModel() {
  if (isDemoMode()) return mockChatModel as any;
  const providerName = resolveProviderName(process.env.LLM_CHAT_PROVIDER, 'volcengine');
  const modelId = process.env.LLM_CHAT_MODEL || process.env.VOLCENGINE_MODEL_ID || '';
  return getProvider(providerName).chat(modelId);
}

/**
 * 获取轻量任务模型（上下文压缩、记忆提取、分析洞察，可配置为边缘提供商）
 */
export function getTaskModel() {
  if (isDemoMode()) return mockTaskModel as any;
  const providerName = resolveProviderName(process.env.LLM_TASK_PROVIDER, 'volcengine');
  const modelId = process.env.LLM_TASK_MODEL || process.env.VOLCENGINE_MODEL_ID || '';
  return getProvider(providerName).chat(modelId);
}

/**
 * 获取 Embedding 模型（默认 Volcengine，暂不建议切换到边缘）
 */
export function getEmbeddingModel() {
  if (isDemoMode()) return mockEmbeddingModel as any;
  const providerName = resolveProviderName(process.env.LLM_EMBEDDING_PROVIDER, 'volcengine');
  const modelId = process.env.LLM_EMBEDDING_MODEL || process.env.VOLCENGINE_EMBEDDING_MODEL_ID;
  if (!modelId) {
    throw new Error('No embedding model configured. Set LLM_EMBEDDING_MODEL or VOLCENGINE_EMBEDDING_MODEL_ID.');
  }
  return getProvider(providerName).textEmbeddingModel(modelId);
}

/**
 * 获取当前 chat provider 名称（用于日志/诊断）
 */
export function getChatProviderName(): ProviderName {
  if (isDemoMode()) return 'volcengine';
  return resolveProviderName(process.env.LLM_CHAT_PROVIDER, 'volcengine');
}

/**
 * 获取当前 task provider 名称（用于日志/诊断）
 */
export function getTaskProviderName(): ProviderName {
  if (isDemoMode()) return 'volcengine';
  return resolveProviderName(process.env.LLM_TASK_PROVIDER, 'volcengine');
}
