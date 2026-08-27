export interface AIRequestMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
