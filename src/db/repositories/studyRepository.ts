import Dexie from "dexie";
import type { FlashStudyDatabase } from "../db";
import { db } from "../db";
import type { Flashcard } from "../../types/flashcard";
import type { CardStats } from "../../types/stats";
import type {
  AttemptResult,
  CardAttempt,
  StartStudySessionInput,
  StudyAnswerOutcome,
  StudyPass,
  StudySession,
} from "../../types/study";
import {
  answerCurrentCard,
  createInitialPass,
  createNextPass,
  type StudyPassState,
} from "../../services/study/studyEngine";
import { nowIso } from "../../utils/dates";
import { createId } from "../../utils/ids";

export type StudySessionSnapshot = {
  session: StudySession;
  pass: StudyPass;
  currentCard?: Flashcard;
  currentPassCards: Flashcard[];
  incorrectCards: Flashcard[];
};

export type StudySessionHistory = {
  session: StudySession;
  passes: StudyPass[];
  attempts: CardAttempt[];
  cards: Flashcard[];
};

function stateFromSession(session: StudySession): StudyPassState {
  if (
    !session.selectedCardIds ||
    !session.currentCardIds ||
    session.currentCardIndex === undefined ||
    session.currentPassNumber === undefined
  ) {
    throw new Error("La sesión guardada no contiene un estado reanudable.");
  }

  return {
    selectedCardIds: session.selectedCardIds,
    currentCardIds: session.currentCardIds,
    currentCardIndex: session.currentCardIndex,
    incorrectCardIds: session.currentIncorrectCardIds ?? [],
    passNumber: session.currentPassNumber,
    shuffle: session.shuffle,
  };
}

function applyState(
  session: StudySession,
  state: StudyPassState,
): StudySession {
  return {
    ...session,
    selectedCardIds: state.selectedCardIds,
    currentCardIds: state.currentCardIds,
    currentCardIndex: state.currentCardIndex,
    currentPassNumber: state.passNumber,
    currentIncorrectCardIds: state.incorrectCardIds,
  };
}

export class StudyRepository {
  constructor(private readonly database: FlashStudyDatabase = db) {}

  async prepareSession(
    input: StartStudySessionInput,
    forceNew = false,
  ): Promise<StudySessionSnapshot> {
    const active = forceNew
      ? undefined
      : await this.findActiveSession(input.topicId, input.mode);

    if (active) {
      try {
        return await this.getSnapshot(active.id);
      } catch {
        await this.abandonSession(active.id);
      }
    }

    return this.startSession(input);
  }

  async startSession(
    input: StartStudySessionInput,
  ): Promise<StudySessionSnapshot> {
    const timestamp = nowIso();
    const sessionId = createId("session");
    const passId = createId("pass");

    await this.database.transaction(
      "rw",
      [
        this.database.flashcards,
        this.database.studySessions,
        this.database.studyPasses,
      ],
      async () => {
        const cards = (
          await this.database.flashcards
            .where("topicId")
            .equals(input.topicId)
            .filter(
              (card) =>
                card.isActive &&
                (!input.category || card.category === input.category),
            )
            .toArray()
        ).sort((left, right) => left.order - right.order);
        const state = createInitialPass(
          cards.map((card) => card.id),
          input.shuffle,
        );

        await this.abandonActiveSessions(input.topicId, input.mode, timestamp);

        const session: StudySession = applyState(
          {
            id: sessionId,
            topicId: input.topicId,
            mode: input.mode,
            startedAt: timestamp,
            totalCards: cards.length,
            totalPasses: 1,
            shuffle: input.shuffle,
            selectedCategory: input.category,
            currentPassId: passId,
          },
          state,
        );
        const pass: StudyPass = {
          id: passId,
          sessionId,
          passNumber: 1,
          totalCards: cards.length,
          correctCount: 0,
          incorrectCount: 0,
          startedAt: timestamp,
        };

        await this.database.studySessions.add(session);
        await this.database.studyPasses.add(pass);
      },
    );

    return this.getSnapshot(sessionId);
  }

  async getSnapshot(sessionId: string): Promise<StudySessionSnapshot> {
    const session = await this.getSession(sessionId);
    if (!session?.currentPassId) {
      throw new Error("No se encontró la sesión de estudio.");
    }
    const pass = await this.database.studyPasses.get(session.currentPassId);
    if (!pass) {
      throw new Error("No se encontró la pasada actual.");
    }

    const currentCardIds = session.currentCardIds ?? [];
    const currentPassCards = (
      await this.database.flashcards.bulkGet(currentCardIds)
    ).filter((card): card is Flashcard => Boolean(card));
    const cardsById = new Map(
      currentPassCards.map((card) => [card.id, card]),
    );
    const incorrectCards = (session.currentIncorrectCardIds ?? [])
      .map((cardId) => cardsById.get(cardId))
      .filter((card): card is Flashcard => Boolean(card));

    return {
      session,
      pass,
      currentCard:
        currentPassCards[session.currentCardIndex ?? 0],
      currentPassCards,
      incorrectCards,
    };
  }

