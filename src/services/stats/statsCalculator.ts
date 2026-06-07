import type { Course } from "../../types/course";
import type { Flashcard } from "../../types/flashcard";
import type {
  BestSessionStats,
  CardStats,
  CardStudyStats,
  CourseStudyStats,
  GlobalStudyStats,
  StatsDashboard,
  StatsPeriod,
  TopicStudyStats,
} from "../../types/stats";
import type {
  CardAttempt,
  StudyPass,
  StudySession,
} from "../../types/study";
import type { Topic } from "../../types/topic";

export type StatsCalculatorInput = {
  courses: Course[];
  topics: Topic[];
  cards: Flashcard[];
  cardStats: CardStats[];
  sessions: StudySession[];
  passes: StudyPass[];
  attempts: CardAttempt[];
};

function percentage(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : Math.round((numerator / denominator) * 100);
}

function average(values: number[], decimals = 1): number {
  if (values.length === 0) {
    return 0;
  }
  const factor = 10 ** decimals;
  return Math.round(
    (values.reduce((sum, value) => sum + value, 0) / values.length) *
      factor,
  ) / factor;
}

function cutoffForPeriod(
  period: StatsPeriod,
  now: Date,
): number | undefined {
  if (period === "all") {
    return undefined;
  }
  const days = period === "30d" ? 30 : 90;
  return now.getTime() - days * 86_400_000;
}

function isWithinPeriod(
  value: string | undefined,
  cutoff: number | undefined,
): boolean {
  if (!value) {
    return false;
  }
  return cutoff === undefined || new Date(value).getTime() >= cutoff;
}

function latestDate(values: Array<string | undefined>): string | undefined {
  return values
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => right.localeCompare(left))[0];
}

function cardMastery(
  cardIds: string[],
  statsByCardId: Map<string, CardStats>,
): number {
  if (cardIds.length === 0) {
    return 0;
  }
  const total = cardIds.reduce((sum, cardId) => {
    const stats = statsByCardId.get(cardId);
    return stats && stats.seenCount > 0
      ? sum + stats.correctCount / stats.seenCount
      : sum;
  }, 0);
  return Math.round((total / cardIds.length) * 100);
}

function sessionScore(
  session: StudySession,
  passesBySession: Map<string, StudyPass[]>,
): number {
  const passes = passesBySession.get(session.id) ?? [];
  const firstPass = passes.find((pass) => pass.passNumber === 1);
  return firstPass
    ? percentage(firstPass.correctCount, firstPass.totalCards)
    : 0;
}

function bestSession(
  sessions: StudySession[],
  passesBySession: Map<string, StudyPass[]>,
): BestSessionStats | undefined {
  return sessions
    .map((session) => ({
      sessionId: session.id,
      mode: session.mode,
      score: sessionScore(session, passesBySession),
      totalPasses: session.totalPasses,
      finishedAt: session.finishedAt!,
    }))
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.totalPasses - right.totalPasses ||
        right.finishedAt.localeCompare(left.finishedAt),
    )[0];
}

