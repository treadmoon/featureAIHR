# 边缘大模型集成

## 概述

futureAIHR 支持将部分 AI 任务卸载到边缘大模型（Edge LLM），以**降低成本、减少延迟**，同时保持核心聊天体验不变。

边缘模型指运行在离用户更近的推理节点上的小型语言模型（通常 1B-7B 参数），相比云端大模型（如 Volcengine 火山引擎），它们响应更快、成本更低，但推理能力较弱。

本系统采用**智能路由**策略：简单任务走边缘，复杂任务走云端，自动降级保障可靠性。

---

## 架构

```
用户请求
  │
  ▼
┌─────────────────────────────────────┐
│         Middleware Pipeline          │
│                                     │
│  Auth → RateLimit → PromptGuard     │
│  → Role → Cache → PreHooks          │
│  → Summarization ←──┐              │
│  → TokenBudget       │ 降级链       │
│  → ProviderRoute ────┤ edge→cloud   │
│  → ContextPrepare    │              │
│  → LoopDetection     │              │
│  → Memory ←──────────┘              │
│  → Stream Handler                    │
│  → PostHooks                         │
└─────────────────────────────────────┘
```

### 任务分类与模型选择

| 任务类型 | 复杂度 | 当前提供商 | 边缘适合? | 说明 |
|---------|--------|-----------|----------|------|
| 主聊天代理 | 最高 | 云端（Volcengine） | 不适合 | 16 个工具调用、流式输出、复杂推理 |
| 上下文压缩 | 低 | 可选边缘 | **非常适合** | 2-3 句话概括，输入 ≤3000 字符，输出 ≤200 tokens |
| 记忆提取 | 中 | 可选边缘 | **适合** | 结构化 JSON 输出，需要 ≥7B 模型 |
| 分析洞察 | 中 | 可选边缘 | 可选 | 仅管理员使用，频率低 |
| 向量 Embedding | 专项 | 云端 | 不适合 | 中文 embedding 质量在边缘模型上显著下降 |

---

## 支持的提供商

### Cloudflare Workers AI（推荐）

- **类型**：边缘推理服务（Serverless GPU）
- **模型**：Qwen 2.5 系列（1.5B / 7B / 14B），原生中文支持
- **优势**：
  - 无服务器管理，按需计费
  - 免费额度 10,000 neurons/天
  - 全球边缘节点，低延迟
  - OpenAI 兼容 API，零代码改动
- **适用场景**：生产环境的上下文压缩和记忆提取

### Ollama（本地开发）

- **类型**：本地模型服务
- **模型**：任意 GGUF 量化模型（推荐 Qwen 2.5 7B Q4_K_M）
- **优势**：
  - 零成本，无需 API Key
  - 完全离线可用
  - 开发调试方便
- **适用场景**：本地开发和测试

---

## 降级保障

系统为每个边缘任务实现了多级降级链，确保服务可靠性：

### 上下文压缩降级链

```
边缘任务模型 → 云端聊天模型 → 消息截断（保留最近 8 条）
```

- 每次降级自动记录诊断日志
- 截断兜底保证请求不会因 LLM 故障而失败

### 记忆提取降级链

```
边缘任务模型（generateObject）→ 云端聊天模型（generateObject）→ 跳过提取
```

- 边缘模型 JSON 输出不可靠时自动重试云端模型
- 记忆提取是异步后台任务，失败不影响用户体验

### 健康检查

- 每次路由决策前检查边缘提供商健康状态
- 健康检查结果缓存 1 分钟，避免频繁探测
- 不健康时自动路由到云端，1 分钟后重新检查

---

## 智能路由

`providerRoute` 中间件根据请求特征自动选择提供商：

### 路由规则

| 条件 | 路由目标 |
|------|---------|
| 问候类消息（"你好"、"hi"） | 边缘（如果配置） |
| 简单查询（≤10 字符） | 边缘（如果配置） |
| FAQ 类问题（年假/考勤/工资） | 边缘（如果配置） |
| 复杂工具链请求 | 云端 |
| 边缘提供商不健康 | 云端 |
| 渐进发布未命中 | 云端 |

### 渐进发布

通过 `EDGE_ROLLOUT_PERCENT` 环境变量控制边缘流量比例：

```
0%   → 全部走云端（默认，最安全）
10%  → 10% 的简单请求走边缘
50%  → 一半走边缘
100% → 所有简单请求走边缘
```

建议逐步增加：0% → 10% → 30% → 50% → 100%，每阶段观察错误率和用户反馈。

---

## 配置

### 环境变量

```bash
# ── 必填（已有）──
VOLCENGINE_API_KEY=your-api-key
VOLCENGINE_MODEL_ID=your-model-id

# ── 边缘推理（新增）──
# 任务提供商：volcengine（默认）、cloudflare、ollama
LLM_TASK_PROVIDER=cloudflare

# 任务模型 ID（可选，默认同 VOLCENGINE_MODEL_ID）
LLM_TASK_MODEL=@cf/qwen/qwen2.5-7b-instruct

# Cloudflare 配置
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token

# Ollama 配置（本地开发）
# OLLAMA_BASE_URL=http://localhost:11434/v1

# 渐进发布百分比（0-100）
EDGE_ROLLOUT_PERCENT=0
```

