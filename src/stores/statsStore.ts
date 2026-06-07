import { create } from "zustand";
import { statsRepository } from "../db/repositories/statsRepository";
import type {
  StatsDashboard,
  StatsPeriod,
  TopicStudyStats,
} from "../types/stats";

type StatsState = {
  dashboard?: StatsDashboard;
  period: StatsPeriod;
  isLoading: boolean;
  error?: string;
  load: (period?: StatsPeriod) => Promise<void>;
  setPeriod: (period: StatsPeriod) => Promise<void>;
  getTopic: (topicId: string) => TopicStudyStats | undefined;
};

export const useStatsStore = create<StatsState>((set, get) => ({
  dashboard: undefined,
  period: "30d",
  isLoading: false,
  error: undefined,

  load: async (period = get().period) => {
    set({ isLoading: true, error: undefined, period });
    try {
      const dashboard = await statsRepository.getDashboard(period);
      set({ dashboard, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron calcular las estadísticas.",
        isLoading: false,
      });
    }
  },

  setPeriod: async (period) => {
    await get().load(period);
  },

  getTopic: (topicId) =>
    get().dashboard?.topics.find((topic) => topic.topicId === topicId),
}));
