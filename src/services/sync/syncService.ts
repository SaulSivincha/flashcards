import { Capacitor } from "@capacitor/core";
import {
  Directory,
  Encoding,
  Filesystem,
  type FileInfo,
} from "@capacitor/filesystem";
import { dataManagementRepository } from "../../db/repositories/dataManagementRepository";
import type { FlashStudyBackup } from "../../types/backup";
import type { FlashStudySyncPackage, SyncMergeSummary } from "../../types/sync";
import { createId } from "../../utils/ids";
import { validateBackup } from "../backup/backupValidator";

const deviceIdKey = "flashstudy.sync.deviceId";
const automaticSyncEnabledKey = "flashstudy.sync.automatic";
const automaticSyncDirectory = "FlashStudy/Sync";
let automaticSyncPromise: Promise<AutomaticSyncResult> | undefined;

export type AutomaticSyncResult = {
  available: boolean;
  filesMerged: number;
  recordsChanged: number;
};

function fileStamp(date: Date): string {
  return date.toISOString().slice(0, 19).replaceAll(":", "-");
}

export function getSyncDeviceId(): string {
  if (typeof localStorage === "undefined") {
    return createId("device");
  }
  const current = localStorage.getItem(deviceIdKey);
  if (current) {
    return current;
  }
  const next = createId("device");
  localStorage.setItem(deviceIdKey, next);
  return next;
}

export function isAutomaticSyncAvailable(): boolean {
  return Capacitor.isNativePlatform();
}

export function isAutomaticSyncEnabled(): boolean {
  if (!isAutomaticSyncAvailable() || typeof localStorage === "undefined") {
    return false;
  }
  return localStorage.getItem(automaticSyncEnabledKey) !== "false";
}

export function setAutomaticSyncEnabled(enabled: boolean): void {
  localStorage.setItem(automaticSyncEnabledKey, String(enabled));
}

export function getAutomaticSyncDirectory(): string {
  return `Documentos/${automaticSyncDirectory}`;
}

function validateSyncPackage(value: unknown): FlashStudySyncPackage {
  if (
    typeof value !== "object" ||
    value === null ||
    !("format" in value) ||
    !("version" in value) ||
    !("deviceId" in value) ||
    !("exportedAt" in value) ||
    !("data" in value)
  ) {
    throw new Error("El archivo seleccionado no es un paquete de sincronización.");
  }
  const candidate = value as FlashStudySyncPackage;
  if (
    candidate.format !== "flashstudy-sync" ||
    candidate.version !== 1 ||
    typeof candidate.deviceId !== "string" ||
    typeof candidate.exportedAt !== "string"
  ) {
    throw new Error("El paquete de sincronización no es compatible.");
  }

  const backup = validateBackup({
    format: "flashstudy-backup",
    version: 2,
    exportedAt: candidate.exportedAt,
    data: candidate.data,
  } satisfies FlashStudyBackup);

  return {
    ...candidate,
    data: backup.data,
  };
}

export async function createSyncPackage(): Promise<FlashStudySyncPackage> {
  const backup = await dataManagementRepository.createBackup();
  return {
    format: "flashstudy-sync",
    version: 1,
    deviceId: getSyncDeviceId(),
    exportedAt: new Date().toISOString(),
    data: backup.data,
  };
}

export async function exportSyncPackageFile(): Promise<FlashStudySyncPackage> {
  const syncPackage = await createSyncPackage();
  const blob = new Blob([JSON.stringify(syncPackage, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `flashstudy-sync-${fileStamp(new Date())}.json`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  return syncPackage;
}

export async function readSyncPackageFile(
  file: File,
): Promise<FlashStudySyncPackage> {
  let value: unknown;
  try {
    value = JSON.parse(await file.text());
  } catch {
    throw new Error("El archivo seleccionado no contiene JSON válido.");
  }
  return validateSyncPackage(value);
}

export function mergeSyncPackage(
  syncPackage: FlashStudySyncPackage,
): Promise<SyncMergeSummary> {
  return dataManagementRepository.mergeSyncBackup(
    {
      format: "flashstudy-backup",
      version: 2,
      exportedAt: syncPackage.exportedAt,
      data: syncPackage.data,
    } satisfies FlashStudyBackup,
    syncPackage.deviceId,
  );
}

function countChanges(summary: SyncMergeSummary): number {
  return (
    summary.coursesAdded +
    summary.coursesUpdated +
    summary.topicsAdded +
    summary.topicsUpdated +
    summary.flashcardsAdded +
    summary.flashcardsUpdated +
    summary.studySessionsAdded +
    summary.studySessionsUpdated +
    summary.studyPassesAdded +
    summary.studyPassesUpdated +
    summary.cardAttemptsAdded +
    summary.appUsageSessionsAdded +
    summary.activityEventsAdded +
    summary.cardInteractionsAdded
  );
}

function syncFileName(deviceId: string): string {
  return `flashstudy-${deviceId}.json`;
}

async function readAutomaticSyncFile(
  file: FileInfo,
): Promise<FlashStudySyncPackage | undefined> {
  if (file.type !== "file" || !file.name.endsWith(".json")) {
    return undefined;
  }
  const result = await Filesystem.readFile({
    path: `${automaticSyncDirectory}/${file.name}`,
    directory: Directory.Documents,
    encoding: Encoding.UTF8,
  });
  if (typeof result.data !== "string") {
    return undefined;
  }
  return validateSyncPackage(JSON.parse(result.data) as unknown);
}

async function writeAutomaticSyncFile(): Promise<void> {
  const syncPackage = await createSyncPackage();
  await Filesystem.writeFile({
    path: `${automaticSyncDirectory}/${syncFileName(syncPackage.deviceId)}`,
    directory: Directory.Documents,
    encoding: Encoding.UTF8,
    data: JSON.stringify(syncPackage),
    recursive: true,
  });
}

async function runAutomaticSync(): Promise<AutomaticSyncResult> {
  if (!isAutomaticSyncEnabled()) {
    return {
      available: isAutomaticSyncAvailable(),
      filesMerged: 0,
      recordsChanged: 0,
    };
  }

  await writeAutomaticSyncFile();
  const ownDeviceId = getSyncDeviceId();
  const directory = await Filesystem.readdir({
    path: automaticSyncDirectory,
    directory: Directory.Documents,
  });
  let filesMerged = 0;
  let recordsChanged = 0;

  for (const file of directory.files) {
    try {
      const syncPackage = await readAutomaticSyncFile(file);
      if (!syncPackage || syncPackage.deviceId === ownDeviceId) {
        continue;
      }
      const summary = await mergeSyncPackage(syncPackage);
      filesMerged += 1;
      recordsChanged += countChanges(summary);
    } catch (error) {
      console.warn(`Se omitió el archivo de sincronización ${file.name}.`, error);
    }
  }

  if (filesMerged > 0) {
    await writeAutomaticSyncFile();
  }
  return { available: true, filesMerged, recordsChanged };
}

export function automaticSync(): Promise<AutomaticSyncResult> {
  automaticSyncPromise ??= runAutomaticSync().finally(() => {
    automaticSyncPromise = undefined;
  });
  return automaticSyncPromise;
}

export async function publishAutomaticSync(): Promise<void> {
  if (!isAutomaticSyncEnabled()) {
    return;
  }
  await writeAutomaticSyncFile();
}
