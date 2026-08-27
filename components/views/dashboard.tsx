'use client';

import * as React from 'react';
import {
  MessageSquare,
  Lightbulb,
  FileText,
  ListChecks,
  CalendarDays,
  Sparkles,
  TrendingUp,
  HelpCircle,
  BookOpen,
  ClipboardCheck,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ViewKey } from '@/lib/nav';
import { storage } from '@/lib/storage';
import type { Stats } from '@/lib/types';

interface DashboardProps {
  onNavigate: (key: ViewKey) => void;
}

const FEATURES: {
  key: ViewKey;
  title: string;
  desc: string;
  icon: React.ElementType;
  color: string;
}[] = [
  {
    key: 'chat',
    title: 'Ask AI',
    desc: 'Ask any academic question.',
    icon: MessageSquare,
    color: 'text-primary bg-accent',
  },
  {
    key: 'explain',
    title: 'Explain a Concept',
    desc: 'Get a simple explanation of difficult topics.',
    icon: Lightbulb,
    color: 'text-warning bg-warning/10',
  },
  {
    key: 'summarize',
    title: 'Summarize',
    desc: 'Turn long study material into concise notes.',
    icon: FileText,
    color: 'text-success bg-success/10',
  },
  {
    key: 'quiz',
    title: 'Generate Quiz',
    desc: 'Create practice questions from any topic.',
    icon: ListChecks,
    color: 'text-primary bg-accent',
  },
  {
    key: 'planner',
    title: 'Study Planner',
    desc: 'Create a personalized study plan.',
    icon: CalendarDays,
    color: 'text-warning bg-warning/10',
  },
];

const STAT_META: {
  key: keyof Stats;
  label: string;
  icon: React.ElementType;
  iconColor: string;
}[] = [
  { key: 'questionsAsked', label: 'Questions Asked', icon: HelpCircle, iconColor: 'text-primary' },
  { key: 'topicsStudied', label: 'Topics Studied', icon: BookOpen, iconColor: 'text-success' },
  { key: 'quizzesGenerated', label: 'Quizzes Generated', icon: ClipboardCheck, iconColor: 'text-warning' },
  { key: 'studySessions', label: 'Study Sessions', icon: Clock, iconColor: 'text-primary' },
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = React.useState<Stats>(storage.getStats());

  React.useEffect(() => {
    const update = () => setStats(storage.getStats());
    update();
    window.addEventListener('studyai-storage-change', update);
    return () => window.removeEventListener('studyai-storage-change', update);
  }, []);

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">
        {/* Greeting */}
        <div className="animate-in-fade mb-8">
          <div className="mb-1 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">
              StudyAI
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {getGreeting()} <span className="inline-block">👋</span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            Ready to learn something new?
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {STAT_META.map((s, i) => {
            const Icon = s.icon;
            return (
              <Card
                key={s.key}
                className="animate-in-fade overflow-hidden transition-shadow hover:shadow-md"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <CardContent className="p-4 md:p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      {s.label}
                    </span>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                      <Icon className={`h-3.5 w-3.5 ${s.iconColor}`} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold tracking-tight md:text-3xl tabular-nums">
                    {stats[s.key]}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Feature cards */}
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-muted-foreground">
            Quick actions
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <button
                key={f.key}
                onClick={() => onNavigate(f.key)}
                className="group animate-in-fade text-left"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <Card className="h-full transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
                  <CardContent className="flex h-full flex-col gap-3 p-5">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110 ${f.color}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold tracking-tight">
                        {f.title}
                      </h3>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {f.desc}
                      </p>
                    </div>
                    <div className="mt-auto pt-2">
                      <span className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                        Open
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>

        {/* CTA */}
        <Card className="mt-6 overflow-hidden border-primary/20 bg-gradient-to-br from-accent/60 to-accent/20">
          <CardContent className="flex flex-col items-start gap-3 p-5 md:flex-row md:items-center md:justify-between md:p-6">
            <div>
              <h3 className="font-semibold tracking-tight">
                Start a conversation
              </h3>
              <p className="text-sm text-muted-foreground">
                Ask your first question and let AI guide your learning.
              </p>
            </div>
            <Button onClick={() => onNavigate('chat')} size="sm">
              <MessageSquare className="mr-2 h-4 w-4" />
              Open AI Chat
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