export function calculateStatsDashboard(
  input: StatsCalculatorInput,
  period: StatsPeriod,
  now = new Date(),
): StatsDashboard {
  const cutoff = cutoffForPeriod(period, now);
  const activeCards = input.cards.filter((card) => card.isActive);
  const activeCardIds = new Set(activeCards.map((card) => card.id));
  const periodStats = input.cardStats.filter(
    (stats) =>
      activeCardIds.has(stats.cardId) &&
      stats.seenCount > 0 &&
      isWithinPeriod(stats.lastStudiedAt, cutoff),
  );
  const statsByCardId = new Map(
    periodStats.map((stats) => [stats.cardId, stats]),
  );
  const completedSessions = input.sessions.filter(
    (session) =>
      Boolean(session.finishedAt) &&
      !session.abandonedAt &&
      isWithinPeriod(session.finishedAt, cutoff),
  );
  const completedSessionIds = new Set(
    completedSessions.map((session) => session.id),
  );
  const periodPasses = input.passes.filter((pass) =>
    completedSessionIds.has(pass.sessionId),
  );
  const periodAttempts = input.attempts.filter((attempt) =>
    completedSessionIds.has(attempt.sessionId),
  );
  const passesBySession = new Map<string, StudyPass[]>();
  for (const pass of periodPasses) {
    const values = passesBySession.get(pass.sessionId) ?? [];
    values.push(pass);
    passesBySession.set(pass.sessionId, values);
  }
  const reviewSessions = completedSessions.filter(
    (session) => session.mode === "review",
  );
  const examSessions = completedSessions.filter(
    (session) => session.mode === "exam",
  );
  const firstPasses = reviewSessions
    .map((session) =>
      (passesBySession.get(session.id) ?? []).find(
        (pass) => pass.passNumber === 1,
      ),
    )
    .filter((pass): pass is StudyPass => Boolean(pass));
  const firstPassCorrect = firstPasses.reduce(
    (sum, pass) => sum + pass.correctCount,
    0,
  );
  const firstPassTotal = firstPasses.reduce(
    (sum, pass) => sum + pass.totalCards,
    0,
  );
  const examSessionIds = new Set(examSessions.map((session) => session.id));
  const examAttempts = periodAttempts.filter((attempt) =>
    examSessionIds.has(attempt.sessionId),
  );
  const examCorrect = examAttempts.filter(
    (attempt) => attempt.result === "correct",
  ).length;

  const global: GlobalStudyStats = {
    studiedCards: periodStats.length,
    studyEvents: periodStats.reduce(
      (sum, stats) => sum + stats.seenCount,
      0,
    ),
    sessions: reviewSessions.length,
    mastery: cardMastery(
      activeCards.map((card) => card.id),
      statsByCardId,
    ),
    firstPassAccuracy: percentage(firstPassCorrect, firstPassTotal),
    averagePasses: average(
      reviewSessions.map((session) => session.totalPasses),
    ),
    firstPassCards: firstPassCorrect,
    multiPassCards: firstPasses.reduce(
      (sum, pass) => sum + pass.incorrectCount,
      0,
    ),
    performance: reviewSessions
      .map((session) => ({
        sessionId: session.id,
        date: session.finishedAt!,
        score: sessionScore(session, passesBySession),
      }))
      .sort((left, right) => left.date.localeCompare(right.date))
      .slice(-8),
    exam: {
      sessions: examSessions.length,
      answeredCards: examAttempts.length,
      accuracy: percentage(examCorrect, examAttempts.length),
    },
  };

  const topicById = new Map(input.topics.map((topic) => [topic.id, topic]));
  const courseById = new Map(
    input.courses.map((course) => [course.id, course]),
  );
  const cardsByTopic = new Map<string, Flashcard[]>();
  for (const card of activeCards) {
    const values = cardsByTopic.get(card.topicId) ?? [];
    values.push(card);
    cardsByTopic.set(card.topicId, values);
  }
  const sessionsByTopic = new Map<string, StudySession[]>();
  for (const session of completedSessions) {
    const values = sessionsByTopic.get(session.topicId) ?? [];
    values.push(session);
    sessionsByTopic.set(session.topicId, values);
  }

  const topics: TopicStudyStats[] = input.topics.map((topic) => {
    const topicCards = cardsByTopic.get(topic.id) ?? [];
    const topicStats = topicCards
      .map((card) => statsByCardId.get(card.id))
      .filter((stats): stats is CardStats => Boolean(stats));
    const topicSessions = sessionsByTopic.get(topic.id) ?? [];
    const reviewTopicSessions = topicSessions.filter(
      (session) => session.mode === "review",
    );

    return {
      topicId: topic.id,
      courseId: topic.courseId,
      courseName: courseById.get(topic.courseId)?.name ?? "Curso",
      title: topic.title,
      unit: topic.unit,
      cardCount: topicCards.length,
      categoryCount: new Set(topicCards.map((card) => card.category)).size,
      sessions: reviewTopicSessions.length,
      mastery: cardMastery(
        topicCards.map((card) => card.id),
        statsByCardId,
      ),
      correctCount: topicStats.reduce(
        (sum, stats) => sum + stats.correctCount,
        0,
      ),
      incorrectCount: topicStats.reduce(
        (sum, stats) => sum + stats.incorrectCount,
        0,
      ),
      averagePasses: average(
        reviewTopicSessions.map((session) => session.totalPasses),
      ),
      bestSession: bestSession(topicSessions, passesBySession),
      lastSessionAt:
        latestDate(topicSessions.map((session) => session.finishedAt)) ??
        latestDate(topicStats.map((stats) => stats.lastStudiedAt)),
      examSessions: topicSessions.filter(
        (session) => session.mode === "exam",
      ).length,
    };
  });

  const courses: CourseStudyStats[] = input.courses.map((course) => {
    const courseTopics = input.topics.filter(
      (topic) => topic.courseId === course.id,
    );
    const topicIds = new Set(courseTopics.map((topic) => topic.id));
    const courseCards = activeCards.filter((card) =>
      topicIds.has(card.topicId),
    );
    const courseStats = courseCards
      .map((card) => statsByCardId.get(card.id))
      .filter((stats): stats is CardStats => Boolean(stats));
    const courseSessions = completedSessions.filter((session) =>
      topicIds.has(session.topicId),
    );
    const reviewCourseSessions = courseSessions.filter(
      (session) => session.mode === "review",
    );
    const correctCount = courseStats.reduce(
      (sum, stats) => sum + stats.correctCount,
      0,
    );
    const seenCount = courseStats.reduce(
      (sum, stats) => sum + stats.seenCount,
      0,
    );

    return {
      courseId: course.id,
      name: course.name,
      topicCount: courseTopics.length,
      cardCount: courseCards.length,
      sessions: reviewCourseSessions.length,
      historicalAccuracy: percentage(correctCount, seenCount),
      mastery: cardMastery(
        courseCards.map((card) => card.id),
        statsByCardId,
      ),
      averagePasses: average(
        reviewCourseSessions.map((session) => session.totalPasses),
      ),
      lastStudiedAt:
        latestDate(courseStats.map((stats) => stats.lastStudiedAt)) ??
        latestDate(courseSessions.map((session) => session.finishedAt)),
      examSessions: courseSessions.filter(
        (session) => session.mode === "exam",
      ).length,
    };
  });

  const cards: CardStudyStats[] = activeCards.map((card) => {
    const stats = statsByCardId.get(card.id);
    return {
      cardId: card.id,
      topicId: card.topicId,
      question: card.question,
      category: card.category,
      seenCount: stats?.seenCount ?? 0,
      correctCount: stats?.correctCount ?? 0,
      incorrectCount: stats?.incorrectCount ?? 0,
      lastStudiedAt: stats?.lastStudiedAt,
      bestPassNumber: stats?.bestPassNumber,
      accuracy: percentage(stats?.correctCount ?? 0, stats?.seenCount ?? 0),
    };
  });

  return {
    period,
    global,
    courses,
    topics,
    cards,
    topicsWithMostErrors: topics
      .filter((topic) => topic.incorrectCount > 0)
      .sort((left, right) => right.incorrectCount - left.incorrectCount)
      .slice(0, 5)
      .map((topic) => ({
        topicId: topic.topicId,
        title: topic.title,
        errorCount: topic.incorrectCount,
      })),
  };
}
