'use client';

import * as React from 'react';
import { toast } from 'sonner';
import {
  CalendarDays,
  Sparkles,
  CheckCircle2,
  Circle,
  Clock,
  Flag,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { ThinkingIndicator } from '@/components/thinking-indicator';
import { callAI, AIError } from '@/lib/ai-client';
import { storage, uid } from '@/lib/storage';
import type { StudyPlan, StudyDay, Difficulty } from '@/lib/types';
import { cn } from '@/lib/utils';

export function PlannerView() {
  const [subject, setSubject] = React.useState('');
  const [examDate, setExamDate] = React.useState('');
  const [hoursPerDay, setHoursPerDay] = React.useState('2');
  const [topics, setTopics] = React.useState('');
  const [difficulty, setDifficulty] = React.useState<Difficulty>('Intermediate');
  const [loading, setLoading] = React.useState(false);
  const [plan, setPlan] = React.useState<StudyPlan | null>(null);

  React.useEffect(() => {
    const plans = storage.getPlans();
    if (plans.length > 0) setPlan(plans[0]);
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const handleGenerate = async () => {
    if (!subject.trim()) {
      toast.error('Please enter a subject.');
      return;
    }
    if (!examDate) {
      toast.error('Please select an exam date.');
      return;
    }
    const hours = parseFloat(hoursPerDay);
    if (isNaN(hours) || hours <= 0 || hours > 24) {
      toast.error('Study hours per day must be a positive number (1–24).');
      return;
    }
    if (loading) return;
    setLoading(true);

    const daysUntil = Math.max(
      1,
      Math.ceil(
        (new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    );

    const prompt = `Create a personalized study plan.
Subject: ${subject.trim()}
Exam date: ${examDate} (${daysUntil} days from now)
Available study hours per day: ${hours}
Topics to cover: ${topics.trim() || 'General syllabus for the subject'}
Difficulty level: ${difficulty}

Return ONLY a valid JSON array (no markdown, no explanation) with this exact format:
[
  {
    "day": "Monday",
    "date": "2024-01-01",
    "sessions": [
      {
        "topic": "Topic name",
        "duration": "60 min",
        "priority": "High",
        "task": "What to do"
      }
    ]
  }
]

Spread topics across the available days. Each day should respect the ${hours} hours/day limit. Priority must be "High", "Medium", or "Low".`;

    try {
      const res = await callAI({
        messages: [
          {
            role: 'system',
            content:
              'You are StudyAI, a study planner. Return ONLY valid JSON arrays, no markdown or extra text.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.6,
        maxTokens: 2000,
      });

      const days = parsePlanJSON(res.content);
      if (days.length === 0) {
        throw new AIError(
          'The AI returned an invalid plan format. Please try again.',
          'PARSE'
        );
      }

      const newPlan: StudyPlan = {
        id: uid(),
        subject: subject.trim(),
        examDate,
        hoursPerDay: hours,
        difficulty,
        days,
        createdAt: Date.now(),
      };
      setPlan(newPlan);

      const plans = storage.getPlans();
      plans.unshift(newPlan);
      storage.savePlans(plans);

      const stats = storage.getStats();
      storage.saveStats({
        ...stats,
        studySessions: stats.studySessions + days.length,
      });

      toast.success('Study plan created.');
    } catch (err) {
      if (err instanceof AIError) {
        toast.error(err.message);
      } else {
        toast.error(
          'Something went wrong while creating your plan. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleSession = (dayIdx: number, sessionId: string) => {
    if (!plan) return;
    const updatedDays = plan.days.map((d, di) => {
      if (di !== dayIdx) return d;
      return {
        ...d,
        sessions: d.sessions.map((s) =>
          s.id === sessionId ? { ...s, completed: !s.completed } : s
        ),
      };
    });
    const updated = { ...plan, days: updatedDays };
    setPlan(updated);
    const plans = storage.getPlans();
    const idx = plans.findIndex((p) => p.id === plan.id);
    if (idx >= 0) {
      plans[idx] = updated;
      storage.savePlans(plans);
    }
  };

  const handleDelete = () => {
    if (!plan) return;
    if (!window.confirm('Delete this study plan? This cannot be undone.'))
      return;
    const plans = storage.getPlans().filter((p) => p.id !== plan.id);
    storage.savePlans(plans);
    setPlan(null);
    toast.success('Study plan deleted.');
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-8">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-warning/10 text-warning">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Study Planner</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Create a personalized AI-powered study plan.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. JavaScript"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exam-date">Exam date</Label>
                <Input
                  id="exam-date"
                  type="date"
                  min={today}
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="hours">Study hours per day</Label>
                <Input
                  id="hours"
                  type="number"
                  min="1"
                  max="24"
                  step="0.5"
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label>Difficulty level</Label>
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="topics">Topics (optional)</Label>
              <Textarea
                id="topics"
                value={topics}
                onChange={(e) => setTopics(e.target.value)}
                placeholder="List the topics you need to cover, separated by commas…"
                className="min-h-[80px] scrollbar-thin"
                disabled={loading}
              />
            </div>
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {loading ? 'Creating plan…' : 'Generate Study Plan'}
            </Button>
          </CardContent>
        </Card>

        {loading && !plan && (
          <Card>
            <CardContent className="py-8">
              <ThinkingIndicator label="Planning your study schedule" />
            </CardContent>
          </Card>
        )}

        {plan && (
          <div className="animate-in-fade">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  {plan.subject}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Exam: {plan.examDate} · {plan.hoursPerDay}h/day ·{' '}
                  {plan.difficulty}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              {plan.days.map((day, di) => (
                <DayCard
                  key={di}
                  day={day}
                  onToggle={(sessionId) => toggleSession(di, sessionId)}
                />
              ))}
            </div>
          </div>
        )}

        {!plan && !loading && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
            <CalendarDays className="mb-2 h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No study plan created yet. Fill in the form above to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const priorityColors: Record<string, string> = {
  High: 'text-destructive bg-destructive/10',
  Medium: 'text-warning bg-warning/10',
  Low: 'text-success bg-success/10',
};

function DayCard({
  day,
  onToggle,
}: {
  day: StudyDay;
  onToggle: (sessionId: string) => void;
}) {
  const completedCount = day.sessions.filter((s) => s.completed).length;
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-base">{day.day}</CardTitle>
          <p className="text-xs text-muted-foreground">{day.date}</p>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {completedCount}/{day.sessions.length} done
        </span>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {day.sessions.map((s) => (
          <button
            key={s.id}
            onClick={() => onToggle(s.id)}
            className={cn(
              'flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-all hover:bg-accent/50',
              s.completed && 'opacity-60'
            )}
          >
            {s.completed ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            ) : (
              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <div className="flex-1">
              <p
                className={cn(
                  'text-sm font-medium',
                  s.completed && 'line-through'
                )}
              >
                {s.topic}
              </p>
              <p className="text-xs text-muted-foreground">{s.task}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {s.duration}
              </span>
              <span
                className={cn(
                  'flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
                  priorityColors[s.priority] || priorityColors.Medium
                )}
              >
                <Flag className="h-2.5 w-2.5" />
                {s.priority}
              </span>
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}

function parsePlanJSON(content: string): StudyDay[] {
  let jsonStr = content.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) jsonStr = fenceMatch[1].trim();
  const arrayStart = jsonStr.indexOf('[');
  const arrayEnd = jsonStr.lastIndexOf(']');
  if (arrayStart === -1 || arrayEnd === -1) return [];
  jsonStr = jsonStr.slice(arrayStart, arrayEnd + 1);

  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((d) => d && typeof d.day === 'string' && Array.isArray(d.sessions))
      .map((d, di) => ({
        day: d.day,
        date: String(d.date || ''),
        sessions: d.sessions.map((s: Record<string, unknown>, si: number) => ({
          id: `s-${di}-${si}-${Date.now().toString(36)}`,
          topic: String(s.topic || 'Untitled'),
          duration: String(s.duration || '60 min'),
          priority:
            s.priority === 'High' || s.priority === 'Low'
              ? (s.priority as 'High' | 'Low')
              : 'Medium',
          task: String(s.task || ''),
          completed: false,
        })),
      }));
  } catch {
    return [];
  }
}
