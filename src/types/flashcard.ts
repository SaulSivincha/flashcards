export type Flashcard = {
  id: string;
  topicId: string;
  category: string;
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateFlashcardInput = Omit<
  Flashcard,
  "id" | "createdAt" | "updatedAt"
> & {
  id?: string;
};
