import financialEducationCsv from "../../TEMA2_EF_sociedades_2026-06-06.csv?raw";
import type { FlashStudyDatabase } from "./db";
import { CsvImportRepository } from "./repositories/csvImportRepository";
import { parseFlashcardCsv } from "../services/csv/csvParser";

const fileName = "TEMA2_EF_sociedades_2026-06-06.csv";

/** Adds the bundled financial-education deck once, without overwriting user data. */
export async function seedFinancialEducation(
  database: FlashStudyDatabase,
): Promise<void> {
  const parsed = parseFlashcardCsv(financialEducationCsv, fileName);
  const repository = new CsvImportRepository(database);
  const analysis = await repository.analyze(parsed);

  if (analysis.conflict) {
    return;
  }

  await repository.import(parsed, {
    mode: "create",
    preferredCourseId: analysis.targetCourseId,
  });
}
