# GitHub Actions Secrets 配置清单

> 仓库 → Settings → Secrets and variables → Actions → New repository secret

## EC2 服务器连接（3 个）

| Secret 名称 | 说明 | 示例 |
|---|---|---|
| `EC2_HOST` | EC2 实例公网 IP 或域名 | `54.123.45.67` |
| `EC2_USER` | SSH 登录用户名，Ubuntu 系统默认 `ubuntu`，Amazon Linux 默认 `ec2-user` | `ubuntu` |
| `EC2_SSH_KEY` | EC2 密钥对的私钥完整内容（含首尾 BEGIN/END 行），从 AWS 下载的 `.pem` 文件 | `-----BEGIN RSA PRIVATE KEY-----\nMIIE...` |

## 火山引擎大模型（2 个）

| Secret 名称 | 说明 | 获取位置 |
|---|---|---|
| `VOLCENGINE_API_KEY` | 火山方舟 API 密钥 | [火山方舟控制台](https://console.volcengine.com/ark) → API Key 管理 |
| `VOLCENGINE_MODEL_ID` | 豆包模型的推理接入点 ID，格式 `ep-xxxxxxxx-xxxxxxxx` | 火山方舟 → 在线推理 → 接入点管理 |
| `VOLCENGINE_EMBEDDING_MODEL_ID` | 豆包 Embedding 模型接入点 ID（用于政策文档 RAG 检索），可选 | 火山方舟 → 在线推理 → Embedding 接入点 |

## Supabase 数据库（3 个）

| Secret 名称 | 说明 | 获取位置 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 API 地址，格式 `https://xxx.supabase.co` | [Supabase Dashboard](https://supabase.com/dashboard) → 项目 → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名公钥（可暴露给前端） | 同上 → `anon` `public` Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务端密钥（绕过 RLS，**绝不可暴露给前端**） | 同上 → `service_role` Key |
