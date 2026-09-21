import networksCsv from "../../cursos/Redes/Tema_01_Redes_y_Comunicacion.csv?raw";
import routingCsv from "../../cursos/Redes/Tema_02_Enrutamiento_y_Direccionamiento_IP.csv?raw";
import type { FlashStudyDatabase } from "./db";
import { CsvImportRepository } from "./repositories/csvImportRepository";
import { parseFlashcardCsv } from "../services/csv/csvParser";

const seedDecks = [
  ["Tema_01_Redes_y_Comunicacion.csv", networksCsv],
  ["Tema_02_Enrutamiento_y_Direccionamiento_IP.csv", routingCsv],
] as const;

/** Creates the bundled Networks deck and refreshes it only when its source changes. */
export async function seedNetworks(database: FlashStudyDatabase): Promise<void> {
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
