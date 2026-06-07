import type { FlashStudyDatabase } from "./db";
import { CourseRepository } from "./repositories/courseRepository";

const demoCourseIds = [
  "inteligencia-artificial",
  "economia-financiera",
  "sistemas-distribuidos",
];

export async function removeLegacyDemoData(
  database: FlashStudyDatabase,
): Promise<void> {
  const settings = await database.settings.get("app");
  if (!settings?.seedVersion) {
    return;
  }

  const courseRepository = new CourseRepository(database);
  for (const courseId of demoCourseIds) {
    if (await database.courses.get(courseId)) {
      await courseRepository.delete(courseId);
    }
  }

  await database.settings.put({
    ...settings,
    seedVersion: 0,
    updatedAt: new Date().toISOString(),
  });
}
