import { db } from "./db";
import { removeLegacyDemoData } from "./removeLegacyDemoData";

let initializationPromise: Promise<void> | undefined;

export function initializeDatabase(): Promise<void> {
  initializationPromise ??= (async () => {
    await db.open();
    await removeLegacyDemoData(db);
  })();

  return initializationPromise;
}
