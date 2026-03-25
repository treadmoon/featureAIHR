# 第一段
**2026年AI编码新范式下最推荐的颠覆式设计。**

我们不再做一个“传统HR系统”（页面+按钮+表格），而是直接构建一个**始终在线的AI HR Secretary**（智能HR秘书）。  
它像一个贴身助手：你用任何方式提问（文字、语音、截图、上传Excel），它根据**你的角色（员工/HR/经理）、场景（上班路上/会议中/深夜查数据）、设备（手机/电脑）**，自动选择最优展现形式——文字、动态HTML交互卡片、图表图像、语音播报、短视频演示、甚至沉浸式3D组织架构可视化。

这不是科幻，而是用我们现有的工具（Claude Code + Cursor + Vercel AI SDK + Grok Imagine级多模态 + ElevenLabs TTS + Runway视频）**今天就能落地**的核心模块。

### 真实场景演示（高频功能重构后）

| 使用场景（日常最高频） | 你的输入方式 | AI Secretary 智能判断 + 输出形式（多模态混合） |
|-----------------------|-------------|------------------------------------------------|
| 员工早上打卡前问“我的考勤怎么样？” | 语音（微信/APP） | ① 立即语音回复（温暖女声）“小李你本月已打卡22天，迟到1次，剩余年假8天”<br>② 同时推送**动态HTML卡片**（可点“补卡”按钮）<br>③ 附加**生成图像**：彩色进度环 + 表情包（开心/提醒） |
| HR问“本月请假最多的部门是哪个？” | 文字 + 截图（系统看板） | ① **交互HTML仪表盘**（实时可过滤表格+柱状图）<br>② 自动生成**一键导出视频**（30秒讲解动画）<br>③ 语音总结 + 风险高亮红框 |
| 经理批假时说“帮我模拟这个请假通过后的团队排班” | 语音 + 上传Excel | ① **生成视频**（15秒动画：张三请假后团队日历变化）<br>② **交互HTML日历**（拖拽调整，实时高亮冲突）<br>③ **图像**：前后对比热力图 |
| 新员工问“我入职需要准备什么？” | 语音 | ① **沉浸式HTML引导页**（卡片式Checklist，可勾选）<br>② **生成短视频**（HR真人出镜演示流程，带字幕）<br>③ 语音一步步引导 |
| 深夜查工资“我这个月为什么扣了这么多？” | 文字 | ① **解释性HTML可视化**（饼图+逐项展开，点击每项弹出AI解释）<br>② **语音安慰+建议**：“要不要我帮你生成调薪申请模板？” |

这些输出**全部由AI实时生成**，不需要预先设计几十个固定页面。







（上面两张图就是2026年真实AI秘书界面的风格：左侧知识/输入，右侧多Agent + 多模态输出）







（企业级AI Orchestrator仪表盘示例——完全可作为我们HR Secretary的后台控制面板）

### 在我们之前的开发大纲中如何无缝替换传统模式

**阶段1（Spec）**  
把“功能清单”全部改成 **“AI Secretary能力清单”**，不再列“页面”，而是列“意图场景 + 输出模态 + 触发规则”。

**阶段2（架构）**  
核心只建一个 **AI Secretary Agent Hub**（Next.js + LangGraph风格多Agent）  
- 输入路由器（语音→Whisper，图像→GPT-4o-Vision，文字直接）  
- 上下文记忆（Zustand + Supabase向量）  
- 输出路由器（根据场景决定：HTML用v0.dev实时生成、图像用Grok Imagine、视频用Runway、语音用TTS）

**阶段3（开发）**  
所有高频功能都变成一个Chat界面 + Agent执行：  
“你只要说一句话，它就直接给你想要的样子”。

传统按钮、菜单、报表页全部砍掉或作为“fallback”隐藏。

**阶段4-5**  
测试时直接喂“场景截图+期望输出”，AI自己修复；部署后用户体验是“像和真人秘书聊天，但永远不睡觉、秒出图表”。

