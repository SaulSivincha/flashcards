export type StudyMode = "review" | "exam";
export type AttemptResult = "correct" | "incorrect";

export type StudySession = {
  id: string;
  topicId: string;
  mode: StudyMode;
  startedAt: string;
  finishedAt?: string;
  abandonedAt?: string;
  totalCards: number;
  totalPasses: number;
  shuffle: boolean;
  selectedCategory?: string;
  selectedCardIds?: string[];
  currentPassId?: string;
  currentPassNumber?: number;
  currentCardIds?: string[];
  currentCardIndex?: number;
  currentIncorrectCardIds?: string[];
};

export type StudyPass = {
  id: string;
  sessionId: string;
  passNumber: number;
  totalCards: number;
  correctCount: number;
  incorrectCount: number;
  startedAt?: string;
  finishedAt?: string;
};

export type CardAttempt = {
  id: string;
  sessionId: string;
  passId: string;
  cardId: string;
  result: AttemptResult;
  answeredAt: string;
  presentedAt?: string;
  revealedAt?: string;
  timeToRevealMs?: number;
  answerViewingMs?: number;
  responseTimeMs?: number;
  appSessionId?: string;
  interactionId?: string;
};

export type StartStudySessionInput = {
  topicId: string;
  mode: StudyMode;
  category?: string;
  shuffle: boolean;
};

export type StudyAnswerOutcome = {
  session: StudySession;
  pass: StudyPass;
  attempt: CardAttempt;
  passCompleted: boolean;
  sessionCompleted: boolean;
  nextCardId?: string;
};
