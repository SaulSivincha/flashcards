import type { FlashStudyDatabase } from "../db";
import { db } from "../db";
import type { FlashStudyBackup, StorageSummary } from "../../types/backup";
import type { CardStats } from "../../types/stats";
import type { SyncMergeSummary } from "../../types/sync";
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
  database.appUsageSessions,
  database.activityEvents,
  database.cardInteractions,
  database.cardLearningStates,
];

type WithUpdatedAt = { updatedAt: string };
type WithId = { id: string };

function isNewer(left?: string, right?: string): boolean {
  if (!left) {
    return false;
  }
  if (!right) {
    return true;
  }
  return new Date(left).getTime() > new Date(right).getTime();
}

function latestValue<T>(
  incoming: T,
  current: T | undefined,
  timestamp: (value: T) => string | undefined,
): T {
  if (!current) {
    return incoming;
  }
  return isNewer(timestamp(incoming), timestamp(current)) ? incoming : current;
}

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
      appUsageSessions,
      activityEvents,
      cardInteractions,
      cardLearningStates,
    ] = await Promise.all([
      this.database.courses.toArray(),
      this.database.topics.toArray(),
      this.database.flashcards.toArray(),
      this.database.studySessions.toArray(),
      this.database.studyPasses.toArray(),
      this.database.cardAttempts.toArray(),
      this.database.cardStats.toArray(),
      this.database.settings.toArray(),
      this.database.appUsageSessions.toArray(),
      this.database.activityEvents.toArray(),
      this.database.cardInteractions.toArray(),
      this.database.cardLearningStates.toArray(),
    ]);

    return {
      format: "flashstudy-backup",
      version: 2,
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
        appUsageSessions,
        activityEvents,
        cardInteractions,
        cardLearningStates,
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
      await this.database.appUsageSessions.bulkAdd(
        backup.data.appUsageSessions,
      );
      await this.database.activityEvents.bulkAdd(backup.data.activityEvents);
      await this.database.cardInteractions.bulkAdd(
        backup.data.cardInteractions,
      );
      await this.database.cardLearningStates.bulkAdd(
        backup.data.cardLearningStates,
      );
    });

    return backup;
  }

  async mergeSyncBackup(
    value: unknown,
    sourceDeviceId: string,
  ): Promise<SyncMergeSummary> {
    const backup = validateBackup(value);
    const summary: SyncMergeSummary = {
      importedAt: new Date().toISOString(),
      sourceDeviceId,
      coursesAdded: 0,
      coursesUpdated: 0,
      topicsAdded: 0,
      topicsUpdated: 0,
      flashcardsAdded: 0,
      flashcardsUpdated: 0,
      studySessionsAdded: 0,
      studySessionsUpdated: 0,
      studyPassesAdded: 0,
      studyPassesUpdated: 0,
      cardAttemptsAdded: 0,
      appUsageSessionsAdded: 0,
      activityEventsAdded: 0,
      cardInteractionsAdded: 0,
      cardStatsRebuilt: 0,
    };

    await this.database.transaction("rw", allTables(this.database), async () => {
      summary.coursesAdded += await this.mergeUpdatedById(
        this.database.courses,
        backup.data.courses,
      );
      summary.coursesUpdated += this.lastUpdatedCount;

      summary.topicsAdded += await this.mergeUpdatedById(
        this.database.topics,
        backup.data.topics,
      );
      summary.topicsUpdated += this.lastUpdatedCount;

      summary.flashcardsAdded += await this.mergeUpdatedById(
        this.database.flashcards,
        backup.data.flashcards,
      );
      summary.flashcardsUpdated += this.lastUpdatedCount;

      summary.studySessionsAdded += await this.mergeById(
        this.database.studySessions,
        backup.data.studySessions,
        (session) =>
          session.finishedAt ??
          session.abandonedAt ??
          session.startedAt,
      );
      summary.studySessionsUpdated += this.lastUpdatedCount;

      summary.studyPassesAdded += await this.mergeById(
        this.database.studyPasses,
        backup.data.studyPasses,
        (pass) => pass.finishedAt ?? pass.startedAt,
      );
      summary.studyPassesUpdated += this.lastUpdatedCount;

      summary.cardAttemptsAdded += await this.addMissingById(
        this.database.cardAttempts,
        backup.data.cardAttempts,
      );
      summary.appUsageSessionsAdded += await this.mergeById(
        this.database.appUsageSessions,
        backup.data.appUsageSessions,
        (session) => session.closedAt ?? session.lastActiveAt ?? session.openedAt,
      );
      summary.activityEventsAdded += await this.addMissingById(
        this.database.activityEvents,
        backup.data.activityEvents,
      );
      summary.cardInteractionsAdded += await this.mergeById(
        this.database.cardInteractions,
        backup.data.cardInteractions,
        (interaction) => interaction.answeredAt ?? interaction.presentedAt,
      );

      await this.mergeLatestByKey(
        this.database.settings,
        backup.data.settings,
        (setting) => setting.key,
        (setting) => setting.updatedAt,
      );
      await this.mergeLatestByKey(
        this.database.cardLearningStates,
        backup.data.cardLearningStates,
        (state) => state.cardId,
        (state) => state.updatedAt,
      );
      summary.cardStatsRebuilt = await this.rebuildCardStats();
    });

    return summary;
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
        this.database.cardInteractions,
        this.database.cardLearningStates,
      ],
      async () => {
        const cards = await this.database.flashcards.toArray();
        await Promise.all([
          this.database.studySessions.clear(),
          this.database.studyPasses.clear(),
          this.database.cardAttempts.clear(),
          this.database.cardStats.clear(),
          this.database.cardInteractions.clear(),
          this.database.cardLearningStates.clear(),
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

  private lastUpdatedCount = 0;

  private async mergeUpdatedById<T extends WithId & WithUpdatedAt>(
    table: { bulkGet: (keys: string[]) => Promise<(T | undefined)[]>; bulkAdd: (items: T[]) => Promise<unknown>; bulkPut: (items: T[]) => Promise<unknown> },
    incoming: T[],
  ): Promise<number> {
    return this.mergeById(table, incoming, (item) => item.updatedAt);
  }

  private async mergeById<T extends WithId>(
    table: { bulkGet: (keys: string[]) => Promise<(T | undefined)[]>; bulkAdd: (items: T[]) => Promise<unknown>; bulkPut: (items: T[]) => Promise<unknown> },
    incoming: T[],
    timestamp: (value: T) => string | undefined,
  ): Promise<number> {
    this.lastUpdatedCount = 0;
    if (incoming.length === 0) {
      return 0;
    }
    const current = await table.bulkGet(incoming.map((item) => item.id));
    const toAdd: T[] = [];
    const toPut: T[] = [];
    incoming.forEach((item, index) => {
      const existing = current[index];
      if (!existing) {
        toAdd.push(item);
        return;
      }
      const next = latestValue(item, existing, timestamp);
      if (next !== existing) {
        toPut.push(next);
      }
    });
    if (toAdd.length > 0) {
      await table.bulkAdd(toAdd);
    }
    if (toPut.length > 0) {
      await table.bulkPut(toPut);
    }
    this.lastUpdatedCount = toPut.length;
    return toAdd.length;
  }

  private async addMissingById<T extends WithId>(
    table: { bulkGet: (keys: string[]) => Promise<(T | undefined)[]>; bulkAdd: (items: T[]) => Promise<unknown> },
    incoming: T[],
  ): Promise<number> {
    if (incoming.length === 0) {
      return 0;
    }
    const current = await table.bulkGet(incoming.map((item) => item.id));
    const toAdd = incoming.filter((_, index) => !current[index]);
    if (toAdd.length > 0) {
      await table.bulkAdd(toAdd);
    }
    return toAdd.length;
  }

  private async mergeLatestByKey<T, K>(
    table: { bulkGet: (keys: K[]) => Promise<(T | undefined)[]>; bulkPut: (items: T[]) => Promise<unknown> },
    incoming: T[],
    key: (value: T) => K,
    timestamp: (value: T) => string | undefined,
  ): Promise<void> {
    if (incoming.length === 0) {
      return;
    }
    const current = await table.bulkGet(incoming.map(key));
    const toPut = incoming
      .map((item, index) => latestValue(item, current[index], timestamp))
      .filter((item, index) => item !== current[index]);
    if (toPut.length > 0) {
      await table.bulkPut(toPut);
    }
  }

  private async rebuildCardStats(): Promise<number> {
    const [cards, attempts, passes] = await Promise.all([
      this.database.flashcards.toArray(),
      this.database.cardAttempts.toArray(),
      this.database.studyPasses.toArray(),
    ]);
    const passById = new Map(passes.map((pass) => [pass.id, pass]));
    const statsByCardId = new Map<string, CardStats>();

    for (const card of cards) {
      statsByCardId.set(card.id, {
        cardId: card.id,
        seenCount: 0,
        correctCount: 0,
        incorrectCount: 0,
      });
    }

    for (const attempt of attempts) {
      const stats =
        statsByCardId.get(attempt.cardId) ??
        ({
          cardId: attempt.cardId,
          seenCount: 0,
          correctCount: 0,
          incorrectCount: 0,
        } satisfies CardStats);
      const passNumber = passById.get(attempt.passId)?.passNumber;
      stats.seenCount += 1;
      stats.correctCount += attempt.result === "correct" ? 1 : 0;
      stats.incorrectCount += attempt.result === "incorrect" ? 1 : 0;
      stats.lastStudiedAt = isNewer(attempt.answeredAt, stats.lastStudiedAt)
        ? attempt.answeredAt
        : stats.lastStudiedAt;
      if (
        attempt.result === "correct" &&
        passNumber !== undefined &&
        (stats.bestPassNumber === undefined ||
          passNumber < stats.bestPassNumber)
      ) {
        stats.bestPassNumber = passNumber;
      }
      statsByCardId.set(attempt.cardId, stats);
    }

    const stats = Array.from(statsByCardId.values());
    await this.database.cardStats.clear();
    if (stats.length > 0) {
      await this.database.cardStats.bulkPut(stats);
    }
    return stats.length;
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
      appSessions,
      activityEvents,
      cardInteractions,
    ] = await Promise.all([
      this.createBackup(),
      this.database.courses.count(),
      this.database.topics.count(),
      this.database.flashcards.count(),
      this.database.flashcards.filter((card) => card.isActive).count(),
      this.database.studySessions.count(),
      this.database.cardAttempts.count(),
      this.database.appUsageSessions.count(),
      this.database.activityEvents.count(),
      this.database.cardInteractions.count(),
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
      appSessions,
      activityEvents,
      cardInteractions,
    };
  }
}

export const dataManagementRepository = new DataManagementRepository();