### 实际落地优势（对比传统HR系统）
- 开发量减少60%以上（不用做几十个CRUD页面）
- 用户粘性暴增（员工爱用，因为“真像有个秘书”）
- 合规更易（所有生成内容都带审计日志 + 来源引用）
- 2026主流案例：Juicebox.ai、Ema、Leena AI、Moveworks等已经这样做了，我们直接站在它们肩膀上更进一步。

**结论**：  
摒弃传统模式后，你的HR系统不再是“工具”，而是**每个人的专属AI HR秘书**。这正是我们之前讨论的“意图驱动 + 多模态代理执行”的极致体现。


# 第二段
2026年已有多个**类似“AI HR Secretary”**（多模态、意图驱动、像真人秘书一样根据场景输出文字/图像/语音/视频/HTML交互等）的真实商业案例或接近的实现。这些系统不再是传统页面堆砌，而是以**conversational + agentic AI**为核心，结合**RAG（检索增强生成）**、**多模态输出**和**企业系统集成**，实现“说一句就给你想要的样子”。

以下是目前最接近你描述的**真实或高度成熟的案例**（基于公开case study、产品功能和2025-2026趋势报告），我按相似度排序：

### 1. Leena AI（最接近“全能AI HR秘书”）
- **核心特点**：Agentic AI + 多渠道（Slack/Teams/语音/邮件/Web/App）+ 多模态支持（文本 + 语音回复 + 文档生成 + 交互式票据/表单 + 知识库RAG）。
- **秘书式体验**：员工问“我的年假剩多少天？” → 即时语音/文本回复 + 推送HTML交互卡片（可一键申请/查看余额）+ 附带政策引用图像或图表。
- **真实案例**：
  - RPG Group：92% 查询分钟内解决，HR工作量大幅下降，员工24/7自助。
  - Beacon Mobility：60% 查询自动化，97.5% 满意度，节省2000+小时。
  - MRHFL（金融）：针对现场员工重构体验，信息访问革命化。
- **多模态亮点**：支持语音交互、生成个性化文档/总结、集成企业微信/Teams推送动态内容。
- **为什么类似**：已从纯聊天机器人进化到“自主代理”（agentic），能跨系统执行多步任务（如查薪资 → 解释扣款 → 生成调薪模板 → 发起审批）。

### 2. Paradox (Olivia / Emma) – 招聘场景的“对话秘书”
- **核心特点**：Conversational AI + 语音/文本 + 视频面试调度 + 个性化候选人指导。
- **秘书式体验**：候选人语音问“这个职位需要什么技能？” → Olivia语音回复 + 生成短视频（职位预览/公司文化）+ 交互HTML日程卡片。
- **真实案例**：Great Wolf Lodge（季节性招聘高峰）→ 大幅加速筛选/面试，减少HR手动干预。
- **多模态亮点**：支持视频嵌入、语音调度、实时反馈。
- **适用**：招聘端“秘书”极强，全生命周期HR可扩展。

### 3. IBM AskHR / watsonx Orchestrate（企业级HR代理）
- **核心特点**：270K+员工规模下每天处理百万级查询 + Agentic workflow + 集成SAP SuccessFactors/Microsoft Teams。
- **秘书式体验**：员工问“产假政策是什么？” → 即时文本/语音 + 生成个性化HTML总结 + 附带流程图/视频演示。
- **真实案例**：IBM内部部署 → HR从行政转向战略，员工自助率暴增。
- **多模态亮点**：语音助手 + 嵌入视频/图表 + 多步代理执行（查政策 → 申请 → 提醒经理）。

### 4. Moveworks（HR/IT/Finance统一代理，类似“企业秘书”）
- **核心特点**：Agentic AI + 多模态（文本/语音/Teams/Slack）+ 跨系统自动化。
- **秘书式体验**：HR问“团队请假冲突怎么排？” → 生成交互日历HTML + 语音解释 + 预测风险图像。
- **真实案例**：Johnson Controls / Ciena / Databricks → 24/7自助 + HR解放战略工作。
- **多模态亮点**：支持生成动态内容、语音交互、票据自动化。

