// 轻量级埋点 + 错误上报 SDK
// 批量上报，减少请求数

type Event = { event_type: string; event_name: string; metadata?: Record<string, unknown> };

const queue: Event[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_INTERVAL = 10000; // 10秒批量上报
const MAX_QUEUE = 30;

function scheduleFlush() {
  if (timer) return;
  timer = setTimeout(flush, FLUSH_INTERVAL);
}

async function flush() {
  timer = null;
  if (!queue.length) return;
  const batch = queue.splice(0, MAX_QUEUE);
  try {
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: batch }),
    });
  } catch {
    // 上报失败不影响用户，静默丢弃
  }
}

export function track(eventName: string, metadata?: Record<string, unknown>) {
  queue.push({ event_type: 'feature_use', event_name: eventName, metadata });
  if (queue.length >= MAX_QUEUE) flush();
  else scheduleFlush();
}

export function trackPageView(page: string) {
  queue.push({ event_type: 'page_view', event_name: page, metadata: { url: window.location.pathname } });
  scheduleFlush();
}

export function trackError(error: string, context?: Record<string, unknown>) {
  queue.push({ event_type: 'error', event_name: error.slice(0, 200), metadata: { ...context, userAgent: navigator.userAgent } });
  flush(); // 错误立即上报
}

export function trackApiSlow(api: string, durationMs: number) {
  if (durationMs < 3000) return; // 只记录超过 3 秒的
  queue.push({ event_type: 'api_slow', event_name: api, metadata: { durationMs } });
  scheduleFlush();
}

// 全局错误捕获
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    trackError(e.message, { filename: e.filename, lineno: e.lineno, colno: e.colno });
  });
  window.addEventListener('unhandledrejection', (e) => {
    trackError(`Unhandled: ${e.reason?.message || e.reason}`, { stack: e.reason?.stack?.slice(0, 500) });
  });
}

// 页面卸载时尝试发送剩余事件
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (queue.length && navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics', JSON.stringify({ events: queue.splice(0) }));
    }
  });
}
