import afevCsv from "../../cursos/AFEV/Tema_01_Metodos_Formales_Introduccion.csv?raw";
import afevFailuresCsv from "../../cursos/AFEV/Tema_02_Falla_Fracaso_y_Error.csv?raw";
import type { FlashStudyDatabase } from "./db";
import { CsvImportRepository } from "./repositories/csvImportRepository";
import { parseFlashcardCsv } from "../services/csv/csvParser";

const seedDecks = [
  ["Tema_01_Metodos_Formales_Introduccion.csv", afevCsv],
  ["Tema_02_Falla_Fracaso_y_Error.csv", afevFailuresCsv],
] as const;

/** Creates bundled AFEV decks and refreshes them when their source changes. */
export async function seedAfev(database: FlashStudyDatabase): Promise<void> {
  const repository = new CsvImportRepository(database);

  for (const [fileName, csvText] of seedDecks) {
    const parsed = parseFlashcardCsv(csvText, fileName);
    const analysis = await repository.analyze(parsed);
    if (analysis.conflict) {
      const existingTopic = await database.topics.get(analysis.conflict.topicId);
      if (existingTopic?.sourceHash === parsed.sourceHash) continue;
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
