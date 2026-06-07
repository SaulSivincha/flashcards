import type { StudySessionHistory } from "../../db/repositories/studyRepository";
import type { Flashcard } from "../../types/flashcard";

export type PassMetric = {
  passNumber: number;
  totalCards: number;
  correctCount: number;
  incorrectCount: number;
  score: number;
};

export type DifficultCard = {
  card: Flashcard;
  incorrectCount: number;
  correctPassNumber?: number;
};

export type StudySessionSummary = {
  totalCards: number;
  totalPasses: number;
  totalAttempts: number;
  correctAttempts: number;
  incorrectAttempts: number;
  accuracy: number;
  durationMinutes: number;
  passes: PassMetric[];
  difficultCards: DifficultCard[];
};

export function buildStudySessionSummary(
  history: StudySessionHistory,
): StudySessionSummary {
  const attemptsByCard = new Map<
    string,
    { incorrectCount: number; correctPassNumber?: number }
  >();
  const passNumberById = new Map(
    history.passes.map((pass) => [pass.id, pass.passNumber]),
  );

  for (const attempt of history.attempts) {
    const current = attemptsByCard.get(attempt.cardId) ?? {
      incorrectCount: 0,
    };
    if (attempt.result === "incorrect") {
      current.incorrectCount += 1;
    } else {
      current.correctPassNumber = Math.min(
        current.correctPassNumber ?? Number.MAX_SAFE_INTEGER,
        passNumberById.get(attempt.passId) ?? Number.MAX_SAFE_INTEGER,
      );
    }
    attemptsByCard.set(attempt.cardId, current);
  }

  const correctAttempts = history.attempts.filter(
    (attempt) => attempt.result === "correct",
  ).length;
  const incorrectAttempts = history.attempts.length - correctAttempts;
  const durationMilliseconds = history.session.finishedAt
    ? new Date(history.session.finishedAt).getTime() -
      new Date(history.session.startedAt).getTime()
    : 0;
  const difficultCards = history.cards
    .map((card) => ({
      card,
      ...(attemptsByCard.get(card.id) ?? { incorrectCount: 0 }),
    }))
    .filter((item) => item.incorrectCount > 0)
    .sort(
      (left, right) =>
        right.incorrectCount - left.incorrectCount ||
        (right.correctPassNumber ?? 0) - (left.correctPassNumber ?? 0),
    );

  return {
    totalCards: history.session.totalCards,
    totalPasses: history.passes.length,
    totalAttempts: history.attempts.length,
    correctAttempts,
    incorrectAttempts,
    accuracy:
      history.attempts.length === 0
        ? 0
        : Math.round((correctAttempts / history.attempts.length) * 100),
    durationMinutes:
      durationMilliseconds <= 0
        ? 0
        : Math.max(1, Math.round(durationMilliseconds / 60_000)),
    passes: history.passes.map((pass) => ({
      passNumber: pass.passNumber,
      totalCards: pass.totalCards,
      correctCount: pass.correctCount,
      incorrectCount: pass.incorrectCount,
      score:
        pass.totalCards === 0
          ? 0
          : Math.round((pass.correctCount / pass.totalCards) * 100),
    })),
    difficultCards,
  };
}
