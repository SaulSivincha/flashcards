import type { ParsedFlashcardCsv } from "./csvTypes";

export type CsvConflictMatch = "fileName" | "metadata";

export type CsvImportConflict = {
  topicId: string;
  topicTitle: string;
  match: CsvConflictMatch;
};

export type CsvImportAnalysis = {
  parsed: ParsedFlashcardCsv;
  targetCourseId?: string;
  targetCourseName: string;
  courseNameMismatch: boolean;
  conflict?: CsvImportConflict;
};

export type CsvImportMode = "create" | "update" | "copy";

export type CsvImportOptions = {
  preferredCourseId?: string;
  mode: CsvImportMode;
  existingTopicId?: string;
};

export type CsvImportResult = {
  courseId: string;
  topicId: string;
  mode: CsvImportMode;
  createdCards: number;
  updatedCards: number;
  deactivatedCards: number;
};
