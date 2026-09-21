import type { FlashStudyDatabase } from "../db";
import { db } from "../db";
import type { Course } from "../../types/course";
import type { Flashcard } from "../../types/flashcard";
import type { CardStats } from "../../types/stats";
import type { Topic } from "../../types/topic";
import { nowIso } from "../../utils/dates";
import { createStableCardId } from "../../utils/hash";
import { createId } from "../../utils/ids";
import type {
  CsvImportAnalysis,
  CsvImportOptions,
  CsvImportResult,
} from "../../services/csv/csvImportTypes";
import type { ParsedFlashcardCsv } from "../../services/csv/csvTypes";
import { normalizeCsvKey } from "../../services/csv/csvValidator";
import { saveTopicCsvFile } from "../../services/csv/csvArchiveService";

function sameText(left: string, right: string): boolean {
  return normalizeCsvKey(left) === normalizeCsvKey(right);
}

function cardFingerprint(category: string, question: string): string {
  return `${normalizeCsvKey(category)}|${normalizeCsvKey(question)}`;
}

function copyFileName(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex <= 0) {
    return `${fileName} (copia)`;
  }

  return `${fileName.slice(0, dotIndex)} (copia)${fileName.slice(dotIndex)}`;
}

export class CsvImportRepository {
  constructor(private readonly database: FlashStudyDatabase = db) {}

  async analyze(
    parsed: ParsedFlashcardCsv,
    preferredCourseId?: string,
  ): Promise<CsvImportAnalysis> {
    const courses = await this.database.courses.toArray();
    const preferredCourse = preferredCourseId
      ? courses.find((course) => course.id === preferredCourseId)
      : undefined;
    const matchingCourse = courses.find((course) =>
      sameText(course.name, parsed.metadata.course),
    );
    const targetCourse = preferredCourse ?? matchingCourse;
    const topics = await this.database.topics.toArray();
    const fileNameConflict = topics.find((topic) =>
      sameText(topic.fileName, parsed.fileName),
    );
    const metadataConflict = targetCourse
      ? topics.find(
          (topic) =>
            topic.courseId === targetCourse.id &&
            sameText(topic.unit, parsed.metadata.unit) &&
            sameText(topic.title, parsed.metadata.topic),
        )
      : undefined;
    const conflict = fileNameConflict ?? metadataConflict;

    return {
      parsed,
      targetCourseId: targetCourse?.id,
      targetCourseName: targetCourse?.name ?? parsed.metadata.course,
      courseNameMismatch: Boolean(
        preferredCourse &&
          !sameText(preferredCourse.name, parsed.metadata.course),
      ),
      conflict: conflict
        ? {
            topicId: conflict.id,
            topicTitle: conflict.title,
            match: conflict === fileNameConflict ? "fileName" : "metadata",
          }
        : undefined,
    };
  }

