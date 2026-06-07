import Dexie, { type EntityTable } from "dexie";
import type { Course } from "../types/course";
import type { Flashcard } from "../types/flashcard";
import type { AppSettings } from "../types/settings";
import type { CardAttempt, StudyPass, StudySession } from "../types/study";
import type { CardStats } from "../types/stats";
import type { Topic } from "../types/topic";

export class FlashStudyDatabase extends Dexie {
  courses!: EntityTable<Course, "id">;
  topics!: EntityTable<Topic, "id">;
  flashcards!: EntityTable<Flashcard, "id">;
  studySessions!: EntityTable<StudySession, "id">;
  studyPasses!: EntityTable<StudyPass, "id">;
  cardAttempts!: EntityTable<CardAttempt, "id">;
  cardStats!: EntityTable<CardStats, "cardId">;
  settings!: EntityTable<AppSettings, "key">;

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
  }
}

export const db = new FlashStudyDatabase();
