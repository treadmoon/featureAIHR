export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content?: string;
  parts?: any[];
  [key: string]: any;
}
