import type { StudyMode } from "./study";

export type CardStats = {
  cardId: string;
  seenCount: number;
  correctCount: number;
  incorrectCount: number;
  lastStudiedAt?: string;
  bestPassNumber?: number;
};

export type StatsPeriod = "30d" | "90d" | "all";

export type PerformancePoint = {
  sessionId: string;
  date: string;
  score: number;
};

export type ExamStatsSummary = {
  sessions: number;
  answeredCards: number;
  accuracy: number;
};

export type GlobalStudyStats = {
  studiedCards: number;
  studyEvents: number;
  sessions: number;
  mastery: number;
  firstPassAccuracy: number;
  averagePasses: number;
  firstPassCards: number;
  multiPassCards: number;
  performance: PerformancePoint[];
  exam: ExamStatsSummary;
};

export type CourseStudyStats = {
  courseId: string;
  name: string;
  topicCount: number;
  cardCount: number;
  sessions: number;
  historicalAccuracy: number;
  mastery: number;
  averagePasses: number;
  lastStudiedAt?: string;
  examSessions: number;
};

export type BestSessionStats = {
  sessionId: string;
  mode: StudyMode;
  score: number;
  totalPasses: number;
  finishedAt: string;
};

export type TopicStudyStats = {
  topicId: string;
  courseId: string;
  courseName: string;
  title: string;
  unit: string;
  cardCount: number;
  categoryCount: number;
  sessions: number;
  mastery: number;
  correctCount: number;
  incorrectCount: number;
  averagePasses: number;
  bestSession?: BestSessionStats;
  lastSessionAt?: string;
  examSessions: number;
};

export type CardStudyStats = CardStats & {
  topicId: string;
  question: string;
  category: string;
  accuracy: number;
};

export type TopicErrorStats = {
  topicId: string;
  title: string;
  errorCount: number;
};

export type StatsDashboard = {
  period: StatsPeriod;
  global: GlobalStudyStats;
  courses: CourseStudyStats[];
  topics: TopicStudyStats[];
  cards: CardStudyStats[];
  topicsWithMostErrors: TopicErrorStats[];
};
