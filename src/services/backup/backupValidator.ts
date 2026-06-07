import type { FlashStudyBackup } from "../../types/backup";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasString(record: UnknownRecord, key: string): boolean {
  return typeof record[key] === "string";
}

function hasNumber(record: UnknownRecord, key: string): boolean {
  return typeof record[key] === "number" && Number.isFinite(record[key]);
}

function hasBoolean(record: UnknownRecord, key: string): boolean {
  return typeof record[key] === "boolean";
}

function isArrayOf(
  value: unknown,
  validator: (item: unknown) => boolean,
): boolean {
  return Array.isArray(value) && value.every(validator);
}

function isCourse(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasString(value, "id") &&
    hasString(value, "name") &&
    hasString(value, "createdAt") &&
    hasString(value, "updatedAt") &&
    hasNumber(value, "order")
  );
}

function isTopic(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasString(value, "id") &&
    hasString(value, "courseId") &&
    hasString(value, "fileName") &&
    hasString(value, "unit") &&
    hasString(value, "title") &&
    hasNumber(value, "order") &&
    hasString(value, "createdAt") &&
    hasString(value, "updatedAt") &&
    hasString(value, "sourceHash")
  );
}

function isFlashcard(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasString(value, "id") &&
    hasString(value, "topicId") &&
    hasString(value, "category") &&
    hasString(value, "question") &&
    hasString(value, "answer") &&
    hasNumber(value, "order") &&
    hasBoolean(value, "isActive") &&
    hasString(value, "createdAt") &&
    hasString(value, "updatedAt")
  );
}

function isStudySession(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasString(value, "id") &&
    hasString(value, "topicId") &&
    (value.mode === "review" || value.mode === "exam") &&
    hasString(value, "startedAt") &&
    hasNumber(value, "totalCards") &&
    hasNumber(value, "totalPasses") &&
    hasBoolean(value, "shuffle")
  );
}

function isStudyPass(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasString(value, "id") &&
    hasString(value, "sessionId") &&
    hasNumber(value, "passNumber") &&
    hasNumber(value, "totalCards") &&
    hasNumber(value, "correctCount") &&
    hasNumber(value, "incorrectCount")
  );
}

function isCardAttempt(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasString(value, "id") &&
    hasString(value, "sessionId") &&
    hasString(value, "passId") &&
    hasString(value, "cardId") &&
    (value.result === "correct" || value.result === "incorrect") &&
    hasString(value, "answeredAt")
  );
}

function isCardStats(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasString(value, "cardId") &&
    hasNumber(value, "seenCount") &&
    hasNumber(value, "correctCount") &&
    hasNumber(value, "incorrectCount")
  );
}

function isSettings(value: unknown): boolean {
  return (
    isRecord(value) &&
    value.key === "app" &&
    (value.theme === "system" ||
      value.theme === "light" ||
      value.theme === "dark") &&
    (value.defaultStudyOrder === "normal" ||
      value.defaultStudyOrder === "random") &&
    hasBoolean(value, "flipCardOnTap") &&
    hasNumber(value, "seedVersion") &&
    hasString(value, "updatedAt")
  );
}

function assertUniqueIds(
  values: unknown[],
  label: string,
  key = "id",
): void {
  const ids = values.map((value) => (value as UnknownRecord)[key]);
  if (new Set(ids).size !== ids.length) {
    throw new Error(`El respaldo contiene ${label} duplicados.`);
  }
}

export function validateBackup(value: unknown): FlashStudyBackup {
  if (
    !isRecord(value) ||
    value.format !== "flashstudy-backup" ||
    value.version !== 1 ||
    !hasString(value, "exportedAt") ||
    !isRecord(value.data)
  ) {
    throw new Error("El archivo no es un respaldo compatible de FlashStudy.");
  }

  const data = value.data;
  const valid =
    isArrayOf(data.courses, isCourse) &&
    isArrayOf(data.topics, isTopic) &&
    isArrayOf(data.flashcards, isFlashcard) &&
    isArrayOf(data.studySessions, isStudySession) &&
    isArrayOf(data.studyPasses, isStudyPass) &&
    isArrayOf(data.cardAttempts, isCardAttempt) &&
    isArrayOf(data.cardStats, isCardStats) &&
    isArrayOf(data.settings, isSettings);

  if (!valid) {
    throw new Error("El respaldo contiene tablas o registros inválidos.");
  }

  const backup = value as FlashStudyBackup;
  assertUniqueIds(backup.data.courses, "cursos");
  assertUniqueIds(backup.data.topics, "temas");
  assertUniqueIds(backup.data.flashcards, "tarjetas");
  assertUniqueIds(backup.data.studySessions, "sesiones");
  assertUniqueIds(backup.data.studyPasses, "pasadas");
  assertUniqueIds(backup.data.cardAttempts, "intentos");
  assertUniqueIds(backup.data.cardStats, "estadísticas de tarjeta", "cardId");

  const courseIds = new Set(backup.data.courses.map((course) => course.id));
  const topicIds = new Set(backup.data.topics.map((topic) => topic.id));
  const cardIds = new Set(backup.data.flashcards.map((card) => card.id));
  const sessionIds = new Set(
    backup.data.studySessions.map((session) => session.id),
  );
  const passIds = new Set(backup.data.studyPasses.map((pass) => pass.id));
  const passSessionIds = new Map(
    backup.data.studyPasses.map((pass) => [pass.id, pass.sessionId]),
  );

  if (backup.data.topics.some((topic) => !courseIds.has(topic.courseId))) {
    throw new Error("El respaldo contiene temas sin un curso válido.");
  }
  if (backup.data.flashcards.some((card) => !topicIds.has(card.topicId))) {
    throw new Error("El respaldo contiene tarjetas sin un tema válido.");
  }
  if (
    backup.data.studySessions.some(
      (session) => !topicIds.has(session.topicId),
    )
  ) {
    throw new Error("El respaldo contiene sesiones sin un tema válido.");
  }
  if (
    backup.data.studyPasses.some(
      (pass) => !sessionIds.has(pass.sessionId),
    )
  ) {
    throw new Error("El respaldo contiene pasadas sin una sesión válida.");
  }
  if (
    backup.data.cardAttempts.some(
      (attempt) =>
        !sessionIds.has(attempt.sessionId) ||
        !passIds.has(attempt.passId) ||
        passSessionIds.get(attempt.passId) !== attempt.sessionId ||
        !cardIds.has(attempt.cardId),
    )
  ) {
    throw new Error("El respaldo contiene intentos con referencias inválidas.");
  }
  if (
    backup.data.cardStats.some((stats) => !cardIds.has(stats.cardId))
  ) {
    throw new Error(
      "El respaldo contiene estadísticas de tarjetas inexistentes.",
    );
  }
  if (backup.data.settings.length !== 1) {
    throw new Error("El respaldo debe contener una configuración de aplicación.");
  }
  if (
    backup.data.studySessions.some(
      (session) =>
        session.currentPassId &&
        passSessionIds.get(session.currentPassId) !== session.id,
    )
  ) {
    throw new Error(
      "El respaldo contiene sesiones con una pasada actual inválida.",
    );
  }

  return backup;
}
