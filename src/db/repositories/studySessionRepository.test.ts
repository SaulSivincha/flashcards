import type { Flashcard } from "../../types/flashcard";
import { FlashStudyDatabase } from "../db";
import { StudyRepository } from "./studyRepository";

function databaseName(): string {
  return `flashstudy-study-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function cards(): Flashcard[] {
  const timestamp = "2026-06-06T10:00:00.000Z";
  return ["a", "b", "c"].map((id, order) => ({
    id,
    topicId: "topic-1",
    category: order === 2 ? "Otra" : "Base",
    question: `Pregunta ${id}`,
    answer: `Respuesta ${id}`,
    order,
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));
}

describe("StudyRepository", () => {
  it("persiste respuestas y crea otra pasada solo con incorrectas", async () => {
    const database = new FlashStudyDatabase(databaseName());
    await database.flashcards.bulkAdd(cards());
    const repository = new StudyRepository(database);
    const initial = await repository.startSession({
      topicId: "topic-1",
      mode: "review",
      category: "Base",
      shuffle: false,
    });

    await repository.recordAnswer(initial.session.id, "correct");
    const lastAnswer = await repository.recordAnswer(
      initial.session.id,
      "incorrect",
    );
    const secondPass = await repository.startNextPass(initial.session.id);

    expect(lastAnswer.passCompleted).toBe(true);
    expect(lastAnswer.sessionCompleted).toBe(false);
    expect(secondPass.session.currentCardIds).toEqual(["b"]);
    expect(secondPass.pass.passNumber).toBe(2);
    expect(await database.cardAttempts.count()).toBe(2);
    expect(await database.cardStats.get("a")).toMatchObject({
      seenCount: 1,
      correctCount: 1,
    });
    expect(await database.cardStats.get("b")).toMatchObject({
      seenCount: 1,
      incorrectCount: 1,
    });
    await database.delete();
  });

  it("finaliza la sesión cuando todas las tarjetas son correctas", async () => {
    const database = new FlashStudyDatabase(databaseName());
    await database.flashcards.bulkAdd(cards().slice(0, 1));
    const repository = new StudyRepository(database);
    const initial = await repository.startSession({
      topicId: "topic-1",
      mode: "review",
      shuffle: false,
    });
    const outcome = await repository.recordAnswer(
      initial.session.id,
      "correct",
    );

    expect(outcome.sessionCompleted).toBe(true);
    expect(outcome.session.finishedAt).toBeDefined();
    await database.delete();
  });

  it("reanuda una sesión activa en la misma tarjeta", async () => {
    const database = new FlashStudyDatabase(databaseName());
    await database.flashcards.bulkAdd(cards().slice(0, 2));
    const repository = new StudyRepository(database);
    const initial = await repository.startSession({
      topicId: "topic-1",
      mode: "review",
      shuffle: false,
    });
    await repository.recordAnswer(initial.session.id, "correct");

    const resumed = await repository.prepareSession({
      topicId: "topic-1",
      mode: "review",
      shuffle: false,
    });

    expect(resumed.session.id).toBe(initial.session.id);
    expect(resumed.currentCard?.id).toBe("b");
    await database.delete();
  });

  it("finaliza el examen tras una sola pasada aunque existan errores", async () => {
    const database = new FlashStudyDatabase(databaseName());
    await database.flashcards.bulkAdd(cards().slice(0, 2));
    const repository = new StudyRepository(database);
    const initial = await repository.startSession({
      topicId: "topic-1",
      mode: "exam",
      shuffle: false,
    });

    await repository.recordAnswer(initial.session.id, "correct");
    const outcome = await repository.recordAnswer(
      initial.session.id,
      "incorrect",
    );

    expect(outcome.sessionCompleted).toBe(true);
    expect(outcome.session.totalPasses).toBe(1);
    expect(await repository.listPasses(initial.session.id)).toHaveLength(1);
    await database.delete();
  });
});
