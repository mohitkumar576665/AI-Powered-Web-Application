'use client';

import * as React from 'react';
import { AppShell } from '@/components/app-shell';
import { Dashboard } from '@/components/views/dashboard';
import { ChatView } from '@/components/views/chat';
import { ExplainView } from '@/components/views/explain';
import { SummarizeView } from '@/components/views/summarize';
import { QuizView } from '@/components/views/quiz';
import { PlannerView } from '@/components/views/planner';
import { HistoryView } from '@/components/views/history';
import { SettingsView } from '@/components/views/settings';
import type { ViewKey } from '@/lib/nav';

export default function Home() {
  const [active, setActive] = React.useState<ViewKey>('dashboard');

  return (
    <AppShell active={active} onNavigate={setActive}>
      {active === 'dashboard' && <Dashboard onNavigate={setActive} />}
      {active === 'chat' && <ChatView />}
      {active === 'explain' && <ExplainView />}
      {active === 'summarize' && <SummarizeView />}
      {active === 'quiz' && <QuizView />}
      {active === 'planner' && <PlannerView />}
      {active === 'history' && <HistoryView onOpenConversation={() => setActive('chat')} />}
      {active === 'settings' && <SettingsView />}
    </AppShell>
  );
}
