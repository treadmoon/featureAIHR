const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTest() {
  console.log('1. Logging in...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@star.dev',
    password: 'Pass1234',
  });

  if (error) throw error;
  const session = data.session;
  console.log('Login success.');

  console.log('2. Sending Chat Request...');
  
  // Note: We need to pass the session in a way that the Next.js server-side Supabase client can read it.
  // The default cookie name for @supabase/ssr is usually supabase-auth-token
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
  const cookieName = `sb-${projectRef}-auth-token`;
  
  const response = await fetch('http://127.0.0.1:51984/api/chat?role=admin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // We encode the session object to match the cookie format expected by @supabase/ssr
      'Cookie': `${cookieName}=${encodeURIComponent(JSON.stringify(session))}`
    },
    body: JSON.stringify({
      messages: [
        { role: 'user', parts: [{ type: 'text', text: '我要请假，下周三到下周五，想回趟老家' }] }
      ]
    })
  });

  console.log('STATUS:', response.status);
  if (!response.ok) {
    console.log('Error:', await response.text());
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let result = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    result += chunk;
    process.stdout.write(chunk);
  }
  
  console.log('\n--- Test Finished ---');
  if (result.includes('draftWorkflowApplication')) {
     console.log('✅ Success: Leave draft tool called.');
  } else {
     console.log('❌ Failure: Expected tool call not found in response.');
  }
}

runTest().catch(console.error);
