# 前端 → AI应用工程师转型周计划（6个月）

> 前置条件：有前端开发经验，熟悉 JavaScript/TypeScript，了解 HTTP/API 调用
> 目标：6个月后具备投递 AI应用工程师 / Agent工程师 的能力
> 每周投入：工作日2-3小时 + 周末4-6小时 ≈ 每周20小时

---

## 阶段一：基础补齐（第1-8周）

### 第1周：Python 环境与基础语法
- [ ] 安装 Python 3.11+，配置 pyenv/uv 管理版本
- [ ] 对比学习：Python vs JavaScript 语法差异（变量/函数/类/模块）
- [ ] 学习 Python 虚拟环境（venv/uv）、pip/poetry 包管理
- [ ] 练习：用 Python 重写3个你熟悉的 JS 小工具
- [ ] 熟悉 Python 的 list comprehension、dict、f-string
- 产出：GitHub 仓库 `python-practice`，包含练习代码

### 第2周：Python 进阶 + 异步编程
- [ ] 类型注解 Type Hints（对比 TypeScript）
- [ ] 装饰器（对应 JS 的高阶函数/中间件概念）
- [ ] async/await 异步编程（对比 JS Promise/async-await）
- [ ] 学习 requests/httpx 库（对比 fetch/axios）
- [ ] 练习：用 httpx 调用一个公开 REST API
- 产出：异步爬虫或 API 调用示例

### 第3周：LLM API 基础
- [ ] 注册 OpenAI / Anthropic / 通义千问 API Key
- [ ] 学习 Chat Completion API（messages、role、temperature）
- [ ] 实现：Python 调用 LLM 的最小示例
- [ ] 学习 Streaming 输出（对比前端 SSE/WebSocket）
- [ ] 对比：OpenAI / Claude / 通义千问 API 差异
- 产出：多模型调用对比脚本

### 第4周：Prompt Engineering 入门
- [ ] 学习 System/User/Assistant 角色设计
- [ ] 掌握 Few-shot Prompting（提供示例引导输出）
- [ ] 学习 Chain-of-Thought（思维链推理）
- [ ] 学习输出格式控制（JSON mode、结构化输出）
- [ ] 实操：为3个不同场景设计 Prompt 模板
- 产出：Prompt 模板库 + 效果对比记录

### 第5周：Function Calling / Tool Use
- [ ] 学习 OpenAI Function Calling 机制
- [ ] 学习 Anthropic Tool Use 机制
- [ ] 实现：让 LLM 调用你定义的函数（天气查询/计算器）
- [ ] 理解 JSON Schema 定义工具参数
- [ ] 对比：前端的 API 调用 vs LLM 的工具调用
- 产出：一个能调用3个工具的简单对话机器人

### 第6周：Python 数据处理基础
- [ ] 学习 pandas 基础（对比前端的数组操作 lodash）
- [ ] 学习 JSON/CSV 文件读写
- [ ] 学习 pydantic 数据校验（对比 TypeScript interface + zod）
- [ ] 实操：处理一份真实数据集（清洗/分析/导出）
- 产出：数据分析脚本

### 第7周：Python Web 框架（FastAPI）
- [ ] 学习 FastAPI 基础（对比 Express/Koa）
- [ ] 定义路由、请求体校验（Pydantic Model）
- [ ] 实现：一个简单的 LLM API 代理服务
- [ ] 学习 SSE 流式响应（对比前端 EventSource）
- [ ] 学习 FastAPI 的依赖注入系统
- 产出：FastAPI + LLM 流式对话服务

### 第8周：Git + 项目工程化
- [ ] Python 项目结构规范（src layout、pyproject.toml）
- [ ] 学习 pytest 测试框架（对比 Jest）
- [ ] 学习 ruff / mypy 代码检查（对比 ESLint / TypeScript）
- [ ] 配置 GitHub Actions CI（lint + test）
- [ ] 整理前8周代码，写 README 文档
- 产出：结构化的 Python 项目，有 CI、有测试

---

## 阶段二：核心技能（第9-16周）

### 第9周：Embedding 与向量基础
- [ ] 理解 Embedding 概念（文本 → 向量表示）
- [ ] 学习 OpenAI / text2vec / BGE Embedding API
- [ ] 实操：计算文本相似度（余弦相似度）
- [ ] 理解向量检索原理（ANN、HNSW）
- 产出：文本相似度计算工具

### 第10周：向量数据库入门
- [ ] 学习 Chroma（本地开发，最容易上手）
- [ ] 实操：文档入库 → 向量化 → 相似度检索
- [ ] 了解 FAISS / Milvus / Qdrant（生产级方案）
- [ ] 学习元数据过滤（按时间/类型/标签筛选）
- 产出：基于向量的文档搜索引擎

