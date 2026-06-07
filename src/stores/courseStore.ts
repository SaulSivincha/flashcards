import { create } from "zustand";
import { courseRepository } from "../db/repositories/courseRepository";
import type { Course, CourseSummary } from "../types/course";

type CourseState = {
  courses: CourseSummary[];
  isLoading: boolean;
  error?: string;
  loadCourses: () => Promise<void>;
  createCourse: (name: string) => Promise<Course>;
  renameCourse: (id: string, name: string) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;
};

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: [],
  isLoading: false,
  error: undefined,

  loadCourses: async () => {
    set({ isLoading: true, error: undefined });
    try {
      const courses = await courseRepository.listSummaries();
      set({ courses, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los cursos.",
        isLoading: false,
      });
    }
  },

  createCourse: async (name) => {
    const course = await courseRepository.create({ name });
    await get().loadCourses();
    return course;
  },

  renameCourse: async (id, name) => {
    await courseRepository.rename(id, name);
    await get().loadCourses();
  },

  deleteCourse: async (id) => {
    await courseRepository.delete(id);
    await get().loadCourses();
  },
}));
