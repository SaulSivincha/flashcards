import type { CardStats } from "../../types/stats";

export function calculateProgress(
  cardIds: string[],
  statsByCardId: Map<string, CardStats>,
): number {
  if (cardIds.length === 0) {
    return 0;
  }

  const total = cardIds.reduce((sum, cardId) => {
    const stats = statsByCardId.get(cardId);

    if (!stats || stats.seenCount === 0) {
      return sum;
    }

    return sum + stats.correctCount / stats.seenCount;
  }, 0);

  return Math.round((total / cardIds.length) * 100);
}

export function maxDate(values: Array<string | undefined>): string | undefined {
  return values
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => right.localeCompare(left))[0];
}
