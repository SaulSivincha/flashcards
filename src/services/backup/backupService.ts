import { dataManagementRepository } from "../../db/repositories/dataManagementRepository";
import { validateBackup } from "./backupValidator";
import type { FlashStudyBackup, StorageSummary } from "../../types/backup";

function fileStamp(date: Date): string {
  return date.toISOString().slice(0, 19).replaceAll(":", "-");
}

export async function exportBackupFile(): Promise<FlashStudyBackup> {
  const backup = await dataManagementRepository.createBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `flashstudy-respaldo-${fileStamp(new Date())}.json`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  return backup;
}

export async function readBackupFile(file: File): Promise<FlashStudyBackup> {
  let value: unknown;
  try {
    value = JSON.parse(await file.text());
  } catch {
    throw new Error("El archivo seleccionado no contiene JSON válido.");
  }
  return validateBackup(value);
}

export function restoreBackup(
  backup: FlashStudyBackup,
): Promise<FlashStudyBackup> {
  return dataManagementRepository.restoreBackup(backup);
}

export async function restoreBackupFile(file: File): Promise<FlashStudyBackup> {
  return restoreBackup(await readBackupFile(file));
}

export function resetStudyProgress(): Promise<void> {
  return dataManagementRepository.resetProgress();
}

export function getStorageSummary(): Promise<StorageSummary> {
  return dataManagementRepository.getStorageSummary();
}
