import type { AIRequestMessage } from './ai-client-shared';
export type { AIRequestMessage };

export interface AIRequestOptions {
  messages: AIRequestMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface AIResponse {
  content: string;
}

export class AIError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'AIError';
  }
}

/**
 * Calls the secure server-side AI endpoint. The API key is never present
 * in client code — it is read from environment variables on the server.
 */
export async function callAI(options: AIRequestOptions): Promise<AIResponse> {
  let res: Response;
  try {
    res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        maxTokens: options.maxTokens ?? 1200,
      }),
    });
  } catch {
    throw new AIError(
      'Network error — please check your connection and try again.',
      'NETWORK'
    );
  }

  if (!res.ok) {
    let code = 'SERVER';
    let message = 'Something went wrong while contacting the AI. Please try again.';
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
      if (body?.code) code = body.code;
    } catch {
      /* ignore parse error */
    }
    throw new AIError(message, code);
  }

  try {
    const data = (await res.json()) as AIResponse;
    if (!data?.content) throw new AIError('The AI returned an empty response.', 'EMPTY');
    return data;
  } catch {
    throw new AIError('Received an invalid response from the AI service.', 'PARSE');
  }
}
