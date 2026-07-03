import { create } from "zustand";
import {
  studyRepository,
  type StudySessionHistory,
  type StudySessionSnapshot,
} from "../db/repositories/studyRepository";
import { topicRepository } from "../db/repositories/topicRepository";
import {
  buildStudySessionSummary,
  type StudySessionSummary,
} from "../services/study/studySummary";
import { telemetryService } from "../services/telemetry/telemetryService";
import type { AttemptResult, StudyMode } from "../types/study";
import type { StudySession } from "../types/study";
import type { TopicDetails } from "../types/topic";
import { useStatsStore } from "./statsStore";
import { useTopicStore } from "./topicStore";

type BeginStudyOptions = {
  category?: string;
  shuffle?: boolean;
  forceNew?: boolean;
};

type StudyState = {
  snapshot?: StudySessionSnapshot;
  history?: StudySessionHistory;
  summary?: StudySessionSummary;
  topic?: TopicDetails;
  activeSession?: StudySession;
  activeTopic?: TopicDetails;
  isLoading: boolean;
  isSubmitting: boolean;
  error?: string;
  begin: (
    topicId: string,
    mode: StudyMode,
    options?: BeginStudyOptions,
  ) => Promise<StudySessionSnapshot>;
  loadActiveSession: () => Promise<void>;
  answer: (result: AttemptResult) => Promise<{
    passCompleted: boolean;
    sessionCompleted: boolean;
  }>;
  beginNextPass: () => Promise<void>;
  finishExam: () => Promise<void>;
  loadSummary: (topicId: string, mode?: StudyMode) => Promise<void>;
  clearError: () => void;
  resetState: () => void;
};

let initialization:
  | { key: string; promise: Promise<StudySessionSnapshot> }
  | undefined;

