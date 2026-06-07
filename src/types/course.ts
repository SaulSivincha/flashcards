export type Course = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  order: number;
};

export type CreateCourseInput = {
  name: string;
};

export type CourseSummary = Course & {
  topicCount: number;
  cardCount: number;
  progress: number;
};
