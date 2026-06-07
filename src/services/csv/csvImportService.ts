import { csvImportRepository } from "../../db/repositories/csvImportRepository";
import type {
  CsvImportAnalysis,
  CsvImportOptions,
  CsvImportResult,
} from "./csvImportTypes";
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
  return csvImportRepository.import(analysis.parsed, {
    ...options,
    preferredCourseId: analysis.targetCourseId,
  });
}
