import type { FlashStudyDatabase } from "../db";
import { db } from "../db";
import type {
  CardStats,
  StatsDashboard,
  StatsPeriod,
} from "../../types/stats";
import { calculateStatsDashboard } from "../../services/stats/statsCalculator";

export class StatsRepository {
  constructor(private readonly database: FlashStudyDatabase = db) {}

  async getCardStats(cardId: string): Promise<CardStats | undefined> {
    return this.database.cardStats.get(cardId);
  }

  async getMany(cardIds: string[]): Promise<CardStats[]> {
    const values = await this.database.cardStats.bulkGet(cardIds);
    return values.filter(
      (value): value is CardStats => Boolean(value),
    );
  }

  async put(stats: CardStats): Promise<void> {
    await this.database.cardStats.put(stats);
  }

  async putMany(stats: CardStats[]): Promise<void> {
    await this.database.cardStats.bulkPut(stats);
  }

  async getDashboard(period: StatsPeriod): Promise<StatsDashboard> {
    const [
      courses,
      topics,
      cards,
      cardStats,
      sessions,
      passes,
      attempts,
    ] = await Promise.all([
      this.database.courses.orderBy("order").toArray(),
      this.database.topics.toArray(),
      this.database.flashcards.toArray(),
      this.database.cardStats.toArray(),
      this.database.studySessions.toArray(),
      this.database.studyPasses.toArray(),
      this.database.cardAttempts.toArray(),
    ]);

    return calculateStatsDashboard(
      {
        courses,
        topics,
        cards,
        cardStats,
        sessions,
        passes,
        attempts,
      },
      period,
    );
  }
}

export const statsRepository = new StatsRepository();
