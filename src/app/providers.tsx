import { useEffect, useState, type PropsWithChildren } from "react";
import { initializeDatabase } from "../db/initializeDatabase";
import { useCourseStore } from "../stores/courseStore";
import { useSettingsStore } from "../stores/settingsStore";
import { useTopicStore } from "../stores/topicStore";
import { useStudyStore } from "../stores/studyStore";
import { useStatsStore } from "../stores/statsStore";

export function AppProviders({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        await initializeDatabase();
        await Promise.all([
          useCourseStore.getState().loadCourses(),
          useTopicStore.getState().loadRecent(),
          useSettingsStore.getState().loadSettings(),
          useStudyStore.getState().loadActiveSession(),
          useStatsStore.getState().load(),
        ]);
        if (active) {
          setStatus("ready");
        }
      } catch (initializationError) {
        if (active) {
          setError(
            initializationError instanceof Error
              ? initializationError.message
              : "No se pudo iniciar la base de datos local.",
          );
          setStatus("error");
        }
      }
    }

    void initialize();
    return () => {
      active = false;
    };
  }, []);

  if (status === "loading") {
    return (
      <div
        aria-live="polite"
        className="flex min-h-screen items-center justify-center bg-paper px-6 text-center text-ink"
      >
        <div>
          <p className="text-2xl font-semibold">FlashStudy</p>
          <p className="mt-2 text-sm text-slate">Preparando tus datos locales…</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        role="alert"
        className="flex min-h-screen items-center justify-center bg-paper px-6 text-center text-ink"
      >
        <div>
          <p className="text-xl font-semibold">No se pudo abrir FlashStudy</p>
          <p className="mt-3 text-sm text-mahogany">{error}</p>
        </div>
      </div>
    );
  }

  return children;
}
