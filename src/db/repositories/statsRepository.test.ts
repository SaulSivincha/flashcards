import type { Flashcard } from "../../types/flashcard";
import { FlashStudyDatabase } from "../db";
import { StatsRepository } from "./statsRepository";

function databaseName(): string {
  return `flashstudy-stats-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

describe("StatsRepository", () => {
  it("construye el dashboard desde los datos persistidos", async () => {
    const database = new FlashStudyDatabase(databaseName());
    const timestamp = new Date().toISOString();
    const card: Flashcard = {
      id: "card-1",
      topicId: "topic-1",
      category: "Base",
      question: "Pregunta",
      answer: "Respuesta",
      order: 0,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await database.courses.add({
      id: "course-1",
      name: "Curso",
      order: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    await database.topics.add({
      id: "topic-1",
      courseId: "course-1",
      fileName: "tema.csv",
      unit: "Unidad 1",
      title: "Tema",
      order: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
      sourceHash: "hash",
    });
    await database.flashcards.add(card);
    await database.cardStats.add({
      cardId: card.id,
      seenCount: 3,
      correctCount: 2,
      incorrectCount: 1,
      lastStudiedAt: timestamp,
      bestPassNumber: 1,
    });

    const dashboard = await new StatsRepository(database).getDashboard("all");

    expect(dashboard.global.studiedCards).toBe(1);
    expect(dashboard.courses[0].historicalAccuracy).toBe(67);
    expect(dashboard.topics[0].incorrectCount).toBe(1);
    expect(dashboard.cards[0].accuracy).toBe(67);
    await database.delete();
  });
});
