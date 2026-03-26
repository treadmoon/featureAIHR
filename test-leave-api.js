const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLeaveRequest() {
  console.log('--- Testing Leave Application Flow ---');

  // 1. Login
  const email = 'admin@star.dev';
  const password = 'Pass1234';
  
  console.log(`Logging in as ${email}...`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    console.error('Login failed:', authError.message);
    return;
  }

  const session = authData.session;
  console.log('Login successful! Session token obtained.');

  // 2. Call Chat API
  console.log('Sending leave request prompt to AI Agent...');
  const response = await fetch('http://127.0.0.1:51984/api/chat?role=admin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token=${JSON.stringify(session)}`
    },
    body: JSON.stringify({
      messages: [
        { role: 'user', content: '我要请假，从 2026-04-01 到 2026-04-02，年假，家里有事' }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API call failed with status ${response.status}:`, errorText);
    return;
  }

  // 3. Process Streamed Response
  console.log('Processing stream...');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullContent = '';
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    fullContent += decoder.decode(value, { stream: true });
  }

  console.log('Raw Response Samples:', fullContent.substring(0, 500) + '...');
  
  // 4. Verification
  if (fullContent.includes('draftWorkflowApplication') || fullContent.includes('leave')) {
    console.log('\nSUCCESS: AI Agent triggered the leave application draft tool.');
    if (fullContent.includes('2026-04-01') && fullContent.includes('2026-04-02')) {
      console.log('SUCCESS: Dates were correctly extracted by the AI.');
    }
  } else {
    console.log('\nFAILURE: AI Agent did not trigger the expected tool call.');
  }
}

testLeaveRequest().catch(console.error);
