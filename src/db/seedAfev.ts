import afevCsv from "../../cursos/AFEV/Tema_01_Metodos_Formales_Introduccion.csv?raw";
import type { FlashStudyDatabase } from "./db";
import { CsvImportRepository } from "./repositories/csvImportRepository";
import { parseFlashcardCsv } from "../services/csv/csvParser";

const fileName = "Tema_01_Metodos_Formales_Introduccion.csv";

/** Creates the bundled AFEV deck and refreshes it when its source changes. */
export async function seedAfev(database: FlashStudyDatabase): Promise<void> {
  const parsed = parseFlashcardCsv(afevCsv, fileName);
  const repository = new CsvImportRepository(database);
  const analysis = await repository.analyze(parsed);

  if (analysis.conflict) {
    const existingTopic = await database.topics.get(analysis.conflict.topicId);
    if (existingTopic?.sourceHash === parsed.sourceHash) return;
    await repository.import(parsed, {
      mode: "update",
      existingTopicId: analysis.conflict.topicId,
      preferredCourseId: analysis.targetCourseId,
    });
    return;
  }

  await repository.import(parsed, {
    mode: "create",
    preferredCourseId: analysis.targetCourseId,
  });
}
