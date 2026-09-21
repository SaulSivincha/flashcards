import operatingSystemsCsv from "../../cursos/Sistemas Operativos/Tema_01_Fundamentos_de_Sistemas_Operativos.csv?raw";
import type { FlashStudyDatabase } from "./db";
import { CsvImportRepository } from "./repositories/csvImportRepository";
import { parseFlashcardCsv } from "../services/csv/csvParser";

const fileName = "Tema_01_Fundamentos_de_Sistemas_Operativos.csv";

/** Adds the bundled operating-systems deck once, without overwriting user imports. */
export async function seedOperatingSystems(
  database: FlashStudyDatabase,
): Promise<void> {
  const parsed = parseFlashcardCsv(operatingSystemsCsv, fileName);
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
