/**
 * 预置初创公司组织架构 seed 脚本
 * 创建部门、职位、职级、员工账号及任职关系
 * 运行: node scripts/seed-org.js
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PASSWORD = 'Pass1234';

// ── 职级 ──
const LEVELS = [
  { name: '初级', code: 'P1', track: 'professional', level: 1 },
  { name: '中级', code: 'P2', track: 'professional', level: 2 },
  { name: '高级', code: 'P3', track: 'professional', level: 3 },
  { name: '资深', code: 'P4', track: 'professional', level: 4 },
  { name: '主管', code: 'M1', track: 'management', level: 5 },
  { name: '经理', code: 'M2', track: 'management', level: 6 },
  { name: '总监', code: 'M3', track: 'management', level: 7 },
];

// ── 部门（三层） ──
// key 用于引用，parent 指向 key
const DEPTS = [
  { key: 'company', name: '星辰科技', code: 'HQ', parent: null, sort: 0 },
  { key: 'tech', name: '技术中心', code: 'TECH', parent: 'company', sort: 1 },
  { key: 'product', name: '产品部', code: 'PROD', parent: 'company', sort: 2 },
  { key: 'market', name: '市场部', code: 'MKT', parent: 'company', sort: 3 },
  { key: 'hr', name: '人力资源部', code: 'HR', parent: 'company', sort: 4 },
  { key: 'finance', name: '财务部', code: 'FIN', parent: 'company', sort: 5 },
  { key: 'ops', name: '运营部', code: 'OPS', parent: 'company', sort: 6 },
  // 三级
  { key: 'fe', name: '前端组', code: 'TECH-FE', parent: 'tech', sort: 1 },
  { key: 'be', name: '后端组', code: 'TECH-BE', parent: 'tech', sort: 2 },
  { key: 'qa', name: '测试组', code: 'TECH-QA', parent: 'tech', sort: 3 },
];

// ── 职位 ──
// dept: 部门 key，null 表示通用
const POSITIONS = [
  { name: 'CEO', code: 'CEO', dept: 'company' },
  { name: '技术总监', code: 'CTO', dept: 'tech' },
  { name: '前端工程师', code: 'FE-ENG', dept: 'fe' },
  { name: '后端工程师', code: 'BE-ENG', dept: 'be' },
  { name: '测试工程师', code: 'QA-ENG', dept: 'qa' },
  { name: '产品经理', code: 'PM', dept: 'product' },
  { name: '产品设计师', code: 'UX', dept: 'product' },
  { name: '市场经理', code: 'MKT-MGR', dept: 'market' },
  { name: '市场专员', code: 'MKT-SP', dept: 'market' },
  { name: 'HR经理', code: 'HR-MGR', dept: 'hr' },
  { name: 'HRBP', code: 'HRBP', dept: 'hr' },
  { name: '财务经理', code: 'FIN-MGR', dept: 'finance' },
  { name: '会计', code: 'ACCT', dept: 'finance' },
  { name: '运营经理', code: 'OPS-MGR', dept: 'ops' },
  { name: '运营专员', code: 'OPS-SP', dept: 'ops' },
];

// ── 员工 ──
// dept/pos 引用上面的 key/code, level 引用 code, mgr=true 表示设为部门经理
const EMPLOYEES = [
  // CEO
  { name: '陈明远', email: 'ceo@star.dev', dept: 'company', pos: 'CEO', level: 'M3', mgr: true, gender: '男' },

  // 技术中心
  { name: '李志强', email: 'lizhiqiang@star.dev', dept: 'tech', pos: 'CTO', level: 'M3', mgr: true, gender: '男' },
  // 前端组
  { name: '王小明', email: 'wangxm@star.dev', dept: 'fe', pos: 'FE-ENG', level: 'M1', mgr: true, gender: '男' },
  { name: '赵雨晴', email: 'zhaoyq@star.dev', dept: 'fe', pos: 'FE-ENG', level: 'P3', gender: '女' },
  { name: '孙浩然', email: 'sunhr@star.dev', dept: 'fe', pos: 'FE-ENG', level: 'P2', gender: '男' },
  { name: '林小燕', email: 'linxy@star.dev', dept: 'fe', pos: 'FE-ENG', level: 'P2', gender: '女' },
  { name: '陈子轩', email: 'chenzx@star.dev', dept: 'fe', pos: 'FE-ENG', level: 'P1', gender: '男' },
  // 后端组
  { name: '张伟', email: 'zhangwei@star.dev', dept: 'be', pos: 'BE-ENG', level: 'M1', mgr: true, gender: '男' },
  { name: '刘洋', email: 'liuyang@star.dev', dept: 'be', pos: 'BE-ENG', level: 'P4', gender: '男' },
  { name: '周敏', email: 'zhoumin@star.dev', dept: 'be', pos: 'BE-ENG', level: 'P3', gender: '女' },
  { name: '吴昊', email: 'wuhao@star.dev', dept: 'be', pos: 'BE-ENG', level: 'P2', gender: '男' },
  { name: '郑雅文', email: 'zhengyw@star.dev', dept: 'be', pos: 'BE-ENG', level: 'P2', gender: '女' },
  { name: '黄磊', email: 'huanglei@star.dev', dept: 'be', pos: 'BE-ENG', level: 'P1', gender: '男' },
  // 测试组
  { name: '杨静', email: 'yangjing@star.dev', dept: 'qa', pos: 'QA-ENG', level: 'M1', mgr: true, gender: '女' },
  { name: '许文博', email: 'xuwb@star.dev', dept: 'qa', pos: 'QA-ENG', level: 'P3', gender: '男' },
  { name: '何雪', email: 'hexue@star.dev', dept: 'qa', pos: 'QA-ENG', level: 'P2', gender: '女' },

  // 产品部
  { name: '马丽华', email: 'malh@star.dev', dept: 'product', pos: 'PM', level: 'M2', mgr: true, gender: '女' },
  { name: '宋佳', email: 'songjia@star.dev', dept: 'product', pos: 'PM', level: 'P3', gender: '女' },
  { name: '唐艺', email: 'tangyi@star.dev', dept: 'product', pos: 'UX', level: 'P3', gender: '女' },
  { name: '韩冰', email: 'hanbing@star.dev', dept: 'product', pos: 'UX', level: 'P2', gender: '男' },

  // 市场部
  { name: '冯刚', email: 'fenggang@star.dev', dept: 'market', pos: 'MKT-MGR', level: 'M2', mgr: true, gender: '男' },
  { name: '曹颖', email: 'caoying@star.dev', dept: 'market', pos: 'MKT-SP', level: 'P2', gender: '女' },
  { name: '彭涛', email: 'pengtao@star.dev', dept: 'market', pos: 'MKT-SP', level: 'P2', gender: '男' },
  { name: '谢芳', email: 'xiefang@star.dev', dept: 'market', pos: 'MKT-SP', level: 'P1', gender: '女' },

  // 人力资源部
  { name: '邓丽', email: 'dengli@star.dev', dept: 'hr', pos: 'HR-MGR', level: 'M2', mgr: true, gender: '女' },
  { name: '蒋文', email: 'jiangwen@star.dev', dept: 'hr', pos: 'HRBP', level: 'P3', gender: '女' },
  { name: '沈超', email: 'shenchao@star.dev', dept: 'hr', pos: 'HRBP', level: 'P2', gender: '男' },

  // 财务部
  { name: '韦国强', email: 'weigq@star.dev', dept: 'finance', pos: 'FIN-MGR', level: 'M2', mgr: true, gender: '男' },
  { name: '秦月', email: 'qinyue@star.dev', dept: 'finance', pos: 'ACCT', level: 'P3', gender: '女' },
  { name: '尤明', email: 'youming@star.dev', dept: 'finance', pos: 'ACCT', level: 'P2', gender: '男' },

  // 运营部
  { name: '罗晨', email: 'luochen@star.dev', dept: 'ops', pos: 'OPS-MGR', level: 'M2', mgr: true, gender: '男' },
  { name: '田甜', email: 'tiantian@star.dev', dept: 'ops', pos: 'OPS-SP', level: 'P2', gender: '女' },
  { name: '范志远', email: 'fanzy@star.dev', dept: 'ops', pos: 'OPS-SP', level: 'P1', gender: '男' },
];

// 管理员账号
const ADMIN = { name: '系统管理员', email: 'admin@star.dev', role: 'admin' };

async function seed() {
  console.log('🌱 开始预置初创公司架构...\n');

  // 1. 职级
  console.log('📊 创建职级...');
  const levelMap = {};
  for (const l of LEVELS) {
    const { data, error } = await sb.from('job_levels').upsert(l, { onConflict: 'code' }).select().single();
    if (error) { console.error(`  ❌ ${l.code}: ${error.message}`); continue; }
    levelMap[l.code] = data.id;
    console.log(`  ✅ ${l.code} ${l.name}`);
  }

  // 2. 部门
  console.log('\n🏢 创建部门...');
  const deptMap = {};
  for (const d of DEPTS) {
    const row = { name: d.name, code: d.code, parent_id: d.parent ? deptMap[d.parent] : null, sort_order: d.sort };
    const { data, error } = await sb.from('departments').upsert(row, { onConflict: 'name,parent_id' }).select().single();
    if (error) { console.error(`  ❌ ${d.name}: ${error.message}`); continue; }
    deptMap[d.key] = data.id;
    console.log(`  ✅ ${d.name}`);
  }

  // 3. 职位
  console.log('\n💼 创建职位...');
  const posMap = {};
  for (const p of POSITIONS) {
    const row = { name: p.name, code: p.code, department_id: p.dept ? deptMap[p.dept] : null };
    // 用 code 去重
    const { data: existing } = await sb.from('positions').select('id').eq('code', p.code).maybeSingle();
    if (existing) {
      posMap[p.code] = existing.id;
      console.log(`  ⏭️ ${p.name} (已存在)`);
      continue;
    }
    const { data, error } = await sb.from('positions').insert(row).select().single();
    if (error) { console.error(`  ❌ ${p.name}: ${error.message}`); continue; }
    posMap[p.code] = data.id;
    console.log(`  ✅ ${p.name}`);
  }

  // 4. 管理员账号
  console.log('\n👤 创建管理员...');
  const adminId = await ensureUser(ADMIN.email, ADMIN.name, 'admin');
  if (adminId) console.log(`  ✅ ${ADMIN.name} (${ADMIN.email})`);

  // 5. 员工
  console.log('\n👥 创建员工...');
  const mgrAssign = []; // { deptKey, userId }
  for (const emp of EMPLOYEES) {
    const userId = await ensureUser(emp.email, emp.name, 'employee');
    if (!userId) continue;

    // 更新 profile
    await sb.from('profiles').update({
      gender: emp.gender,
      department: DEPTS.find(d => d.key === emp.dept)?.name || '',
      job_title: POSITIONS.find(p => p.code === emp.pos)?.name || '',
      job_level: LEVELS.find(l => l.code === emp.level)?.name || '',
      department_id: deptMap[emp.dept] || null,
      position_id: posMap[emp.pos] || null,
      job_level_id: levelMap[emp.level] || null,
      employee_status: 'active',
      hire_date: '2025-01-15',
    }).eq('id', userId);

    // 创建主职位记录
    const { data: existingEp } = await sb.from('employee_positions')
      .select('id').eq('employee_id', userId).eq('is_primary', true).is('end_date', null).maybeSingle();
    if (!existingEp && deptMap[emp.dept] && posMap[emp.pos]) {
      await sb.from('employee_positions').insert({
        employee_id: userId,
        department_id: deptMap[emp.dept],
        position_id: posMap[emp.pos],
        is_primary: true,
        start_date: '2025-01-15',
      });
    }

    if (emp.mgr) mgrAssign.push({ deptKey: emp.dept, userId });
    console.log(`  ✅ ${emp.name} (${emp.email}) → ${emp.dept}/${emp.pos}/${emp.level}`);
  }

  // 6. 设置部门经理
  console.log('\n👔 设置部门经理...');
  for (const { deptKey, userId } of mgrAssign) {
    await sb.from('departments').update({ manager_id: userId }).eq('id', deptMap[deptKey]);
    console.log(`  ✅ ${DEPTS.find(d => d.key === deptKey)?.name} → ${EMPLOYEES.find(e => e.dept === deptKey && e.mgr)?.name}`);
  }

  console.log('\n🎉 全部完成！');
}

async function ensureUser(email, name, role) {
  // 检查是否已存在
  const { data: { users } } = await sb.auth.admin.listUsers();
  const existing = users.find(u => u.email === email);
  if (existing) return existing.id;

  const { data, error } = await sb.auth.admin.createUser({
    email, password: PASSWORD, email_confirm: true,
    user_metadata: { name, role },
  });
  if (error) { console.error(`  ❌ ${email}: ${error.message}`); return null; }
  return data.user.id;
}

seed();
