import networksCsv from "../../cursos/Redes/Tema_01_Redes_y_Comunicacion.csv?raw";
import type { FlashStudyDatabase } from "./db";
import { CsvImportRepository } from "./repositories/csvImportRepository";
import { parseFlashcardCsv } from "../services/csv/csvParser";

const fileName = "Tema_01_Redes_y_Comunicacion.csv";

/** Creates the bundled Networks deck and refreshes it only when its source changes. */
export async function seedNetworks(database: FlashStudyDatabase): Promise<void> {
  const parsed = parseFlashcardCsv(networksCsv, fileName);
  const repository = new CsvImportRepository(database);
  const analysis = await repository.analyze(parsed);

  if (analysis.conflict) {
    const existingTopic = await database.topics.get(analysis.conflict.topicId);
    if (existingTopic?.sourceHash === parsed.sourceHash) {
      return;
    }

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
