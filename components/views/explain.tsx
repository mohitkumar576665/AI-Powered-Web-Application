'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Lightbulb, Copy, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import type { Difficulty, ExplanationStyle } from '@/lib/types';

export function ExplainView() {
  const [topic, setTopic] = React.useState('');
  const [difficulty, setDifficulty] = React.useState<Difficulty>('Beginner');
  const [style, setStyle] = React.useState<ExplanationStyle>('Simple');
  const [result, setResult] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const handleSubmit = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic or concept to explain.');
      return;
    }
    if (loading) return;
    setLoading(true);
    setResult('');

    const prompt = `Explain the following concept for a ${difficulty} level student.
Concept: ${topic.trim()}
Explanation style: ${style}

Structure your response with these sections:
### Simple Explanation
### Key Points
### Example
### Quick Revision`;

    try {
      const res = await callAI({
        messages: [
          {
            role: 'system',
            content:
              'You are StudyAI, a helpful academic tutor. Explain concepts clearly using Markdown.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.6,
      });
      setResult(res.content);
      toast.success('Explanation generated.');
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
      toast.success('Explanation copied.');
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
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-warning/10 text-warning">
                <Lightbulb className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Explain a Concept</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Get a clear, structured explanation of any topic.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic / Concept</Label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Explain recursion in JavaScript"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                disabled={loading}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select
                  value={difficulty}
                  onValueChange={(v) => setDifficulty(v as Difficulty)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Explanation style</Label>
                <Select
                  value={style}
                  onValueChange={(v) => setStyle(v as ExplanationStyle)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Simple">Simple</SelectItem>
                    <SelectItem value="Detailed">Detailed</SelectItem>
                    <SelectItem value="Exam-focused">Exam-focused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={loading || !topic.trim()}
              className="w-full sm:w-auto"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {loading ? 'Generating…' : 'Explain with AI'}
            </Button>
          </CardContent>
        </Card>

        {loading && !result && (
          <Card>
            <CardContent className="py-8">
              <ThinkingIndicator label="Explaining" />
            </CardContent>
          </Card>
        )}

        {result && (
          <Card className="animate-in-fade">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Explanation</CardTitle>
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
      </div>
    </div>
  );
}