  async import(
    parsed: ParsedFlashcardCsv,
    options: CsvImportOptions,
  ): Promise<CsvImportResult> {
    const result = await this.database.transaction(
      "rw",
      [
        this.database.courses,
        this.database.topics,
        this.database.flashcards,
        this.database.cardStats,
      ],
      async () => {
        const timestamp = nowIso();
        const existingTopic =
          options.mode === "update" && options.existingTopicId
            ? await this.database.topics.get(options.existingTopicId)
            : undefined;

        if (options.mode === "update" && !existingTopic) {
          throw new Error("El tema que se iba a actualizar ya no existe.");
        }
        const course = await this.resolveCourse(
          parsed.metadata.course,
          existingTopic?.courseId ?? options.preferredCourseId,
          timestamp,
        );

        const copy = options.mode === "copy";
        const topicTitle = copy
          ? await this.nextCopyTitle(course.id, parsed.metadata.topic)
          : parsed.metadata.topic;
        const topicFileName = copy
          ? copyFileName(parsed.fileName)
          : parsed.fileName;
        const topic =
          existingTopic ??
          (await this.createTopic(
            course.id,
            topicFileName,
            parsed.metadata.unit,
            topicTitle,
            parsed.sourceHash,
            timestamp,
          ));
        const previousCards = existingTopic
          ? await this.database.flashcards
              .where("topicId")
              .equals(topic.id)
              .toArray()
          : [];
        const previousByFingerprint = new Map(
          previousCards.map((card) => [
            cardFingerprint(card.category, card.question),
            card,
          ]),
        );
        const importedIds = new Set<string>();
        const cardsToPut: Flashcard[] = [];
        const statsToCreate: CardStats[] = [];
        let createdCards = 0;
        let updatedCards = 0;

        for (const [order, parsedCard] of parsed.cards.entries()) {
          const category = parsedCard.category || "Sin categoría";
          const previous = previousByFingerprint.get(
            cardFingerprint(category, parsedCard.question),
          );
          let id =
            previous?.id ??
            createStableCardId({
              course: course.name,
              unit: parsed.metadata.unit,
              topic: topicTitle,
              category,
              question: parsedCard.question,
            });

          const collision = previous
            ? undefined
            : await this.database.flashcards.get(id);
          if (collision && collision.topicId !== topic.id) {
            id = `${id}-${topic.id.slice(-8)}`;
          }

          importedIds.add(id);
          cardsToPut.push({
            id,
            topicId: topic.id,
            category,
            question: parsedCard.question,
            answer: parsedCard.answer,
            alternatives: parsedCard.alternatives,
            order,
            isActive: true,
            createdAt: previous?.createdAt ?? timestamp,
            updatedAt: timestamp,
          });

          if (previous) {
            updatedCards += 1;
          } else {
            createdCards += 1;
            statsToCreate.push({
              cardId: id,
              seenCount: 0,
              correctCount: 0,
              incorrectCount: 0,
            });
          }
        }

        const cardsToDeactivate = previousCards
          .filter((card) => card.isActive && !importedIds.has(card.id))
          .map((card) => ({
            ...card,
            isActive: false,
            updatedAt: timestamp,
          }));

        await this.database.flashcards.bulkPut([
          ...cardsToPut,
          ...cardsToDeactivate,
        ]);
        if (statsToCreate.length > 0) {
          await this.database.cardStats.bulkPut(statsToCreate);
        }

        if (existingTopic) {
          await this.database.topics.put({
            ...existingTopic,
            courseId: course.id,
            fileName: topicFileName,
            unit: parsed.metadata.unit,
            title: topicTitle,
            sourceHash: parsed.sourceHash,
            updatedAt: timestamp,
          });
        }
        await this.database.courses.update(course.id, { updatedAt: timestamp });

        return {
          courseId: course.id,
          courseName: course.name,
          topicId: topic.id,
          topicFileName,
          mode: options.mode,
          createdCards,
          updatedCards,
          deactivatedCards: cardsToDeactivate.length,
        };
      },
    );

    // The database remains the source of truth; a file-system error must not
    // prevent studying or importing on browsers that lack a native Documents folder.
    void saveTopicCsvFile(result.courseName, result.topicFileName, parsed.sourceText).catch(
      () => undefined,
    );
    return result;
  }

  private async resolveCourse(
    parsedCourseName: string,
    preferredCourseId: string | undefined,
    timestamp: string,
  ): Promise<Course> {
    const preferredCourse = preferredCourseId
      ? await this.database.courses.get(preferredCourseId)
      : undefined;
    if (preferredCourse) {
      return preferredCourse;
    }

    const matchingCourse = await this.database.courses
      .filter((course) => sameText(course.name, parsedCourseName))
      .first();
    if (matchingCourse) {
      return matchingCourse;
    }

    const lastCourse = await this.database.courses.orderBy("order").last();
    const course: Course = {
      id: createId("course"),
      name: parsedCourseName,
      order: (lastCourse?.order ?? -1) + 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await this.database.courses.add(course);
    return course;
  }

  private async createTopic(
    courseId: string,
    fileName: string,
    unit: string,
    title: string,
    sourceHash: string,
    timestamp: string,
  ): Promise<Topic> {
    const lastTopic = await this.database.topics
      .where("courseId")
      .equals(courseId)
      .sortBy("order");
    const topic: Topic = {
      id: createId("topic"),
      courseId,
      fileName,
      unit,
      title,
      order: (lastTopic.at(-1)?.order ?? -1) + 1,
      createdAt: timestamp,
      updatedAt: timestamp,
      sourceHash,
    };
    await this.database.topics.add(topic);
    return topic;
  }

  private async nextCopyTitle(
    courseId: string,
    baseTitle: string,
  ): Promise<string> {
    const titles = new Set(
      (
        await this.database.topics.where("courseId").equals(courseId).toArray()
      ).map((topic) => normalizeCsvKey(topic.title)),
    );
    let copyNumber = 1;
    let title = `${baseTitle} (copia)`;

    while (titles.has(normalizeCsvKey(title))) {
      copyNumber += 1;
      title = `${baseTitle} (copia ${copyNumber})`;
    }

    return title;
  }
}

export const csvImportRepository = new CsvImportRepository();
