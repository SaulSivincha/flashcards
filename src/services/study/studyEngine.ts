import type { AttemptResult } from "../../types/study";
import { shuffleItems } from "../../utils/shuffle";

export type StudyPassState = {
  selectedCardIds: string[];
  currentCardIds: string[];
  currentCardIndex: number;
  incorrectCardIds: string[];
  passNumber: number;
  shuffle: boolean;
};

export type StudyStepResult = {
  state: StudyPassState;
  passCompleted: boolean;
  sessionCompleted: boolean;
  nextCardId?: string;
};

export function createInitialPass(
  cardIds: readonly string[],
  shuffle: boolean,
  random: () => number = Math.random,
): StudyPassState {
  if (cardIds.length === 0) {
    throw new Error("No hay tarjetas disponibles para iniciar la sesión.");
  }

  const selectedCardIds = [...cardIds];
  return {
    selectedCardIds,
    currentCardIds: shuffle
      ? shuffleItems(selectedCardIds, random)
      : selectedCardIds,
    currentCardIndex: 0,
    incorrectCardIds: [],
    passNumber: 1,
    shuffle,
  };
}

export function answerCurrentCard(
  state: StudyPassState,
  result: AttemptResult,
): StudyStepResult {
  const currentCardId = state.currentCardIds[state.currentCardIndex];
  if (!currentCardId) {
    throw new Error("La pasada actual ya terminó.");
  }

  const incorrectCardIds =
    result === "incorrect"
      ? [...state.incorrectCardIds, currentCardId]
      : state.incorrectCardIds;
  const currentCardIndex = state.currentCardIndex + 1;
  const passCompleted = currentCardIndex >= state.currentCardIds.length;
  const sessionCompleted = passCompleted && incorrectCardIds.length === 0;

  return {
    state: {
      ...state,
      currentCardIndex,
      incorrectCardIds,
    },
    passCompleted,
    sessionCompleted,
    nextCardId: passCompleted
      ? undefined
      : state.currentCardIds[currentCardIndex],
  };
}

export function createNextPass(
  state: StudyPassState,
  random: () => number = Math.random,
): StudyPassState {
  if (state.currentCardIndex < state.currentCardIds.length) {
    throw new Error("La pasada actual todavía no terminó.");
  }
  if (state.incorrectCardIds.length === 0) {
    throw new Error("La sesión ya no tiene tarjetas incorrectas.");
  }

  return {
    ...state,
    currentCardIds: state.shuffle
      ? shuffleItems(state.incorrectCardIds, random)
      : [...state.incorrectCardIds],
    currentCardIndex: 0,
    incorrectCardIds: [],
    passNumber: state.passNumber + 1,
  };
}