  async recordAnswer(
    sessionId: string,
    result: AttemptResult,
  ): Promise<StudyAnswerOutcome> {
    let outcome: StudyAnswerOutcome | undefined;

    await this.database.transaction(
      "rw",
      [
        this.database.studySessions,
        this.database.studyPasses,
        this.database.cardAttempts,
        this.database.cardStats,
      ],
      async () => {
        const session = await this.database.studySessions.get(sessionId);
        if (!session?.currentPassId || session.finishedAt || session.abandonedAt) {
          throw new Error("La sesión ya no está activa.");
        }
        const pass = await this.database.studyPasses.get(session.currentPassId);
        if (!pass) {
          throw new Error("No se encontró la pasada actual.");
        }

        const state = stateFromSession(session);
        const cardId = state.currentCardIds[state.currentCardIndex];
        if (!cardId) {
          throw new Error("La pasada actual ya terminó.");
        }

        const timestamp = nowIso();
        const step = answerCurrentCard(state, result);
        const passCompleted = step.passCompleted;
        const sessionCompleted =
          passCompleted &&
          (session.mode === "exam" || step.sessionCompleted);
        const attempt: CardAttempt = {
          id: createId("attempt"),
          sessionId,
          passId: pass.id,
          cardId,
          result,
          answeredAt: timestamp,
        };
        const currentStats = await this.database.cardStats.get(cardId);
        const stats: CardStats = {
          cardId,
          seenCount: (currentStats?.seenCount ?? 0) + 1,
          correctCount:
            (currentStats?.correctCount ?? 0) + (result === "correct" ? 1 : 0),
          incorrectCount:
            (currentStats?.incorrectCount ?? 0) +
            (result === "incorrect" ? 1 : 0),
          lastStudiedAt: timestamp,
          bestPassNumber:
            result === "correct"
              ? Math.min(
                  currentStats?.bestPassNumber ?? state.passNumber,
                  state.passNumber,
                )
              : currentStats?.bestPassNumber,
        };
        const updatedPass: StudyPass = {
          ...pass,
          correctCount:
            pass.correctCount + (result === "correct" ? 1 : 0),
          incorrectCount:
            pass.incorrectCount + (result === "incorrect" ? 1 : 0),
          finishedAt: passCompleted ? timestamp : undefined,
        };
        const updatedSession: StudySession = {
          ...applyState(session, step.state),
          finishedAt: sessionCompleted ? timestamp : undefined,
        };

        await this.database.cardAttempts.add(attempt);
        await this.database.cardStats.put(stats);
        await this.database.studyPasses.put(updatedPass);
        await this.database.studySessions.put(updatedSession);

        outcome = {
          session: updatedSession,
          pass: updatedPass,
          attempt,
          passCompleted,
          sessionCompleted,
          nextCardId: step.nextCardId,
        };
      },
    );

    if (!outcome) {
      throw new Error("No se pudo guardar la respuesta.");
    }
    return outcome;
  }

  async startNextPass(sessionId: string): Promise<StudySessionSnapshot> {
    await this.database.transaction(
      "rw",
      [this.database.studySessions, this.database.studyPasses],
      async () => {
        const session = await this.database.studySessions.get(sessionId);
        if (!session || session.finishedAt || session.abandonedAt) {
          throw new Error("La sesión ya no está activa.");
        }

        const nextState = createNextPass(stateFromSession(session));
        const timestamp = nowIso();
        const passId = createId("pass");
        const updatedSession: StudySession = {
          ...applyState(session, nextState),
          currentPassId: passId,
          totalPasses: nextState.passNumber,
        };
        const pass: StudyPass = {
          id: passId,
          sessionId,
          passNumber: nextState.passNumber,
          totalCards: nextState.currentCardIds.length,
          correctCount: 0,
          incorrectCount: 0,
          startedAt: timestamp,
        };

        await this.database.studySessions.put(updatedSession);
        await this.database.studyPasses.add(pass);
      },
    );

    return this.getSnapshot(sessionId);
  }