### 第11周：RAG 系统 - 基础搭建
- [ ] 理解 RAG 流程：文档加载 → 切分 → 向量化 → 存储 → 检索 → 生成
- [ ] 学习文档加载器（PDF/TXT/Markdown/网页）
- [ ] 学习文本切分策略（RecursiveCharacterTextSplitter）
- [ ] 实操：用 LangChain 搭建基础 RAG 问答系统
- 产出：一个能回答文档问题的 RAG 应用

### 第12周：RAG 系统 - 优化进阶
- [ ] 学习 Chunk 策略优化（大小、重叠、语义切分）
- [ ] 学习 Hybrid Search（向量检索 + 关键词检索）
- [ ] 学习 Rerank（重排序模型，如 Cohere/BGE Reranker）
- [ ] 学习 Query 改写（HyDE、多查询扩展）
- [ ] 对比不同策略的检索效果
- 产出：优化后的 RAG 系统 + 效果评估报告

### 第13周：LangChain 框架深入
- [ ] 学习 LangChain 核心概念：Chain、Prompt Template、Output Parser
- [ ] 学习 LCEL（LangChain Expression Language）链式调用
- [ ] 学习 Memory 机制（对话历史管理）
- [ ] 实操：构建多轮对话 Chain
- 产出：基于 LangChain 的多轮对话应用

### 第14周：Agent 框架 - 工具调用
- [ ] 理解 Agent 概念（感知 → 思考 → 行动 → 观察循环）
- [ ] 用 LangChain Agent 实现工具调用
- [ ] 自定义 Tool：搜索 API、数据库查询、文件操作
- [ ] 学习 ReAct 模式（推理+行动交替）
- 产出：能调用多个工具完成任务的 Agent

### 第15周：Agent 框架 - 任务编排
- [ ] 学习 LangGraph（LangChain 的图编排框架）
- [ ] 理解状态机、条件分支、循环
- [ ] 实操：构建一个多步骤任务 Agent（如：搜索 → 分析 → 总结）
- [ ] 学习 Agent 的错误处理和重试机制
- 产出：基于 LangGraph 的任务编排 Agent

### 第16周：Dify / Coze 低代码平台
- [ ] 本地部署 Dify（Docker）
- [ ] 在 Dify 中搭建 RAG + Agent 工作流
- [ ] 对比 Dify vs 自研 LangChain 的优劣
- [ ] 了解 Coze/扣子 平台（字节跳动）
- [ ] 思考：什么场景用低代码，什么场景需要自研
- 产出：Dify 工作流 Demo + 对比分析文档

---

## 阶段三：实战项目（第17-22周）

### 第17周：项目一启动 - 企业知识库问答系统
- [ ] 需求分析：支持上传文档 → 自动入库 → 问答
- [ ] 技术选型：FastAPI + LangChain + Chroma + React
- [ ] 后端：文档上传、切分、向量化 API
- [ ] 前端：文件上传组件（你的前端强项！）
- 产出：项目骨架 + 后端基础 API

### 第18周：项目一完善
- [ ] 后端：RAG 问答 API（支持流式输出）
- [ ] 前端：聊天界面（Markdown 渲染、代码高亮、打字机效果）
- [ ] 前端：对话历史、文档管理页面
- [ ] 部署：Docker Compose 一键启动
- 产出：完整的知识库问答系统

### 第19周：项目一打磨
- [ ] 添加 Hybrid Search + Rerank 优化检索效果
- [ ] 添加对话历史存储（SQLite/Redis）
- [ ] 优化前端交互（加载状态、错误处理、响应式）
- [ ] 写 README + 项目文档 + 录屏演示
- 产出：可展示的 GitHub 项目（有在线 Demo 最佳）

### 第20周：项目二启动 - 多工具智能助手 Agent
- [ ] 需求分析：一个能搜索、查天气、读文件、写代码的助手
- [ ] 技术选型：LangGraph + Function Calling + FastAPI
- [ ] 实现3-5个工具：网络搜索 / 天气 / 计算器 / 文件操作 / SQL查询
- [ ] 实现 Agent 推理循环
- 产出：Agent 核心逻辑 + 工具集

### 第21周：项目二完善
- [ ] 前端：Agent 执行过程可视化（思考链/工具调用/结果展示）
- [ ] 前端：实时流式展示 Agent 的推理过程
- [ ] 添加错误处理、超时、重试机制
- [ ] 添加 Agent 执行日志和调试面板
- 产出：完整的 Agent 应用

