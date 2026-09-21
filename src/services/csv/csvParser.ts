import Papa from "papaparse";
import { stableHash } from "../../utils/hash";
import {
  CsvValidationError,
  type CsvMetadata,
  type CsvValidationIssue,
  type ParsedCsvCard,
  type ParsedFlashcardCsv,
} from "./csvTypes";
import {
  isFlashcardHeader,
  alternativeColumnIndexes,
  normalizeCsvCell,
  normalizeCsvKey,
  validateCards,
  validateMetadata,
} from "./csvValidator";

const metadataKeys: Record<string, keyof CsvMetadata> = {
  curso: "course",
  unidad: "unit",
  tema: "topic",
};

export function parseFlashcardCsv(
  csvText: string,
  fileName = "flashcards.csv",
): ParsedFlashcardCsv {
  if (!csvText.trim()) {
    throw new CsvValidationError([
      {
        code: "EMPTY_FILE",
        message: "El archivo CSV está vacío.",
      },
    ]);
  }

  const result = Papa.parse<unknown[]>(csvText.replace(/^\uFEFF/, ""), {
    delimiter: "",
    skipEmptyLines: false,
  });
  const parserIssues: CsvValidationIssue[] = result.errors
    .filter((error) => error.type !== "Delimiter")
    .map((error) => ({
      code: "PAPA_PARSE_ERROR",
      message: `No se pudo leer la fila ${(error.row ?? 0) + 1}: ${error.message}`,
      row: (error.row ?? 0) + 1,
    }));

  const rows = result.data.map((row) =>
    Array.isArray(row) ? row.map(normalizeCsvCell) : [],
  );
  const headerIndex = rows.findIndex(isFlashcardHeader);
  const metadata: Partial<CsvMetadata> = {};
  const alternativeIndexes =
    headerIndex >= 0 ? alternativeColumnIndexes(rows[headerIndex]) : undefined;

  const metadataRows = headerIndex >= 0 ? rows.slice(0, headerIndex) : rows;
  metadataRows.forEach((row) => {
    const key = metadataKeys[normalizeCsvKey(row[0])];
    const value = normalizeCsvCell(row[1]);
    if (key && value) {
      metadata[key] = value;
    }
  });

  const issues = [...parserIssues, ...validateMetadata(metadata)];
  if (headerIndex < 0) {
    issues.push({
      code: "MISSING_HEADER",
      message:
        'No se encontró el encabezado "categoria,pregunta,respuesta".',
    });
  }

  const cards: ParsedCsvCard[] =
    headerIndex < 0
      ? []
      : rows
          .slice(headerIndex + 1)
          .map((row, index) => ({
            category: normalizeCsvCell(row[0]),
            question: normalizeCsvCell(row[1]),
            answer: normalizeCsvCell(row[2]),
            alternatives: alternativeIndexes
              ? alternativeIndexes.map((alternativeIndex) =>
                  normalizeCsvCell(row[alternativeIndex]),
                )
              : undefined,
            sourceRow: headerIndex + index + 2,
          }))
          .filter(
            (card) =>
              Boolean(card.category) ||
              Boolean(card.question) ||
              Boolean(card.answer),
          );

  if (headerIndex >= 0) {
    issues.push(...validateCards(cards));
  }

  if (issues.length > 0) {
    throw new CsvValidationError(issues);
  }

  const completeMetadata: CsvMetadata = {
    course: metadata.course!,
    unit: metadata.unit ?? "",
    topic: metadata.topic!,
  };
  const categories = Array.from(
    new Set(cards.map((card) => card.category || "Sin categoría")),
  );
  const normalizedSource = JSON.stringify({
    metadata: completeMetadata,
    cards: cards.map(({ category, question, answer, alternatives }) => ({
      category,
      question,
      answer,
      alternatives,
    })),
  });

  return {
    fileName,
    sourceText: csvText,
    metadata: completeMetadata,
    cards,
    categories,
    sourceHash: stableHash(normalizedSource),
  };
}

export async function parseFlashcardCsvFile(
  file: File,
): Promise<ParsedFlashcardCsv> {
  return parseFlashcardCsv(await file.text(), file.name);
}
