import {
  LayoutDashboard,
  MessageSquare,
  Lightbulb,
  FileText,
  ListChecks,
  CalendarDays,
  History,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export type ViewKey =
  | 'dashboard'
  | 'chat'
  | 'explain'
  | 'summarize'
  | 'quiz'
  | 'planner'
  | 'history'
  | 'settings';

export interface NavItem {
  key: ViewKey;
  label: string;
  icon: LucideIcon;
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Overview and quick actions',
  },
  {
    key: 'chat',
    label: 'AI Chat',
    icon: MessageSquare,
    description: 'Ask anything',
  },
  {
    key: 'explain',
    label: 'Explain',
    icon: Lightbulb,
    description: 'Understand a concept',
  },
  {
    key: 'summarize',
    label: 'Summarize',
    icon: FileText,
    description: 'Condense study material',
  },
  {
    key: 'quiz',
    label: 'Quiz Generator',
    icon: ListChecks,
    description: 'Practice with quizzes',
  },
  {
    key: 'planner',
    label: 'Study Planner',
    icon: CalendarDays,
    description: 'Build a study plan',
  },
  {
    key: 'history',
    label: 'History',
    icon: History,
    description: 'Past conversations',
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: Settings,
    description: 'Preferences',
  },
];
