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
    expect(await database.cardStats.get("card-1")).toEqual({
      cardId: "card-1",
      seenCount: 0,
      correctCount: 0,
      incorrectCount: 0,
    });
    await database.delete();
  });
});
