require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// 这里因为只写简单的脚手架脚本，直接通过 node 原生 fetch 模拟或调用火山 API 即可，
// 但为避免复杂的依赖编译，我们通过简单的 HTTP Post 请求生成 Embedding 向量。

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const apiKey = process.env.VOLCENGINE_API_KEY;
const embedModelId = process.env.VOLCENGINE_EMBEDDING_MODEL_ID; 

if (!supabaseUrl || !supabaseServiceKey || !apiKey || !embedModelId) {
  console.error("请确保 .env.local 中配置了 SUPABASE_URL, SERVICE_KEY, VOLCENGINE_API_KEY 以及 VOLCENGINE_EMBEDDING_MODEL_ID");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const dummyPolicies = [
  {
    title: '《2026年员工福利与休假手册》',
    content: '公司自2026年起支持弹性休假与带薪病假。普通员工每年享有 10 天带薪年假，HR 及 Manager 级别享有 15 天。可通过企微一键申请。'
  },
  {
    title: '《IT 设备领用与网络排障指南》',
    content: '如果电脑连不上 VPN，请确认账户状态。如果密码到期，员工可直接使用 Auth 中心重置密码。新的设计软件需经过 IT Admin 审批。'
  },
  {
    title: '《差旅报销制度与发票标准》',
    content: '出差打车费和住宿费支持超额预警，当住宿超 500 元/晚时触发二次审批。所有发票必须通过 OCR 自动识别，自动汇入员工报销账单。'
  }
];

async function generateEmbedding(text) {
  const url = 'https://ark.cn-beijing.volces.com/api/v3/embeddings';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: embedModelId,
      input: text
    })
  });
  
  const result = await response.json();
  if (result.data && result.data.length > 0) {
    return result.data[0].embedding; // 通常返回一个 1024 维度的数字数组
  }
  throw new Error("Embedding generation failed: " + JSON.stringify(result));
}

async function seed() {
  console.log("🌱 正在向 Supabase 知识库播种初始测试政策数据...");

  for (const policy of dummyPolicies) {
    try {
      console.log(`正在生成向量: ${policy.title}`);
      const embedding = await generateEmbedding(policy.title + "\n" + policy.content);
      
      const { data, error } = await supabase
        .from('company_policies')
        .insert({
          title: policy.title,
          content: policy.content,
          embedding: embedding
        });

      if (error) {
        console.error(`保存 ${policy.title} 失败:`, error.message);
      } else {
        console.log(`✅ 已保存: ${policy.title}`);
      }
    } catch (e) {
      console.error(`处理 ${policy.title} 发生异常:`, e.message);
    }
  }
  
  console.log("🎉 播种完成！");
}

seed();
