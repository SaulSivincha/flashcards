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
