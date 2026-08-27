'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { FileText, Copy, Check, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Markdown } from '@/components/markdown';
import { ThinkingIndicator } from '@/components/thinking-indicator';
import { callAI } from '@/lib/ai-client';
import { storage } from '@/lib/storage';
import type { SummaryLength } from '@/lib/types';

export function SummarizeView() {
  const [text, setText] = React.useState('');
  const [length, setLength] = React.useState<SummaryLength>('Medium');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) {
      toast.error('Please paste some study material to summarize.');
      return;
    }
    if (text.trim().length < 20) {
      toast.error('Please provide at least a few sentences to summarize.');
      return;
    }
    if (loading) return;
    setLoading(true);
    setResult('');

    const prompt = `Summarize the following study material. Summary length: ${length}.

Structure your response with these sections:
### Summary
### Key Points
### Important Terms
### Quick Revision

Study material:
${text.trim()}`;

    try {
      const res = await callAI({
        messages: [
          {
            role: 'system',
            content:
              'You are StudyAI, a helpful academic tutor. Summarize study material clearly using Markdown.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        maxTokens: 1500,
      });
      setResult(res.content);
      toast.success('Summary generated.');
      const stats = storage.getStats();
      storage.saveStats({
        ...stats,
        topicsStudied: stats.topicsStudied + 1,
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Something went wrong while contacting the AI. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      toast.success('Summary copied.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy.');
    }
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-8">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-success/10 text-success">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Summarize Study Material</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Turn long text into concise, structured notes.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="material">Study material</Label>
              <Textarea
                id="material"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your study material here…"
                className="min-h-[160px] scrollbar-thin"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                {text.trim().length} characters
              </p>
            </div>
            <div className="space-y-2">
              <Label>Summary length</Label>
              <Select
                value={length}
                onValueChange={(v) => setLength(v as SummaryLength)}
                disabled={loading}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Short">Short</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Detailed">Detailed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={loading || !text.trim()}
              className="w-full sm:w-auto"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {loading ? 'Summarizing…' : 'Summarize with AI'}
            </Button>
          </CardContent>
        </Card>

        {loading && !result && (
          <Card>
            <CardContent className="py-8">
              <ThinkingIndicator label="Summarizing" />
            </CardContent>
          </Card>
        )}

        {result && (
          <Card className="animate-in-fade">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Summary</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-8 text-xs"
              >
                {copied ? (
                  <Check className="mr-1.5 h-3 w-3" />
                ) : (
                  <Copy className="mr-1.5 h-3 w-3" />
                )}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </CardHeader>
            <CardContent>
              <Markdown content={result} />
            </CardContent>
          </Card>
        )}

        {!result && !loading && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
            <AlertCircle className="mb-2 h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Paste study material above and click &quot;Summarize with AI&quot;.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
