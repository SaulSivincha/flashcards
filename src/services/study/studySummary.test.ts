import type { StudySessionHistory } from "../../db/repositories/studyRepository";
import { buildStudySessionSummary } from "./studySummary";

describe("buildStudySessionSummary", () => {
  it("calcula evolución, precisión y tarjetas difíciles", () => {
    const history: StudySessionHistory = {
      session: {
        id: "session-1",
        topicId: "topic-1",
        mode: "review",
        startedAt: "2026-06-06T10:00:00.000Z",
        finishedAt: "2026-06-06T10:05:00.000Z",
        totalCards: 2,
        totalPasses: 2,
        shuffle: false,
        selectedCardIds: ["a", "b"],
      },
      passes: [
        {
          id: "pass-1",
          sessionId: "session-1",
          passNumber: 1,
          totalCards: 2,
          correctCount: 1,
          incorrectCount: 1,
        },
        {
          id: "pass-2",
          sessionId: "session-1",
          passNumber: 2,
          totalCards: 1,
          correctCount: 1,
          incorrectCount: 0,
        },
      ],
      attempts: [
        {
          id: "attempt-1",
          sessionId: "session-1",
          passId: "pass-1",
          cardId: "a",
          result: "correct",
          answeredAt: "2026-06-06T10:01:00.000Z",
        },
        {
          id: "attempt-2",
          sessionId: "session-1",
          passId: "pass-1",
          cardId: "b",
          result: "incorrect",
          answeredAt: "2026-06-06T10:02:00.000Z",
        },
        {
          id: "attempt-3",
          sessionId: "session-1",
          passId: "pass-2",
          cardId: "b",
          result: "correct",
          answeredAt: "2026-06-06T10:03:00.000Z",
        },
      ],
      cards: [
        {
          id: "a",
          topicId: "topic-1",
          category: "Base",
          question: "A",
          answer: "A",
          order: 0,
          isActive: true,
          createdAt: "",
          updatedAt: "",
        },
        {
          id: "b",
          topicId: "topic-1",
          category: "Base",
          question: "B",
          answer: "B",
          order: 1,
          isActive: true,
          createdAt: "",
          updatedAt: "",
        },
      ],
    };

    const summary = buildStudySessionSummary(history);

    expect(summary.accuracy).toBe(67);
    expect(summary.passes.map((pass) => pass.score)).toEqual([50, 100]);
    expect(summary.difficultCards[0]).toMatchObject({
      incorrectCount: 1,
      correctPassNumber: 2,
    });
    expect(summary.durationMinutes).toBe(5);
  });
});