### 5. 其他接近的多模态/秘书式趋势案例（2026主流）
- **HireVue**：视频面试 + AI评估 + 实时反馈（视频/文本/图像），招聘场景多模态强。
- **Phenom**：聊天机器人 + 语音 + 个性化视频/内容推送，员工体验/入职强。
- **Ema / Juicebox.ai**：新兴agent平台，支持HR copilots + 多模态输出（生成图像/视频/交互卡片）。
- **新兴趋势**：2026报告提到**AI voice assistants** + **multi-agent systems**正快速扩展到HR，员工/候选人像和真人秘书对话，但输出包括视频讲解、动态图表、语音总结。

### 这些案例与你理想的“AI HR Secretary”差距与机会
- **已实现**：意图理解 + 多渠道输入（语音/文本/截图）+ 输出多样（文本/HTML/语音/嵌入视频/图表）。
- **部分实现**：完整视频生成（短讲解视频常见，但实时Runway级生成还在实验）、3D可视化（少数有组织架构热力图）。
- **你的机会**：在Next.js + Vercel AI SDK + Supabase + Grok/Claude多模态基础上，自建一个**更激进的版本**（砍掉所有传统页面，只剩一个Chat/语音入口 + 输出路由器），参考Leena/Paradox的agentic架构 + IBM的规模化RAG。

有几个**开源的 AI HR 助手 / 聊天机器人**项目可以让你快速体验一下。这些大多是基于 RAG（检索增强生成）、LangChain、Streamlit 或类似框架构建的原型或 demo，聚焦 HR 查询、请假申请、政策解答、员工自助等场景。它们不像商业产品（如 Leena AI）那么完整，但可以本地跑起来试试“AI 秘书”感觉。

以下是 2026 年 GitHub 上相对活跃 / 完整的几个开源案例，按易上手 + 相似度排序（从聊天交互到 agentic 风格）：

1. **bachasachin0/Genai_Agentic_HR_asssitant**  
   - 最接近“agentic HR 秘书”：用 LangChain agent + Groq-Mistral + MongoDB，支持员工记录管理、团队组建、自然语言查询。  
   - 特点：多步推理、工具调用，能处理复杂 HR 任务。  
   - 体验方式：克隆 repo → 装依赖 → 配置 LLM key → 跑 app。  
   - GitHub: https://github.com/bachasachin0/Genai_Agentic_HR_asssitant  
   - 适合：想试多 agent / 工具链的你。

2. **stepanogil/autonomous-hr-chatbot**  
   - 自主代理式 HR 聊天机器人，用 ChatGPT / LangChain 构建，能调用工具回答 HR 查询。  
   - 特点：企业原型，强调工具使用（类似秘书“查一下”“帮我申请”）。  
   - GitHub: https://github.com/stepanogil/autonomous-hr-chatbot  
   - 体验：本地跑 demo，输入 HR 问题看它怎么用工具响应。

3. **AliElneklawy/AI-HR-Assistant**  
   - 智能 HR 助手聊天机器人，用 Google Gemini / NLP 处理 HR 流程。  
   - 特点：用户体验导向，简化 HR 操作。  
   - GitHub: https://github.com/AliElneklawy/AI-HR-Assistant  
   - 适合：快速 fork 改改试试。

4. **rajikudusadewale/HR-Chatbot** 或 **r123singh/hr-assistant-chatbot**  
   - OpenAI 驱动的 HR 聊天机器人，支持请假、工资条、政策查询。  
   - 特点：Streamlit 界面，简单 Web app，容易本地启动。  
   - 示例：https://github.com/rajikudusadewale/HR-Chatbot  
   - 另一个 neon 主题的：https://github.com/r123singh/hr-assistant-chatbot（有截图和 demo 视频参考）。

5. **northlnwza/HR-Chatbot**  
   - 自托管栈，专注自然语言请假请求处理。  
   - GitHub: https://github.com/northlnwza/HR-Chatbot  
   - 适合：只想试请假 / 审批场景。