  async finishExam(sessionId: string): Promise<void> {
    const timestamp = nowIso();
    await this.database.transaction(
      "rw",
      [this.database.studySessions, this.database.studyPasses],
      async () => {
        const session = await this.database.studySessions.get(sessionId);
        if (!session || session.mode !== "exam") {
          throw new Error("No se encontró el examen activo.");
        }
        if (session.finishedAt) {
          return;
        }

        await this.database.studySessions.update(sessionId, {
          finishedAt: timestamp,
        });
        if (session.currentPassId) {
          await this.database.studyPasses.update(session.currentPassId, {
            finishedAt: timestamp,
          });
        }
      },
    );
  }

  async abandonSession(sessionId: string): Promise<void> {
    await this.database.studySessions.update(sessionId, {
      abandonedAt: nowIso(),
    });
  }

  async saveSession(session: StudySession): Promise<void> {
    await this.database.studySessions.put(session);
  }

  async getSession(id: string): Promise<StudySession | undefined> {
    return this.database.studySessions.get(id);
  }

  async findActiveSession(
    topicId: string,
    mode: StudySession["mode"],
  ): Promise<StudySession | undefined> {
    const sessions = await this.database.studySessions
      .where("topicId")
      .equals(topicId)
      .toArray();

    return sessions
      .filter(
        (session) =>
          session.mode === mode &&
          !session.finishedAt &&
          !session.abandonedAt,
      )
      .sort((left, right) => right.startedAt.localeCompare(left.startedAt))[0];
  }

  async findLatestActiveSession(
    mode?: StudySession["mode"],
  ): Promise<StudySession | undefined> {
    const sessions = await this.database.studySessions.toArray();
    return sessions
      .filter(
        (session) =>
          !session.finishedAt &&
          !session.abandonedAt &&
          (!mode || session.mode === mode),
      )
      .sort((left, right) => right.startedAt.localeCompare(left.startedAt))[0];
  }

  async findLatestCompletedSession(
    topicId: string,
    mode?: StudySession["mode"],
  ): Promise<StudySession | undefined> {
    const sessions = await this.database.studySessions
      .where("topicId")
      .equals(topicId)
      .toArray();

    return sessions
      .filter(
        (session) =>
          Boolean(session.finishedAt) && (!mode || session.mode === mode),
      )
      .sort((left, right) =>
        (right.finishedAt ?? "").localeCompare(left.finishedAt ?? ""),
      )[0];
  }

  async getHistory(sessionId: string): Promise<StudySessionHistory> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error("No se encontró la sesión de estudio.");
    }
    const [passes, attempts, cards] = await Promise.all([
      this.listPasses(sessionId),
      this.listAttempts(sessionId),
      this.database.flashcards.bulkGet(session.selectedCardIds ?? []),
    ]);

    return {
      session,
      passes,
      attempts,
      cards: cards.filter((card): card is Flashcard => Boolean(card)),
    };
  }

  async listSessionsByTopic(topicId: string): Promise<StudySession[]> {
    const sessions = await this.database.studySessions
      .where("topicId")
      .equals(topicId)
      .toArray();
    return sessions.sort((left, right) =>
      right.startedAt.localeCompare(left.startedAt),
    );
  }

  async savePass(pass: StudyPass): Promise<void> {
    await this.database.studyPasses.put(pass);
  }

  async listPasses(sessionId: string): Promise<StudyPass[]> {
    const passes = await this.database.studyPasses
      .where("[sessionId+passNumber]")
      .between([sessionId, Dexie.minKey], [sessionId, Dexie.maxKey])
      .toArray();
    return passes.sort((left, right) => left.passNumber - right.passNumber);
  }

  async saveAttempt(attempt: CardAttempt): Promise<void> {
    await this.database.cardAttempts.put(attempt);
  }

  async listAttempts(sessionId: string): Promise<CardAttempt[]> {
    return this.database.cardAttempts
      .where("sessionId")
      .equals(sessionId)
      .sortBy("answeredAt");
  }

  private async abandonActiveSessions(
    topicId: string,
    mode: StudySession["mode"],
    timestamp: string,
  ): Promise<void> {
    const activeSessions = await this.database.studySessions
      .where("topicId")
      .equals(topicId)
      .filter(
        (session) =>
          session.mode === mode &&
          !session.finishedAt &&
          !session.abandonedAt,
      )
      .toArray();

    await Promise.all(
      activeSessions.map((session) =>
        this.database.studySessions.update(session.id, {
          abandonedAt: timestamp,
        }),
      ),
    );
  }
}

export const studyRepository = new StudyRepository();
