/**
 * Mock data for DEMO_MODE — pre-recorded LLM responses
 * Used when DEMO_MODE=true to avoid real LLM API calls
 */

/** Leave balance query scenario */
export const LEAVE_BALANCE_SCENARIO = {
  toolCall: { toolCallId: 'call_leave_001', toolName: 'getLeaveBalance', input: {} },
  toolResult: {
    annual: { total: 15, used: 3, remaining: 12 },
    sick: { total: 10, used: 1, remaining: 9 },
    personal: { total: 5, used: 2, remaining: 3 },
    lieu: { total: 3, used: 0, remaining: 3 },
  },
  text: '查询完毕！你的假期余额如下：\n\n🏖️ **年假**：剩余 **12 天**（共 15 天，已用 3 天）\n🤒 **病假**：剩余 **9 天**（共 10 天，已用 1 天）\n🏠 **事假**：剩余 **3 天**（共 5 天，已用 2 天）\n⏰ **调休**：剩余 **3 天**（共 3 天，未使用）\n\n还有什么需要帮忙的吗？',
};

/** Leave request draft scenario */
export const LEAVE_DRAFT_SCENARIO = {
  toolCall: {
    toolCallId: 'call_draft_001',
    toolName: 'draftWorkflowApplication',
    input: { workflowType: 'leave', leaveType: 'personal', startDate: '2026-05-28', endDate: '2026-05-28', days: 1, reason: '个人事务' },
  },
  toolResult: {
    success: true,
    recommendation: { type: '调休', reason: '你有 3 天调休未使用，建议优先使用调休，不影响年假余额。' },
    draft: {
      workflowType: 'leave',
      leaveType: 'lieu',
      startDate: '2026-05-28',
      endDate: '2026-05-28',
      days: 1,
      reason: '个人事务',
      approver: { name: '李经理', department: '技术部' },
      steps: [{ step: 1, approver: '李明', role: '直属经理' }, { step: 2, approver: 'HR 团队', role: 'HR 审批' }],
    },
  },
  text: '已为你起草请假申请！📋\n\n**请假类型**：调休 1 天\n**日期**：2026年5月28日（周四）\n**事由**：个人事务\n**审批人**：李经理（技术部）\n\n💡 **推荐理由**：你有 3 天调休未使用，建议优先使用调休，不影响年假余额。\n\n请确认提交或修改信息：',
};

/** Password reset scenario */
export const PASSWORD_RESET_SCENARIO = {
  toolCall: { toolCallId: 'call_ticket_001', toolName: 'submitITTicket', input: { category: 'password_reset', title: '重置登录密码', description: '用户请求重置登录密码', priority: 'high' } },
  toolResult: {
    success: true,
    ticketId: 'IT-2026-0527-001',
    status: '已创建',
    estimatedTime: '15分钟内',
    assignee: 'IT 支持团队',
  },
  text: '已为你创建 IT 工单！🎫\n\n**工单号**：IT-2026-0527-001\n**类型**：密码重置\n**优先级**：高\n**处理团队**：IT 支持团队\n**预计处理时间**：15分钟内\n\nIT 同事会尽快处理，你也可以通过企业微信联系 IT 支持获取更快响应。',
};

/** Admin employee search scenario */
export const ADMIN_SEARCH_SCENARIO = {
  toolCall: { toolCallId: 'call_search_001', toolName: 'searchEmployee', input: { query: '张伟' } },
  toolResult: {
    employees: [
      { id: 'emp-001', name: '张伟', department: '技术部', job_title: '高级前端工程师', job_level: 'P6', status: 'active', email: 'zhangwei@star.dev', phone: '13800138001' },
      { id: 'emp-015', name: '张伟', department: '市场部', job_title: '市场专员', job_level: 'P3', status: 'active', email: 'zhangwei2@star.dev', phone: '13800138015' },
    ],
  },
  text: '找到 2 位名为"张伟"的员工：\n\n1. **张伟** — 技术部 · 高级前端工程师（P6）\n   📧 zhangwei@star.dev · 📱 13800138001 · 状态：在职\n\n2. **张伟** — 市场部 · 市场专员（P3）\n   📧 zhangwei2@star.dev · 📱 13800138015 · 状态：在职\n\n需要查看某位的详细信息或进行修改吗？',
};

/** Welcome/greeting scenario */
export const GREETING_SCENARIO = {
  text: '你好！我是你的 AI 智能秘书 👋\n\n我可以帮你处理各种 HR 和 IT 事务，比如：\n\n- 🏖️ 查看假期余额、申请请假\n- 📊 查询考勤记录、薪资明细\n- 🔑 重置密码、申请软件授权\n- 📋 查看和提交审批申请\n\n有什么需要帮忙的，尽管问我！',
};

/** Memory extraction mock result */
export const MOCK_MEMORY_FACTS = {
  facts: [
    { category: 'preference', content: '用户偏好使用调休优先于年假', confidence: 0.85 },
    { category: 'context', content: '用户在技术部工作，是一名前端工程师', confidence: 0.9 },
  ],
};

/** Summarization mock result */
export const MOCK_SUMMARY = '用户之前查询了年假余额（剩余12天），并申请了一天调休（2026年5月28日），工单已提交等待审批。';

/** Analytics insights mock result */
export const MOCK_ANALYTICS_INSIGHTS = `📊 数据洞察（Demo 模式）：

1. **用户活跃度**：本周有 28 位用户使用了 AI 秘书，日均对话 3.2 轮，较上周增长 15%。

2. **高频功能**：假期查询（35%）、考勤查询（22%）、薪资查询（18%）是最常用的功能。

3. **工具调用成功率**：整体工具调用成功率为 97.3%，主要失败原因是超时（1.8%）。

4. **用户满意度**：正面反馈占比 89%，负面反馈主要集中在"响应速度慢"（6%）和"信息不准确"（5%）。

5. **建议**：建议优化薪资查询的缓存策略，可减少约 30% 的重复查询延迟。`;

/** Map user text keywords to demo scenarios */
export function matchDemoScenario(text: string) {
  const t = text.toLowerCase();
  if (/请假|假期|leave/.test(t)) return 'leave_draft';
  if (/余额|剩|balance|年假/.test(t)) return 'leave_balance';
  if (/密码|password|重置/.test(t)) return 'password_reset';
  if (/搜索|查询.*员工|search|查员工/.test(t)) return 'admin_search';
  return 'greeting';
}

/** Get scenario data by name */
export function getScenarioData(name: string) {
  switch (name) {
    case 'leave_balance': return LEAVE_BALANCE_SCENARIO;
    case 'leave_draft': return LEAVE_DRAFT_SCENARIO;
    case 'password_reset': return PASSWORD_RESET_SCENARIO;
    case 'admin_search': return ADMIN_SEARCH_SCENARIO;
    default: return GREETING_SCENARIO;
  }
}
