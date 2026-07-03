import Dexie from "dexie";
import type { FlashStudyDatabase } from "../db";
import { db } from "../db";
import type {
  CategorySummary,
  CreateTopicInput,
  Topic,
  TopicDetails,
  TopicSummary,
} from "../../types/topic";
import { createId } from "../../utils/ids";
import { nowIso } from "../../utils/dates";
import { calculateProgress, maxDate } from "./repositoryUtils";

export class TopicRepository {
  constructor(private readonly database: FlashStudyDatabase = db) {}

  async listByCourse(courseId: string): Promise<Topic[]> {
    return this.database.topics
      .where("[courseId+order]")
      .between([courseId, Dexie.minKey], [courseId, Dexie.maxKey])
      .toArray();
  }

  async listSummariesByCourse(courseId: string): Promise<TopicSummary[]> {
    const topics = await this.listByCourse(courseId);
    return this.buildSummaries(topics);
  }

  async listRecent(limit = 5): Promise<TopicSummary[]> {
    const topics = await this.database.topics.toArray();
    const summaries = await this.buildSummaries(topics);

    return summaries
      .sort((left, right) =>
        (right.lastStudiedAt ?? right.updatedAt).localeCompare(
          left.lastStudiedAt ?? left.updatedAt,
        ),
      )
      .slice(0, limit);
  }

  async getById(id: string): Promise<Topic | undefined> {
    return this.database.topics.get(id);
  }

  async getDetails(id: string): Promise<TopicDetails | undefined> {
    const topic = await this.getById(id);
    if (!topic) {
      return undefined;
    }

    const [summary] = await this.buildSummaries([topic]);
    const [course, cards, cardStats] = await Promise.all([
      this.database.courses.get(topic.courseId),
      this.database.flashcards
        .where("topicId")
        .equals(topic.id)
        .filter((card) => card.isActive)
        .sortBy("order"),
      this.database.cardStats.toArray(),
    ]);
    const statsByCardId = new Map(cardStats.map((stats) => [stats.cardId, stats]));
    const categoryMap = new Map<string, string[]>();

    cards.forEach((card) => {
      const ids = categoryMap.get(card.category) ?? [];
      ids.push(card.id);
      categoryMap.set(card.category, ids);
    });

    const categories: CategorySummary[] = Array.from(categoryMap.entries()).map(
      ([name, cardIds]) => ({
        name,
        cardCount: cardIds.length,
        progress: calculateProgress(cardIds, statsByCardId),
      }),
    );

    return {
      ...summary,
      courseName: course?.name ?? "Curso",
      categories,
    };
  }

