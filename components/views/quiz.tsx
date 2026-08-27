'use client';

import * as React from 'react';
import { toast } from 'sonner';
import {
  ListChecks,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trophy,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
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
import { ThinkingIndicator } from '@/components/thinking-indicator';
import { callAI, AIError } from '@/lib/ai-client';
import { storage, uid } from '@/lib/storage';
import type {
  Quiz,
  QuizQuestion,
  QuizDifficulty,
  QuizType,
  QuizResult,
} from '@/lib/types';
import { cn } from '@/lib/utils';

type Phase = 'setup' | 'taking' | 'results';

export function QuizView() {
  const [topic, setTopic] = React.useState('');
  const [count, setCount] = React.useState('5');
  const [difficulty, setDifficulty] = React.useState<QuizDifficulty>('Easy');
  const [type, setType] = React.useState<QuizType>('Multiple Choice');
  const [loading, setLoading] = React.useState(false);
  const [quiz, setQuiz] = React.useState<Quiz | null>(null);
  const [phase, setPhase] = React.useState<Phase>('setup');
  const [currentIdx, setCurrentIdx] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<number, number>>({});

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic for the quiz.');
      return;
    }
    if (loading) return;
    setLoading(true);

    const qType =
      type === 'Mixed'
        ? 'a mix of multiple choice and true/false'
        : type.toLowerCase();

    const prompt = `Generate a quiz about: ${topic.trim()}
Number of questions: ${count}
Difficulty: ${difficulty}
Question type: ${qType}

Return ONLY a valid JSON array (no markdown, no explanation) with this exact format:
[
  {
    "question": "The question text",
    "options": ["option A", "option B", "option C", "option D"],
    "correctIndex": 0,
    "explanation": "Why the correct answer is correct"
  }
]

For true/false questions, use exactly 2 options: ["True", "False"].
The correctIndex must be 0-based and point to the correct option.`;

    try {
      const res = await callAI({
        messages: [
          {
            role: 'system',
            content:
              'You are StudyAI, a quiz generator. Return ONLY valid JSON arrays, no markdown or extra text.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        maxTokens: 2000,
      });

      const questions = parseQuizJSON(res.content);
      if (questions.length === 0) {
        throw new AIError(
          'The AI returned an invalid quiz format. Please try again.',
          'PARSE'
        );
      }

      const newQuiz: Quiz = {
        id: uid(),
        topic: topic.trim(),
        difficulty,
        type,
        questions,
        createdAt: Date.now(),
      };
      setQuiz(newQuiz);
      setAnswers({});
      setCurrentIdx(0);
      setPhase('taking');
      toast.success(`Quiz generated with ${questions.length} questions.`);

      const quizzes = storage.getQuizzes();
      quizzes.unshift(newQuiz);
      storage.saveQuizzes(quizzes);

      const stats = storage.getStats();
      storage.saveStats({
        ...stats,
        quizzesGenerated: stats.quizzesGenerated + 1,
      });
    } catch (err) {
      if (err instanceof AIError) {
        toast.error(err.message);
      } else {
        toast.error(
          'Something went wrong while generating the quiz. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (qIdx: number, optIdx: number) => {
    setAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleSubmit = () => {
    if (!quiz) return;
    const unanswered = quiz.questions.filter((_, i) => answers[i] === undefined);
    if (unanswered.length > 0) {
      if (
        !window.confirm(
          `You have ${unanswered.length} unanswered question(s). Submit anyway?`
        )
      )
        return;
    }
    const correct = quiz.questions.reduce(
      (acc, q, i) => (answers[i] === q.correctIndex ? acc + 1 : acc),
      0
    );
    const total = quiz.questions.length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    const result: QuizResult = {
      id: uid(),
      topic: quiz.topic,
      score: correct,
      total,
      accuracy,
      createdAt: Date.now(),
    };
    const results = storage.getQuizResults();
    results.unshift(result);
    storage.saveQuizResults(results);

    setPhase('results');
    toast.success(`You scored ${correct}/${total}!`);
  };

  const handleRestart = () => {
    setQuiz(null);
    setPhase('setup');
    setAnswers({});
    setCurrentIdx(0);
    setTopic('');
  };

  // SETUP PHASE
  if (phase === 'setup' || (!quiz && !loading)) {
    return (
      <div className="h-full overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-8">
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-primary">
                  <ListChecks className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Quiz Generator</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Create practice questions from any topic.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="quiz-topic">Topic</Label>
                <Input
                  id="quiz-topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. JavaScript fundamentals"
                  disabled={loading}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Questions</Label>
                  <Select
                    value={count}
                    onValueChange={setCount}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="15">15</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select
                    value={difficulty}
                    onValueChange={(v) => setDifficulty(v as QuizDifficulty)}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Question type</Label>
                  <Select
                    value={type}
                    onValueChange={(v) => setType(v as QuizType)}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Multiple Choice">
                        Multiple Choice
                      </SelectItem>
                      <SelectItem value="True/False">True/False</SelectItem>
                      <SelectItem value="Mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={handleGenerate}
                disabled={loading || !topic.trim()}
                className="w-full sm:w-auto"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {loading ? 'Generating…' : 'Generate Quiz'}
              </Button>
            </CardContent>
          </Card>

          {loading && (
            <Card>
              <CardContent className="py-8">
                <ThinkingIndicator label="Creating your quiz" />
              </CardContent>
            </Card>
          )}

          {!loading && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
              <BookOpen className="mb-2 h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Enter a topic and generate a quiz to start practicing.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (loading && !quiz) {
    return (
      <div className="flex h-full items-center justify-center">
        <ThinkingIndicator label="Creating your quiz" />
      </div>
    );
  }

  if (!quiz) return null;

  // RESULTS PHASE
  if (phase === 'results') {
    const correct = quiz.questions.reduce(
      (acc, q, i) => (answers[i] === q.correctIndex ? acc + 1 : acc),
      0
    );
    const total = quiz.questions.length;
    const accuracy = Math.round((correct / total) * 100);
    return (
      <div className="h-full overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-8">
          <Card className="mb-6 animate-in-fade">
            <CardContent className="flex flex-col items-center py-8 text-center">
              <div
                className={cn(
                  'mb-4 flex h-16 w-16 items-center justify-center rounded-2xl',
                  accuracy >= 70
                    ? 'bg-success/10 text-success'
                    : 'bg-warning/10 text-warning'
                )}
              >
                <Trophy className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">
                {correct} / {total}
              </h2>
              <p className="text-sm text-muted-foreground">
                Accuracy: <span className="font-semibold">{accuracy}%</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Topic: {quiz.topic}
              </p>
              <Button onClick={handleRestart} className="mt-6" variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" />
                New Quiz
              </Button>
            </CardContent>
          </Card>

          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
            Review
          </h3>
          <div className="space-y-3">
            {quiz.questions.map((q, i) => {
              const userAnswer = answers[i];
              const isCorrect = userAnswer === q.correctIndex;
              return (
                <Card key={q.id} className="animate-in-fade">
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-start gap-2">
                      {isCorrect ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      ) : (
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                      )}
                      <p className="text-sm font-medium">{q.question}</p>
                    </div>
                    <div className="ml-6 space-y-1">
                      {q.options.map((opt, oi) => (
                        <div
                          key={oi}
                          className={cn(
                            'rounded-md px-2.5 py-1.5 text-xs',
                            oi === q.correctIndex
                              ? 'bg-success/10 font-medium text-success'
                              : oi === userAnswer
                                ? 'bg-destructive/10 text-destructive'
                                : 'text-muted-foreground'
                          )}
                        >
                          {opt}
                          {oi === q.correctIndex && ' ✓'}
                          {oi === userAnswer && oi !== q.correctIndex && ' ✗'}
                        </div>
                      ))}
                    </div>
                    {q.explanation && (
                      <p className="ml-6 mt-2 text-xs text-muted-foreground">
                        <span className="font-medium">Explanation: </span>
                        {q.explanation}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // TAKING PHASE
  const current = quiz.questions[currentIdx];
  const isLast = currentIdx === quiz.questions.length - 1;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-8">
        {/* Progress */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">
              Question {currentIdx + 1} of {quiz.questions.length}
            </p>
            <p className="text-xs text-muted-foreground">
              {answeredCount} answered · Topic: {quiz.topic}
            </p>
          </div>
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted md:w-32">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width: `${((currentIdx + 1) / quiz.questions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        <Card className="animate-in-fade" key={current.id}>
          <CardContent className="p-5 md:p-6">
            <p className="mb-4 text-base font-medium">{current.question}</p>
            <div className="space-y-2">
              {current.options.map((opt, oi) => {
                const selected = answers[currentIdx] === oi;
                return (
                  <button
                    key={oi}
                    onClick={() => handleSelect(currentIdx, oi)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-all',
                      selected
                        ? 'border-primary bg-accent text-accent-foreground'
                        : 'border-border hover:border-primary/40 hover:bg-accent/50'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium',
                        selected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border text-muted-foreground'
                      )}
                    >
                      {String.fromCharCode(65 + oi)}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
            disabled={currentIdx === 0}
          >
            Previous
          </Button>
          {isLast ? (
            <Button onClick={handleSubmit}>
              Submit Quiz
            </Button>
          ) : (
            <Button onClick={() => setCurrentIdx((i) => i + 1)}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function parseQuizJSON(content: string): QuizQuestion[] {
  // Extract JSON array from the response (handles markdown code fences)
  let jsonStr = content.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }
  const arrayStart = jsonStr.indexOf('[');
  const arrayEnd = jsonStr.lastIndexOf(']');
  if (arrayStart === -1 || arrayEnd === -1) return [];
  jsonStr = jsonStr.slice(arrayStart, arrayEnd + 1);

  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (q) =>
          q &&
          typeof q.question === 'string' &&
          Array.isArray(q.options) &&
          typeof q.correctIndex === 'number'
      )
      .map((q, i) => ({
        id: `q-${i}-${Date.now().toString(36)}`,
        question: q.question,
        options: q.options.map(String),
        correctIndex: q.correctIndex,
        explanation: String(q.explanation || ''),
      }));
  } catch {
    return [];
  }
}
