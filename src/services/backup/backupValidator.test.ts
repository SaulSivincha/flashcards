import type { FlashStudyBackup } from "../../types/backup";
import { validateBackup } from "./backupValidator";

function validBackup(): FlashStudyBackup {
  const timestamp = "2026-06-06T10:00:00.000Z";
  return {
    format: "flashstudy-backup",
    version: 2,
    exportedAt: timestamp,
    data: {
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
      flashcards: [
        {
          id: "card-1",
          topicId: "topic-1",
          category: "General",
          question: "Pregunta",
          answer: "Respuesta",
          order: 0,
          isActive: true,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
      studySessions: [
        {
          id: "session-1",
          topicId: "topic-1",
          mode: "review",
          startedAt: timestamp,
          totalCards: 1,
          totalPasses: 1,
          shuffle: false,
          currentPassId: "pass-1",
        },
      ],
      studyPasses: [
        {
          id: "pass-1",
          sessionId: "session-1",
          passNumber: 1,
          totalCards: 1,
          correctCount: 1,
          incorrectCount: 0,
        },
      ],
      cardAttempts: [
        {
          id: "attempt-1",
          sessionId: "session-1",
          passId: "pass-1",
          cardId: "card-1",
          result: "correct",
          answeredAt: timestamp,
        },
      ],
      cardStats: [
        {
          cardId: "card-1",
          seenCount: 1,
          correctCount: 1,
          incorrectCount: 0,
          lastStudiedAt: timestamp,
          bestPassNumber: 1,
        },
      ],
      settings: [
        {
          key: "app",
          theme: "dark",
          defaultStudyOrder: "normal",
          flipCardOnTap: true,
          seedVersion: 1,
          updatedAt: timestamp,
        },
      ],
      appUsageSessions: [
        {
          id: "app-session-1",
          openedAt: timestamp,
          lastActiveAt: timestamp,
          activeDurationMs: 1_000,
          backgroundDurationMs: 0,
          foregroundCount: 1,
          routeChangeCount: 1,
          entryRoute: "/",
          timezone: "America/Lima",
          language: "es",
          platform: "test",
        },
      ],
      activityEvents: [
        {
          id: "event-1",
          appSessionId: "app-session-1",
          type: "app_open",
          occurredAt: timestamp,
          route: "/",
        },
      ],
      cardInteractions: [
        {
          id: "interaction-1",
          appSessionId: "app-session-1",
          studySessionId: "session-1",
          passId: "pass-1",
          cardId: "card-1",
          mode: "review",
          passNumber: 1,
          presentationNumber: 1,
          presentedAt: timestamp,
          revealCount: 0,
          routeChanges: 0,
          resumed: false,
        },
      ],
      cardLearningStates: [
        {
          cardId: "card-1",
          intervalDays: 1,
          easeFactor: 2.5,
          correctStreak: 1,
          longestCorrectStreak: 1,
          lapseCount: 0,
          totalReviews: 1,
          totalResponseMs: 1_000,
          averageResponseMs: 1_000,
          averageCorrectResponseMs: 1_000,
          averageIncorrectResponseMs: 0,
          correctResponseMs: 1_000,
          incorrectResponseMs: 0,
          correctResponseCount: 1,
          incorrectResponseCount: 0,
          totalReviewGapHours: 0,
          reviewGapCount: 0,
          updatedAt: timestamp,
        },
      ],
    },
  };
}

describe("validateBackup", () => {
  it("acepta un respaldo completo con referencias válidas", () => {
    const backup = validBackup();

    expect(validateBackup(backup)).toBe(backup);
  });

  it("rechaza formatos incompatibles", () => {
    expect(() =>
      validateBackup({ ...validBackup(), version: 99 }),
    ).toThrow("no es un respaldo compatible");
  });

  it("migra respaldos versión 1 sin telemetría", () => {
    const current = validBackup();
    const legacy = {
      ...current,
      version: 1,
      data: {
        courses: current.data.courses,
        topics: current.data.topics,
        flashcards: current.data.flashcards,
        studySessions: current.data.studySessions,
        studyPasses: current.data.studyPasses,
        cardAttempts: current.data.cardAttempts,
        cardStats: current.data.cardStats,
        settings: current.data.settings,
      },
    };

    expect(validateBackup(legacy)).toMatchObject({
      version: 2,
      data: {
        appUsageSessions: [],
        activityEvents: [],
        cardInteractions: [],
        cardLearningStates: [],
      },
    });
  });

  it("rechaza intentos cuya pasada pertenece a otra sesión", () => {
    const backup = validBackup();
    backup.data.studySessions.push({
      ...backup.data.studySessions[0],
      id: "session-2",
      currentPassId: undefined,
    });
    backup.data.cardAttempts[0].sessionId = "session-2";

    expect(() => validateBackup(backup)).toThrow(
      "intentos con referencias inválidas",
    );
  });

  it("rechaza temas sin curso", () => {
    const backup = validBackup();
    backup.data.topics[0].courseId = "missing";

    expect(() => validateBackup(backup)).toThrow(
      "temas sin un curso válido",
    );
  });
});
