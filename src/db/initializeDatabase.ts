import { db } from "./db";
import { removeLegacyDemoData } from "./removeLegacyDemoData";
import { seedArtificialIntelligence } from "./seedArtificialIntelligence";
import { seedFinancialEducation } from "./seedFinancialEducation";
import { seedNetworks } from "./seedNetworks";
import { ensureCourseDirectory } from "../services/csv/csvArchiveService";

let initializationPromise: Promise<void> | undefined;

export function initializeDatabase(): Promise<void> {
  initializationPromise ??= (async () => {
    await db.open();
    await removeLegacyDemoData(db);
    await seedFinancialEducation(db);
    await seedArtificialIntelligence(db);
    await seedNetworks(db);
    const courses = await db.courses.toArray();
    void Promise.all(courses.map((course) => ensureCourseDirectory(course.name))).catch(
      () => undefined,
    );
  })();

  return initializationPromise;
}