6. **debarun1234/Nestle-HR-AI-Assistant**  
   - RAG 风格：基于公司 HR 政策文档回答查询（上传 PDF 就能用）。  
   - GitHub: https://github.com/debarun1234/Nestle-HR-AI-Assistant  
   - 体验：上传自己的 HR 手册 PDF，模拟企业内部秘书。

7. **其他 RAG 基础模板可快速改成 HR**（如果你想从零自定义）  
   - **infiniflow/ragflow**：强大开源 RAG 引擎，支持 agent 能力，直接喂 HR 文档就能变 HR 秘书。  
     GitHub: https://github.com/infiniflow/ragflow  
   - **weaviate/Verba**：黄金 RAG 聊天机器人，易自定义数据源。  
     GitHub: https://github.com/weaviate/Verba  

# 第三段
**2026年最核心的软件开发范式转变：从“页面驱动”到“意图驱动 + 多模态Agent Secretary”**。

几乎**所有软件系统**（尤其是企业内部工具、SaaS、生产力工具）都可以完全或大部分采用这个思路。  
传统CRUD页面、菜单、仪表盘正在被一个“永远在线的智能秘书”取代：你用任意方式说/问/上传，它就根据角色、场景、设备，实时给出最优形态（语音+HTML交互+图表+视频+图像+3D）。

这不是HR专属，而是**Agentic AI + AI-Native App**的通用蓝图，已在多个领域大规模落地。

### 几乎所有领域都能套用的真实案例（2026主流）

| 系统类型          | 传统模式痛点                  | AI Secretary版体验（一句话）                                                                 | 真实/接近产品举例（2026）                  |
|-------------------|-------------------------------|---------------------------------------------------------------------------------------------|-------------------------------------------|
| **CRM / 销售**   | 几十个Tab、复杂过滤器         | “帮我准备明天和大客户的会议” → 语音总结+生成HTML议程卡片+视频模拟对话+自动CRM更新         | Aviso Agentic AI、Salesforce + Agentforce、Dialpad AI Sales Rep |
| **ERP / 财务**   | 海量报表、权限切换麻烦        | “这个月库存为什么短缺？” → 交互HTML热力图+语音解释+生成视频补货动画+一键下采购单       | DualEntry、Campfire、Rillet、SAP Joule + AI-native ERP |
| **项目管理**     | Kanban + Gantt + 评论散乱     | “下周团队负载怎么排？” → 动态HTML甘特图（可拖拽）+生成冲突视频演示+语音提醒             | Monday.com AI、Linear + Agent、Notion AI Secretary |
| **客服/支持**    | Ticket系统 + 多轮回复         | 用户语音投诉 → 自动生成HTML解决方案卡片+短视频教程+一键退款执行                         | Moveworks、Kore.ai、Zendesk AI Agents     |
| **教育/培训**    | LMS页面堆砌                   | 学生问“这个公式怎么用？” → 互动HTML白板+生成讲解视频+语音一步步引导                     | Duolingo Max、Khanmigo、Ema Education Agent |
| **医疗/健康**    | 电子病历繁杂                  | 医生语音：“这个病人下步方案？” → 隐私HTML病例总结+风险图像热图+合规视频审批流         | IBM watsonx Health、Epic AI Copilot       |
| **供应链/物流**  | 多系统切换                    | “上海仓库延误怎么办？” → 生成交互地图HTML+补货视频模拟+自动通知供应商                   | 8allocate物流Agent、Oracle AI Supply Chain |
| **个人生产力**   | 多App切换                     | “帮我总结今天邮件并排明天日程” → 语音播报+HTML日历卡片+自动生成会议邀请                 | Superhuman AI、Raycast + Agent、Rewind    |




（上面是典型CRM Agentic AI界面：多Agent化身 + 跨系统执行，看起来就像一个销售秘书）




（ERP AI聊天场景：直接问就出报表+同步，彻底取代传统仪表盘）