export const useStudyStore = create<StudyState>((set, get) => ({
  snapshot: undefined,
  history: undefined,
  summary: undefined,
  topic: undefined,
  activeSession: undefined,
  activeTopic: undefined,
  isLoading: false,
  isSubmitting: false,
  error: undefined,

  begin: async (topicId, mode, options = {}) => {
    const key = [
      topicId,
      mode,
      options.category ?? "",
      options.shuffle ? "shuffle" : "ordered",
      options.forceNew ? "new" : "resume",
    ].join("|");
    if (initialization?.key === key) {
      return initialization.promise;
    }

    set({ isLoading: true, error: undefined });
    const promise = Promise.all([
      studyRepository.prepareSession(
        {
          topicId,
          mode,
          category: options.category,
          shuffle: options.shuffle ?? false,
        },
        options.forceNew,
      ),
      topicRepository.getDetails(topicId),
    ])
      .then(async ([snapshot, topic]) => {
        const history = await studyRepository.getHistory(snapshot.session.id);
        set({
          snapshot,
          history,
          summary: buildStudySessionSummary(history),
          topic,
          activeSession: snapshot.session,
          activeTopic: topic,
          isLoading: false,
        });
        const resumed =
          Date.now() - new Date(snapshot.session.startedAt).getTime() > 2_000;
        void telemetryService.recordStudyEvent({
          type: resumed ? "study_resumed" : "study_started",
          courseId: topic?.courseId,
          topicId,
          studySessionId: snapshot.session.id,
          data: {
            mode,
            shuffle: snapshot.session.shuffle,
            totalCards: snapshot.session.totalCards,
            category: snapshot.session.selectedCategory ?? null,
          },
        });
        return snapshot;
      })
      .catch((error) => {
        set({
          error:
            error instanceof Error
              ? error.message
              : "No se pudo iniciar la sesión.",
          isLoading: false,
        });
        throw error;
      })
      .finally(() => {
        if (initialization?.key === key) {
          initialization = undefined;
        }
      });

    initialization = { key, promise };
    return promise;
  },

  loadActiveSession: async () => {
    const activeSession = await studyRepository.findLatestActiveSession();
    const activeTopic = activeSession
      ? await topicRepository.getDetails(activeSession.topicId)
      : undefined;
    set({ activeSession, activeTopic });
  },

  answer: async (result) => {
    if (get().isSubmitting) {
      throw new Error("La respuesta anterior todavía se está guardando.");
    }
    const sessionId = get().snapshot?.session.id;
    if (!sessionId) {
      throw new Error("No hay una sesión activa.");
    }

    set({ isSubmitting: true, error: undefined });
    try {
      const attemptTelemetry = await telemetryService.getAttemptTelemetry();
      const outcome = await studyRepository.recordAnswer(
        sessionId,
        result,
        attemptTelemetry,
      );
      await telemetryService.completeCard(result, outcome.attempt.id);
      const [snapshot, history] = await Promise.all([
        studyRepository.getSnapshot(sessionId),
        studyRepository.getHistory(sessionId),
      ]);
      set({
        snapshot,
        history,
        summary: buildStudySessionSummary(history),
        activeSession: outcome.sessionCompleted ? undefined : snapshot.session,
        activeTopic: outcome.sessionCompleted ? undefined : get().topic,
        isSubmitting: false,
      });
      if (outcome.sessionCompleted) {
        void telemetryService.recordStudyEvent({
          type: "study_finished",
          topicId: snapshot.session.topicId,
          studySessionId: sessionId,
          data: { mode: snapshot.session.mode },
        });
        await Promise.all([
          useStatsStore.getState().load(),
          useTopicStore.getState().loadRecent(),
        ]);
      }
      return {
        passCompleted: outcome.passCompleted,
        sessionCompleted: outcome.sessionCompleted,
      };
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "No se pudo guardar la respuesta.",
        isSubmitting: false,
      });
      throw error;
    }
  },

  beginNextPass: async () => {
    if (get().isSubmitting) {
      return;
    }
    const sessionId = get().snapshot?.session.id;
    if (!sessionId) {
      throw new Error("No hay una sesión activa.");
    }

    set({ isSubmitting: true, error: undefined });
    try {
      const snapshot = await studyRepository.startNextPass(sessionId);
      const history = await studyRepository.getHistory(sessionId);
      set({
        snapshot,
        history,
        summary: buildStudySessionSummary(history),
        activeSession: snapshot.session,
        activeTopic: get().topic,
        isSubmitting: false,
      });
      void telemetryService.recordStudyEvent({
        type: "pass_started",
        topicId: snapshot.session.topicId,
        studySessionId: sessionId,
        data: {
          passNumber: snapshot.pass.passNumber,
          totalCards: snapshot.pass.totalCards,
        },
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "No se pudo iniciar la siguiente pasada.",
        isSubmitting: false,
      });
      throw error;
    }
  },

  finishExam: async () => {
    const sessionId = get().snapshot?.session.id;
    if (!sessionId) {
      throw new Error("No hay un examen activo.");
    }

    set({ isSubmitting: true, error: undefined });
    try {
      await studyRepository.finishExam(sessionId);
      const history = await studyRepository.getHistory(sessionId);
      set({
        history,
        summary: buildStudySessionSummary(history),
        activeSession: undefined,
        activeTopic: undefined,
        isSubmitting: false,
      });
      void telemetryService.recordStudyEvent({
        type: "exam_finished",
        topicId: history.session.topicId,
        studySessionId: sessionId,
        data: {
          answeredCards: history.attempts.length,
          totalCards: history.session.totalCards,
          finishedEarly: history.attempts.length < history.session.totalCards,
        },
      });
      await Promise.all([
        useStatsStore.getState().load(),
        useTopicStore.getState().loadRecent(),
      ]);
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "No se pudo finalizar el examen.",
        isSubmitting: false,
      });
      throw error;
    }
  },

  loadSummary: async (topicId, mode) => {
    set({ isLoading: true, error: undefined });
    try {
      const current = get().snapshot?.session;
      const session =
        current?.topicId === topicId &&
        current.finishedAt &&
        (!mode || current.mode === mode)
          ? current
          : await studyRepository.findLatestCompletedSession(topicId, mode);
      if (!session) {
        throw new Error("Todavía no hay una sesión completada para este tema.");
      }
      const [history, topic] = await Promise.all([
        studyRepository.getHistory(session.id),
        topicRepository.getDetails(topicId),
      ]);
      set({
        history,
        summary: buildStudySessionSummary(history),
        topic,
        isLoading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "No se pudo cargar el resumen.",
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: undefined }),
  resetState: () => {
    initialization = undefined;
    set({
      snapshot: undefined,
      history: undefined,
      summary: undefined,
      topic: undefined,
      activeSession: undefined,
      activeTopic: undefined,
      isLoading: false,
      isSubmitting: false,
      error: undefined,
    });
  },
}));
