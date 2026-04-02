# Changelog

本项目所有重要变更记录。格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/)。

---

## [1.0.0] - 2026-04-02

### 🚀 核心功能

- **对话式 AI 秘书**：基于火山引擎豆包大模型，支持自然语言交互
- **审批工作流**：请假/报销/加班/补卡等，支持多级审批链
- **组织架构管理**：部门/职位/职级 CRUD，树形架构图
- **员工管理后台**：录入/编辑/禁用员工，详情页含考勤/绩效/调动记录
- **登录认证**：Supabase Auth，基于 cookie 的会话管理

### 👥 角色个性化（迭代 1）

- 三级角色识别：普通员工 / 经理（departments.manager_id + report_to） / 管理员
- 三套差异化欢迎页问候语和建议卡片
- 三套快捷操作按角色切换
- 经理专属工具：`getTeamAttendance`、`getTeamMembers`、`getTeamLeaveCalendar`
- 管理员专属工具：`searchEmployee`、`updateEmployee`、`getCompanyStats`
- CEO/admin 查团队数据直接看全公司

### 💬 对话历史持久化（迭代 2）

- `chat_sessions` + `chat_messages` 表，RLS 隔离
- 对话自动增量保存（非 streaming 时触发）
- 侧边栏：历史会话列表 + 搜索框
- 按日期删除（7天/30天前）或压缩（保留首尾各2条）

### 🔔 主动推送通知（迭代 3）

- 🎂 今日生日祝福（员工看同部门，经理看全公司）
- ⚠️ 合同 30 天内到期预警（经理/管理员）
- 📋 待审批事项提醒（经理/管理员）
- ✅❌ 审批结果通知（申请被通过/驳回，3天内）
- 🎉 新员工入职引导清单（入职 7 天内，4 个快捷按钮）
- ⏰ 上月考勤异常提醒

### 📊 数据看板（迭代 4）

- 管理员专属页面 `/admin/dashboard`
- 人员概览：在职/离职/部门分布/本月入职
- 考勤统计：迟到/早退/缺勤/平均出勤率
- 审批统计：按类型和状态分布（含进度条）
- AI 差评分析：差评率 + 原因分布

### 📚 企业 RAG 知识库（迭代 5）

- 知识分类：人事制度/IT规范/行政管理/财务制度/安全合规
- 文档管理页面 `/admin/knowledge`：新建/编辑/删除/归档
- 自动切片（~500字/片）+ 向量化（Embedding）
- 版本记录：每次编辑自动递增版本号
- 双模检索：有 Embedding 模型用向量检索，无则降级关键词搜索
- AI 回答溯源：回复末尾附 📖 参考：《文档标题》

### 🎨 UX 优化

- 隐藏 AI Reasoning 思考过程（前端过滤 + prompt 约束）
- 移除假按钮（文件上传/语音）
- 移除"输出完成"无意义提示
- Header 精简：7 个操作区 → 3 个（清空 + 审批 + 头像下拉菜单）
- 快捷操作独立短标签（不再硬截断文字）
- 错误提示改为手动关闭
- IT 工单专属卡片 + 兜底卡片去技术术语
- 审批列表增加类型筛选和申请人搜索
- `lang="en"` → `lang="zh-CN"`

### 👍 用户反馈系统

- 每条 AI 回复下方 👍👎 按钮
- 👎 弹出原因选择（回答不准确/没解决问题/回复太慢/信息不完整/其他）
- 反馈记录到 `diagnosis_logs` 表，可通过看板分析

### 🔒 安全

- **Prompt 注入防护三层防线**：
  - 输入层：正则检测 20+ 种注入模式（角色劫持/提示泄露/越权提权/工具滥用）
  - 模型层：system prompt 安全红线第 0 条
  - 日志层：拦截记录到 diagnosis_logs
- **API Rate Limit**：chat 20次/分钟，知识库 10次/分钟
- **密码框**：`type="password"`（修复明文显示）
- **知识库安全**：输入校验 + 内容注入检测 + tsquery 清洗
- **RAG 间接注入防护**：写入时拦截 + system prompt 规则
- **RBAC**：每个工具内部校验角色权限
- **RLS**：所有表启用行级安全策略

### ⚡ 性能

- **LLM 语义缓存**：相同查询 5 分钟内命中缓存，写操作不缓存
- **Notifications API**：7-8 次串行查询 → Promise.all 并行
- **Supabase 客户端单例化**：浏览器端不再每次渲染新建
- **数据库索引**：11 个索引覆盖高频查询路径
- **getTeamLeaveCalendar**：只查近 30 天，避免全表扫描
- **maxDuration**：30s → 60s

### 🏗️ 架构 & 部署

- **组件拆分**：ToolCards、ChatSidebar 独立组件
- **Docker 部署**：多阶段构建 + standalone 模式
- **GitHub Actions CI/CD**：push main 自动构建 → SCP → Docker 部署
- **环境变量文档**：`DEPLOY_SECRETS.md`（8+1 个 Secrets）
- **Supabase 客户端统一**：复用全局 `supabaseAdmin`，不再重复创建

### 📄 文档

- `DEPLOY_SECRETS.md`：GitHub Secrets 配置清单
- `PROMPT_INJECTION_TEST.md`：Prompt 注入测试用例
- `CHANGELOG.md`：本文件
- `projectPlan.md`：项目详细计划书
- `use.md`：测试账号信息

### 🗄️ 数据库迁移脚本

| 文件 | 内容 |
|------|------|
| `schema.sql` | 基础 profiles 表 + RLS |
| `p0-extend.sql` | 扩展字段 + 考勤/绩效/工单/报销表 |
| `p1-org-tables.sql` | 部门/职位/职级表 |
| `p2-employee-positions.sql` | 员工岗位关联表 |
| `p3-migrate-text-to-fk.sql` | 文本字段迁移为外键 |
| `p4-approvals.sql` | 审批请求 + 审批步骤表 |
| `p5-diagnosis.sql` | 诊断日志表 |
| `p6-create-users.sql` | 创建测试用户 |
| `p6-seed-org.sql` | 组织架构种子数据 |
| `p7-seed-employees.sql` | 员工种子数据 |
| `p8-chat-history.sql` | 对话历史表 |
| `p9-performance-indexes.sql` | 性能优化索引 |
| `p10-knowledge-base.sql` | 知识库表 + 向量检索函数 |