### 配置示例

**场景 1：默认（全部云端）**

```bash
VOLCENGINE_API_KEY=xxx
VOLCENGINE_MODEL_ID=ep-xxx
# 其他不配置即可
```

**场景 2：Cloudflare 边缘推理**

```bash
VOLCENGINE_API_KEY=xxx
VOLCENGINE_MODEL_ID=ep-xxx
LLM_TASK_PROVIDER=cloudflare
LLM_TASK_MODEL=@cf/qwen/qwen2.5-7b-instruct
CLOUDFLARE_ACCOUNT_ID=xxx
CLOUDFLARE_API_TOKEN=xxx
EDGE_ROLLOUT_PERCENT=50
```

**场景 3：本地 Ollama 开发**

```bash
VOLCENGINE_API_KEY=xxx
VOLCENGINE_MODEL_ID=ep-xxx
LLM_TASK_PROVIDER=ollama
LLM_TASK_MODEL=qwen2.5:7b
OLLAMA_BASE_URL=http://localhost:11434/v1
```

---

## 可观测性

### Provider 指标接口

```bash
GET /api/analytics?action=provider-metrics&days=7
```

返回示例：

```json
{
  "days": 7,
  "rolloutPercent": 50,
  "taskProvider": "cloudflare",
  "routing": {
    "total": 120,
    "edge": 45,
    "cloud": 75,
    "edgeRate": 38
  },
  "compression": {
    "total": 30,
    "edge": 22,
    "cloud": 8
  },
  "memory": {
    "total": 50,
    "fallbacks": 3
  }
}
```

### 关键指标

| 指标 | 含义 | 关注点 |
|------|------|--------|
| `routing.edgeRate` | 边缘路由命中率 | 应与 rollout 配置一致 |
| `compression.edge` | 压缩走边缘的次数 | 成本节省的主要来源 |
| `memory.fallbacks` | 记忆提取降级次数 | 越少越好，过多说明边缘模型质量不足 |

### 诊断日志

所有 provider 相关事件记录在 `diagnosis_logs` 表中：

| source | 含义 |
|--------|------|
| `provider:route` | 路由决策（edge/cloud） |
| `provider:health` | 健康检查结果 |
| `context:compress` | 压缩使用的 provider |
| `memory:extract` | 记忆提取降级事件 |

---

## 成本对比

| 场景 | 云端（Volcengine） | 边缘（Cloudflare Free） |
|------|-------------------|------------------------|
| 上下文压缩（每次） | ~0.001 元 | 免费（neurons 额度内） |
| 记忆提取（每次） | ~0.002 元 | 免费（neurons 额度内） |
| 日均 1000 次对话 | ~3 元/天 | ~0 元/天（压缩+记忆部分） |
| 月节省 | - | ~60-90 元 |

> 注：主聊天代理始终走云端，边缘仅覆盖辅助任务。实际节省取决于对话频率和压缩触发率。

---

## 模型推荐

### 边缘任务模型

| 模型 | 参数量 | 量化 | 中文能力 | 结构化输出 | 推荐场景 |
|------|--------|------|---------|-----------|---------|
| Qwen 2.5 3B | 3B | Q4 | 良好 | 一般 | 简单压缩 |
| Qwen 2.5 7B | 7B | Q4 | 优秀 | 可靠 | 压缩 + 记忆提取 |
| Qwen 2.5 14B | 14B | Q4 | 优秀 | 可靠 | 高质量需求 |

**推荐**：`Qwen 2.5 7B` 是性价比最优选择，中文能力和结构化输出均可靠。

### Cloudflare 模型 ID

```
@cf/qwen/qwen2.5-3b-instruct   # 轻量，仅适合压缩
@cf/qwen/qwen2.5-7b-instruct   # 推荐，压缩+记忆
@cf/qwen/qwen2.5-14b-instruct  # 高质量，限流更严
```

---

## FAQ

**Q：边缘模型会影响聊天质量吗？**

A：不会。主聊天代理始终使用云端 Volcengine 模型，边缘仅覆盖上下文压缩和记忆提取等辅助任务。

**Q：如何回退到全部云端？**

A：删除或注释 `LLM_TASK_PROVIDER` 环境变量即可，系统默认走 Volcengine。

**Q：边缘模型支持流式输出吗？**

A：当前边缘模型仅用于非流式任务（generateText / generateObject），主聊天的流式输出始终走云端。

**Q：Cloudflare 免费额度够用吗？**

A：免费额度 10,000 neurons/天，约支持 500-1000 次压缩/记忆提取。超出后按量计费，费用极低。

**Q：可以混合使用多个边缘提供商吗？**

A：当前 `LLM_TASK_PROVIDER` 只支持一个值。如需混合策略，可修改 `src/lib/llm-provider.ts` 中的 `getTaskModel()` 实现自定义路由逻辑。
