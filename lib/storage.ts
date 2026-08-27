import type {
  Conversation,
  Quiz,
  StudyPlan,
  QuizResult,
  Settings,
  Stats,
} from './types';

const KEYS = {
  conversations: 'studyai_conversations',
  quizzes: 'studyai_quizzes',
  plans: 'studyai_plans',
  quizResults: 'studyai_quiz_results',
  settings: 'studyai_settings',
  stats: 'studyai_stats',
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event('studyai-storage-change'));
  } catch {
    /* ignore quota errors */
  }
}

export const storage = {
  getConversations: () => read<Conversation[]>(KEYS.conversations, []),
  saveConversations: (c: Conversation[]) => write(KEYS.conversations, c),

  getQuizzes: () => read<Quiz[]>(KEYS.quizzes, []),
  saveQuizzes: (q: Quiz[]) => write(KEYS.quizzes, q),

  getPlans: () => read<StudyPlan[]>(KEYS.plans, []),
  savePlans: (p: StudyPlan[]) => write(KEYS.plans, p),

  getQuizResults: () => read<QuizResult[]>(KEYS.quizResults, []),
  saveQuizResults: (r: QuizResult[]) => write(KEYS.quizResults, r),

  getSettings: () =>
    read<Settings>(KEYS.settings, {
      difficulty: 'Intermediate',
      responseStyle: 'Balanced',
    }),
  saveSettings: (s: Settings) => write(KEYS.settings, s),

  getStats: () =>
    read<Stats>(KEYS.stats, {
      questionsAsked: 0,
      topicsStudied: 0,
      quizzesGenerated: 0,
      studySessions: 0,
    }),
  saveStats: (s: Stats) => write(KEYS.stats, s),

  clearAll: () => {
    Object.values(KEYS).forEach((k) =>
      typeof window !== 'undefined'
        ? window.localStorage.removeItem(k)
        : undefined
    );
  },
};

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
