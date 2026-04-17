import { z } from 'zod';
import { embed } from 'ai';
import { ToolDefinition, AgentContext, ToolResult } from './types';
import { supabaseAdmin } from '@/lib/supabase';
import { createOpenAI } from '@ai-sdk/openai';

const volcengine = createOpenAI({
  apiKey: process.env.VOLCENGINE_API_KEY || '',
  baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
});

export const searchCompanyPoliciesTool: ToolDefinition = {
  name: 'searchCompanyPolicies',
  description: '检索公司人事/IT/行政政策文档知识库。当用户询问公司制度、规章、政策、流程相关问题时调用此工具。',
  inputSchema: z.object({ query: z.string().describe('用户问题的关键词，如"年假规定"、"报销流程"') }),
  execute: async (args: unknown, ctx: AgentContext): Promise<ToolResult> => {
    const { query } = args as { query: string };

    // 知识库仅对管理员/HR/经理可见
    if (!['admin', 'hr', 'manager'].includes(ctx.role)) {
      return { documents: [], message: '知识库仅对管理序列开放' };
    }

    if (!supabaseAdmin) {
      return { error: 'Supabase 未连接' };
    }

    const embedModelId = process.env.VOLCENGINE_EMBEDDING_MODEL_ID;

    // 无 embedding 模型时：降级为全文搜索
    if (!embedModelId) {
      // 清洗输入，防 tsquery 注入
      const safeQuery = query
        .replace(/[^a-zA-Z0-9\u4e00-\u9fff\s]/g, ' ')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 5)
        .join(' & ');

      if (!safeQuery) {
        return { documents: [], message: '知识库中未找到相关内容' };
      }

      const { data } = await supabaseAdmin
        .from('knowledge_chunks')
        .select('content, doc_id')
        .textSearch('content', safeQuery, { type: 'plain' })
        .limit(3);

      if (!data?.length) {
        return { documents: [], message: '知识库中未找到相关内容' };
      }

      const docIds = [...new Set(data.map(d => d.doc_id))];
      const { data: docs } = await supabaseAdmin
        .from('knowledge_docs')
        .select('id, title')
        .in('id', docIds);

      const titleMap = Object.fromEntries((docs || []).map(d => [d.id, d.title]));

      return {
        documents: data.map(d => ({
          title: titleMap[d.doc_id] || '未知文档',
          excerpt: d.content,
        })),
      };
    }

    // 有 embedding 模型：使用向量搜索
    try {
      const { embedding } = await embed({
        model: volcengine.textEmbeddingModel(embedModelId),
        value: query,
      });

      // 阈值 0.65（约 0.35 余弦距离），避免垃圾召回
      const { data, error } = await supabaseAdmin.rpc('match_policies', {
        query_embedding: embedding,
        match_threshold: 0.65,
        match_count: 3,
      });

      if (error) {
        throw error;
      }

      if (!data?.length) {
        return { documents: [], message: '知识库中未找到相关内容' };
      }

      return {
        documents: data.map((d: any) => ({
          title: d.title,
          excerpt: d.content,
          similarity: d.similarity,
        })),
      };
    } catch (e: any) {
      return { error: '检索失败: ' + e.message };
    }
  },
};
