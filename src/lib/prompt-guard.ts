// Prompt 注入检测 — 检查用户输入是否包含恶意指令
const INJECTION_PATTERNS = [
  // 角色劫持
  /忽略.{0,10}(之前|以上|所有|全部).{0,10}(指令|规则|限制|约束)/i,
  /ignore.{0,15}(previous|above|all|prior).{0,15}(instructions?|rules?|prompts?)/i,
  /you are now/i,
  /你现在是/,
  /act as/i,
  /pretend (to be|you are)/i,
  /假装你是/,
  /扮演/,

  // 系统提示泄露
  /system\s*prompt/i,
  /(输出|显示|打印|告诉我).{0,10}(系统提示|system prompt|指令|初始化|配置)/,
  /repeat.{0,10}(instructions?|prompt|above)/i,
  /重复.{0,10}(指令|提示|上面)/,
  /what are your (instructions|rules)/i,

  // 越权提权
  /我的角色.{0,10}(是|改为|变成).{0,10}(admin|管理员)/,
  /my role is admin/i,
  /grant.{0,10}(admin|root|superuser)/i,
  /提升.{0,10}权限/,

  // 工具滥用（批量操作）
  /(所有|全部|每个).{0,10}(员工|用户).{0,10}(删除|禁用|修改|设为)/,
  /update all/i,
  /delete all/i,
  /drop\s+table/i,
];

export type InjectionResult = { blocked: boolean; reason?: string };

export function detectInjection(text: string): InjectionResult {
  const normalized = text.replace(/\s+/g, ' ').trim();
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(normalized)) {
      return { blocked: true, reason: `检测到可疑指令模式: ${pattern.source.slice(0, 30)}` };
    }
  }
  return { blocked: false };
}
