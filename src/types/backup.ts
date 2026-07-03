import type { Course } from "./course";
import type { Flashcard } from "./flashcard";
import type { AppSettings } from "./settings";
import type { CardStats } from "./stats";
import type { CardAttempt, StudyPass, StudySession } from "./study";
import type { Topic } from "./topic";
import type {
  ActivityEvent,
  AppUsageSession,
  CardInteraction,
  CardLearningState,
} from "./telemetry";

export type FlashStudyBackup = {
  format: "flashstudy-backup";
  version: 2;
  exportedAt: string;
  data: {
    courses: Course[];
    topics: Topic[];
    flashcards: Flashcard[];
    studySessions: StudySession[];
    studyPasses: StudyPass[];
    cardAttempts: CardAttempt[];
    cardStats: CardStats[];
    settings: AppSettings[];
    appUsageSessions: AppUsageSession[];
    activityEvents: ActivityEvent[];
    cardInteractions: CardInteraction[];
    cardLearningStates: CardLearningState[];
  };
};

export type StorageSummary = {
  backupBytes: number;
  browserUsageBytes?: number;
  browserQuotaBytes?: number;
  courses: number;
  topics: number;
  flashcards: number;
  activeFlashcards: number;
  sessions: number;
  attempts: number;
  appSessions: number;
  activityEvents: number;
  cardInteractions: number;
};
