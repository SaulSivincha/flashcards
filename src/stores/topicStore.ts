import { create } from "zustand";
import { topicRepository } from "../db/repositories/topicRepository";
import type { TopicDetails, TopicSummary } from "../types/topic";

type TopicState = {
  topics: TopicSummary[];
  currentCourseId?: string;
  recentTopics: TopicSummary[];
  currentTopic?: TopicDetails;
  isLoading: boolean;
  error?: string;
  loadByCourse: (courseId: string) => Promise<void>;
  loadRecent: (limit?: number) => Promise<void>;
  loadDetails: (topicId: string) => Promise<void>;
  saveOrder: (courseId: string, topicIds: string[]) => Promise<void>;
};

export const useTopicStore = create<TopicState>((set, get) => ({
  topics: [],
  currentCourseId: undefined,
  recentTopics: [],
  currentTopic: undefined,
  isLoading: false,
  error: undefined,

  loadByCourse: async (courseId) => {
    set((state) => ({
      isLoading: true,
      error: undefined,
      topics: state.currentCourseId === courseId ? state.topics : [],
      currentCourseId: courseId,
    }));
    try {
      const topics = await topicRepository.listSummariesByCourse(courseId);
      set({ topics, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los temas.",
        isLoading: false,
      });
    }
  },

  loadRecent: async (limit = 5) => {
    const recentTopics = await topicRepository.listRecent(limit);
    set({ recentTopics });
  },

  loadDetails: async (topicId) => {
    set({ isLoading: true, currentTopic: undefined, error: undefined });
    try {
      const currentTopic = await topicRepository.getDetails(topicId);
      set({ currentTopic, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "No se pudo cargar el tema.",
        isLoading: false,
      });
    }
  },

  saveOrder: async (courseId, topicIds) => {
    const previousTopics = get().topics;
    const topicById = new Map(
      previousTopics.map((topic) => [topic.id, topic]),
    );
    const reordered = topicIds
      .map((id, order) => {
        const topic = topicById.get(id);
        return topic ? { ...topic, order } : undefined;
      })
      .filter((topic): topic is TopicSummary => Boolean(topic));

    set({ topics: reordered, error: undefined });
    try {
      await topicRepository.saveOrder(courseId, topicIds);
    } catch (error) {
      set({
        topics: previousTopics,
        error:
          error instanceof Error
            ? error.message
            : "No se pudo guardar el orden de los temas.",
      });
      throw error;
    }
  },
}));
