export type Role = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
  error?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type ResponseStyle = 'Concise' | 'Balanced' | 'Detailed';
export type ExplanationStyle = 'Simple' | 'Detailed' | 'Exam-focused';
export type SummaryLength = 'Short' | 'Medium' | 'Detailed';
export type QuizDifficulty = 'Easy' | 'Medium' | 'Hard';
export type QuizType = 'Multiple Choice' | 'True/False' | 'Mixed';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  topic: string;
  difficulty: QuizDifficulty;
  type: QuizType;
  questions: QuizQuestion[];
  createdAt: number;
}

export interface StudyDay {
  day: string;
  date: string;
  sessions: StudySession[];
}

export interface StudySession {
  id: string;
  topic: string;
  duration: string;
  priority: 'High' | 'Medium' | 'Low';
  task: string;
  completed: boolean;
}

export interface StudyPlan {
  id: string;
  subject: string;
  examDate: string;
  hoursPerDay: number;
  difficulty: Difficulty;
  days: StudyDay[];
  createdAt: number;
}

export interface QuizResult {
  id: string;
  topic: string;
  score: number;
  total: number;
  accuracy: number;
  createdAt: number;
}

export interface Settings {
  difficulty: Difficulty;
  responseStyle: ResponseStyle;
}

export interface Stats {
  questionsAsked: number;
  topicsStudied: number;
  quizzesGenerated: number;
  studySessions: number;
}
