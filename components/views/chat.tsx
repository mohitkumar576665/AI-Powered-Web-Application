'use client';

import * as React from 'react';
import { toast } from 'sonner';
import {
  Send,
  Copy,
  RefreshCw,
  Trash2,
  Check,
  AlertCircle,
  User,
  GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Markdown } from '@/components/markdown';
import { ThinkingIndicator } from '@/components/thinking-indicator';
import { callAI, AIError } from '@/lib/ai-client';
import { storage, uid } from '@/lib/storage';
import type { ChatMessage, Conversation, Settings } from '@/lib/types';
import { cn } from '@/lib/utils';

const SYSTEM_PROMPT = `You are StudyAI, a helpful, patient academic tutor.
- Explain concepts clearly and prefer simple language.
- Give examples and break complex topics into steps.
- Ask clarifying questions when the request is ambiguous.
- Encourage learning rather than simply giving answers.
- Adapt explanations to the student's level.
- When useful, structure responses with: Simple Explanation, Key Points, Example, Quick Revision.
- Use Markdown for formatting (headings, bullet lists, bold, code blocks).`;

function buildSystemPrompt(settings: Settings): string {
  return `${SYSTEM_PROMPT}\n\nStudent level: ${settings.difficulty}. Response style: ${settings.responseStyle}.`;
}

function titleFromPrompt(prompt: string): string {
  const clean = prompt.trim().replace(/\s+/g, ' ');
  return clean.length > 42 ? clean.slice(0, 42) + '…' : clean || 'New conversation';
}

