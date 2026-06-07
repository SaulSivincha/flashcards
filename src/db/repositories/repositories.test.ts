import { FlashStudyDatabase } from "../db";
import { removeLegacyDemoData } from "../removeLegacyDemoData";
import { CourseRepository } from "./courseRepository";
import { FlashcardRepository } from "./flashcardRepository";
import { SettingsRepository } from "./settingsRepository";
import { StudyRepository } from "./studyRepository";
import { TopicRepository } from "./topicRepository";

function databaseName(): string {
  return `flashstudy-test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

describe("repositories Dexie", () => {
  it("persiste cursos después de cerrar y volver a abrir la base", async () => {
    const name = databaseName();
    const firstDatabase = new FlashStudyDatabase(name);
    const firstRepository = new CourseRepository(firstDatabase);
    const created = await firstRepository.create({ name: "Derecho Empresarial" });
    firstDatabase.close();

    const secondDatabase = new FlashStudyDatabase(name);
    const secondRepository = new CourseRepository(secondDatabase);
    const persisted = await secondRepository.getById(created.id);

    expect(persisted?.name).toBe("Derecho Empresarial");
    await secondDatabase.delete();
  });

  it("persiste temas y flashcards asociados", async () => {
    const name = databaseName();
    const firstDatabase = new FlashStudyDatabase(name);
    const courseRepository = new CourseRepository(firstDatabase);
    const topicRepository = new TopicRepository(firstDatabase);
    const flashcardRepository = new FlashcardRepository(firstDatabase);
    const course = await courseRepository.create({ name: "Arquitectura" });
    const topic = await topicRepository.create({
      courseId: course.id,
      fileName: "arquitectura.csv",
      unit: "Unidad 1",
      title: "Patrones",
      order: 0,
      sourceHash: "hash-1",
    });
    await flashcardRepository.createMany([
      {
        topicId: topic.id,
        category: "Creacionales",
        question: "¿Qué resuelve Factory Method?",
        answer: "Delega la creación de objetos a subclases.",
        order: 0,
        isActive: true,
      },
    ]);
    firstDatabase.close();

    const secondDatabase = new FlashStudyDatabase(name);
    const persistedTopics = await new TopicRepository(
      secondDatabase,
    ).listByCourse(course.id);
    const persistedCards = await new FlashcardRepository(
      secondDatabase,
    ).listByTopic(topic.id);

    expect(persistedTopics).toHaveLength(1);
    expect(persistedCards).toHaveLength(1);
    expect(persistedCards[0].question).toContain("Factory Method");
    await secondDatabase.delete();
  });

  it("persiste el orden manual de los temas después de reabrir", async () => {
    const name = databaseName();
    const firstDatabase = new FlashStudyDatabase(name);
    const courseRepository = new CourseRepository(firstDatabase);
    const topicRepository = new TopicRepository(firstDatabase);
    const course = await courseRepository.create({ name: "Algoritmos" });
    const first = await topicRepository.create({
      courseId: course.id,
      fileName: "uno.csv",
      unit: "Unidad 1",
      title: "Tema uno",
      order: 0,
      sourceHash: "hash-uno",
    });
    const second = await topicRepository.create({
      courseId: course.id,
      fileName: "dos.csv",
      unit: "Unidad 2",
      title: "Tema dos",
      order: 1,
      sourceHash: "hash-dos",
    });

    await topicRepository.saveOrder(course.id, [second.id, first.id]);
    firstDatabase.close();

    const secondDatabase = new FlashStudyDatabase(name);
    const persisted = await new TopicRepository(secondDatabase).listByCourse(
      course.id,
    );

    expect(persisted.map((topic) => topic.id)).toEqual([second.id, first.id]);
    expect(persisted.map((topic) => topic.order)).toEqual([0, 1]);
    await secondDatabase.delete();
  });

  it("rechaza órdenes incompletos o con temas repetidos", async () => {
    const database = new FlashStudyDatabase(databaseName());
    const course = await new CourseRepository(database).create({
      name: "Bases de datos",
    });
    const topicRepository = new TopicRepository(database);
    const first = await topicRepository.create({
      courseId: course.id,
      fileName: "uno.csv",
      unit: "Unidad 1",
      title: "Tema uno",
      order: 0,
      sourceHash: "hash-uno",
    });
    await topicRepository.create({
      courseId: course.id,
      fileName: "dos.csv",
      unit: "Unidad 2",
      title: "Tema dos",
      order: 1,
      sourceHash: "hash-dos",
    });

    await expect(
      topicRepository.saveOrder(course.id, [first.id, first.id]),
    ).rejects.toThrow("todos los temas");
    expect(
      (await topicRepository.listByCourse(course.id)).map((topic) => topic.order),
    ).toEqual([0, 1]);
    await database.delete();
  });

  it("elimina un curso y todos sus datos asociados", async () => {
    const database = new FlashStudyDatabase(databaseName());
    const courseRepository = new CourseRepository(database);
    const topicRepository = new TopicRepository(database);
    const flashcardRepository = new FlashcardRepository(database);
    const course = await courseRepository.create({ name: "Curso temporal" });
    const topic = await topicRepository.create({
      courseId: course.id,
      fileName: "temporal.csv",
      unit: "Unidad 1",
      title: "Tema temporal",
      order: 0,
      sourceHash: "hash-temporal",
    });
    const [card] = await flashcardRepository.createMany([
      {
        topicId: topic.id,
        category: "General",
        question: "Pregunta temporal",
        answer: "Respuesta temporal",
        order: 0,
        isActive: true,
      },
    ]);
    await database.studySessions.add({
      id: "session-delete",
      topicId: topic.id,
      mode: "review",
      startedAt: "2026-06-06T10:00:00.000Z",
      totalCards: 1,
      totalPasses: 1,
      shuffle: false,
    });
    await database.studyPasses.add({
      id: "pass-delete",
      sessionId: "session-delete",
      passNumber: 1,
      totalCards: 1,
      correctCount: 1,
      incorrectCount: 0,
    });
    await database.cardAttempts.add({
      id: "attempt-delete",
      sessionId: "session-delete",
      passId: "pass-delete",
      cardId: card.id,
      result: "correct",
      answeredAt: "2026-06-06T10:01:00.000Z",
    });
    await database.cardStats.add({
      cardId: card.id,
      seenCount: 1,
      correctCount: 1,
      incorrectCount: 0,
    });

    await courseRepository.delete(course.id);

    expect(await database.courses.get(course.id)).toBeUndefined();
    expect(await database.topics.get(topic.id)).toBeUndefined();
    expect(await database.flashcards.get(card.id)).toBeUndefined();
    expect(await database.studySessions.get("session-delete")).toBeUndefined();
    expect(await database.studyPasses.get("pass-delete")).toBeUndefined();
    expect(await database.cardAttempts.get("attempt-delete")).toBeUndefined();
    expect(await database.cardStats.get(card.id)).toBeUndefined();
    await database.delete();
  });

  it("persiste sesiones, pasadas e intentos", async () => {
    const name = databaseName();
    const firstDatabase = new FlashStudyDatabase(name);
    const repository = new StudyRepository(firstDatabase);
    await repository.saveSession({
      id: "session-1",
      topicId: "topic-1",
      mode: "review",
      startedAt: "2026-06-06T10:00:00.000Z",
      totalCards: 1,
      totalPasses: 1,
      shuffle: false,
    });
    await repository.savePass({
      id: "pass-1",
      sessionId: "session-1",
      passNumber: 1,
      totalCards: 1,
      correctCount: 1,
      incorrectCount: 0,
    });
    await repository.saveAttempt({
      id: "attempt-1",
      sessionId: "session-1",
      passId: "pass-1",
      cardId: "card-1",
      result: "correct",
      answeredAt: "2026-06-06T10:01:00.000Z",
    });
    firstDatabase.close();

    const secondDatabase = new FlashStudyDatabase(name);
    const secondRepository = new StudyRepository(secondDatabase);

    expect(await secondRepository.getSession("session-1")).toBeDefined();
    expect(await secondRepository.listPasses("session-1")).toHaveLength(1);
    expect(await secondRepository.listAttempts("session-1")).toHaveLength(1);
    await secondDatabase.delete();
  });

  it("elimina los datos demo heredados y conserva las preferencias", async () => {
    const database = new FlashStudyDatabase(databaseName());
    await database.courses.add({
      id: "inteligencia-artificial",
      name: "Inteligencia Artificial",
      order: 0,
      createdAt: "2026-06-06T10:00:00.000Z",
      updatedAt: "2026-06-06T10:00:00.000Z",
    });
    await database.settings.add({
      key: "app",
      theme: "dark",
      defaultStudyOrder: "random",
      flipCardOnTap: false,
      seedVersion: 1,
      updatedAt: "2026-06-06T10:00:00.000Z",
    });

    await removeLegacyDemoData(database);

    const settings = await new SettingsRepository(database).get();
    expect(await database.courses.count()).toBe(0);
    expect(settings.defaultStudyOrder).toBe("random");
    expect(settings.flipCardOnTap).toBe(false);
    expect(settings.seedVersion).toBe(0);
    await database.delete();
  });
});
