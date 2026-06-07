import { useEffect } from "react";
import { useHistory, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { PageHeader } from "../../components/layout/PageHeader";
import { ScreenContainer } from "../../components/layout/ScreenContainer";
import { AppIcon } from "../../components/ui/AppIcon";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Chip } from "../../components/ui/Chip";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { useStudyStore } from "../../stores/studyStore";

export function PassResultPage() {
  const history = useHistory();
  const { topicId } = useParams<{ topicId: string }>();
  const snapshot = useStudyStore((state) => state.snapshot);
  const isLoading = useStudyStore((state) => state.isLoading);
  const isSubmitting = useStudyStore((state) => state.isSubmitting);
  const error = useStudyStore((state) => state.error);
  const begin = useStudyStore((state) => state.begin);
  const beginNextPass = useStudyStore((state) => state.beginNextPass);

  useEffect(() => {
    if (
      snapshot?.session.topicId !== topicId ||
      snapshot?.session.mode !== "review"
    ) {
      void begin(topicId, "review").catch(() => undefined);
    }
  }, [begin, snapshot?.session.mode, snapshot?.session.topicId, topicId]);

  const pass = snapshot?.pass;
  const incorrectCards = snapshot?.incorrectCards ?? [];
  const answered = pass ? pass.correctCount + pass.incorrectCount : 0;
  const score =
    pass && pass.totalCards > 0
      ? Math.round((pass.correctCount / pass.totalCards) * 100)
      : 0;

  useEffect(() => {
    if (
      !isLoading &&
      snapshot?.currentCard &&
      answered < (pass?.totalCards ?? 0)
    ) {
      history.replace(`/estudio/${topicId}`);
    }
  }, [
    answered,
    history,
    isLoading,
    pass?.totalCards,
    snapshot?.currentCard,
    topicId,
  ]);

  async function handleNextPass(): Promise<void> {
    await beginNextPass();
    history.replace(`/estudio/${topicId}`);
  }

  if (isLoading || !snapshot || !pass) {
    return (
      <ScreenContainer focused>
        <div className="flex min-h-[70vh] items-center justify-center text-center">
          <p className={error ? "text-mahogany" : ""}>
            {error ?? "Preparando el resultado…"}
          </p>
        </div>
      </ScreenContainer>
    );
  }

  const metrics = [
    { value: String(answered), label: "ESTUDIADAS", tone: "text-ink" },
    {
      value: String(pass.correctCount),
      label: "CORRECTAS",
      tone: "text-slate",
    },
    {
      value: String(pass.incorrectCount),
      label: "INCORRECTAS",
      tone: "text-mahogany",
    },
    { value: `${score}%`, label: "ACIERTO", tone: "text-blaze" },
  ];

  return (
    <ScreenContainer focused>
      <PageHeader
        close
        onClose={() => history.push(`/temas/${topicId}`)}
        title="Resumen de la pasada"
      />

      <motion.section
        animate={{ y: 0 }}
        className="text-center"
        initial={{ y: 16 }}
        transition={{ duration: 0.35 }}
      >
        <div
          className="relative mx-auto flex h-36 w-36 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(#F26419 0 ${score}%, #E8E8E8 ${score}% 100%)`,
          }}
        >
          <div className="flex h-[116px] w-[116px] items-center justify-center rounded-full bg-[var(--fs-background-soft)]">
            <span className="text-3xl font-semibold text-blaze">{score}%</span>
          </div>
        </div>
        <h1 className="mt-10 text-xl font-semibold">
          Pasada {pass.passNumber} completada
        </h1>
        <p className="mx-auto mt-3 max-w-xs text-sm leading-6 muted-text">
          Buen avance. Repasa las que faltan para dominar el tema.
        </p>
      </motion.section>

      <section className="mt-10 grid grid-cols-2 gap-3">
        {metrics.map((metric) => (
          <Card className="p-5 text-center" key={metric.label}>
            <p className={`text-3xl font-semibold ${metric.tone}`}>
              {metric.value}
            </p>
            <p className="mt-3 text-[11px] font-medium tracking-wider">
              {metric.label}
            </p>
          </Card>
        ))}
      </section>

      <Card className="mt-10">
        <h2 className="text-xl font-semibold">Avance entre pasadas</h2>
        <p className="mt-3 text-sm muted-text">
          La siguiente pasada incluirá solo {incorrectCards.length}{" "}
          {incorrectCards.length === 1 ? "tarjeta" : "tarjetas"}.
        </p>
        <div className="mt-6">
          <div className="mb-2 flex justify-between text-xs">
            <span>Pasada {pass.passNumber}</span>
            <span className="text-blaze">{score}%</span>
          </div>
          <ProgressBar value={score} />
          <div className="mb-2 mt-5 flex justify-between text-xs muted-text">
            <span>Siguiente objetivo</span>
            <span>{100 - score}% pendiente</span>
          </div>
          <div className="h-2 rounded-full border-2 border-dashed border-slate/20" />
        </div>
      </Card>

      <Card className="mt-10">
        <div className="flex items-center justify-between border-b subtle-divider pb-4">
          <h2 className="text-xl font-semibold">Necesitan repaso</h2>
          <Chip tone="danger">
            {incorrectCards.length}{" "}
            {incorrectCards.length === 1 ? "tarjeta" : "tarjetas"}
          </Chip>
        </div>
        <div>
          {incorrectCards.map((card) => (
            <div
              className="flex items-center justify-between gap-3 border-b subtle-divider py-4 last:border-0"
              key={card.id}
            >
              <div className="min-w-0">
                <p className="line-clamp-1 text-sm">{card.question}</p>
                <p className="mt-1 text-xs muted-text">{card.category}</p>
              </div>
              <Chip className="shrink-0" tone="danger">
                Incorrecta
              </Chip>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-10 space-y-3">
        <Button disabled={isSubmitting} onClick={() => void handleNextPass()}>
          <AppIcon className="text-xl" name="repeat" />
          Repasar {incorrectCards.length}{" "}
          {incorrectCards.length === 1 ? "incorrecta" : "incorrectas"}
        </Button>
        <Button
          onClick={() => history.push(`/temas/${topicId}`)}
          variant="secondary"
        >
          Volver al tema
        </Button>
        {error ? <p className="text-center text-sm text-mahogany">{error}</p> : null}
      </div>
    </ScreenContainer>
  );
}
