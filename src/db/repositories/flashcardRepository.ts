import type { FlashStudyDatabase } from "../db";
import { db } from "../db";
import type {
  CreateFlashcardInput,
  Flashcard,
} from "../../types/flashcard";
import { nowIso } from "../../utils/dates";
import { createId } from "../../utils/ids";

export class FlashcardRepository {
  constructor(private readonly database: FlashStudyDatabase = db) {}

  async listByTopic(
    topicId: string,
    includeInactive = false,
  ): Promise<Flashcard[]> {
    const collection = this.database.flashcards.where("topicId").equals(topicId);
    const cards = includeInactive
      ? await collection.toArray()
      : await collection.filter((card) => card.isActive).toArray();

    return cards.sort((left, right) => left.order - right.order);
  }

  async getById(id: string): Promise<Flashcard | undefined> {
    return this.database.flashcards.get(id);
  }

  async getMany(ids: string[]): Promise<Flashcard[]> {
    const cards = await this.database.flashcards.bulkGet(ids);
    return cards.filter((card): card is Flashcard => Boolean(card));
  }

  async createMany(inputs: CreateFlashcardInput[]): Promise<Flashcard[]> {
    const timestamp = nowIso();
    const cards = inputs.map((input) => ({
      ...input,
      id: input.id ?? createId("card"),
      createdAt: timestamp,
      updatedAt: timestamp,
    }));
    await this.database.flashcards.bulkAdd(cards);
    return cards;
  }

  async putMany(cards: Flashcard[]): Promise<void> {
    const timestamp = nowIso();
    await this.database.flashcards.bulkPut(
      cards.map((card) => ({ ...card, updatedAt: timestamp })),
    );
  }
}

export const flashcardRepository = new FlashcardRepository();
