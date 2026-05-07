import { createOpenAI } from '@ai-sdk/openai';

export const volcengine = createOpenAI({
  apiKey: process.env.VOLCENGINE_API_KEY || '',
  baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
});
