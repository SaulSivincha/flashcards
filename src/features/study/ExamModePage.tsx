import { useEffect, useState } from "react";
import { useHistory, useLocation, useParams } from "react-router-dom";
import { ScreenContainer } from "../../components/layout/ScreenContainer";
import { AppIcon } from "../../components/ui/AppIcon";
import { Button } from "../../components/ui/Button";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { useSettingsStore } from "../../stores/settingsStore";
import { useStudyStore } from "../../stores/studyStore";
import type { AttemptResult } from "../../types/study";

export function ExamModePage() {
  const history = useHistory();
  const location = useLocation();
  const { topicId } = useParams<{ topicId: string }>();
  const [answerOpen, setAnswerOpen] = useState(false);
  const [result, setResult] = useState<AttemptResult>();
  const snapshot = useStudyStore((state) => state.snapshot);
  const topic = useStudyStore((state) => state.topic);
  const isLoading = useStudyStore((state) => state.isLoading);
  const isSubmitting = useStudyStore((state) => state.isSubmitting);
  const error = useStudyStore((state) => state.error);
  const begin = useStudyStore((state) => state.begin);
  const answer = useStudyStore((state) => state.answer);
  const finishExam = useStudyStore((state) => state.finishExam);
  const settings = useSettingsStore((state) => state.settings);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const forceNew = query.get("new") === "1";
    const shuffle =
      query.get("order") === "random" ||
      (!query.get("order") && settings?.defaultStudyOrder === "random");
    void begin(topicId, "exam", { shuffle, forceNew })
      .then(() => {
        if (forceNew) {
          history.replace(`/examen/${topicId}`);
        }
      })
      .catch(() => undefined);
  }, [
    begin,
    history,
    location.search,
    settings?.defaultStudyOrder,
    topicId,
  ]);

  const card = snapshot?.currentCard;
  const session = snapshot?.session;
  const pass = snapshot?.pass;
  const current = (session?.currentCardIndex ?? 0) + 1;
  const progress =
    pass && pass.totalCards > 0 ? Math.round((current / pass.totalCards) * 100) : 0;

  useEffect(() => {
    setAnswerOpen(false);
    setResult(undefined);
  }, [card?.id]);

  async function saveAndContinue(): Promise<void> {
    if (!result) {
      return;
    }
    const outcome = await answer(result);
    if (outcome.sessionCompleted) {
      history.replace(`/estudio/${topicId}/resumen?mode=exam`);
    }
  }

  async function finishEarly(): Promise<void> {
    await finishExam();
    history.replace(`/estudio/${topicId}/resumen?mode=exam`);
  }

  if (isLoading || !snapshot || !topic || !session || !pass) {
    return (
      <ScreenContainer className="!bg-[#111A36] !text-paper" dark focused>
        <div className="flex min-h-[70vh] items-center justify-center text-center">
          <p className={error ? "text-mahogany" : ""}>
            {error ?? "Preparando examen…"}
          </p>
        </div>
      </ScreenContainer>
    );
  }

  if (!card) {
    return null;
  }

  return (
    <ScreenContainer className="!bg-[#111A36] !text-paper" dark focused>
      <header className="flex min-h-14 items-center justify-between">
        <button
          aria-label="Cerrar examen"
          className="flex h-12 w-12 items-center justify-start"
          onClick={() => history.push(`/temas/${topicId}`)}
          type="button"
        >
          <AppIcon className="text-3xl" name="close" />
        </button>
        <h1 className="text-2xl font-semibold">Modo examen</h1>
        <AppIcon className="text-3xl text-paper/80" name="info" />
      </header>

      <div className="mt-8 flex items-start gap-3 rounded-xl bg-white/5 p-4 text-sm font-semibold leading-6 text-paper/75">
        <AppIcon className="mt-0.5 text-2xl" name="alert" />
        Sin retroalimentación inmediata. Revisa tus resultados al finalizar.
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between text-lg font-semibold">
          <span>
            Pregunta {current} de {pass.totalCards}
          </span>
          <span className="text-[#FFD7C0]">{progress}%</span>
        </div>
        <ProgressBar className="bg-white/10" value={progress} />
      </section>

      <section className="mt-8 rounded-card bg-[#424D6A] p-6 shadow-active">
        <span className="inline-flex rounded-full bg-[#26304D] px-4 py-2 text-xs font-semibold">
          {card.category}
        </span>
        <h2 className="mt-8 text-2xl leading-[1.55]">{card.question}</h2>

        <div className="mt-10 overflow-hidden rounded-xl border border-white/20 bg-[#303A58]">
          <button
            className="flex min-h-14 w-full items-center justify-between px-4 text-left text-sm font-semibold"
            onClick={() => setAnswerOpen((currentValue) => !currentValue)}
            type="button"
          >
            Mostrar respuesta para autoevaluar
            <AppIcon
              className={`text-xl transition-transform ${
                answerOpen ? "rotate-180" : ""
              }`}
              name="chevron-down"
            />
          </button>
          {answerOpen ? (
            <p className="border-t border-white/15 bg-[#27314D] p-4 text-base leading-7 text-paper/90">
              {card.answer}
            </p>
          ) : null}
        </div>

        <div className="mt-7">
          <p className="mb-3 text-sm font-semibold">Mi respuesta fue:</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 ${
                result === "correct"
                  ? "border-[#FFD7C0] bg-[#FFD7C0]/10 text-[#FFD7C0]"
                  : "border-white/20"
              }`}
              onClick={() => setResult("correct")}
              type="button"
            >
              <AppIcon className="text-xl" name="check" />
              Correcta
            </button>
            <button
              className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 ${
                result === "incorrect"
                  ? "border-mahogany text-white"
                  : "border-white/20 text-paper/60"
              }`}
              onClick={() => setResult("incorrect")}
              type="button"
            >
              <AppIcon className="text-xl" name="close-circle" />
              Incorrecta
            </button>
          </div>
        </div>
      </section>

      <div className="mt-8 grid grid-cols-[1fr_2fr] gap-3">
        <Button
          className="border-white/25 text-paper"
          disabled
          variant="secondary"
        >
          Anterior
        </Button>
        <Button
          className="bg-[#FFD7C0] text-ink"
          disabled={!result || isSubmitting}
          onClick={() => void saveAndContinue()}
          variant="primary"
        >
          Guardar y siguiente
        </Button>
      </div>
      <button
        className="mt-5 min-h-12 w-full text-sm font-semibold text-[#FFD7C0] underline underline-offset-4 disabled:opacity-50"
        disabled={isSubmitting}
        onClick={() => void finishEarly()}
        type="button"
      >
        Finalizar examen
      </button>
      <p className="text-center text-xs font-semibold text-paper/30">
        {session.currentCardIndex ?? 0} respondidas ·{" "}
        {pass.totalCards - (session.currentCardIndex ?? 0)} pendientes
      </p>
      {error ? <p className="mt-3 text-center text-sm text-mahogany">{error}</p> : null}
    </ScreenContainer>
  );
}
