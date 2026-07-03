import type { FlashStudyDatabase } from "../db";
import { db } from "../db";
import type { AttemptResult, StudyMode } from "../../types/study";
import type {
  ActivityEvent,
  AppUsageSession,
  CardInteraction,
  CardLearningState,
  TelemetryValue,
} from "../../types/telemetry";
import { nowIso } from "../../utils/dates";
import { createId } from "../../utils/ids";

const dayMs = 86_400_000;

function nextInterval(
  current: CardLearningState | undefined,
  result: AttemptResult,
): { intervalDays: number; easeFactor: number } {
  const ease = current?.easeFactor ?? 2.5;
  if (result === "incorrect") {
    return { intervalDays: 1, easeFactor: Math.max(1.3, ease - 0.2) };
  }
  const streak = (current?.correctStreak ?? 0) + 1;
  const intervalDays =
    streak === 1
      ? 1
      : streak === 2
        ? 3
        : Math.max(4, Math.round((current?.intervalDays ?? 3) * ease));
  return { intervalDays, easeFactor: Math.min(3, ease + 0.05) };
}

export class TelemetryRepository {
  constructor(private readonly database: FlashStudyDatabase = db) {}

  async startAppSession(entryRoute: string): Promise<AppUsageSession> {
    const timestamp = nowIso();
    const session: AppUsageSession = {
      id: createId("app-session"),
      openedAt: timestamp,
      lastActiveAt: timestamp,
      activeDurationMs: 0,
      backgroundDurationMs: 0,
      foregroundCount: 1,
      routeChangeCount: 0,
      entryRoute,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language:
        typeof navigator === "undefined" ? "unknown" : navigator.language,
      platform:
        typeof navigator === "undefined"
          ? "unknown"
          : navigator.platform || navigator.userAgent,
      screenWidth: typeof screen === "undefined" ? undefined : screen.width,
      screenHeight: typeof screen === "undefined" ? undefined : screen.height,
    };
    await this.database.appUsageSessions.add(session);
    return session;
  }

  updateAppSession(
    id: string,
    changes: Partial<AppUsageSession>,
  ): Promise<number> {
    return this.database.appUsageSessions.update(id, changes);
  }

  async recordEvent(input: {
    appSessionId: string;
    type: ActivityEvent["type"];
    route?: string;
    courseId?: string;
    topicId?: string;
    studySessionId?: string;
    cardId?: string;
    data?: Record<string, TelemetryValue>;
  }): Promise<ActivityEvent> {
    const event: ActivityEvent = {
      id: createId("event"),
      occurredAt: nowIso(),
      ...input,
    };
    await this.database.activityEvents.add(event);
    return event;
  }

  async beginCardInteraction(input: {
    appSessionId?: string;
    studySessionId: string;
    passId: string;
    cardId: string;
    mode: StudyMode;
    passNumber: number;
    presentationNumber: number;
    resumed: boolean;
  }): Promise<CardInteraction> {
    const existing = await this.database.cardInteractions
      .where("[studySessionId+cardId]")
      .equals([input.studySessionId, input.cardId])
      .filter((interaction) => !interaction.answeredAt)
      .last();
    if (existing) {
      return existing;
    }

    const interaction: CardInteraction = {
      id: createId("interaction"),
      presentedAt: nowIso(),
      revealCount: 0,
      routeChanges: 0,
      ...input,
    };
    await this.database.cardInteractions.add(interaction);
    return interaction;
  }

  async revealCard(interactionId: string): Promise<CardInteraction | undefined> {
    const interaction = await this.database.cardInteractions.get(interactionId);
    if (!interaction || interaction.answeredAt) {
      return interaction;
    }
    const revealedAt = interaction.revealedAt ?? nowIso();
    const updated = {
      ...interaction,
      revealedAt,
      revealCount: interaction.revealCount + 1,
      timeToRevealMs:
        new Date(revealedAt).getTime() -
        new Date(interaction.presentedAt).getTime(),
    };
    await this.database.cardInteractions.put(updated);
    return updated;
  }

  async incrementInteractionRouteChanges(
    interactionId: string,
  ): Promise<CardInteraction | undefined> {
    const interaction = await this.database.cardInteractions.get(interactionId);
    if (!interaction || interaction.answeredAt) {
      return interaction;
    }
    const updated = {
      ...interaction,
      routeChanges: interaction.routeChanges + 1,
    };
    await this.database.cardInteractions.put(updated);
    return updated;
  }