  async create(input: CreateTopicInput): Promise<Topic> {
    const timestamp = nowIso();
    const topic: Topic = {
      ...input,
      id: input.id ?? createId("topic"),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await this.database.topics.add(topic);
    return topic;
  }

  async update(topic: Topic): Promise<Topic> {
    const updated = { ...topic, updatedAt: nowIso() };
    await this.database.topics.put(updated);
    return updated;
  }

  async rename(id: string, title: string): Promise<Topic> {
    const topic = await this.database.topics.get(id);
    if (!topic) {
      throw new Error("No se encontró el tema.");
    }
    const nextTitle = title.trim();
    if (!nextTitle) {
      throw new Error("El nombre del tema es obligatorio.");
    }
    const duplicate = await this.database.topics
      .where("courseId")
      .equals(topic.courseId)
      .filter(
        (item) =>
          item.id !== id &&
          item.title.toLocaleLowerCase() === nextTitle.toLocaleLowerCase(),
      )
      .first();
    if (duplicate) {
      throw new Error("Ya existe un tema con ese nombre en el curso.");
    }

    const updated = {
      ...topic,
      title: nextTitle,
      updatedAt: nowIso(),
    };
    await this.database.topics.put(updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const topic = await this.database.topics.get(id);
    if (!topic) {
      throw new Error("No se encontró el tema.");
    }
    const flashcardIds = await this.database.flashcards
      .where("topicId")
      .equals(id)
      .primaryKeys();
    const sessionIds = await this.database.studySessions
      .where("topicId")
      .equals(id)
      .primaryKeys();
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
    const interactionIds =
      sessionIds.length > 0
        ? await this.database.cardInteractions
            .where("studySessionId")
            .anyOf(sessionIds)
            .primaryKeys()
        : [];
    const activityEvents = await this.database.activityEvents.toArray();
    const sessionIdSet = new Set(sessionIds);
    const cardIdSet = new Set(flashcardIds);
    const activityEventIds = activityEvents
      .filter(
        (event) =>
          event.topicId === id ||
          Boolean(
            event.studySessionId && sessionIdSet.has(event.studySessionId),
          ) ||
          Boolean(event.cardId && cardIdSet.has(event.cardId)),
      )
      .map((event) => event.id);

    await this.database.transaction(
      "rw",
      [
        this.database.topics,
        this.database.flashcards,
        this.database.studySessions,
        this.database.studyPasses,
        this.database.cardAttempts,
        this.database.cardStats,
        this.database.activityEvents,
        this.database.cardInteractions,
        this.database.cardLearningStates,
      ],
      async () => {
        await this.database.activityEvents.bulkDelete(activityEventIds);
        await this.database.cardInteractions.bulkDelete(interactionIds);
        await this.database.cardLearningStates.bulkDelete(flashcardIds);
        await this.database.cardAttempts.bulkDelete(attemptIds);
        await this.database.studyPasses.bulkDelete(passIds);
        await this.database.studySessions.bulkDelete(sessionIds);
        await this.database.cardStats.bulkDelete(flashcardIds);
        await this.database.flashcards.bulkDelete(flashcardIds);
        await this.database.topics.delete(id);

        const remaining = await this.database.topics
          .where("courseId")
          .equals(topic.courseId)
          .sortBy("order");
        await this.database.topics.bulkPut(
          remaining.map((item, order) => ({ ...item, order })),
        );
      },
    );
  }

  async saveOrder(courseId: string, topicIds: string[]): Promise<void> {
    const timestamp = nowIso();
    await this.database.transaction("rw", this.database.topics, async () => {
      const currentTopics = await this.database.topics
        .where("courseId")
        .equals(courseId)
        .toArray();
      const currentIds = new Set(currentTopics.map((topic) => topic.id));
      const requestedIds = new Set(topicIds);
      const sameTopics =
        currentTopics.length === topicIds.length &&
        requestedIds.size === topicIds.length &&
        topicIds.every((id) => currentIds.has(id));

      if (!sameTopics) {
        throw new Error(
          "El nuevo orden debe incluir todos los temas del curso una sola vez.",
        );
      }

      const topicById = new Map(
        currentTopics.map((topic) => [topic.id, topic]),
      );
      await this.database.topics.bulkPut(
        topicIds.map((id, order) => ({
          ...topicById.get(id)!,
          order,
          updatedAt: timestamp,
        })),
      );
    });
  }

  private async buildSummaries(topics: Topic[]): Promise<TopicSummary[]> {
    if (topics.length === 0) {
      return [];
    }

    const topicIds = topics.map((topic) => topic.id);
    const cards = await this.database.flashcards
      .where("topicId")
      .anyOf(topicIds)
      .filter((card) => card.isActive)
      .toArray();
    const cardIds = cards.map((card) => card.id);
    const cardStats =
      cardIds.length > 0
        ? (await this.database.cardStats.bulkGet(cardIds)).filter(
            (stats): stats is NonNullable<typeof stats> => Boolean(stats),
          )
        : [];
    const statsByCardId = new Map(cardStats.map((stats) => [stats.cardId, stats]));

    return topics.map((topic) => {
      const topicCards = cards.filter((card) => card.topicId === topic.id);
      const categoryCount = new Set(topicCards.map((card) => card.category)).size;
      const topicStats = topicCards
        .map((card) => statsByCardId.get(card.id))
        .filter((stats) => Boolean(stats));

      return {
        ...topic,
        cardCount: topicCards.length,
        categoryCount,
        progress: calculateProgress(
          topicCards.map((card) => card.id),
          statsByCardId,
        ),
        lastStudiedAt: maxDate(topicStats.map((stats) => stats?.lastStudiedAt)),
      };
    });
  }
}

export const topicRepository = new TopicRepository();