（通用AI Secretary视觉：机器人+多模态浮窗，完全匹配我们描述的“想看什么就给什么”）

### 适用性总结（99%场景都行）

**强烈推荐全替换的系统**（内部工具、协作SaaS、中后台）：CRM、ERP、HR、PM、客服、OA、BI报表、知识库、审批流……开发量可砍60-80%，用户满意度暴增。

**部分保留传统UI的场景**（作为fallback）：
- 高精度数据录入（财务凭证）
- 创意设计工具（Figma类，需要精确拖拽）
- 游戏/沉浸式消费App（但也可以加AI Secretary作为辅助）

**核心架构通用模板**（适用于任何系统）：
1. 一个 **Agent Hub**（Next.js + LangGraph/LangChain）
2. 输入路由器（语音/图片/文字/文件）
3. 输出路由器（根据场景选：v0.dev实时HTML、Grok Imagine图像、Runway视频、TTS语音）
4. 记忆 + RAG + 工具调用（连接你的数据库/外部API）
5. 角色/场景上下文（员工/HR/经理/CEO → 不同输出风格）

这个模板和我们之前给HR的开发大纲**完全一样**，只需把spec里的“功能模块”改成“意图场景清单”即可。

### 在我们的Cursor/Claude流程里怎么落地
- **Spec阶段**：Round 0 只写一句目标 + 核心场景 + 输出模态偏好，AI自动展开成“AI Secretary能力清单”。
- **骨架阶段**：一键生成Agent Hub + 第一个场景demo（比如“查询库存”多模态输出）。
- **开发阶段**：每个场景一个独立Chat，迭代速度更快。

**一句话结论**：  
2026年的软件开发，已经从“做系统”变成“做秘书”。HR只是我们第一个试验田，几乎所有系统都能用同一套思路、同一套prompt模板、同一套技术栈快速复制。

# 第四段
**合2026年3月的AI成熟度、业务痛点、实施风险、ROI和多模态适配度，认为目前最合适走“AI Secretary / Agentic 多模态意图驱动”方案的软件类型是：**

### 冠军推荐：**企业客服 / 客户支持系统（Customer Support / CX / Helpdesk）**  
（其次紧随其后的是 **HR + 员工体验 + IT服务台（EX/Internal Support）**）

为什么它综合得分最高？下面用关键因素拆解：

| 因素                  | Customer Support / CX | HR/EX + IT Service Desk | CRM/Sales | ERP/Finance | 为什么胜出 |
|-----------------------|-----------------------|-------------------------|-----------|-------------|------------|
| **AI成熟度（多模态+Agent）** | ★★★★★（语音+截图+视频教程+HTML卡片已大规模生产） | ★★★★★ | ★★★★☆ | ★★★☆☆（精度要求更高） | Whisper/TTS/v0.dev/Runway已ready，RAG+工具调用成熟 |
| **业务高频+自然语言需求** | ★★★★★（用户随时问“我的订单呢？”“怎么退款？”） | ★★★★★（“年假剩多少？”“帮我重置权限”） | ★★★★ | ★★★ | 每天百万级查询，传统UI最烦 |
| **数据可用性 & 集成** | ★★★★★（Zendesk/Salesforce/CRM API现成） | ★★★★★（Supabase/Workday/AD） | ★★★★ | ★★★（敏感） | 工具调用简单，RAG文档易喂 |
| **风险 & 合规** | 中等（可加human-in-loop、审计日志） | 较低（内部） | 中等 | 高 | 出错可fallback人工，ROI快 |
| **开发/验证速度** | 最快（一个场景demo就能上线） | 极快（我们HR例子已验证） | 快 | 较慢 | Cursor/Claude 1周出MVP |
| **ROI & 用户爱用度** | 最高（60-80%自动化，成本砍半） | 极高（员工自助率暴增） | 高 | 中高 | 商业案例最多（Kore.ai、Moveworks、Salesforce Agentforce） |
| **多模态发挥空间** | 最大（上传发票截图→AI圈重点→生成退款视频） | 极大（语音+动态HTML工资条+入职短视频） | 大 | 中等 | 完美匹配我们方案 |







