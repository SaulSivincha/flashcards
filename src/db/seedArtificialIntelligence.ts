import kddCsv from "../../cursos/Inteligencia Artificial/flashcards_0_c_kdd.csv?raw";
import decisionTreesCsv from "../../cursos/Inteligencia Artificial/flashcards_01_arboles_decision.csv?raw";
import blindSearchCsv from "../../cursos/Inteligencia Artificial/flashcards_02_busqueda_ciegas.csv?raw";
import heuristicSearchCsv from "../../cursos/Inteligencia Artificial/flashcards_03_busqueda_heuristica.csv?raw";
import localSearchCsv from "../../cursos/Inteligencia Artificial/flashcards_04_busqueda_local.csv?raw";
import kmeansCsv from "../../cursos/Inteligencia Artificial/flashcards_05_kmeans.csv?raw";
import dbscanCsv from "../../cursos/Inteligencia Artificial/flashcards_06_dbscan.csv?raw";
import xgboostCsv from "../../cursos/Inteligencia Artificial/flashcards_07_xgboost.csv?raw";
import isolationForestCsv from "../../cursos/Inteligencia Artificial/flashcards_08_isolation_forest.csv?raw";
import knnCsv from "../../cursos/Inteligencia Artificial/flashcards_09_knn.csv?raw";
import naiveBayesCsv from "../../cursos/Inteligencia Artificial/flashcards_10_naive_bayes.csv?raw";
import randomForestCsv from "../../cursos/Inteligencia Artificial/flashcards_11_random_forest.csv?raw";
import svmCsv from "../../cursos/Inteligencia Artificial/flashcards_12_svm.csv?raw";
import type { FlashStudyDatabase } from "./db";
import { CsvImportRepository } from "./repositories/csvImportRepository";
import { parseFlashcardCsv } from "../services/csv/csvParser";

const seedDecks = [
  ["flashcards_0_c_kdd.csv", kddCsv],
  ["flashcards_01_arboles_decision.csv", decisionTreesCsv],
  ["flashcards_02_busqueda_ciegas.csv", blindSearchCsv],
  ["flashcards_03_busqueda_heuristica.csv", heuristicSearchCsv],
  ["flashcards_04_busqueda_local.csv", localSearchCsv],
  ["flashcards_05_kmeans.csv", kmeansCsv],
  ["flashcards_06_dbscan.csv", dbscanCsv],
  ["flashcards_07_xgboost.csv", xgboostCsv],
  ["flashcards_08_isolation_forest.csv", isolationForestCsv],
  ["flashcards_09_knn.csv", knnCsv],
  ["flashcards_10_naive_bayes.csv", naiveBayesCsv],
  ["flashcards_11_random_forest.csv", randomForestCsv],
  ["flashcards_12_svm.csv", svmCsv],
] as const;

/** Adds bundled AI decks once, without overwriting user-imported topics. */
export async function seedArtificialIntelligence(
  database: FlashStudyDatabase,
): Promise<void> {
  const repository = new CsvImportRepository(database);

  for (const [fileName, csvText] of seedDecks) {
    const parsed = parseFlashcardCsv(csvText, fileName);
    const analysis = await repository.analyze(parsed);

    if (analysis.conflict) {
      continue;
    }

    await repository.import(parsed, {
      mode: "create",
      preferredCourseId: analysis.targetCourseId,
    });
  }
}
