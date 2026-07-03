import type { AttemptResult, StudyMode } from "./study";

export type TelemetryValue =
  | string
  | number
  | boolean
  | null
  | TelemetryValue[]
  | { [key: string]: TelemetryValue };

export type AppUsageSession = {
  id: string;
  openedAt: string;
  lastActiveAt: string;
  closedAt?: string;
  activeDurationMs: number;
  backgroundDurationMs: number;
  foregroundCount: number;
  routeChangeCount: number;
  entryRoute: string;
  exitRoute?: string;
  timezone: string;
  language: string;
  platform: string;
  screenWidth?: number;
  screenHeight?: number;
};

export type ActivityEventType =
  | "app_open"
  | "app_close"
  | "app_foreground"
  | "app_background"
  | "route_view"
  | "study_started"
  | "study_resumed"
  | "study_paused"
  | "study_finished"
  | "pass_started"
  | "answer_revealed"
  | "card_answered"
  | "exam_finished";

export type ActivityEvent = {
  id: string;
  appSessionId: string;
  type: ActivityEventType;
  occurredAt: string;
  route?: string;
  courseId?: string;
  topicId?: string;
  studySessionId?: string;
  cardId?: string;
  data?: Record<string, TelemetryValue>;
};

export type CardInteraction = {
  id: string;
  appSessionId?: string;
  studySessionId: string;
  passId: string;
  cardId: string;
  mode: StudyMode;
  passNumber: number;
  presentationNumber: number;
  presentedAt: string;
  revealedAt?: string;
  answeredAt?: string;
  result?: AttemptResult;
  attemptId?: string;
  timeToRevealMs?: number;
  answerViewingMs?: number;
  totalResponseMs?: number;
  revealCount: number;
  routeChanges: number;
  resumed: boolean;
};

export type CardLearningState = {
  cardId: string;
  firstStudiedAt?: string;
  lastStudiedAt?: string;
  lastCorrectAt?: string;
  lastIncorrectAt?: string;
  nextReviewAt?: string;
  intervalDays: number;
  easeFactor: number;
  correctStreak: number;
  longestCorrectStreak: number;
  lapseCount: number;
  totalReviews: number;
  totalResponseMs: number;
  averageResponseMs: number;
  averageCorrectResponseMs: number;
  averageIncorrectResponseMs: number;
  correctResponseMs: number;
  incorrectResponseMs: number;
  correctResponseCount: number;
  incorrectResponseCount: number;
  lastReviewGapHours?: number;
  averageReviewGapHours?: number;
  totalReviewGapHours: number;
  reviewGapCount: number;
  updatedAt: string;
};

export type AttemptTelemetry = {
  presentedAt?: string;
  revealedAt?: string;
  timeToRevealMs?: number;
  answerViewingMs?: number;
  responseTimeMs?: number;
  appSessionId?: string;
  interactionId?: string;
};
