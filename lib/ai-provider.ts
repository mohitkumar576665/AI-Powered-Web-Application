import type { AIRequestMessage } from './ai-client-shared';

/**
 * Provider abstraction so the AI backend can be swapped without touching
 * the route. Currently supports an OpenAI-compatible Chat Completions API.
 * Set AI_API_KEY and AI_API_BASE_URL in your environment.
 *
 * If no key is configured, a deterministic local fallback generates a
 * study-tutor-style response so the app remains usable for demos.
 */

const SYSTEM_FALLBACK_PREFIX =
  'You are StudyAI, a helpful academic tutor. ';

export interface AIProviderResponse {
  content: string;
}

export async function generateAIResponse(
  messages: AIRequestMessage[],
  temperature: number,
  maxTokens: number
): Promise<AIProviderResponse> {
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = process.env.AI_API_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.AI_MODEL || 'gpt-4o-mini';

  if (apiKey) {
    return callOpenAICompatible(baseUrl, model, apiKey, messages, temperature, maxTokens);
  }
  return localFallback(messages);
}

async function callOpenAICompatible(
  baseUrl: string,
  model: string,
  apiKey: string,
  messages: AIRequestMessage[],
  temperature: number,
  maxTokens: number
): Promise<AIProviderResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (res.status === 429) {
      throw new Error('AI service is temporarily unavailable (rate limit). Please try again shortly.');
    }
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error('The AI service returned an error. Please try again.');
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error('The AI returned an empty response.');
    return { content };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('The AI request timed out. Please try again.');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Keyless fallback used when no AI_API_KEY is configured. Produces a
 * structured, genuinely helpful study response so the app is demoable
 * out of the box. Never sends data to any external service.
 */
function localFallback(messages: AIRequestMessage[]): AIProviderResponse {
  const last = [...messages].reverse().find((m) => m.role === 'user');
  const prompt = last?.content?.trim() ?? '';

  if (!prompt) {
    return { content: 'Please enter a question or topic so I can help you study.' };
  }

  const topic = prompt.length > 80 ? prompt.slice(0, 80) + '…' : prompt;
  const content = `${SYSTEM_FALLBACK_PREFIX}Here is a study-oriented response to your prompt.

> **Note:** No AI API key is configured, so this is a structured offline response. Add an \`AI_API_KEY\` in your environment to get live AI answers.

---

### Simple Explanation

You asked about: **${topic}**

This is the core idea broken down into approachable language. Start by understanding what the concept means in plain words, then connect it to something you already know. A good explanation answers *what it is*, *why it matters*, and *how it works*.

### Key Points

- **Definition** — A concise statement of what the concept is.
- **Why it matters** — The problem it solves or the value it provides.
- **How it works** — The mechanism or steps involved.
- **Common pitfalls** — Mistakes beginners make and how to avoid them.

### Example

Consider a concrete example that illustrates the concept in action. Work through it step by step so the pattern becomes clear, then try a variation on your own.

### Quick Revision

1. Restate the concept in one sentence.
2. List two key properties or rules.
3. Recall one example you can reproduce from memory.

---

*Tip:* Ask a more specific question to get a deeper, tailored explanation.`;

  return { content };
}
