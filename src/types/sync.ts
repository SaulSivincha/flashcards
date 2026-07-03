import type { FlashStudyBackup } from "./backup";

export type FlashStudySyncPackage = {
  format: "flashstudy-sync";
  version: 1;
  deviceId: string;
  exportedAt: string;
  data: FlashStudyBackup["data"];
};

export type SyncMergeSummary = {
  importedAt: string;
  sourceDeviceId: string;
  coursesAdded: number;
  coursesUpdated: number;
  topicsAdded: number;
  topicsUpdated: number;
  flashcardsAdded: number;
  flashcardsUpdated: number;
  studySessionsAdded: number;
  studySessionsUpdated: number;
  studyPassesAdded: number;
  studyPassesUpdated: number;
  cardAttemptsAdded: number;
  appUsageSessionsAdded: number;
  activityEventsAdded: number;
  cardInteractionsAdded: number;
  cardStatsRebuilt: number;
};
