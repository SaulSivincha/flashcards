import type { StatsCalculatorInput } from "./statsCalculator";
import { calculateStatsDashboard } from "./statsCalculator";

const timestamp = "2026-06-01T10:00:00.000Z";

function input(): StatsCalculatorInput {
  return {
    courses: [
      {
        id: "course-1",
        name: "Curso",
        order: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    topics: [
      {
        id: "topic-1",
        courseId: "course-1",
        fileName: "tema.csv",
        unit: "Unidad 1",
        title: "Tema",
        order: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
        sourceHash: "hash",
      },
    ],
    cards: ["a", "b"].map((id, order) => ({
      id,
      topicId: "topic-1",
      category: "Base",
      question: `Pregunta ${id}`,
      answer: `Respuesta ${id}`,
      order,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    })),
    cardStats: [
      {
        cardId: "a",
        seenCount: 1,
        correctCount: 1,
        incorrectCount: 0,
        lastStudiedAt: timestamp,
        bestPassNumber: 1,
      },
      {
        cardId: "b",
        seenCount: 2,
        correctCount: 1,
        incorrectCount: 1,
        lastStudiedAt: timestamp,
        bestPassNumber: 2,
      },
    ],
    sessions: [
      {
        id: "session-review",
        topicId: "topic-1",
        mode: "review",
        startedAt: timestamp,
        finishedAt: "2026-06-01T10:05:00.000Z",
        totalCards: 2,
        totalPasses: 2,
        shuffle: false,
      },
      {
        id: "session-exam",
        topicId: "topic-1",
        mode: "exam",
        startedAt: timestamp,
        finishedAt: "2026-06-02T10:05:00.000Z",
        totalCards: 2,
        totalPasses: 1,
        shuffle: false,
      },
    ],
    passes: [
      {
        id: "pass-1",
        sessionId: "session-review",
        passNumber: 1,
        totalCards: 2,
        correctCount: 1,
        incorrectCount: 1,
      },
      {
        id: "pass-2",
        sessionId: "session-review",
        passNumber: 2,
        totalCards: 1,
        correctCount: 1,
        incorrectCount: 0,
      },
      {
        id: "pass-exam",
        sessionId: "session-exam",
        passNumber: 1,
        totalCards: 2,
        correctCount: 1,
        incorrectCount: 1,
      },
    ],
    attempts: [
      {
        id: "attempt-1",
        sessionId: "session-exam",
        passId: "pass-exam",
        cardId: "a",
        result: "correct",
        answeredAt: "2026-06-02T10:01:00.000Z",
      },
      {
        id: "attempt-2",
        sessionId: "session-exam",
        passId: "pass-exam",
        cardId: "b",
        result: "incorrect",
        answeredAt: "2026-06-02T10:02:00.000Z",
      },
    ],
  };
}

describe("calculateStatsDashboard", () => {
  it("calcula estadísticas globales de repaso y separa examen", () => {
    const result = calculateStatsDashboard(
      input(),
      "30d",
      new Date("2026-06-06T10:00:00.000Z"),
    );

    expect(result.global).toMatchObject({
      studiedCards: 2,
      sessions: 1,
      mastery: 75,
      firstPassAccuracy: 50,
      averagePasses: 2,
      firstPassCards: 1,
      multiPassCards: 1,
      exam: {
        sessions: 1,
        answeredCards: 2,
        accuracy: 50,
      },
    });
  });

  it("calcula estadísticas por curso, tema y tarjeta", () => {
    const result = calculateStatsDashboard(
      input(),
      "all",
      new Date("2026-06-06T10:00:00.000Z"),
    );

    expect(result.courses[0]).toMatchObject({
      topicCount: 1,
      cardCount: 2,
      sessions: 1,
      historicalAccuracy: 67,
      averagePasses: 2,
    });
    expect(result.topics[0]).toMatchObject({
      correctCount: 2,
      incorrectCount: 1,
      categoryCount: 1,
      examSessions: 1,
    });
    expect(result.cards.find((card) => card.cardId === "b")).toMatchObject({
      seenCount: 2,
      correctCount: 1,
      incorrectCount: 1,
      accuracy: 50,
      bestPassNumber: 2,
    });
  });

  it("excluye datos fuera del periodo seleccionado", () => {
    const result = calculateStatsDashboard(
      input(),
      "30d",
      new Date("2026-08-06T10:00:00.000Z"),
    );

    expect(result.global.studiedCards).toBe(0);
    expect(result.global.sessions).toBe(0);
    expect(result.topics[0].incorrectCount).toBe(0);
  });
});
