import { telemetryRepository } from "../../db/repositories/telemetryRepository";
import type { AttemptResult, StudyMode } from "../../types/study";
import type {
  ActivityEventType,
  AppUsageSession,
  AttemptTelemetry,
  CardInteraction,
  TelemetryValue,
} from "../../types/telemetry";

type StudyEventInput = {
  type: ActivityEventType;
  route?: string;
  courseId?: string;
  topicId?: string;
  studySessionId?: string;
  cardId?: string;
  data?: Record<string, TelemetryValue>;
};

type CardPresentationInput = {
  studySessionId: string;
  passId: string;
  cardId: string;
  mode: StudyMode;
  passNumber: number;
  presentationNumber: number;
  resumed?: boolean;
};

class TelemetryService {
  private appSession?: AppUsageSession;
  private startPromise?: Promise<void>;
  private activeSince = Date.now();
  private backgroundSince?: number;
  private currentInteraction?: CardInteraction;
  private interactionPromise?: Promise<CardInteraction | undefined>;
  private lastRoute?: string;

  start(entryRoute: string): Promise<void> {
    if (this.appSession) {
      return Promise.resolve();
    }
    if (this.startPromise) {
      return this.startPromise;
    }
    this.activeSince = Date.now();
    this.startPromise = telemetryRepository
      .startAppSession(entryRoute)
      .then(async (session) => {
        this.appSession = session;
        this.lastRoute = entryRoute;
        await telemetryRepository.recordEvent({
          appSessionId: session.id,
          type: "app_open",
          route: entryRoute,
        });
      })
      .catch(() => undefined)
      .finally(() => {
        this.startPromise = undefined;
      });
    return this.startPromise;
  }

  async stop(exitRoute: string): Promise<void> {
    await this.startPromise;
    const session = this.appSession;
    if (!session || session.closedAt) {
      return;
    }
    const timestamp = Date.now();
    this.flushElapsedTime(timestamp);
    session.closedAt = new Date(timestamp).toISOString();
    session.exitRoute = exitRoute;
    await this.ignoreErrors(
      telemetryRepository.updateAppSession(session.id, {
        ...session,
      }),
    );
    await this.ignoreErrors(
      telemetryRepository.recordEvent({
        appSessionId: session.id,
        type: "app_close",
        route: exitRoute,
        data: {
          activeDurationMs: session.activeDurationMs,
          backgroundDurationMs: session.backgroundDurationMs,
        },
      }),
    );
  }

  async setBackgrounded(backgrounded: boolean, route: string): Promise<void> {
    await this.startPromise;
    const session = this.appSession;
    if (!session) {
      return;
    }
    const timestamp = Date.now();
    if (backgrounded) {
      if (this.backgroundSince !== undefined) {
        return;
      }
      session.activeDurationMs += Math.max(0, timestamp - this.activeSince);
      session.lastActiveAt = new Date(timestamp).toISOString();
      this.backgroundSince = timestamp;
      await this.persistSession();
      await this.record({ type: "app_background", route });
      return;
    }
    if (this.backgroundSince === undefined) {
      return;
    }
    session.backgroundDurationMs += Math.max(
      0,
      timestamp - this.backgroundSince,
    );
    session.foregroundCount += 1;
    this.backgroundSince = undefined;
    this.activeSince = timestamp;
    await this.persistSession();
    await this.record({ type: "app_foreground", route });
  }

  async recordRouteView(route: string): Promise<void> {
    await this.startPromise;
    const session = this.appSession;
    if (!session || route === this.lastRoute) {
      return;
    }
    this.lastRoute = route;
    session.routeChangeCount += 1;
    session.lastActiveAt = new Date().toISOString();
    await this.persistSession();
    if (this.currentInteraction) {
      const updated = await this.ignoreErrors(
        telemetryRepository.incrementInteractionRouteChanges(
          this.currentInteraction.id,
        ),
      );
      this.currentInteraction = updated ?? this.currentInteraction;
    }
    await this.record({ type: "route_view", route });
  }

  async recordStudyEvent(input: StudyEventInput): Promise<void> {
    await this.startPromise;
    await this.record(input);
  }

