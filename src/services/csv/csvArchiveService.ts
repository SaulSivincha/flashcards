import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";

const archiveDirectory = "FlashStudy/CSV";
const coursesDirectory = "FlashStudy/Cursos";

function pad(value: number, length = 2): string {
  return value.toString().padStart(length, "0");
}

function timestampForFile(date: Date): string {
  const calendarDate = [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-");
  const time = [
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
    pad(date.getMilliseconds(), 3),
  ].join("-");

  return `${calendarDate}_${time}`;
}

function safeFileName(fileName: string): string {
  return (
    fileName
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_")
      .replace(/[. ]+$/g, "")
      .trim() || "flashcards.csv"
  );
}

function safeDirectoryName(name: string): string {
  return safeFileName(name).replace(/\.csv$/i, "") || "Sin nombre";
}

export function buildArchivedCsvFileName(
  fileName: string,
  savedAt = new Date(),
): string {
  const safeName = safeFileName(fileName);
  const extensionIndex = safeName.toLocaleLowerCase().endsWith(".csv")
    ? safeName.length - 4
    : safeName.length;
  const baseName = safeName.slice(0, extensionIndex) || "flashcards";

  return `${baseName}_${timestampForFile(savedAt)}.csv`;
}

export async function archiveCsvFile(
  fileName: string,
  sourceText: string,
): Promise<string> {
  const path = `${archiveDirectory}/${buildArchivedCsvFileName(fileName)}`;

  await Filesystem.writeFile({
    path,
    data: sourceText,
    directory: Directory.Documents,
    encoding: Encoding.UTF8,
    recursive: true,
  });

  return path;
}

/** Saves the current source CSV under Documents/FlashStudy/Cursos/<curso>/. */
export async function saveTopicCsvFile(
  courseName: string,
  fileName: string,
  sourceText: string,
): Promise<string> {
  const path = `${coursesDirectory}/${safeDirectoryName(courseName)}/${safeFileName(fileName)}`;

  await Filesystem.writeFile({
    path,
    data: sourceText,
    directory: Directory.Documents,
    encoding: Encoding.UTF8,
    recursive: true,
  });

  return path;
}

/** Creates the course directory even before its first topic is imported. */
export async function ensureCourseDirectory(courseName: string): Promise<string> {
  const path = `${coursesDirectory}/${safeDirectoryName(courseName)}`;
  await Filesystem.mkdir({
    path,
    directory: Directory.Documents,
    recursive: true,
  });
  return path;
}

export function removeArchivedCsvFile(path: string): Promise<void> {
  return Filesystem.deleteFile({
    path,
    directory: Directory.Documents,
  });
}
