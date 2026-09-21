import Dexie, { type EntityTable } from "dexie";
import type { Course } from "../types/course";
import type { Flashcard } from "../types/flashcard";
import type { AppSettings } from "../types/settings";
import type { CardAttempt, StudyPass, StudySession } from "../types/study";
import type { CardStats } from "../types/stats";
import type { Topic } from "../types/topic";
import type {
  ActivityEvent,
  AppUsageSession,
  CardInteraction,
  CardLearningState,
} from "../types/telemetry";

export class FlashStudyDatabase extends Dexie {
  courses!: EntityTable<Course, "id">;
  topics!: EntityTable<Topic, "id">;
  flashcards!: EntityTable<Flashcard, "id">;
  studySessions!: EntityTable<StudySession, "id">;
  studyPasses!: EntityTable<StudyPass, "id">;
  cardAttempts!: EntityTable<CardAttempt, "id">;
  cardStats!: EntityTable<CardStats, "cardId">;
  settings!: EntityTable<AppSettings, "key">;
  appUsageSessions!: EntityTable<AppUsageSession, "id">;
  activityEvents!: EntityTable<ActivityEvent, "id">;
  cardInteractions!: EntityTable<CardInteraction, "id">;
  cardLearningStates!: EntityTable<CardLearningState, "cardId">;

  constructor(name = "flashstudy") {
    super(name);

    this.version(1).stores({
      courses: "id, &name, order, createdAt, updatedAt",
      topics:
        "id, courseId, fileName, [courseId+order], [courseId+unit+title], createdAt, updatedAt",
      flashcards:
        "id, topicId, [topicId+order], category, createdAt, updatedAt",
      studySessions:
        "id, topicId, mode, startedAt, finishedAt, [topicId+startedAt]",
      studyPasses: "id, sessionId, [sessionId+passNumber]",
      cardAttempts:
        "id, sessionId, passId, cardId, answeredAt, [sessionId+answeredAt]",
      cardStats: "cardId, lastStudiedAt",
      settings: "key",
    });

    this.version(2).stores({
      courses: "id, &name, order, createdAt, updatedAt",
      topics:
        "id, courseId, fileName, [courseId+order], [courseId+unit+title], createdAt, updatedAt",
      flashcards:
        "id, topicId, [topicId+order], category, createdAt, updatedAt",
      studySessions:
        "id, topicId, mode, startedAt, finishedAt, [topicId+startedAt]",
      studyPasses: "id, sessionId, [sessionId+passNumber]",
      cardAttempts:
        "id, sessionId, passId, cardId, answeredAt, [sessionId+answeredAt]",
      cardStats: "cardId, lastStudiedAt",
      settings: "key",
      appUsageSessions: "id, openedAt, lastActiveAt, closedAt",
      activityEvents:
        "id, appSessionId, type, occurredAt, route, topicId, studySessionId, cardId, [type+occurredAt]",
      cardInteractions:
        "id, studySessionId, passId, cardId, presentedAt, answeredAt, [studySessionId+cardId]",
      cardLearningStates: "cardId, lastStudiedAt, nextReviewAt, updatedAt",
    });

    this.version(3).stores({
      courses: "id, &name, order, createdAt, updatedAt",
      topics:
        "id, courseId, fileName, [courseId+order], [courseId+unit+title], createdAt, updatedAt",
      flashcards:
        "id, topicId, [topicId+order], category, createdAt, updatedAt",
      studySessions:
        "id, topicId, mode, startedAt, finishedAt, [topicId+startedAt]",
      studyPasses: "id, sessionId, [sessionId+passNumber]",
      cardAttempts:
        "id, sessionId, passId, cardId, answeredAt, [sessionId+answeredAt]",
      cardStats: "cardId, lastStudiedAt",
      settings: "key",
      appUsageSessions: "id, openedAt, lastActiveAt, closedAt",
      activityEvents:
        "id, appSessionId, type, occurredAt, route, topicId, studySessionId, cardId, [type+occurredAt]",
      cardInteractions:
        "id, studySessionId, passId, cardId, presentedAt, answeredAt, [studySessionId+cardId]",
      cardLearningStates: "cardId, lastStudiedAt, nextReviewAt, updatedAt",
    });
  }
}

export const db = new FlashStudyDatabase();