  async presentCard(input: CardPresentationInput): Promise<void> {
    await this.startPromise;
    if (
      this.currentInteraction?.studySessionId === input.studySessionId &&
      this.currentInteraction.cardId === input.cardId &&
      !this.currentInteraction.answeredAt
    ) {
      return;
    }
    this.interactionPromise = telemetryRepository
      .beginCardInteraction({
        ...input,
        resumed: input.resumed ?? false,
        appSessionId: this.appSession?.id,
      })
      .then((interaction) => {
        this.currentInteraction = interaction;
        return interaction;
      })
      .catch(() => undefined)
      .finally(() => {
        this.interactionPromise = undefined;
      });
    await this.interactionPromise;
  }

  async revealCard(): Promise<void> {
    await this.interactionPromise;
    const interaction = this.currentInteraction;
    if (!interaction || interaction.answeredAt || interaction.revealedAt) {
      return;
    }
    const updated = await this.ignoreErrors(
      telemetryRepository.revealCard(interaction.id),
    );
    this.currentInteraction = updated ?? interaction;
    await this.record({
      type: "answer_revealed",
      studySessionId: interaction.studySessionId,
      cardId: interaction.cardId,
      data: {
        mode: interaction.mode,
        passNumber: interaction.passNumber,
      },
    });
  }

  async getAttemptTelemetry(): Promise<AttemptTelemetry> {
    await this.interactionPromise;
    const interaction = this.currentInteraction;
    if (!interaction) {
      return { appSessionId: this.appSession?.id };
    }
    const now = Date.now();
    return {
      presentedAt: interaction.presentedAt,
      revealedAt: interaction.revealedAt,
      timeToRevealMs: interaction.timeToRevealMs,
      answerViewingMs: interaction.revealedAt
        ? Math.max(0, now - new Date(interaction.revealedAt).getTime())
        : undefined,
      responseTimeMs: Math.max(
        0,
        now - new Date(interaction.presentedAt).getTime(),
      ),
      appSessionId: this.appSession?.id,
      interactionId: interaction.id,
    };
  }

  async completeCard(result: AttemptResult, attemptId: string): Promise<void> {
    await this.interactionPromise;
    const interaction = this.currentInteraction;
    if (!interaction) {
      return;
    }
    const completed = await this.ignoreErrors(
      telemetryRepository.completeCardInteraction(
        interaction.id,
        result,
        attemptId,
      ),
    );
    await this.record({
      type: "card_answered",
      studySessionId: interaction.studySessionId,
      cardId: interaction.cardId,
      data: {
        result,
        mode: interaction.mode,
        passNumber: interaction.passNumber,
        responseTimeMs:
          completed?.totalResponseMs ??
          Math.max(0, Date.now() - new Date(interaction.presentedAt).getTime()),
      },
    });
    this.currentInteraction = undefined;
  }

  private async record(input: StudyEventInput): Promise<void> {
    const appSessionId = this.appSession?.id;
    if (!appSessionId) {
      return;
    }
    await this.ignoreErrors(
      telemetryRepository.recordEvent({ appSessionId, ...input }),
    );
  }

  private flushElapsedTime(timestamp: number): void {
    const session = this.appSession;
    if (!session) {
      return;
    }
    if (this.backgroundSince === undefined) {
      session.activeDurationMs += Math.max(0, timestamp - this.activeSince);
      this.activeSince = timestamp;
    } else {
      session.backgroundDurationMs += Math.max(
        0,
        timestamp - this.backgroundSince,
      );
      this.backgroundSince = timestamp;
    }
    session.lastActiveAt = new Date(timestamp).toISOString();
  }

  private async persistSession(): Promise<void> {
    if (!this.appSession) {
      return;
    }
    await this.ignoreErrors(
      telemetryRepository.updateAppSession(this.appSession.id, {
        ...this.appSession,
      }),
    );
  }

  private async ignoreErrors<T>(
    operation: Promise<T>,
  ): Promise<T | undefined> {
    try {
      return await operation;
    } catch {
      return undefined;
    }
  }
}

export const telemetryService = new TelemetryService();