  async completeCardInteraction(
    interactionId: string,
    result: AttemptResult,
    attemptId: string,
  ): Promise<CardInteraction | undefined> {
    let completed: CardInteraction | undefined;
    await this.database.transaction(
      "rw",
      [this.database.cardInteractions, this.database.cardLearningStates],
      async () => {
        const interaction =
          await this.database.cardInteractions.get(interactionId);
        if (!interaction || interaction.answeredAt) {
          completed = interaction;
          return;
        }
        const answeredAt = nowIso();
        const answeredTime = new Date(answeredAt).getTime();
        const totalResponseMs = Math.max(
          0,
          answeredTime - new Date(interaction.presentedAt).getTime(),
        );
        const answerViewingMs = interaction.revealedAt
          ? Math.max(0, answeredTime - new Date(interaction.revealedAt).getTime())
          : undefined;
        completed = {
          ...interaction,
          answeredAt,
          result,
          attemptId,
          totalResponseMs,
          answerViewingMs,
        };
        await this.database.cardInteractions.put(completed);
        await this.updateLearningState(completed);
      },
    );
    return completed;
  }

  private async updateLearningState(
    interaction: CardInteraction,
  ): Promise<void> {
    if (!interaction.result || !interaction.answeredAt) {
      return;
    }
    const previous = await this.database.cardLearningStates.get(
      interaction.cardId,
    );
    const responseMs = interaction.totalResponseMs ?? 0;
    const previousReviews = previous?.totalReviews ?? 0;
    const previousLast = previous?.lastStudiedAt;
    const reviewGapHours = previousLast
      ? Math.max(
          0,
          (new Date(interaction.answeredAt).getTime() -
            new Date(previousLast).getTime()) /
            3_600_000,
        )
      : undefined;
    const interval = nextInterval(previous, interaction.result);
    const correct = interaction.result === "correct";
    const correctCount =
      (previous?.correctResponseCount ?? 0) + (correct ? 1 : 0);
    const incorrectCount =
      (previous?.incorrectResponseCount ?? 0) + (correct ? 0 : 1);
    const correctMs =
      (previous?.correctResponseMs ?? 0) + (correct ? responseMs : 0);
    const incorrectMs =
      (previous?.incorrectResponseMs ?? 0) + (correct ? 0 : responseMs);
    const gapCount =
      (previous?.reviewGapCount ?? 0) +
      (reviewGapHours === undefined ? 0 : 1);
    const totalGap =
      (previous?.totalReviewGapHours ?? 0) + (reviewGapHours ?? 0);
    const correctStreak = correct ? (previous?.correctStreak ?? 0) + 1 : 0;
    const state: CardLearningState = {
      cardId: interaction.cardId,
      firstStudiedAt: previous?.firstStudiedAt ?? interaction.answeredAt,
      lastStudiedAt: interaction.answeredAt,
      lastCorrectAt: correct
        ? interaction.answeredAt
        : previous?.lastCorrectAt,
      lastIncorrectAt: correct
        ? previous?.lastIncorrectAt
        : interaction.answeredAt,
      nextReviewAt: new Date(
        new Date(interaction.answeredAt).getTime() +
          interval.intervalDays * dayMs,
      ).toISOString(),
      intervalDays: interval.intervalDays,
      easeFactor: interval.easeFactor,
      correctStreak,
      longestCorrectStreak: Math.max(
        previous?.longestCorrectStreak ?? 0,
        correctStreak,
      ),
      lapseCount: (previous?.lapseCount ?? 0) + (correct ? 0 : 1),
      totalReviews: previousReviews + 1,
      totalResponseMs: (previous?.totalResponseMs ?? 0) + responseMs,
      averageResponseMs:
        ((previous?.totalResponseMs ?? 0) + responseMs) /
        (previousReviews + 1),
      averageCorrectResponseMs:
        correctCount === 0 ? 0 : correctMs / correctCount,
      averageIncorrectResponseMs:
        incorrectCount === 0 ? 0 : incorrectMs / incorrectCount,
      correctResponseMs: correctMs,
      incorrectResponseMs: incorrectMs,
      correctResponseCount: correctCount,
      incorrectResponseCount: incorrectCount,
      lastReviewGapHours: reviewGapHours,
      averageReviewGapHours: gapCount === 0 ? undefined : totalGap / gapCount,
      totalReviewGapHours: totalGap,
      reviewGapCount: gapCount,
      updatedAt: interaction.answeredAt,
    };
    await this.database.cardLearningStates.put(state);
  }
}

export const telemetryRepository = new TelemetryRepository();
