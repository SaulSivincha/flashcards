import type { FlashStudyDatabase } from "../db";
import { db } from "../db";
import type {
  Course,
  CourseSummary,
  CreateCourseInput,
} from "../../types/course";
import { createId } from "../../utils/ids";
import { nowIso } from "../../utils/dates";
import { calculateProgress } from "./repositoryUtils";
import { ensureCourseDirectory } from "../../services/csv/csvArchiveService";

export class CourseRepository {
  constructor(private readonly database: FlashStudyDatabase = db) {}

  async list(): Promise<Course[]> {
    return this.database.courses.orderBy("order").toArray();
  }

  async listSummaries(): Promise<CourseSummary[]> {
    const [courses, topics, flashcards, cardStats] = await Promise.all([
      this.list(),
      this.database.topics.toArray(),
      this.database.flashcards.filter((card) => card.isActive).toArray(),
      this.database.cardStats.toArray(),
    ]);
    const statsByCardId = new Map(cardStats.map((stats) => [stats.cardId, stats]));

    return courses.map((course) => {
      const courseTopics = topics.filter((topic) => topic.courseId === course.id);
      const topicIds = new Set(courseTopics.map((topic) => topic.id));
      const courseCards = flashcards.filter((card) => topicIds.has(card.topicId));

      return {
        ...course,
        topicCount: courseTopics.length,
        cardCount: courseCards.length,
        progress: calculateProgress(
          courseCards.map((card) => card.id),
          statsByCardId,
        ),
      };
    });
  }

  async getById(id: string): Promise<Course | undefined> {
    return this.database.courses.get(id);
  }

  async getSummary(id: string): Promise<CourseSummary | undefined> {
    const summaries = await this.listSummaries();
    return summaries.find((course) => course.id === id);
  }

  async create(input: CreateCourseInput): Promise<Course> {
    const name = input.name.trim();
    if (!name) {
      throw new Error("El nombre del curso es obligatorio.");
    }

    const existing = await this.database.courses
      .filter((course) => course.name.toLocaleLowerCase() === name.toLocaleLowerCase())
      .first();

    if (existing) {
      throw new Error("Ya existe un curso con ese nombre.");
    }

    const lastCourse = await this.database.courses.orderBy("order").last();
    const timestamp = nowIso();
    const course: Course = {
      id: createId("course"),
      name,
      createdAt: timestamp,
      updatedAt: timestamp,
      order: (lastCourse?.order ?? -1) + 1,
    };

    await this.database.courses.add(course);
    void ensureCourseDirectory(course.name).catch(() => undefined);
    return course;
  }

  async rename(id: string, name: string): Promise<Course> {
    const course = await this.getById(id);
    if (!course) {
      throw new Error("No se encontró el curso.");
    }

    const nextName = name.trim();
    if (!nextName) {
      throw new Error("El nombre del curso es obligatorio.");
    }
    const duplicate = await this.database.courses
      .filter(
        (item) =>
          item.id !== id &&
          item.name.toLocaleLowerCase() === nextName.toLocaleLowerCase(),
      )
      .first();
    if (duplicate) {
      throw new Error("Ya existe un curso con ese nombre.");
    }

    const updated = {
      ...course,
      name: nextName,
      updatedAt: nowIso(),
    };
    await this.database.courses.put(updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const topicIds = await this.database.topics
      .where("courseId")
      .equals(id)
      .primaryKeys();
    const flashcardIds =
      topicIds.length > 0
        ? await this.database.flashcards
            .where("topicId")
            .anyOf(topicIds)
            .primaryKeys()
        : [];
    const sessionIds =
      topicIds.length > 0
        ? await this.database.studySessions
            .where("topicId")
            .anyOf(topicIds)
            .primaryKeys()
        : [];
    const passIds =
      sessionIds.length > 0
        ? await this.database.studyPasses
            .where("sessionId")
            .anyOf(sessionIds)
            .primaryKeys()
        : [];
    const attemptIds =
      sessionIds.length > 0
        ? await this.database.cardAttempts
            .where("sessionId")
            .anyOf(sessionIds)
            .primaryKeys()
        : [];

    await this.database.transaction(
      "rw",
      [
        this.database.courses,
        this.database.topics,
        this.database.flashcards,
        this.database.studySessions,
        this.database.studyPasses,
        this.database.cardAttempts,
        this.database.cardStats,
      ],
      async () => {
        await this.database.cardAttempts.bulkDelete(attemptIds);
        await this.database.studyPasses.bulkDelete(passIds);
        await this.database.studySessions.bulkDelete(sessionIds);
        await this.database.cardStats.bulkDelete(flashcardIds);
        await this.database.flashcards.bulkDelete(flashcardIds);
        await this.database.topics.bulkDelete(topicIds);
        await this.database.courses.delete(id);
      },
    );
  }
}

export const courseRepository = new CourseRepository();
