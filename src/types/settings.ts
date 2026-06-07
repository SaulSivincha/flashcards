export type ThemePreference = "system" | "light" | "dark";
export type StudyOrder = "normal" | "random";

export type AppSettings = {
  key: "app";
  theme: ThemePreference;
  defaultStudyOrder: StudyOrder;
  flipCardOnTap: boolean;
  seedVersion: number;
  updatedAt: string;
};
