import { FlashStudyDatabase } from "../db";
import { TelemetryRepository } from "./telemetryRepository";

function databaseName(): string {
  return `flashstudy-telemetry-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

describe("TelemetryRepository", () => {
  it("registra tiempos de interacción y actualiza el estado de aprendizaje", async () => {
    const database = new FlashStudyDatabase(databaseName());
    const repository = new TelemetryRepository(database);
    const interaction = await repository.beginCardInteraction({
      studySessionId: "session-1",
      passId: "pass-1",
      cardId: "card-1",
      mode: "review",
      passNumber: 1,
      presentationNumber: 1,
      resumed: false,
    });

    const revealed = await repository.revealCard(interaction.id);
    const completed = await repository.completeCardInteraction(
      interaction.id,
      "correct",
      "attempt-1",
    );
    const learning = await database.cardLearningStates.get("card-1");

    expect(revealed?.revealedAt).toBeDefined();
    expect(completed).toMatchObject({
      result: "correct",
      attemptId: "attempt-1",
    });
    expect(completed?.totalResponseMs).toBeGreaterThanOrEqual(0);
    expect(learning).toMatchObject({
      cardId: "card-1",
      intervalDays: 1,
      correctStreak: 1,
      totalReviews: 1,
      lapseCount: 0,
      correctResponseCount: 1,
    });
    expect(learning?.nextReviewAt).toBeDefined();
    await database.delete();
  });

  it("reduce la facilidad y registra un lapso tras una respuesta incorrecta", async () => {
    const database = new FlashStudyDatabase(databaseName());
    const repository = new TelemetryRepository(database);
    await database.cardLearningStates.add({
      cardId: "card-1",
      intervalDays: 7,
      easeFactor: 2.5,
      correctStreak: 3,
      longestCorrectStreak: 3,
      lapseCount: 0,
      totalReviews: 3,
      totalResponseMs: 3_000,
      averageResponseMs: 1_000,
      averageCorrectResponseMs: 1_000,
      averageIncorrectResponseMs: 0,
      correctResponseMs: 3_000,
      incorrectResponseMs: 0,
      correctResponseCount: 3,
      incorrectResponseCount: 0,
      totalReviewGapHours: 48,
      reviewGapCount: 2,
      updatedAt: "2026-06-06T10:00:00.000Z",
      lastStudiedAt: "2026-06-06T10:00:00.000Z",
    });
    const interaction = await repository.beginCardInteraction({
      studySessionId: "session-2",
      passId: "pass-2",
      cardId: "card-1",
      mode: "review",
      passNumber: 2,
      presentationNumber: 1,
      resumed: true,
    });

    await repository.completeCardInteraction(
      interaction.id,
      "incorrect",
      "attempt-2",
    );
    const learning = await database.cardLearningStates.get("card-1");

    expect(learning).toMatchObject({
      intervalDays: 1,
      easeFactor: 2.3,
      correctStreak: 0,
      longestCorrectStreak: 3,
      lapseCount: 1,
      totalReviews: 4,
      incorrectResponseCount: 1,
    });
    await database.delete();
  });
});
