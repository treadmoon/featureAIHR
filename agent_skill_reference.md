# 🚀 高级技能库：工业级 Agent 系统架构与工程规范 

## 0. 核心定位
本规范基于 **Learn Claude Code** 深度解析，旨在指导 Agent 在处理复杂、长链路、多步协作的工程任务时，如何从“对话模式”切换到“系统思维模式”。

---

## 1. 深度系统架构：平面解耦模型


系统的稳健性源于**控制平面 (Control Plane)** 与 **执行平面 (Execution Plane)** 的物理与逻辑双重隔离。

### 1.1 控制平面 (The Brain & Gatekeeper)
* **权限层 (Permissions)**：执行前必须通过 ACL（访问控制列表）检查。Agent 必须意识到自己是否有权访问特定目录、执行特定命令或启动支付。
* **Hook 调度器**：它是系统的“切面”。允许系统在不修改核心逻辑的情况下，注入审计、安全扫描、或特定业务逻辑（如代码风格检查）。
* **Prompt 流水线**：负责将原始指令动态转化为包含上下文、示例和约束的高质量 Prompt 片段。

### 1.2 执行平面 (The Muscle & Sandbox)
* **任务运行时 (Task Runtime)**：负责管理任务的“槽位 (Slot)”。每个槽位包含独立的运行状态。
* **能力总线 (Capability Bus)**：所有能力（本地代码执行、远程 API 调用、MCP 服务）均注册在总线上。Agent 通过标准接口调用，无需关心实现细节。
* **Worktree (工作树)**：借鉴 Git 思想，为每个任务提供隔离的文件系统视图，防止并发修改导致的竞态条件。

---

## 2. 增强型请求生命周期 (The 10-Step Workflow)
Agent 处理任务时必须严格遵循的 10 个原子阶段：

| 阶段 | 动作名称 | Agent 内部决策逻辑 |
| :--- | :--- | :--- |
| **01** | **Ingress (准入)** | 接收原始 Query，提取任务目标（Task Goal）。 |
| **02** | **Budget Check** | 检查 Token 预算和时间步数限制。若预算不足，需提前预警。 |
| **03** | **Context Assembly** | 检索长期记忆（S09）与当前会话，动态装配 Prompt。 |
| **04** | **Pre-Hook Scan** | 在推理前，通过 Hook 检查是否违反系统级指令或安全策略。 |
| **05** | **Inference (推理)** | 模型输出 Action（工具、子代理或直接回复）。 |
| **06** | **Capability Dispatch** | 将 Action 路由至 Capability Bus。若是耗时任务，放入后台运行（S13）。 |
| **07** | **Tool Execution** | 在 Worktree 隔离环境中执行物理操作。监控进度消息（Progress Payload）。 |
| **08** | **Post-Hook Processing** | 执行完毕后，对结果进行清洗或自动触发下游联动任务（如 Git Commit）。 |
| **09** | **Context Merge** | 将工具结果、报错或通知合并到当前任务记录（Runtime Record）。 |
| **10** | **Continuation Check** | 执行 **Query 续行逻辑**：若 Goal 未达成，自动开启下一轮 `Step 01`。 |

---

## 3. 核心机制深度解析

### 3.1 上下文压缩与记忆策略 (Context Compression)
Agent 必须能够自主管理自己的“注意力”。
* **压缩触发**：当 Context 窗口占用超过 70% 或逻辑分支过于琐碎时触发。
* **提炼逻辑**：保留 **Current Task Goal**、**Dependency Graph** 和 **Key Results**，丢弃中间过程的冗余输出。

### 3.2 多代理协作：队友-任务-车道模型


当任务规模超过单体 Agent 的处理极限时，系统启用团队协议：
* **Teammate (队友)**：具备特定能力集（如前端专家、数据库专家）的独立 Agent。
* **Slot (槽位)**：主 Agent 为队友分配的运行位置。
* **Lane (车道)**：每个队友在各自的 Worktree 车道中工作，互不干扰，最后由主 Agent 进行合并。

### 3.3 MCP (Model Context Protocol) 深度接入
系统不再为每个工具写死代码，而是通过 MCP 标准化接入：
* **Local Resources**：本地文件系统、数据库连接。
* **Remote Services**：如 Slack、GitHub、Linear 等。
* **Capability Bus**：屏蔽协议差异，让 Agent 像调用本地函数一样调用全球服务。

---

## 4. 异常处理与自愈规约 (Self-Healing)
Agent 面对错误时的优先级排序：
1.  **Retry (重试)**：由于网络或瞬时因素导致的失败。
2.  **Recovery Mode (恢复模式)**：若模型输出格式错误，系统注入“纠错 Prompt”强制模型修复输出。
3.  **Fallback (降级)**：若核心工具不可用，寻找替代方案（如从 MCP 转为手动代码实现）。
4.  **Graceful Failure (优雅退出)**：记录当前进度，生成 Checkpoint，并告知用户已尝试的路径。

---

## 5. 资料来源与溯源指引
若 Agent 在执行中遇到不确定的逻辑边界，应参考以下原始文档路径：

> **官方参考根路径**: `https://learn.shareai.run/zh/reference/`

### 关键映射表 (Skill to Reference Mapping)
* **核心闭环 (Loop)**: 见 `s01 - s06`。涉及工具调用基础、上下文合并。
* **系统加固 (Hardening)**: 见 `s07 - s11`。涉及权限、Hook 系统、记忆持久化。
* **运行时模型 (Task Runtime)**: 见 `s12 - s14`。涉及任务调度逻辑与后台运行。
* **协作平台 (Collaboration)**: 见 `s15 - s19`。涉及团队协议、MCP 接入。
* **生命周期全景图**: 查阅参考页面中的 **“一次请求生命周期”** 专题文档。
* **数据结构地图**: 查阅 **“关键数据结构地图”** 专题，理解 Task、Record、Goal 的对象关系。

---

## 6. 给 Agent 的行为准则 (Systemic Rules)
* **Rule A**: 优先在隔离的 **Worktree** 中执行任何写操作。
* **Rule B**: 任何高风险操作必须经过 **Control Plane Hook** 审计。
* **Rule C**: 复杂任务必须维护一个清晰的 **Runtime Record**，并在每 5 步循环后自省进度。
* **Rule D**: 若任务依赖多个异构服务，必须通过 **MCP Bus** 进行标准化调用。

---