export const TYPE_LABELS: Record<string, string> = {
  leave: '请假',
  expense: '报销',
  overtime: '加班',
  attendance_fix: '补卡',
  transfer: '调岗',
  salary_adjust: '调薪',
  resignation: '离职',
  onboard: '入职确认',
};

export const TYPE_ICONS: Record<string, string> = {
  leave: '🏖️',
  expense: '🧾',
  overtime: '⏰',
  attendance_fix: '📋',
  transfer: '🔄',
  salary_adjust: '💰',
  resignation: '👋',
  onboard: '🎉',
};

export const STATUS_STYLES: Record<string, { label: string; cls: string; dot: string }> = {
  pending: { label: '审批中', cls: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
  approved: { label: '已通过', cls: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  rejected: { label: '已驳回', cls: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  cancelled: { label: '已撤销', cls: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' },
  skipped: { label: '已跳过', cls: 'bg-gray-100 text-gray-400', dot: 'bg-gray-300' },
};

export const LEAVE_TYPES: Record<string, string> = {
  annual: '年假',
  sick: '病假',
  personal: '事假',
  lieu: '调休',
  maternity: '产假',
  marriage: '婚假',
  bereavement: '丧假',
  other: '其他',
};
