import type { Course } from "../../types/course";
import type { Flashcard } from "../../types/flashcard";
import type { Topic } from "../../types/topic";
import { parseFlashcardCsv } from "../../services/csv/csvParser";
import { FlashStudyDatabase } from "../db";
import { CsvImportRepository } from "./csvImportRepository";

function databaseName(): string {
  return `flashstudy-csv-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const baseCsv = `curso,Inteligencia Artificial
unidad,Unidad 1
tema,Sistemas Expertos

categoria,pregunta,respuesta
Historia,¿Qué fue DENDRAL?,Respuesta actualizada
Conceptos,¿Qué es una heurística?,Una regla práctica`;

describe("CsvImportRepository", () => {
  it("crea curso, tema, tarjetas y estadísticas iniciales", async () => {
    const database = new FlashStudyDatabase(databaseName());
    const repository = new CsvImportRepository(database);
    const parsed = parseFlashcardCsv(baseCsv, "nuevo.csv");
    const result = await repository.import(parsed, { mode: "create" });

    expect(result.createdCards).toBe(2);
    expect(await database.courses.count()).toBe(1);
    expect(await database.topics.count()).toBe(1);
    expect(await database.flashcards.count()).toBe(2);
    expect(await database.cardStats.count()).toBe(2);
    expect((await database.cardStats.toArray())[0].seenCount).toBe(0);
    await database.delete();
  });

  it("detecta conflictos por nombre de archivo y por metadatos", async () => {
    const database = new FlashStudyDatabase(databaseName());
    const timestamp = new Date().toISOString();
    const course: Course = {
      id: "course-1",
      name: "Inteligencia Artificial",
      order: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const topic: Topic = {
      id: "topic-1",
      courseId: course.id,
      fileName: "existente.csv",
      unit: "Unidad 1",
      title: "Sistemas Expertos",
      order: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
      sourceHash: "old",
    };
    await database.courses.add(course);
    await database.topics.add(topic);
    const repository = new CsvImportRepository(database);

    const fileConflict = await repository.analyze(
      parseFlashcardCsv(baseCsv, "existente.csv"),
      course.id,
    );
    const metadataConflict = await repository.analyze(
      parseFlashcardCsv(baseCsv, "renombrado.csv"),
      course.id,
    );

    expect(fileConflict.conflict?.match).toBe("fileName");
    expect(metadataConflict.conflict?.match).toBe("metadata");
    await database.delete();
  });

  it("actualiza tarjetas conservando estadísticas y desactiva las retiradas", async () => {
    const database = new FlashStudyDatabase(databaseName());
    const timestamp = "2026-06-01T10:00:00.000Z";
    const course: Course = {
      id: "course-1",
      name: "Inteligencia Artificial",
      order: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const topic: Topic = {
      id: "topic-1",
      courseId: course.id,
      fileName: "existente.csv",
      unit: "Unidad 1",
      title: "Sistemas Expertos",
      order: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
      sourceHash: "old",
    };
    const cards: Flashcard[] = [
      {
        id: "card-dendral",
        topicId: topic.id,
        category: "Historia",
        question: "¿Qué fue DENDRAL?",
        answer: "Respuesta anterior",
        order: 0,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: "card-retirada",
        topicId: topic.id,
        category: "Historia",
        question: "Pregunta retirada",
        answer: "Ya no aparecerá",
        order: 1,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ];
    await database.courses.add(course);
    await database.topics.add(topic);
    await database.flashcards.bulkAdd(cards);
    await database.cardStats.bulkAdd([
      {
        cardId: "card-dendral",
        seenCount: 5,
        correctCount: 4,
        incorrectCount: 1,
      },
      {
        cardId: "card-retirada",
        seenCount: 2,
        correctCount: 1,
        incorrectCount: 1,
      },
    ]);

    const result = await new CsvImportRepository(database).import(
      parseFlashcardCsv(baseCsv, "existente.csv"),
      {
        mode: "update",
        preferredCourseId: course.id,
        existingTopicId: topic.id,
      },
    );
    const updatedCards = await database.flashcards
      .where("topicId")
      .equals(topic.id)
      .toArray();

    expect(result).toMatchObject({
      createdCards: 1,
      updatedCards: 1,
      deactivatedCards: 1,
    });
    expect(
      updatedCards.find((card) => card.id === "card-dendral"),
    ).toMatchObject({
      answer: "Respuesta actualizada",
      isActive: true,
    });
    expect(
      updatedCards.find((card) => card.id === "card-retirada")?.isActive,
    ).toBe(false);
    expect(await database.cardStats.get("card-dendral")).toMatchObject({
      seenCount: 5,
      correctCount: 4,
      incorrectCount: 1,
    });
    expect(await database.cardStats.get("card-retirada")).toBeDefined();
    await database.delete();
  });
});