（上面就是2026年真实客服Agentforce/Cognigy界面：多Agent头像 + 直接执行动作 + 多模态输出，完全是我们讨论的“秘书”形态）

### 为什么不是其他类型？
- **CRM/Sales**：非常合适（Salesforce Agentforce已证明），但需要更多销售playbook治理，排第3。
- **ERP/财务**：数据敏感+精度要求高，适合“辅助查询”而非全替换传统页面。
- **消费级App（电商/游戏）**：用户习惯传统UI，转化风险大。
- **医疗/安全系统**：合规壁垒太高，暂不推荐全替换。

**Gartner预测**：到2026年底，40%的企业应用会嵌入Agent，而客服和内部支持是首批规模化落地的（已有多家全球企业实现80%+自助率）。

### 和我们之前流程的完美匹配度
这个类型几乎可以**100%套用我们已有的HR开发大纲**：
- Spec阶段 → 把“功能”改成“意图场景清单”（e.g. “用户上传发票截图 → 生成HTML退款表单+语音确认+视频步骤”）
- 骨架 → 一键生成 **Agent Hub + 输入路由器 + 输出路由器**
- 开发 → 每个高频场景一个Chat，迭代超快
- 上线 → Vercel + Supabase + Stripe webhook，1天搞定

**结论**：  
**2026年最值得先上手的，就是“客服/支持系统”或“内部HR+IT秘书平台”**——AI成熟度最高、业务价值最明显、用户会真心爱用、开发风险最低。你可以一周内就看到“说一句就出视频+交互卡片”的产品。

是的，我们继续沿着**HR系统**的思路，但**融合IT支持**（Internal IT Service Desk / Employee IT Self-Service），构建一个统一的**“Employee Experience AI Secretary”**（员工体验智能秘书）。  

这个合并方向在2026年非常务实且趋势明显：许多企业正将HR + IT支持合并成“Employee Service”或“EX/IT”统一平台（参考Moveworks、PeopleReign、Aisera、Rezolve AI、Leena AI等案例）。员工不再区分“这是HR问题还是IT问题”，而是一个入口说一句，AI秘书就多模态解决（查年假余额 → 语音回复 + HTML卡片；VPN连不上 → 生成截图指导 + 自动重置权限 + 视频演示）。

### 为什么HR + IT合并最合适这个方案？
- **高频重叠**：员工日常80%+查询都是“我的电脑卡了”“年假剩多少”“密码重置”“请假审批”“软件安装”“工资条解释”。
- **痛点一致**：传统HR/IT两个系统切换烦、重复录入、响应慢 → 统一AI秘书一键解决，自动化率可达60-80%。
- **AI成熟度**：RAG + Agentic workflow已ready，能跨系统执行（Supabase HR数据 + Active Directory/IT票据 + Microsoft 365/Okta权限）。
- **ROI爆炸**：内部支持成本砍半，员工满意度暴增（参考Moveworks在IT+HR场景的Forrester报告：票据解决时间减90%+）。
- **开发友好**：我们之前的HR大纲直接扩展，加IT场景即可（无需重构核心Agent Hub）。

### 更新后的系统定位（一句话目标）
“一个始终在线的AI Employee Secretary：员工用自然语言/语音/截图提问HR或IT问题，它根据角色/场景实时输出最优形式（语音播报 + 交互HTML卡片 + 图表/图像 + 短视频 + 一键执行），覆盖员工全生命周期 + IT自助支持，实现HR+IT统一、零页面、意图驱动体验。”

### 高频场景示例（HR + IT合并版，日常Top使用）

