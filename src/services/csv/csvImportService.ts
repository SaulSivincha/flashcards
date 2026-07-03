import { csvImportRepository } from "../../db/repositories/csvImportRepository";
import type {
  CsvImportAnalysis,
  CsvImportOptions,
  CsvImportResult,
} from "./csvImportTypes";
import {
  archiveCsvFile,
  removeArchivedCsvFile,
} from "./csvArchiveService";
import { parseFlashcardCsvFile } from "./csvParser";
import type { ParsedFlashcardCsv } from "./csvTypes";

export async function analyzeCsvImport(
  parsed: ParsedFlashcardCsv,
  preferredCourseId?: string,
): Promise<CsvImportAnalysis> {
  return csvImportRepository.analyze(parsed, preferredCourseId);
}

export async function analyzeCsvFile(
  file: File,
  preferredCourseId?: string,
): Promise<CsvImportAnalysis> {
  return analyzeCsvImport(
    await parseFlashcardCsvFile(file),
    preferredCourseId,
  );
}

export async function importCsv(
  analysis: CsvImportAnalysis,
  options: Omit<CsvImportOptions, "preferredCourseId">,
): Promise<CsvImportResult> {
  const archivedPath = await archiveCsvFile(
    analysis.parsed.fileName,
    analysis.parsed.sourceText,
  );

  try {
    return await csvImportRepository.import(analysis.parsed, {
      ...options,
      preferredCourseId: analysis.targetCourseId,
    });
  } catch (error) {
    await removeArchivedCsvFile(archivedPath).catch(() => undefined);
    throw error;
  }
}
