import { create } from "zustand";
import {
  exportBackupFile,
  getStorageSummary,
  resetStudyProgress,
  restoreBackup,
} from "../services/backup/backupService";
import type { FlashStudyBackup, StorageSummary } from "../types/backup";
import { useCourseStore } from "./courseStore";
import { useSettingsStore } from "./settingsStore";
import { useStatsStore } from "./statsStore";
import { useStudyStore } from "./studyStore";
import { useTopicStore } from "./topicStore";

type DataManagementState = {
  storage?: StorageSummary;
  isBusy: boolean;
  message?: string;
  error?: string;
  loadStorage: () => Promise<void>;
  exportBackup: () => Promise<void>;
  restoreBackup: (backup: FlashStudyBackup) => Promise<void>;
  resetProgress: () => Promise<void>;
  clearFeedback: () => void;
  setError: (message: string) => void;
};

async function refreshApplicationState(): Promise<void> {
  useStudyStore.getState().resetState();
  useTopicStore.setState({
    topics: [],
    currentCourseId: undefined,
    recentTopics: [],
    currentTopic: undefined,
    error: undefined,
  });
  await Promise.all([
    useCourseStore.getState().loadCourses(),
    useTopicStore.getState().loadRecent(),
    useSettingsStore.getState().loadSettings(),
    useStudyStore.getState().loadActiveSession(),
    useStatsStore.getState().load(),
  ]);
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export const useDataManagementStore = create<DataManagementState>((set) => ({
  storage: undefined,
  isBusy: false,
  message: undefined,
  error: undefined,

  loadStorage: async () => {
    try {
      const storage = await getStorageSummary();
      set({ storage });
    } catch (error) {
      set({
        error: errorMessage(
          error,
          "No se pudo consultar el almacenamiento local.",
        ),
      });
    }
  },

  exportBackup: async () => {
    set({ isBusy: true, message: undefined, error: undefined });
    try {
      await exportBackupFile();
      const storage = await getStorageSummary();
      set({
        storage,
        isBusy: false,
        message: "Respaldo JSON exportado correctamente.",
      });
    } catch (error) {
      set({
        isBusy: false,
        error: errorMessage(error, "No se pudo exportar el respaldo."),
      });
    }
  },

  restoreBackup: async (backup) => {
    set({ isBusy: true, message: undefined, error: undefined });
    try {
      await restoreBackup(backup);
      await refreshApplicationState();
      const storage = await getStorageSummary();
      set({
        storage,
        isBusy: false,
        message: "Respaldo restaurado. Los datos ya están disponibles.",
      });
    } catch (error) {
      set({
        isBusy: false,
        error: errorMessage(error, "No se pudo restaurar el respaldo."),
      });
      throw error;
    }
  },

  resetProgress: async () => {
    set({ isBusy: true, message: undefined, error: undefined });
    try {
      await resetStudyProgress();
      await refreshApplicationState();
      const storage = await getStorageSummary();
      set({
        storage,
        isBusy: false,
        message:
          "Progreso reiniciado. Tus cursos, temas y tarjetas se conservaron.",
      });
    } catch (error) {
      set({
        isBusy: false,
        error: errorMessage(error, "No se pudo reiniciar el progreso."),
      });
      throw error;
    }
  },

  clearFeedback: () => set({ message: undefined, error: undefined }),
  setError: (error) => set({ error, message: undefined }),
}));
