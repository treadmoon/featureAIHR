# futureAIHR — 企业 AI 智能秘书

基于 Next.js + AI Agent 的企业 HR/IT 智能助手，为员工提供意图驱动、零页面的交互体验。

## 核心功能

- **AI 对话代理**：自然语言办理请假、报销、补签、IT 工单等事务
- **智能工具链**：16 个内置工具，覆盖考勤、薪资、花名册、知识库检索
- **角色权限**：员工 / 经理 / HR / 管理员四级权限，工具按角色动态过滤
- **长期记忆**：对话结束后自动提取用户偏好，下次对话个性化注入
- **知识库 RAG**：支持文档上传、智能切片、向量检索与全文搜索双模式
- **审批流程**：请假、报销等审批的创建、查看、处理
- **边缘大模型**：可选将轻量任务卸载到 Cloudflare Workers AI / Ollama，降低成本

## 技术栈

| 层 | 技术 |
|---|------|
| 框架 | Next.js 16（App Router） |
| 语言 | TypeScript / React 19 |
| AI | Vercel AI SDK 6 + Volcengine（火山引擎） |
| 数据库 | Supabase（PostgreSQL + Auth） |
| 样式 | Tailwind CSS 4 |
| 状态管理 | Zustand |
| 动画 | Framer Motion |

---

## 快速开始

### 前置条件

- Node.js ≥ 18
- pnpm（推荐）或 npm
- Supabase 项目（[创建](https://supabase.com/dashboard)）
- 火山引擎账号（[注册](https://console.volcengine.com/ark)）

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local`，填入以下必要配置：

```bash
# 火山引擎 LLM
VOLCENGINE_API_KEY=你的API密钥
VOLCENGINE_MODEL_ID=ep-xxxxxxxx-xxxxxxxx

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的anon-key
SUPABASE_SERVICE_ROLE_KEY=你的service-role-key
```

> 完整密钥清单见 [DEPLOY_SECRETS.md](./DEPLOY_SECRETS.md)

### 3. 初始化数据库

在 Supabase Dashboard → SQL Editor 中执行项目所需的建表语句（如有 `supabase/migrations` 目录）。

### 4. 启动开发服务器

```bash
pnpm dev
```

打开 http://localhost:51984 即可使用。

---

## 环境变量一览

### 必填

| 变量 | 说明 |
|------|------|
| `VOLCENGINE_API_KEY` | 火山方舟 API 密钥 |
| `VOLCENGINE_MODEL_ID` | 模型推理接入点 ID（`ep-xxx` 格式） |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名公钥 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务端密钥 |

### 可选

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `VOLCENGINE_EMBEDDING_MODEL_ID` | Embedding 模型 ID（知识库向量搜索） | 不配置则降级为全文搜索 |
| `LLM_CHAT_PROVIDER` | 主聊天提供商 | `volcengine` |
| `LLM_TASK_PROVIDER` | 轻量任务提供商（压缩/记忆） | `volcengine` |
| `LLM_TASK_MODEL` | 轻量任务模型 ID | 同 `VOLCENGINE_MODEL_ID` |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 账户 ID | - |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token | - |
| `OLLAMA_BASE_URL` | Ollama 服务地址 | `http://localhost:11434/v1` |
| `EDGE_ROLLOUT_PERCENT` | 边缘模型流量百分比（0-100） | `0` |

---

## 生产部署

### 方式一：Vercel（推荐）

1. Fork 本仓库
2. 在 [Vercel](https://vercel.com) 导入项目
3. 配置环境变量（同上）
4. 部署完成

### 方式二：EC2 / 自托管

项目已配置 GitHub Actions 自动部署：

1. 在 GitHub 仓库 Settings → Secrets 中配置 EC2 连接信息：
   - `EC2_HOST`：服务器公网 IP
   - `EC2_USER`：SSH 用户名（默认 `ubuntu`）
   - `EC2_SSH_KEY`：SSH 私钥（`.pem` 文件内容）

2. 推送到 `main` 分支自动触发部署

3. 手动部署：

```bash
pnpm build
pnpm start
```

### 方式三：Docker

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/public ./public
EXPOSE 51984
CMD ["pnpm", "start"]
```

---

## 边缘大模型（可选）

支持将上下文压缩、记忆提取等轻量任务卸载到边缘模型，降低云端 API 成本。

```bash
# 启用 Cloudflare Workers AI
LLM_TASK_PROVIDER=cloudflare
CLOUDFLARE_ACCOUNT_ID=xxx
CLOUDFLARE_API_TOKEN=xxx
EDGE_ROLLOUT_PERCENT=50
```

详见 [docs/edge-llm.md](./docs/edge-llm.md)。

---

## 项目结构

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts          # AI 聊天主路由（中间件管线）
│   │   ├── admin/                  # 管理后台 API
│   │   ├── approvals/route.ts      # 审批流程 API
│   │   ├── analytics/route.ts      # 埋点与统计
│   │   └── feedback/route.ts       # 用户反馈
│   ├── components/                 # 全局组件（ChatProvider, Sidebar）
│   ├── admin/                      # 管理后台页面
│   ├── approvals/                  # 审批页面
│   ├── profile/                    # 个人中心
│   └── login/                      # 登录页
├── lib/
│   ├── llm-provider.ts             # LLM 提供商抽象层
│   ├── llm-client.ts               # Volcengine 客户端（deprecated）
│   ├── supabase.ts                 # Supabase 客户端
│   ├── agent/
│   │   ├── middleware/             # 11 级中间件管线
│   │   ├── tools/                  # 16 个 Agent 工具
│   │   ├── ContextAssembler.ts     # 上下文压缩
│   │   ├── memory.ts               # 长期记忆系统
│   │   ├── SelfHealing.ts          # 重试与降级
│   │   ├── HookDispatcher.ts       # AOP 钩子
│   │   └── RuntimeRecord.ts        # 运行时诊断
│   └── api-helpers.ts              # API 工具函数
└── docs/
    └── edge-llm.md                 # 边缘模型文档
```

### 中间件管线

```
Auth → RateLimit → PromptGuard → Role → Cache
→ PreHooks → Summarization → TokenBudget
→ ProviderRoute → ContextPrepare
→ LoopDetection → Memory → Stream → PostHooks
```

---

## 可用脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器（端口 51984） |
| `pnpm build` | 生产构建 |
| `pnpm start` | 启动生产服务器 |
| `pnpm lint` | ESLint 检查 |

---

## 相关文档

- [边缘大模型集成](./docs/edge-llm.md) — 边缘推理配置、降级策略、成本对比
- [部署密钥清单](./DEPLOY_SECRETS.md) — 所需环境变量与获取方式
