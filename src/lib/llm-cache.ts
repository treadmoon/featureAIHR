// 语义缓存：相同问题命中缓存，节省 LLM token
// 策略：精确匹配用户输入文本（归一化后），缓存完整的 AI 响应

interface CacheEntry {
  response: string; // 完整的 stream response body
  toolResults: any[];
  createdAt: number;
  hits: number;
}

const cache = new Map<string, CacheEntry>();
const MAX_SIZE = 200;
const TTL = 5 * 60 * 1000; // 5 分钟过期

// 归一化：去空白、转小写、去标点，生成缓存 key
function normalize(text: string): string {
  return text.replace(/\s+/g, '').replace(/[？?。.，,！!、]/g, '').toLowerCase();
}

// 生成 key：用户ID + 角色 + 归一化文本
export function cacheKey(userId: string, role: string, userText: string): string {
  return `${userId}:${role}:${normalize(userText)}`;
}

export function getCache(key: string): CacheEntry | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > TTL) {
    cache.delete(key);
    return null;
  }
  entry.hits++;
  return entry;
}

export function setCache(key: string, response: string, toolResults: any[] = []) {
  // LRU：超过上限删最旧的（Map 保持插入顺序，第一个即最旧）
  if (cache.size >= MAX_SIZE) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, { response, toolResults, createdAt: Date.now(), hits: 0 });
}

// 不应缓存的场景：写操作、确认提交等
const NO_CACHE_PATTERNS = [
  /确认/, /提交/, /修改/, /删除/, /请假/, /报销/, /申请/,
  /update/i, /submit/i, /delete/i, /confirm/i,
];

export function shouldCache(userText: string): boolean {
  const normalized = normalize(userText);
  return !NO_CACHE_PATTERNS.some(p => p.test(normalized));
}

// 统计
export function cacheStats() {
  let totalHits = 0;
  for (const entry of cache.values()) totalHits += entry.hits;
  return { size: cache.size, totalHits };
}
