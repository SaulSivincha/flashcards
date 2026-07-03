import { db } from "./db";
import { removeLegacyDemoData } from "./removeLegacyDemoData";
import { seedArtificialIntelligence } from "./seedArtificialIntelligence";
import { seedFinancialEducation } from "./seedFinancialEducation";

let initializationPromise: Promise<void> | undefined;

export function initializeDatabase(): Promise<void> {
  initializationPromise ??= (async () => {
    await db.open();
    await removeLegacyDemoData(db);
    await seedFinancialEducation(db);
    await seedArtificialIntelligence(db);
  })();

  return initializationPromise;
}
