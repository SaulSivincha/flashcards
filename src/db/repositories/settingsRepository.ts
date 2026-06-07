import type { FlashStudyDatabase } from "../db";
import { db } from "../db";
import type { AppSettings } from "../../types/settings";
import { nowIso } from "../../utils/dates";

const defaultSettings: AppSettings = {
  key: "app",
  theme: "system",
  defaultStudyOrder: "normal",
  flipCardOnTap: true,
  seedVersion: 0,
  updatedAt: nowIso(),
};

export class SettingsRepository {
  constructor(private readonly database: FlashStudyDatabase = db) {}

  async get(): Promise<AppSettings> {
    return (await this.database.settings.get("app")) ?? defaultSettings;
  }

  async save(
    values: Partial<Omit<AppSettings, "key" | "updatedAt">>,
  ): Promise<AppSettings> {
    const current = await this.get();
    const updated: AppSettings = {
      ...current,
      ...values,
      key: "app",
      updatedAt: nowIso(),
    };
    await this.database.settings.put(updated);
    return updated;
  }
}

export const settingsRepository = new SettingsRepository();
