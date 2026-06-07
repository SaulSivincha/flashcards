export type Topic = {
  id: string;
  courseId: string;
  fileName: string;
  unit: string;
  title: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  sourceHash: string;
};

export type CreateTopicInput = Omit<Topic, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
};

export type TopicSummary = Topic & {
  cardCount: number;
  categoryCount: number;
  progress: number;
  lastStudiedAt?: string;
};

export type CategorySummary = {
  name: string;
  cardCount: number;
  progress: number;
};

export type TopicDetails = TopicSummary & {
  courseName: string;
  categories: CategorySummary[];
};