### 第22周：项目三（可选加分项）- AI 应用编排平台
- [ ] 如果时间充裕，做一个简化版 Dify
- [ ] 核心功能：拖拽式 Agent 工作流编排
- [ ] 前端：React Flow / X6 图编排组件
- [ ] 后端：工作流执行引擎
- 这个项目最能发挥你的前端优势，是差异化杀手锏
- 产出：AI 工作流编排平台 MVP

---

## 阶段四：求职准备（第23-26周）

### 第23周：简历与作品集
- [ ] 撰写简历，突出 AI 项目经验
- [ ] 关键词：LLM应用开发、RAG、Agent、Prompt Engineering
- [ ] 整理 GitHub：3个项目 + 清晰 README + 在线 Demo
- [ ] 写技术博客 1-2 篇（掘金/知乎/公众号）
- 产出：AI 方向简历 + 完善的 GitHub

### 第24周：刷题与面试准备
- [ ] Python 常见面试题（数据结构、异步、装饰器）
- [ ] LLM 相关面试题（Token、Temperature、幻觉、对齐）
- [ ] RAG 面试题（检索策略、chunk优化、评估指标）
- [ ] Agent 面试题（ReAct、工具调用、状态管理）
- [ ] 系统设计题：设计一个客服 Agent / 知识库系统
- 产出：面试题库 + 自己的答案

### 第25周：模拟面试 + 投递
- [ ] 找人做模拟面试（或用 AI 模拟）
- [ ] 目标岗位投递：
  - AI应用工程师 / Agent工程师
  - 全栈AI工程师
  - LLM应用开发工程师
  - AI产品开发工程师
- [ ] 优先：当前公司内部转岗机会
- [ ] 平台：Boss直聘、拉勾、脉脉、LinkedIn
- 产出：简历投递 + 面试安排

### 第26周：面试复盘 + 持续学习
- [ ] 复盘每场面试，记录问题和改进点
- [ ] 补充面试中暴露的知识盲区
- [ ] 关注前沿：MCP协议、A2A、Multi-Agent
- [ ] 持续迭代项目和简历
- 产出：面试复盘文档

---

## 每日参考时间表（工作日）

```
07:30 - 08:00  阅读 AI 资讯（公众号/X/即刻）
08:00 - 09:00  通勤路上听 AI 相关播客/视频
12:30 - 13:00  午休时间看教程/文档
20:00 - 22:00  核心学习时间（写代码/做项目）
22:00 - 22:30  整理笔记，更新学习进度
```

## 关键里程碑检查点

| 周次 | 检查项 | 达标标准 |
|------|--------|---------|
| 第4周 | Python 基础 | 能独立写 Python 脚本调用 LLM API |
| 第8周 | 工程能力 | Python 项目有测试、CI、规范结构 |
| 第12周 | RAG 掌握 | 能从零搭建一个有基本效果的 RAG 系统 |
| 第16周 | Agent 掌握 | 能构建多工具 Agent 完成复杂任务 |
| 第20周 | 项目完成 | 至少2个完整项目在 GitHub |
| 第24周 | 面试准备 | 能清晰讲解 RAG/Agent 系统设计 |
| 第26周 | 求职完成 | 拿到至少1个 AI 岗位 Offer |

---

## 学习资源汇总

### 免费课程
- [DeepLearning.AI 短课](https://www.deeplearning.ai/short-courses/) - 吴恩达出品，LangChain/RAG/Agent 系列
- [LangChain 官方教程](https://python.langchain.com/docs/tutorials/) - 最权威的 LangChain 学习资料
- [OpenAI Cookbook](https://cookbook.openai.com/) - 官方最佳实践和示例

### 低代码平台
- [Dify](https://dify.ai/) - 开源 AI 应用平台，前端友好
- [Coze/扣子](https://www.coze.cn/) - 字节跳动 AI Bot 平台

### 开源项目参考
- [awesome-llm-apps](https://github.com/Shubhamsaboo/awesome-llm-apps) - LLM 应用合集
- [Dify](https://github.com/langgenius/dify) - 学习 AI 平台架构
- [Open Interpreter](https://github.com/OpenInterpreter/open-interpreter) - Agent 范例

### 社区
- 即刻 APP 搜索「AI 开发者」
- X/Twitter 关注 @LangChainAI @llaboratory
- 掘金/知乎 搜索「RAG 实战」「Agent 开发」

---

> 最后提醒：
> 1. 不要追求学完所有东西再动手，第3周就开始写代码
> 2. 项目 > 理论，面试官看的是你能做出什么
> 3. 你的前端背景是优势，不要丢掉，做「AI + 前端」的全栈人才
> 4. 技术栈变化快，保持学习习惯比掌握某个具体工具更重要
