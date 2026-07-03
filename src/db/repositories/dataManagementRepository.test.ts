import { FlashStudyDatabase } from "../db";
import { DataManagementRepository } from "./dataManagementRepository";

function databaseName(): string {
  return `flashstudy-data-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function populate(database: FlashStudyDatabase): Promise<void> {
  const timestamp = "2026-06-06T10:00:00.000Z";
  await database.courses.add({
    id: "course-1",
    name: "Curso conservado",
    order: 3,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  await database.topics.add({
    id: "topic-1",
    courseId: "course-1",
    fileName: "tema.csv",
    unit: "Unidad 1",
    title: "Tema conservado",
    order: 4,
    createdAt: timestamp,
    updatedAt: timestamp,
    sourceHash: "hash",
  });
  await database.flashcards.add({
    id: "card-1",
    topicId: "topic-1",
    category: "General",
    question: "Pregunta",
    answer: "Respuesta",
    order: 0,
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  await database.studySessions.add({
    id: "session-1",
    topicId: "topic-1",
    mode: "review",
    startedAt: timestamp,
    finishedAt: timestamp,
    totalCards: 1,
    totalPasses: 1,
    shuffle: false,
  });
  await database.studyPasses.add({
    id: "pass-1",
    sessionId: "session-1",
    passNumber: 1,
    totalCards: 1,
    correctCount: 1,
    incorrectCount: 0,
  });
  await database.cardAttempts.add({
    id: "attempt-1",
    sessionId: "session-1",
    passId: "pass-1",
    cardId: "card-1",
    result: "correct",
    answeredAt: timestamp,
  });
  await database.cardStats.add({
    cardId: "card-1",
    seenCount: 2,
    correctCount: 1,
    incorrectCount: 1,
    lastStudiedAt: timestamp,
    bestPassNumber: 1,
  });
  await database.settings.add({
    key: "app",
    theme: "light",
    defaultStudyOrder: "random",
    flipCardOnTap: false,
    seedVersion: 1,
    updatedAt: timestamp,
  });
  await database.appUsageSessions.add({
    id: "app-session-1",
    openedAt: timestamp,
    lastActiveAt: timestamp,
    closedAt: timestamp,
    activeDurationMs: 60_000,
    backgroundDurationMs: 5_000,
    foregroundCount: 2,
    routeChangeCount: 4,
    entryRoute: "/",
    exitRoute: "/temas/topic-1",
    timezone: "America/Lima",
    language: "es",
    platform: "test",
  });
  await database.activityEvents.add({
    id: "event-1",
    appSessionId: "app-session-1",
    type: "card_answered",
    occurredAt: timestamp,
    studySessionId: "session-1",
    cardId: "card-1",
  });
  await database.cardInteractions.add({
    id: "interaction-1",
    appSessionId: "app-session-1",
    studySessionId: "session-1",
    passId: "pass-1",
    cardId: "card-1",
    mode: "review",
    passNumber: 1,
    presentationNumber: 1,
    presentedAt: timestamp,
    answeredAt: timestamp,
    result: "correct",
    attemptId: "attempt-1",
    totalResponseMs: 2_000,
    revealCount: 1,
    routeChanges: 1,
    resumed: false,
  });
  await database.cardLearningStates.add({
    cardId: "card-1",
    firstStudiedAt: timestamp,
    lastStudiedAt: timestamp,
    nextReviewAt: "2026-06-07T10:00:00.000Z",
    intervalDays: 1,
    easeFactor: 2.55,
    correctStreak: 1,
    longestCorrectStreak: 1,
    lapseCount: 0,
    totalReviews: 1,
    totalResponseMs: 2_000,
    averageResponseMs: 2_000,
    averageCorrectResponseMs: 2_000,
    averageIncorrectResponseMs: 0,
    correctResponseMs: 2_000,
    incorrectResponseMs: 0,
    correctResponseCount: 1,
    incorrectResponseCount: 0,
    totalReviewGapHours: 0,
    reviewGapCount: 0,
    updatedAt: timestamp,
  });
}

describe("DataManagementRepository", () => {
  it("exporta y restaura todas las tablas de forma transaccional", async () => {
    const database = new FlashStudyDatabase(databaseName());
    const repository = new DataManagementRepository(database);
    await populate(database);
    const backup = await repository.createBackup();

    await database.courses.clear();
    await database.topics.clear();
    await database.flashcards.clear();
    await database.studySessions.clear();
    await database.studyPasses.clear();
    await database.cardAttempts.clear();
    await database.cardStats.clear();
    await database.settings.clear();
    await database.appUsageSessions.clear();
    await database.activityEvents.clear();
    await database.cardInteractions.clear();
    await database.cardLearningStates.clear();

    await repository.restoreBackup(backup);

    expect(await database.courses.get("course-1")).toMatchObject({
      name: "Curso conservado",
      order: 3,
    });
    expect(await database.topics.get("topic-1")).toMatchObject({ order: 4 });
    expect(await database.flashcards.count()).toBe(1);
    expect(await database.studySessions.count()).toBe(1);
    expect(await database.studyPasses.count()).toBe(1);
    expect(await database.cardAttempts.count()).toBe(1);
    expect(await database.cardStats.get("card-1")).toMatchObject({
      seenCount: 2,
    });
    expect(await database.settings.get("app")).toMatchObject({
      theme: "light",
      defaultStudyOrder: "random",
    });
    expect(await database.appUsageSessions.count()).toBe(1);
    expect(await database.activityEvents.count()).toBe(1);
    expect(await database.cardInteractions.count()).toBe(1);
    expect(await database.cardLearningStates.get("card-1")).toMatchObject({
      totalReviews: 1,
      nextReviewAt: "2026-06-07T10:00:00.000Z",
    });
    await database.delete();
  });

  it("reinicia el progreso sin eliminar contenido, preferencias ni orden", async () => {
    const database = new FlashStudyDatabase(databaseName());
    const repository = new DataManagementRepository(database);
    await populate(database);

    await repository.resetProgress();

    expect(await database.courses.get("course-1")).toMatchObject({ order: 3 });
    expect(await database.topics.get("topic-1")).toMatchObject({ order: 4 });
    expect(await database.flashcards.get("card-1")).toBeDefined();
    expect(await database.settings.get("app")).toMatchObject({
      theme: "light",
      defaultStudyOrder: "random",
      flipCardOnTap: false,
    });
    expect(await database.studySessions.count()).toBe(0);
    expect(await database.studyPasses.count()).toBe(0);
    expect(await database.cardAttempts.count()).toBe(0);
    expect(await database.cardInteractions.count()).toBe(0);
    expect(await database.cardLearningStates.count()).toBe(0);
    expect(await database.appUsageSessions.count()).toBe(1);
    expect(await database.cardStats.get("card-1")).toEqual({
      cardId: "card-1",
      seenCount: 0,
      correctCount: 0,
      incorrectCount: 0,
    });
    await database.delete();
  });

  it("fusiona paquetes de sincronización y reconstruye estadísticas", async () => {
    const database = new FlashStudyDatabase(databaseName());
    const repository = new DataManagementRepository(database);
    await populate(database);
    const incoming = await repository.createBackup();

    incoming.exportedAt = "2026-06-06T12:00:00.000Z";
    incoming.data.studySessions.push({
      id: "session-2",
      topicId: "topic-1",
      mode: "review",
      startedAt: "2026-06-06T11:00:00.000Z",
      finishedAt: "2026-06-06T11:05:00.000Z",
      totalCards: 1,
      totalPasses: 1,
      shuffle: false,
    });
    incoming.data.studyPasses.push({
      id: "pass-2",
      sessionId: "session-2",
      passNumber: 1,
      totalCards: 1,
      correctCount: 0,
      incorrectCount: 1,
      startedAt: "2026-06-06T11:00:00.000Z",
      finishedAt: "2026-06-06T11:05:00.000Z",
    });
    incoming.data.cardAttempts.push({
      id: "attempt-2",
      sessionId: "session-2",
      passId: "pass-2",
      cardId: "card-1",
      result: "incorrect",
      answeredAt: "2026-06-06T11:05:00.000Z",
    });
    incoming.data.cardStats = [
      {
        cardId: "card-1",
        seenCount: 999,
        correctCount: 999,
        incorrectCount: 999,
      },
    ];

    const summary = await repository.mergeSyncBackup(incoming, "device-test");

    expect(summary.cardAttemptsAdded).toBe(1);
    expect(summary.studySessionsAdded).toBe(1);
    expect(await database.cardAttempts.count()).toBe(2);
    expect(await database.cardStats.get("card-1")).toEqual({
      cardId: "card-1",
      seenCount: 2,
      correctCount: 1,
      incorrectCount: 1,
      lastStudiedAt: "2026-06-06T11:05:00.000Z",
      bestPassNumber: 1,
    });
    await database.delete();
  });
});
