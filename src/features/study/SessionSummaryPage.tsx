import { useEffect } from "react";
import { useHistory, useLocation, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ScreenContainer } from "../../components/layout/ScreenContainer";
import { AppIcon } from "../../components/ui/AppIcon";
import { Button } from "../../components/ui/Button";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { useStudyStore } from "../../stores/studyStore";
import type { StudyMode } from "../../types/study";

export function SessionSummaryPage() {
  const historyRouter = useHistory();
  const location = useLocation();
  const { topicId } = useParams<{ topicId: string }>();
  const sessionHistory = useStudyStore((state) => state.history);
  const summary = useStudyStore((state) => state.summary);
  const isLoading = useStudyStore((state) => state.isLoading);
  const error = useStudyStore((state) => state.error);
  const loadSummary = useStudyStore((state) => state.loadSummary);
  const requestedMode: StudyMode =
    new URLSearchParams(location.search).get("mode") === "exam"
      ? "exam"
      : "review";

  useEffect(() => {
    void loadSummary(topicId, requestedMode);
  }, [loadSummary, requestedMode, topicId]);

  if (isLoading || !summary || !sessionHistory) {
    return (
      <ScreenContainer className="!bg-ink !text-paper" dark focused>
        <div className="flex min-h-[70vh] items-center justify-center text-center">
          <div>
            <p className="text-xl font-semibold">
              {error ? "Resumen no disponible" : "Calculando resumen…"}
            </p>
            {error ? <p className="mt-3 text-sm text-mahogany">{error}</p> : null}
            <Button
              className="mt-6"
              onClick={() => historyRouter.replace(`/temas/${topicId}`)}
            >
              Volver al tema
            </Button>
          </div>
        </div>
      </ScreenContainer>
    );
  }

  const exam = sessionHistory.session.mode === "exam";
  const metrics = [
    {
      icon: "files" as const,
      value: String(summary.totalCards),
      label: "TARJETAS",
    },
    {
      icon: "repeat" as const,
      value: String(summary.totalPasses),
      label: exam ? "BLOQUES" : "PASADAS",
    },
    {
      icon: "stopwatch" as const,
      value: summary.durationMinutes > 0 ? String(summary.durationMinutes) : "<1",
      label: "MIN",
    },
    {
      icon: "check" as const,
      value: exam ? `${summary.accuracy}%` : "100%",
      label: exam ? "ACIERTO" : "COMPLETO",
    },
  ];

  return (
    <ScreenContainer className="!bg-ink !text-paper" dark focused>
      <header className="flex min-h-14 items-center justify-between">
        <div className="h-12 w-12" />
        <h1 className="text-xl font-semibold">
          {exam ? "Resumen de examen" : "Resumen de sesión"}
        </h1>
        <button
          aria-label="Cerrar"
          className="flex h-12 w-12 items-center justify-center"
          onClick={() => historyRouter.push(`/temas/${topicId}`)}
          type="button"
        >
          <AppIcon name="close" />
        </button>
      </header>

      <motion.section
        animate={{ y: 0 }}
        className="mt-10 text-center"
        initial={{ y: 18 }}
        transition={{ duration: 0.35 }}
      >
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate">
          <AppIcon className="text-4xl" name="check" />
        </div>
        <h2 className="mt-8 text-[32px] font-bold">
          {exam ? "Examen finalizado" : "Tema completado"}
        </h2>
        <p className="mx-auto mt-4 max-w-xs text-sm leading-6 text-paper/70">
          {exam
            ? `Resultado final: ${summary.correctAttempts} ${
                summary.correctAttempts === 1 ? "correcta" : "correctas"
              } de ${summary.totalAttempts} respuestas.`
            : "Ya no quedan tarjetas incorrectas en esta sesión."}
        </p>
      </motion.section>

      <section className="mt-12 grid grid-cols-2 gap-3">
        {metrics.map((metric) => (
          <div
            className="flex items-center gap-3 rounded-card border border-white/5 bg-ink-card p-4 shadow-academic"
            key={metric.label}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink">
              <AppIcon className="text-xl text-paper/80" name={metric.icon} />
            </span>
            <span>
              <strong className="block text-2xl leading-none">{metric.value}</strong>
              <span className="mt-1 block text-[11px] font-semibold text-paper/60">
                {metric.label}
              </span>
            </span>
          </div>
        ))}
      </section>

      <section className="mt-10 rounded-card border border-white/5 bg-ink-card p-6">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <AppIcon name="trending-up" />
          {exam ? "Resultado" : "Evolución por pasada"}
        </h2>
        <div className="mt-7 space-y-6">
          {summary.passes.map((pass) => (
            <div key={pass.passNumber}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span>{exam ? "Examen" : `Pasada ${pass.passNumber}`}</span>
                <span>
                  <span className="mr-3 text-paper/60">
                    {pass.correctCount}/{pass.totalCards}
                  </span>
                  {pass.score}%
                </span>
              </div>
              <ProgressBar className="bg-ink" value={pass.score} />
            </div>
          ))}
        </div>
      </section>

      {summary.difficultCards.length > 0 ? (
        <section className="mt-10 rounded-card border border-white/5 bg-ink-card p-6">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <AppIcon name="help" />
            Lo que más costó
          </h2>
          {summary.difficultCards.slice(0, 5).map((item) => (
            <div
              className="border-b border-white/10 py-5 last:border-0"
              key={item.card.id}
            >
              <p className="line-clamp-1">{item.card.question}</p>
              <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-blaze">
                <AppIcon className="text-base" name="info" />
                {item.incorrectCount} error
                {item.incorrectCount === 1 ? "" : "es"}
                {item.correctPassNumber
                  ? ` · Correcta en pasada ${item.correctPassNumber}`
                  : ""}
              </p>
            </div>
          ))}
        </section>
      ) : null}

      <div className="mt-12 space-y-3">
        <Button onClick={() => historyRouter.push(`/temas/${topicId}`)}>
          Volver al tema
        </Button>
        <Button
          className="border-transparent text-paper"
          onClick={() =>
            historyRouter.push(
              exam
                ? `/examen/${topicId}?new=1`
                : `/estudio/${topicId}?new=1`,
            )
          }
          variant="ghost"
        >
          {exam ? "Repetir examen" : "Estudiar de nuevo"}
        </Button>
      </div>
    </ScreenContainer>
  );
}