export function ChatView() {
  const [conversation, setConversation] = React.useState<Conversation | null>(
    null
  );
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [settings, setSettings] = React.useState(storage.getSettings());

  React.useEffect(() => {
    setSettings(storage.getSettings());
  }, []);

  // Load most recent conversation on mount
  React.useEffect(() => {
    const convos = storage.getConversations();
    if (convos.length > 0) {
      setConversation(convos[0]);
    }
  }, []);

  // Auto-scroll
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [conversation?.messages]);

  const persist = React.useCallback((conv: Conversation) => {
    const convos = storage.getConversations();
    const idx = convos.findIndex((c) => c.id === conv.id);
    if (idx >= 0) {
      convos[idx] = conv;
    } else {
      convos.unshift(conv);
    }
    storage.saveConversations(convos);
  }, []);

  const sendMessage = React.useCallback(
    async (prompt: string, regenerateFrom?: ChatMessage) => {
      const trimmed = prompt.trim();
      if (!trimmed && !regenerateFrom) {
        toast.error('Please enter a question first.');
        return;
      }
      if (loading) return;

      setLoading(true);

      let conv = conversation;
      if (!conv) {
        conv = {
          id: uid(),
          title: titleFromPrompt(trimmed),
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      }

      const messages = [...conv.messages];
      let userMsg: ChatMessage | undefined;

      if (regenerateFrom) {
        // Remove the assistant message we're regenerating and the prior user message stays
        const regenIdx = messages.findIndex((m) => m.id === regenerateFrom.id);
        if (regenIdx >= 0) {
          messages.splice(regenIdx, 1);
        }
      } else {
        userMsg = {
          id: uid(),
          role: 'user',
          content: trimmed,
          createdAt: Date.now(),
        };
        messages.push(userMsg);
      }

      const updatedConv: Conversation = {
        ...conv,
        title: conv.messages.length === 0 ? titleFromPrompt(trimmed) : conv.title,
        messages,
        updatedAt: Date.now(),
      };
      setConversation(updatedConv);
      persist(updatedConv);

      // Build API messages
      const apiMessages = [
        { role: 'system' as const, content: buildSystemPrompt(settings) },
        ...messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ];

      try {
        const res = await callAI({ messages: apiMessages });
        const assistantMsg: ChatMessage = {
          id: uid(),
          role: 'assistant',
          content: res.content,
          createdAt: Date.now(),
        };
        const finalConv: Conversation = {
          ...updatedConv,
          messages: [...messages, assistantMsg],
          updatedAt: Date.now(),
        };
        setConversation(finalConv);
        persist(finalConv);

        // Update stats
        const stats = storage.getStats();
        storage.saveStats({
          ...stats,
          questionsAsked: stats.questionsAsked + 1,
          topicsStudied: stats.topicsStudied + 1,
        });
      } catch (err) {
        const isAIError = err instanceof AIError;
        const errorMsg: ChatMessage = {
          id: uid(),
          role: 'assistant',
          content: isAIError
            ? err.message
            : 'Something went wrong while contacting the AI. Please try again.',
          createdAt: Date.now(),
          error: true,
        };
        const finalConv: Conversation = {
          ...updatedConv,
          messages: [...messages, errorMsg],
          updatedAt: Date.now(),
        };
        setConversation(finalConv);
        persist(finalConv);
        toast.error('AI request failed. You can retry.');
      } finally {
        setLoading(false);
      }
    },
    [conversation, loading, persist, settings]
  );

  const handleSubmit = () => {
    const prompt = input;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    sendMessage(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCopy = async (msg: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(msg.content);
      setCopiedId(msg.id);
      toast.success('Response copied to clipboard.');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Could not copy to clipboard.');
    }
  };

  const handleRegenerate = (msg: ChatMessage) => {
    // Find the user message before this assistant message
    const msgs = conversation?.messages ?? [];
    const idx = msgs.findIndex((m) => m.id === msg.id);
    if (idx > 0) {
      const prevUser = [...msgs.slice(0, idx)].reverse().find((m) => m.role === 'user');
      if (prevUser) {
        sendMessage(prevUser.content, msg);
      }
    }
  };

  const handleClear = () => {
    if (!conversation) return;
    if (conversation.messages.length === 0) return;
    if (!window.confirm('Clear this conversation? This cannot be undone.')) return;
    const cleared: Conversation = {
      ...conversation,
      messages: [],
      title: 'New conversation',
      updatedAt: Date.now(),
    };
    setConversation(cleared);
    persist(cleared);
    toast.success('Conversation cleared.');
  };

  const messages = conversation?.messages ?? [];
  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-3xl px-4 py-6 md:px-8">
          {isEmpty ? (
            <EmptyChatState onSuggestion={(text) => setInput(text)} />
          ) : (
            <div className="space-y-6">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  copied={copiedId === msg.id}
                  onCopy={() => handleCopy(msg)}
                  onRegenerate={() => handleRegenerate(msg)}
                  onRetry={() => handleRegenerate(msg)}
                />
              ))}
              {loading && (
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3">
                    <ThinkingIndicator label="Thinking" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card/50 px-4 py-3 md:px-8 md:py-4">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm transition-colors focus-within:border-primary/40">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about your studies…"
              disabled={loading}
              className="min-h-[44px] max-h-40 resize-none border-0 shadow-none focus-visible:ring-0 scrollbar-thin"
              rows={1}
              aria-label="Chat input"
            />
            <Button
              onClick={handleSubmit}
              disabled={loading || !input.trim()}
              size="icon"
              className="h-10 w-10 shrink-0 rounded-xl"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-2 flex items-center justify-between px-1">
            <p className="text-[11px] text-muted-foreground">
              Enter to send · Shift+Enter for newline
            </p>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-7 text-xs text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="mr-1.5 h-3 w-3" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyChatState({ onSuggestion }: { onSuggestion: (text: string) => void }) {
  const suggestions = [
    'Explain how the Internet works',
    'Summarize the water cycle',
    'What is recursion in programming?',
    'Help me understand photosynthesis',
  ];
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
        <GraduationCap className="h-7 w-7" />
      </div>
      <h2 className="text-xl font-semibold tracking-tight">
        Ask your first question
      </h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        I&apos;m here to help you understand concepts, summarize material, and
        guide your learning.
      </p>
      <div className="mt-6 grid w-full max-w-md grid-cols-1 gap-2 sm:grid-cols-2">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onSuggestion(s)}
            className="rounded-lg border border-border bg-card px-3 py-2.5 text-left text-xs text-muted-foreground transition-all hover:border-primary/40 hover:bg-accent hover:text-accent-foreground"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({
  msg,
  copied,
  onCopy,
  onRegenerate,
  onRetry,
}: {
  msg: ChatMessage;
  copied: boolean;
  onCopy: () => void;
  onRegenerate: () => void;
  onRetry: () => void;
}) {
  const isUser = msg.role === 'user';
  return (
    <div
      className={cn(
        'flex animate-in-fade items-start gap-3',
        isUser && 'flex-row-reverse'
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          isUser
            ? 'bg-secondary text-secondary-foreground'
            : msg.error
              ? 'bg-destructive text-destructive-foreground'
              : 'bg-primary text-primary-foreground'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : msg.error ? (
          <AlertCircle className="h-4 w-4" />
        ) : (
          <GraduationCap className="h-4 w-4" />
        )}
      </div>
      <div
        className={cn(
          'group max-w-[85%] rounded-2xl border px-4 py-3',
          isUser
            ? 'rounded-tr-sm bg-primary text-primary-foreground'
            : msg.error
              ? 'rounded-tl-sm border-destructive/40 bg-destructive/5'
              : 'rounded-tl-sm border-border bg-card'
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {msg.content}
          </p>
        ) : msg.error ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-destructive">{msg.content}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="h-7 w-fit text-xs"
            >
              <RefreshCw className="mr-1.5 h-3 w-3" />
              Retry
            </Button>
          </div>
        ) : (
          <>
            <Markdown content={msg.content} />
            <div className="mt-2 flex items-center gap-1 border-t border-border/50 pt-2 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={onCopy}
                className="h-7 text-xs text-muted-foreground"
              >
                {copied ? (
                  <Check className="mr-1.5 h-3 w-3" />
                ) : (
                  <Copy className="mr-1.5 h-3 w-3" />
                )}
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRegenerate}
                className="h-7 text-xs text-muted-foreground"
              >
                <RefreshCw className="mr-1.5 h-3 w-3" />
                Regenerate
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
