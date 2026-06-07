import { useEffect } from "react";
import { useHistory, useParams } from "react-router-dom";
import { PageHeader } from "../../components/layout/PageHeader";
import { ScreenContainer } from "../../components/layout/ScreenContainer";
import { AppIcon } from "../../components/ui/AppIcon";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Chip } from "../../components/ui/Chip";
import { EmptyState } from "../../components/ui/EmptyState";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { StatCard } from "../../components/ui/StatCard";
import { useStatsStore } from "../../stores/statsStore";
import { formatRelativeStudyDate } from "../../utils/dates";

function formatAverage(value: number): string {
  return value === 0 ? "0" : value.toFixed(1);
}

export function TopicStatsPage() {
  const history = useHistory();
  const { topicId } = useParams<{ topicId: string }>();
  const dashboard = useStatsStore((state) => state.dashboard);
  const isLoading = useStatsStore((state) => state.isLoading);
  const error = useStatsStore((state) => state.error);
  const load = useStatsStore((state) => state.load);
  const topic = dashboard?.topics.find((item) => item.topicId === topicId);
  const cards = (dashboard?.cards ?? [])
    .filter((card) => card.topicId === topicId && card.seenCount > 0)
    .sort(
      (left, right) =>
        right.incorrectCount - left.incorrectCount ||
        left.accuracy - right.accuracy,
    );

  useEffect(() => {
    if (!dashboard) {
      void load();
    }
  }, [dashboard, load]);

  if (!isLoading && !topic) {
    return (
      <ScreenContainer>
        <PageHeader back title="Estadísticas del tema" />
        <EmptyState
          description={
            error ??
            "El tema solicitado no existe o no está disponible en este periodo."
          }
          title="Estadísticas no encontradas"
        />
      </ScreenContainer>
    );
  }

  if (!topic) {
    return (
      <ScreenContainer>
        <PageHeader back title="Estadísticas del tema" />
        <p className="py-20 text-center muted-text">Calculando estadísticas…</p>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <PageHeader back title="Estadísticas del tema" />

      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] muted-text">
          {topic.courseName} · {topic.unit}
        </p>
        <h1 className="mt-4 text-[30px] font-bold leading-tight">
          {topic.title}
        </h1>
        <p className="mt-4 text-sm muted-text">
          Última sesión: {formatRelativeStudyDate(topic.lastSessionAt)}
        </p>
      </section>

      <section className="mt-8 grid grid-cols-2 gap-4">
        <StatCard
          accent
          compact
          icon="files"
          label="Tarjetas"
          value={String(topic.cardCount)}
        />
        <StatCard
          accent
          compact
          icon="folder"
          label="Categorías"
          value={String(topic.categoryCount)}
        />
        <StatCard
          accent
          compact
          icon="check"
          label="Aciertos acumulados"
          value={String(topic.correctCount)}
        />
        <StatCard
          accent
          compact
          icon="close-circle"
          label="Errores acumulados"
          value={String(topic.incorrectCount)}
        />
      </section>

      <Card className="mt-7">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Progreso histórico</h2>
          <strong className="text-2xl text-blaze">{topic.mastery}%</strong>
        </div>
        <ProgressBar className="mt-5" value={topic.mastery} />
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          <div>
            <strong className="block text-xl">{topic.sessions}</strong>
            <span className="mt-1 block text-[10px] muted-text">SESIONES</span>
          </div>
          <div>
            <strong className="block text-xl">
              {formatAverage(topic.averagePasses)}
            </strong>
            <span className="mt-1 block text-[10px] muted-text">
              PASADAS PROM.
            </span>
          </div>
          <div>
            <strong className="block text-xl">{topic.examSessions}</strong>
            <span className="mt-1 block text-[10px] muted-text">EXÁMENES</span>
          </div>
        </div>
      </Card>

      <Card className="mt-7">
        <h2 className="text-xl font-semibold">Mejor sesión</h2>
        {topic.bestSession ? (
          <div className="mt-5 flex items-center justify-between gap-4">
            <div>
              <Chip tone={topic.bestSession.mode === "exam" ? "orange" : "success"}>
                {topic.bestSession.mode === "exam" ? "Examen" : "Repaso"}
              </Chip>
              <p className="mt-3 text-sm muted-text">
                {topic.bestSession.totalPasses}{" "}
                {topic.bestSession.totalPasses === 1 ? "pasada" : "pasadas"}
              </p>
            </div>
            <strong className="text-4xl text-blaze">
              {topic.bestSession.score}%
            </strong>
          </div>
        ) : (
          <p className="mt-4 text-sm muted-text">
            Completa una sesión para registrar tu mejor resultado.
          </p>
        )}
      </Card>

      <Card className="mt-7">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Estadísticas por tarjeta</h2>
          <Chip>
            {cards.length} {cards.length === 1 ? "estudiada" : "estudiadas"}
          </Chip>
        </div>
        <div className="mt-4">
          {cards.length ? (
            cards.slice(0, 10).map((card) => (
              <div
                className="border-b subtle-divider py-4 last:border-0"
                key={card.cardId}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm">{card.question}</p>
                    <p className="mt-1 text-xs muted-text">{card.category}</p>
                  </div>
                  <strong
                    className={
                      card.accuracy >= 70 ? "text-slate" : "text-mahogany"
                    }
                  >
                    {card.accuracy}%
                  </strong>
                </div>
                <p className="mt-3 text-xs muted-text">
                  {card.seenCount}{" "}
                  {card.seenCount === 1 ? "vista" : "vistas"} ·{" "}
                  {card.correctCount}{" "}
                  {card.correctCount === 1 ? "correcta" : "correctas"} ·{" "}
                  {card.incorrectCount}{" "}
                  {card.incorrectCount === 1 ? "incorrecta" : "incorrectas"}
                  {card.bestPassNumber
                    ? ` · Mejor pasada ${card.bestPassNumber}`
                    : ""}
                </p>
              </div>
            ))
          ) : (
            <p className="py-5 text-sm muted-text">
              No hay tarjetas estudiadas en el periodo seleccionado.
            </p>
          )}
        </div>
      </Card>

      <div className="mt-8 space-y-3">
        <Button onClick={() => history.push(`/temas/${topicId}`)}>
          <AppIcon className="text-xl" name="play" />
          Estudiar este tema
        </Button>
        <Button
          onClick={() => history.push("/estadisticas")}
          variant="secondary"
        >
          Volver a estadísticas
        </Button>
      </div>
    </ScreenContainer>
  );
}
