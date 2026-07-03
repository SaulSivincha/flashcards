import { useEffect, useState, type PropsWithChildren } from "react";
import { BrandMark } from "../components/brand/BrandMark";
import { initializeDatabase } from "../db/initializeDatabase";
import { useCourseStore } from "../stores/courseStore";
import { useSettingsStore } from "../stores/settingsStore";
import { useTopicStore } from "../stores/topicStore";
import { useStudyStore } from "../stores/studyStore";
import { useStatsStore } from "../stores/statsStore";
import { telemetryService } from "../services/telemetry/telemetryService";
import {
  automaticSync,
  publishAutomaticSync,
} from "../services/sync/syncService";

async function refreshApplicationState(): Promise<void> {
  await Promise.all([
    useCourseStore.getState().loadCourses(),
    useTopicStore.getState().loadRecent(),
    useSettingsStore.getState().loadSettings(),
    useStudyStore.getState().loadActiveSession(),
    useStatsStore.getState().load(),
  ]);
}

async function synchronizeAutomatically(): Promise<number> {
  try {
    const result = await automaticSync();
    return result.recordsChanged;
  } catch (error) {
    console.warn("La sincronización automática se reintentará más tarde.", error);
    return 0;
  }
}

async function publishAutomatically(): Promise<void> {
  try {
    await publishAutomaticSync();
  } catch (error) {
    console.warn("No se pudo publicar la sincronización automática.", error);
  }
}

export function AppProviders({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        await initializeDatabase();
        await synchronizeAutomatically();
        await telemetryService.start(
          `${window.location.pathname}${window.location.search}`,
        );
        await refreshApplicationState();
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
    const handleVisibility = () => {
      const backgrounded = document.visibilityState === "hidden";
      void telemetryService.setBackgrounded(
        backgrounded,
        `${window.location.pathname}${window.location.search}`,
      );
      if (backgrounded) {
        void publishAutomatically();
      } else {
        void synchronizeAutomatically().then((recordsChanged) => {
          if (recordsChanged > 0) {
            return refreshApplicationState();
          }
        });
      }
    };
    const handlePageHide = () => {
      void publishAutomatically();
      void telemetryService.stop(
        `${window.location.pathname}${window.location.search}`,
      );
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      active = false;
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, []);

  if (status === "loading") {
    return (
      <div
        aria-live="polite"
        className="flex min-h-screen items-center justify-center bg-paper px-6 text-center text-ink"
      >
        <div>
          <BrandMark className="mx-auto mb-4 h-16 w-16" title="FlashStudy" />
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
