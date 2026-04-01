// 简易内存 rate limiter（单实例部署足够，集群需换 Redis）
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit = 30, windowMs = 60000): { ok: boolean; remaining: number } {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  entry.count++;
  if (entry.count > limit) return { ok: false, remaining: 0 };
  return { ok: true, remaining: limit - entry.count };
}

// 定期清理过期条目
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of hits) { if (now > v.resetAt) hits.delete(k); }
}, 60000);