| 排名 | 场景（员工端高频）                  | 输入方式示例                  | AI Secretary 输出（多模态混合）                                                                 |
|------|-------------------------------------|-------------------------------|-------------------------------------------------------------------------------------------------|
| 1    | “我的电脑/VPN/邮箱出问题了”       | 语音 + 截图错误               | ① 语音引导步骤<br>② 生成HTML交互故障排除卡片（可点“自动重置”）<br>③ 图像：问题热力图/步骤图<br>④ 视频：30秒演示 |
| 2    | “我的年假/调休剩多少天？”         | 语音/文字                     | ① 语音即时回复 + 剩余天数动画<br>② HTML余额卡片（可点申请）<br>③ 图像：彩色进度环 + 表情 |
| 3    | “帮我重置密码/解锁账号”            | 语音 + 身份验证               | ① 安全语音确认<br>② 一键执行 + HTML成功确认<br>③ 图像：锁图标解开动画 |
| 4    | “这个月工资为什么扣这么多？”      | 文字 + 上传工资条截图         | ① 解释性HTML饼图 + 逐项展开（AI圈重点）<br>② 语音安慰 + 建议<br>③ 可生成调薪申请模板卡片 |
| 5    | “帮我申请请假/安装软件/加班”      | 语音/文字                     | ① HTML表单预填 + 审批流可视化<br>② 自动提交 + 实时进度语音通知<br>③ 视频：审批流程演示（如果复杂） |
| 6    | “公司政策/福利/新工具怎么用？”    | 语音 + 上传文档截图           | ① RAG精准引用 + 语音总结<br>② HTML政策卡片（可折叠）<br>③ 生成短视频讲解 |

### 真实案例参考（2026主流，HR+IT统一）
- **Moveworks**：最典型统一员工支持Agent，覆盖HR查询 + IT票据 + 软件请求，自主执行重置密码/解锁/请假等，真实企业如AMD、Microsoft内部用，自动化率高。
- **PeopleReign**：专为HR+IT员工服务自动化设计，Agent跨系统执行请求。
- **Aisera**：Agentic AI同时做HR + IT + 客服，自主解决端到端。
- **Rezolve AI**：Agentic Service Desk框架，2026强调“outcome-first”而非票据。
- **Leena AI / Kore.ai**：从HR扩展到IT支持，集成Teams/Slack。
- **Microsoft 365 Copilot + Agentforce**：企业内部已大规模用，HR/IT查询统一。

### 开发大纲更新（基于之前HR版，直接扩展）
阶段0–2不变（准备 + Spec迭代 + 骨架），核心改动在阶段3+：

阶段3：模块拆解与迭代（现在拆成“意图场景”而非模块）
- 认证 + 多租户 + 角色上下文（员工/经理/HR/IT Admin）
- HR核心：档案/考勤/请假/薪酬/绩效/入离职
- IT核心：密码重置/软件安装/设备故障/权限申请/网络/VPN/Office 365问题
- 统一高频：审批流（请假+IT请求）、自助查询（政策+IT知识库）、RAG（HR手册 + IT KB）
- AI增强：离职风险预测 + IT故障预测 + 智能推荐（“你可能需要这个工具”）

阶段4：集成测试
- 加IT工具调用：Okta/Azure AD API、Microsoft Graph、ServiceNow/Jira ticket、Jamf/Intune设备管理
- 测试场景：混合查询如“帮我请假同时申请新电脑”

阶段5：部署
- Vercel + Supabase（HR数据） + 向量存储（政策/IT KB）
- 监控：Sentry + Analytics，重点看自动化率 + 升级到人工比例

### 开源/可体验选项（HR+IT方向）
- **Moveworks-like**：无完整开源，但参考**RasaHQ/helpdesk-assistant**（Rasa + ServiceNow集成，IT Helpdesk示例，可扩展HR）。
- **Chatwoot + Captain AI**：开源客服平台，已有AI Agent（可自托管，扩展到内部HR/IT）。
- **Tiledesk**：开源Agentic AI平台，支持多渠道 + 工作流自动化，适合建统一员工秘书。
- **Hexabot**：开源AI Agent builder，多语言/多渠道，可自定义HR+IT意图。
- **infiniflow/ragflow** 或 **weaviate/Verba**：RAG基础，喂HR政策 + IT KB文档，快速变秘书原型。

