export type CsvMetadata = {
  course: string;
  unit: string;
  topic: string;
};

export type ParsedCsvCard = {
  category: string;
  question: string;
  answer: string;
  sourceRow: number;
};

export type ParsedFlashcardCsv = {
  fileName: string;
  metadata: CsvMetadata;
  cards: ParsedCsvCard[];
  categories: string[];
  sourceHash: string;
};

export type CsvValidationErrorCode =
  | "EMPTY_FILE"
  | "PAPA_PARSE_ERROR"
  | "MISSING_COURSE"
  | "MISSING_TOPIC"
  | "MISSING_HEADER"
  | "EMPTY_QUESTION"
  | "EMPTY_ANSWER"
  | "DUPLICATE_CARD"
  | "NO_CARDS";

export type CsvValidationIssue = {
  code: CsvValidationErrorCode;
  message: string;
  row?: number;
};

export class CsvValidationError extends Error {
  readonly issues: CsvValidationIssue[];

  constructor(issues: CsvValidationIssue[]) {
    super(issues[0]?.message ?? "El archivo CSV no es válido.");
    this.name = "CsvValidationError";
    this.issues = issues;
  }
}
