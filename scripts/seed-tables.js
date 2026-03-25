require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setup() {
  // Supabase JS SDK 不能直接执行 DDL，所以我们用 REST API 的方式
  // 改用逐步创建的方式：先通过 insert 测试表是否存在，不存在则提示手动执行 SQL

  // 先尝试查询
  const { data, error } = await supabase.from('employee_profiles').select('employee_id').limit(1);
  
  if (error && error.code === 'PGRST205') {
    console.log('❌ 表不存在，请先在 Supabase Dashboard SQL Editor 中执行 supabase_tables.sql');
    console.log(`   打开: ${supabaseUrl.replace('.supabase.co', '.supabase.co')}/project/default/sql`);
    console.log('   或直接访问: https://supabase.com/dashboard 进入项目 SQL Editor');
    return;
  }

  if (data && data.length > 0) {
    console.log('✅ 表已存在且有数据，跳过播种');
    return;
  }

  // 表存在但没数据，播种
  console.log('🌱 播种员工档案...');
  const { error: e1 } = await supabase.from('employee_profiles').upsert({
    employee_id: 'demo_001', name: '张三', department: '产品研发部', role: 'employee',
    annual_leave_balance: 7.5, sick_leave_balance: 4, lieu_leave_balance: 2,
    base_salary: 18500, housing_fund: 1850, social_insurance: 1200, tax: 680
  }, { onConflict: 'employee_id' });
  if (e1) console.error('员工档案播种失败:', e1.message); else console.log('✅ 员工档案已播种');

  console.log('🌱 播种考勤记录...');
  const records = [
    { employee_id: 'demo_001', date: '2026-03-02', clock_in: '09:02', clock_out: '18:30', status: 'normal' },
    { employee_id: 'demo_001', date: '2026-03-03', clock_in: '09:45', clock_out: '18:20', status: 'late', remark: '迟到45分钟' },
    { employee_id: 'demo_001', date: '2026-03-04', clock_in: '08:55', clock_out: '18:00', status: 'normal' },
    { employee_id: 'demo_001', date: '2026-03-05', clock_in: '09:00', clock_out: '17:15', status: 'early_leave', remark: '早退45分钟' },
    { employee_id: 'demo_001', date: '2026-03-06', clock_in: '09:01', clock_out: '18:35', status: 'normal' },
    { employee_id: 'demo_001', date: '2026-03-09', clock_in: '08:58', clock_out: '18:10', status: 'normal' },
    { employee_id: 'demo_001', date: '2026-03-10', clock_in: null, clock_out: null, status: 'missed', remark: '全天未打卡' },
    { employee_id: 'demo_001', date: '2026-03-11', clock_in: '09:00', clock_out: '18:00', status: 'normal' },
    { employee_id: 'demo_001', date: '2026-03-12', clock_in: '09:03', clock_out: '18:25', status: 'normal' },
    { employee_id: 'demo_001', date: '2026-03-13', clock_in: '08:50', clock_out: '18:00', status: 'normal' },
    { employee_id: 'demo_001', date: '2026-03-16', clock_in: '09:00', clock_out: '18:30', status: 'normal' },
    { employee_id: 'demo_001', date: '2026-03-17', clock_in: '09:10', clock_out: '18:00', status: 'normal' },
    { employee_id: 'demo_001', date: '2026-03-18', clock_in: '09:00', clock_out: '18:15', status: 'normal' },
    { employee_id: 'demo_001', date: '2026-03-19', clock_in: '08:55', clock_out: '18:00', status: 'normal' },
    { employee_id: 'demo_001', date: '2026-03-20', clock_in: '09:00', clock_out: '18:30', status: 'normal' },
  ];
  const { error: e2 } = await supabase.from('attendance_records').upsert(records, { onConflict: 'employee_id,date' });
  if (e2) console.error('考勤播种失败:', e2.message); else console.log('✅ 考勤记录已播种');

  console.log('🎉 全部完成！');
}

setup();
