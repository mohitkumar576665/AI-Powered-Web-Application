import { NextResponse } from 'next/server';
import { generateAIResponse } from '@/lib/ai-provider';
import type { AIRequestMessage } from '@/lib/ai-client-shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function errorResponse(message: string, code: string, status: number) {
  return NextResponse.json({ error: message, code }, { status });
}

export async function POST(req: Request) {
  let body: { messages?: AIRequestMessage[]; temperature?: number; maxTokens?: number };

  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid request body.', 'BAD_REQUEST', 400);
  }

  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return errorResponse('No messages were provided.', 'VALIDATION', 400);
  }

  const hasUser = messages.some((m) => m.role === 'user' && m.content?.trim());
  if (!hasUser) {
    return errorResponse('Please enter a question first.', 'VALIDATION', 400);
  }

  try {
    const result = await generateAIResponse(
      messages,
      body.temperature ?? 0.7,
      body.maxTokens ?? 1200
    );
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : 'Something went wrong while contacting the AI. Please try again.';
    return errorResponse(message, 'AI_ERROR', 502);
  }
}
