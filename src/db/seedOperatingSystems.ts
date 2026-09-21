import operatingSystemsCsv from "../../cursos/Sistemas Operativos/Tema_01_Fundamentos_de_Sistemas_Operativos.csv?raw";
import operatingSystemsStructureCsv from "../../cursos/Sistemas Operativos/Tema_02_Estructura_de_Sistemas_Operativos.csv?raw";
import type { FlashStudyDatabase } from "./db";
import { CsvImportRepository } from "./repositories/csvImportRepository";
import { parseFlashcardCsv } from "../services/csv/csvParser";

const seedDecks = [
  ["Tema_01_Fundamentos_de_Sistemas_Operativos.csv", operatingSystemsCsv],
  [
    "Tema_02_Estructura_de_Sistemas_Operativos.csv",
    operatingSystemsStructureCsv,
  ],
] as const;

/** Creates bundled operating-systems decks and refreshes them on source changes. */
export async function seedOperatingSystems(
  database: FlashStudyDatabase,
): Promise<void> {
  const repository = new CsvImportRepository(database);

  for (const [fileName, csvText] of seedDecks) {
    const parsed = parseFlashcardCsv(csvText, fileName);
    const analysis = await repository.analyze(parsed);

    if (analysis.conflict) {
      const existingTopic = await database.topics.get(analysis.conflict.topicId);
      if (existingTopic?.sourceHash === parsed.sourceHash) {
        continue;
      }

      await repository.import(parsed, {
        mode: "update",
        existingTopicId: analysis.conflict.topicId,
        preferredCourseId: analysis.targetCourseId,
      });
      continue;
    }

    await repository.import(parsed, {
      mode: "create",
      preferredCourseId: analysis.targetCourseId,
    });
  }
}
