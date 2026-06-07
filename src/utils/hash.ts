function normalizeHashPart(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("es");
}

export function stableHash(value: string): string {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function createStableCardId(input: {
  course: string;
  unit: string;
  topic: string;
  category: string;
  question: string;
}): string {
  const source = [
    input.course,
    input.unit,
    input.topic,
    input.category,
    input.question,
  ]
    .map(normalizeHashPart)
    .join("|");

  return `card-${stableHash(source)}`;
}
