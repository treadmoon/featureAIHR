import 'dotenv/config';
import postgres from 'postgres';
import { readFileSync } from 'fs';

// Supabase 直连数据库（Transaction/Session mode pooler）
const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').replace('.supabase.co', '');
const dbPassword = process.env.SUPABASE_DB_PASSWORD;

if (!dbPassword) {
  // 如果没有数据库密码，用 pooler 连接字符串
  // Supabase 的 connection pooler 格式
  console.log('⚠️  未设置 SUPABASE_DB_PASSWORD，尝试使用 service role key 通过 REST 方式...');
  
  // 退回到用 fetch 调用 Supabase 的隐藏 SQL 执行端点
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const sql = readFileSync('supabase_tables.sql', 'utf-8');
  
  // Supabase 有一个未公开的 /pg/ 端点，但更可靠的方式是逐条执行
  // 我们改用另一种方式：通过 service key 创建一个临时 RPC 函数
  console.log('请手动在 Supabase Dashboard SQL Editor 执行 supabase_tables.sql');
  console.log(`Dashboard URL: https://supabase.com/dashboard/project/${projectRef}/sql/new`);
  process.exit(1);
}

const connectionString = `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`;
const sql = postgres(connectionString, { ssl: 'require' });

try {
  const ddl = readFileSync('supabase_tables.sql', 'utf-8');
  // 按分号分割并逐条执行
  const statements = ddl.split(';').map(s => s.trim()).filter(s => s.length > 0);
  for (const stmt of statements) {
    console.log('执行:', stmt.substring(0, 60) + '...');
    await sql.unsafe(stmt);
    console.log('✅ 成功');
  }
  console.log('🎉 所有表和数据已创建！');
} catch (e) {
  console.error('❌ 执行失败:', e.message);
} finally {
  await sql.end();
}
