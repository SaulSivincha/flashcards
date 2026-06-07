import { create } from "zustand";
import { settingsRepository } from "../db/repositories/settingsRepository";
import type {
  AppSettings,
  StudyOrder,
  ThemePreference,
} from "../types/settings";

function applyTheme(theme: ThemePreference): void {
  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = theme === "dark" || (theme === "system" && prefersDark);
  document.documentElement.classList.toggle("dark", dark);
}

type SettingsState = {
  settings?: AppSettings;
  loadSettings: () => Promise<void>;
  setTheme: (theme: ThemePreference) => Promise<void>;
  setDefaultStudyOrder: (order: StudyOrder) => Promise<void>;
  setFlipCardOnTap: (enabled: boolean) => Promise<void>;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: undefined,

  loadSettings: async () => {
    const settings = await settingsRepository.get();
    applyTheme(settings.theme);
    set({ settings });
  },

  setTheme: async (theme) => {
    const settings = await settingsRepository.save({ theme });
    applyTheme(theme);
    set({ settings });
  },

  setDefaultStudyOrder: async (defaultStudyOrder) => {
    const settings = await settingsRepository.save({ defaultStudyOrder });
    set({ settings });
  },

  setFlipCardOnTap: async (flipCardOnTap) => {
    const settings = await settingsRepository.save({ flipCardOnTap });
    set({ settings });
  },
}));
