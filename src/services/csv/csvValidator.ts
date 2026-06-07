import type {
  CsvMetadata,
  CsvValidationIssue,
  ParsedCsvCard,
} from "./csvTypes";

export function normalizeCsvCell(value: unknown): string {
  return String(value ?? "")
    .replace(/^\uFEFF/, "")
    .trim();
}

export function normalizeCsvKey(value: unknown): string {
  return normalizeCsvCell(value).toLocaleLowerCase("es");
}

export function isFlashcardHeader(row: unknown[]): boolean {
  const cells = row.slice(0, 3).map(normalizeCsvKey);
  return (
    cells[0] === "categoria" &&
    cells[1] === "pregunta" &&
    cells[2] === "respuesta"
  );
}

export function validateMetadata(
  metadata: Partial<CsvMetadata>,
): CsvValidationIssue[] {
  const issues: CsvValidationIssue[] = [];

  if (!metadata.course) {
    issues.push({
      code: "MISSING_COURSE",
      message: 'Falta el metadato obligatorio "curso".',
    });
  }

  if (!metadata.topic) {
    issues.push({
      code: "MISSING_TOPIC",
      message: 'Falta el metadato obligatorio "tema".',
    });
  }

  return issues;
}

export function validateCards(cards: ParsedCsvCard[]): CsvValidationIssue[] {
  const issues: CsvValidationIssue[] = [];
  const fingerprints = new Set<string>();

  cards.forEach((card) => {
    if (!card.question) {
      issues.push({
        code: "EMPTY_QUESTION",
        message: `La fila ${card.sourceRow} tiene una pregunta vacía.`,
        row: card.sourceRow,
      });
    }

    if (!card.answer) {
      issues.push({
        code: "EMPTY_ANSWER",
        message: `La fila ${card.sourceRow} tiene una respuesta vacía.`,
        row: card.sourceRow,
      });
    }

    if (card.question) {
      const fingerprint = `${normalizeCsvKey(card.category)}|${normalizeCsvKey(
        card.question,
      )}`;
      if (fingerprints.has(fingerprint)) {
        issues.push({
          code: "DUPLICATE_CARD",
          message: `La fila ${card.sourceRow} repite una pregunta de la misma categoría.`,
          row: card.sourceRow,
        });
      }
      fingerprints.add(fingerprint);
    }
  });

  if (cards.length === 0) {
    issues.push({
      code: "NO_CARDS",
      message: "El archivo no contiene tarjetas después del encabezado.",
    });
  }

  return issues;
}
