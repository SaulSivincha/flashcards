import type { FlashStudyDatabase } from "../db";
import { db } from "../db";
import type { FlashStudyBackup, StorageSummary } from "../../types/backup";
import { validateBackup } from "../../services/backup/backupValidator";

const allTables = (database: FlashStudyDatabase) => [
  database.courses,
  database.topics,
  database.flashcards,
  database.studySessions,
  database.studyPasses,
  database.cardAttempts,
  database.cardStats,
  database.settings,
];

export class DataManagementRepository {
  constructor(private readonly database: FlashStudyDatabase = db) {}

  async createBackup(): Promise<FlashStudyBackup> {
    const [
      courses,
      topics,
      flashcards,
      studySessions,
      studyPasses,
      cardAttempts,
      cardStats,
      settings,
    ] = await Promise.all([
      this.database.courses.toArray(),
      this.database.topics.toArray(),
      this.database.flashcards.toArray(),
      this.database.studySessions.toArray(),
      this.database.studyPasses.toArray(),
      this.database.cardAttempts.toArray(),
      this.database.cardStats.toArray(),
      this.database.settings.toArray(),
    ]);

    return {
      format: "flashstudy-backup",
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        courses,
        topics,
        flashcards,
        studySessions,
        studyPasses,
        cardAttempts,
        cardStats,
        settings,
      },
    };
  }

  async restoreBackup(value: unknown): Promise<FlashStudyBackup> {
    const backup = validateBackup(value);

    await this.database.transaction("rw", allTables(this.database), async () => {
      await Promise.all(allTables(this.database).map((table) => table.clear()));
      await this.database.courses.bulkAdd(backup.data.courses);
      await this.database.topics.bulkAdd(backup.data.topics);
      await this.database.flashcards.bulkAdd(backup.data.flashcards);
      await this.database.studySessions.bulkAdd(backup.data.studySessions);
      await this.database.studyPasses.bulkAdd(backup.data.studyPasses);
      await this.database.cardAttempts.bulkAdd(backup.data.cardAttempts);
      await this.database.cardStats.bulkAdd(backup.data.cardStats);
      await this.database.settings.bulkAdd(backup.data.settings);
    });

    return backup;
  }

  async resetProgress(): Promise<void> {
    await this.database.transaction(
      "rw",
      [
        this.database.studySessions,
        this.database.studyPasses,
        this.database.cardAttempts,
        this.database.cardStats,
        this.database.flashcards,
      ],
      async () => {
        const cards = await this.database.flashcards.toArray();
        await Promise.all([
          this.database.studySessions.clear(),
          this.database.studyPasses.clear(),
          this.database.cardAttempts.clear(),
          this.database.cardStats.clear(),
        ]);
        if (cards.length > 0) {
          await this.database.cardStats.bulkAdd(
            cards.map((card) => ({
              cardId: card.id,
              seenCount: 0,
              correctCount: 0,
              incorrectCount: 0,
            })),
          );
        }
      },
    );
  }

  async getStorageSummary(): Promise<StorageSummary> {
    const [
      backup,
      courses,
      topics,
      flashcards,
      activeFlashcards,
      sessions,
      attempts,
    ] = await Promise.all([
      this.createBackup(),
      this.database.courses.count(),
      this.database.topics.count(),
      this.database.flashcards.count(),
      this.database.flashcards.filter((card) => card.isActive).count(),
      this.database.studySessions.count(),
      this.database.cardAttempts.count(),
    ]);
    const estimate =
      typeof navigator !== "undefined" && navigator.storage?.estimate
        ? await navigator.storage.estimate()
        : undefined;

    return {
      backupBytes: new Blob([JSON.stringify(backup)]).size,
      browserUsageBytes: estimate?.usage,
      browserQuotaBytes: estimate?.quota,
      courses,
      topics,
      flashcards,
      activeFlashcards,
      sessions,
      attempts,
    };
  }
}

export const dataManagementRepository = new DataManagementRepository();
