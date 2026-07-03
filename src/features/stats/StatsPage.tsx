import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { BrandMark } from "../../components/brand/BrandMark";
import { ScreenContainer } from "../../components/layout/ScreenContainer";
import { AppIcon } from "../../components/ui/AppIcon";
import { Card } from "../../components/ui/Card";
import { Chip } from "../../components/ui/Chip";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { StatCard } from "../../components/ui/StatCard";
import { useStatsStore } from "../../stores/statsStore";
import type { PerformancePoint, StatsPeriod } from "../../types/stats";
import { formatRelativeStudyDate } from "../../utils/dates";

type StatsView = "general" | "courses";

const periodLabels: Record<StatsPeriod, string> = {
  "30d": "Últimos 30 días",
  "90d": "Últimos 90 días",
  all: "Todo el historial",
};

function formatAverage(value: number): string {
  return value === 0 ? "0" : value.toFixed(1);
}

function PerformanceChart({ points }: { points: PerformancePoint[] }) {
  if (points.length === 0) {
    return (
      <div className="mt-6 flex h-44 items-center justify-center rounded-xl bg-slate/5 px-6 text-center text-sm muted-text">
        Completa sesiones de repaso para ver la evolución de tu primera pasada.
      </div>
    );
  }

  const width = 300;
  const height = 180;
  const left = 28;
  const right = 274;
  const top = 18;
  const bottom = 150;
  const positions = points.map((point, index) => ({
    ...point,
    x:
      points.length === 1
        ? (left + right) / 2
        : left + ((right - left) * index) / (points.length - 1),
    y: bottom - ((bottom - top) * point.score) / 100,
  }));
  const latest = positions.at(-1)!;

  return (
    <div className="relative mt-6 h-52">
      <span className="absolute left-0 top-2 text-[10px] muted-text">100%</span>
      <span className="absolute bottom-7 left-1 text-[10px] muted-text">0%</span>
      <svg
        aria-label="Evolución del acierto en primera pasada"
        className="h-full w-full"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        <path
          d={`M${left} ${bottom} H${right} M${left} ${top} V${bottom}`}
          fill="none"
          stroke="rgba(37,89,87,.14)"
          strokeWidth="1"
        />
        <polyline
          fill="none"
          points={positions.map((point) => `${point.x},${point.y}`).join(" ")}
          stroke="#F26419"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="5"
        />
        {positions.map((point, index) => (
          <circle
            cx={point.x}
            cy={point.y}
            fill={index === positions.length - 1 ? "#F26419" : "#FFFFFF"}
            key={point.sessionId}
            r="7"
            stroke="#F26419"
            strokeWidth="4"
          />
        ))}
      </svg>
      <span
        className="absolute rounded bg-ink px-2 py-1 text-[10px] text-white"
        style={{
          left: `${Math.min(82, (latest.x / width) * 100)}%`,
          top: `${Math.max(0, (latest.y / height) * 100 - 8)}%`,
        }}
      >
        {latest.score}%
      </span>
    </div>
  );
}

export function StatsPage() {
  const history = useHistory();
  const [view, setView] = useState<StatsView>("general");
  const dashboard = useStatsStore((state) => state.dashboard);
  const period = useStatsStore((state) => state.period);
  const isLoading = useStatsStore((state) => state.isLoading);
  const error = useStatsStore((state) => state.error);
  const load = useStatsStore((state) => state.load);
  const setPeriod = useStatsStore((state) => state.setPeriod);

  useEffect(() => {
    void load();
  }, [load]);

  const global = dashboard?.global;
  const difficultyTotal =
    (global?.firstPassCards ?? 0) + (global?.multiPassCards ?? 0);
  const firstPassPercentage =
    difficultyTotal === 0
      ? 0
      : Math.round(((global?.firstPassCards ?? 0) / difficultyTotal) * 100);
  const multiPassPercentage =
    difficultyTotal === 0 ? 0 : 100 - firstPassPercentage;

  return (
    <ScreenContainer className="!bg-paper dark:!bg-ink">
      <div className="flex items-center gap-2">
        <BrandMark className="h-8 w-8" />
        <strong>FlashStudy</strong>
      </div>

      <div className="mt-9 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold">Estadísticas</h1>
          <p className="mt-1 text-sm muted-text">Tu rendimiento de estudio</p>
        </div>
        <label className="relative">
          <span className="sr-only">Periodo estadístico</span>
          <select
            className="min-h-12 appearance-none rounded-xl border-0 bg-slate/10 py-2 pl-4 pr-9 text-xs text-[var(--fs-text)] outline-none"
            disabled={isLoading}
            onChange={(event) =>
              void setPeriod(event.target.value as StatsPeriod)
            }
            value={period}
          >
            {Object.entries(periodLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <AppIcon
            className="pointer-events-none absolute right-3 top-4 text-base"
            name="chevron-down"
          />
        </label>
      </div>

      <div className="mt-7 flex rounded-xl bg-slate/10 p-1">
        <button
          className={`h-10 flex-1 rounded-lg text-xs ${
            view === "general" ? "bg-white text-ink shadow-sm" : ""
          }`}
          onClick={() => setView("general")}
          type="button"
        >
          General
        </button>
        <button
          className={`h-10 flex-1 rounded-lg text-xs ${
            view === "courses" ? "bg-white text-ink shadow-sm" : ""
          }`}
          onClick={() => setView("courses")}
          type="button"
        >
          Por curso
        </button>
      </div>

      {error ? (
        <Card className="mt-7 border border-mahogany/15 text-sm text-mahogany">
          {error}
        </Card>
      ) : null}

      {view === "general" ? (
        <>
          <section className="mt-7 grid grid-cols-2 gap-4">
            <StatCard
              accent
              icon="files"
              label="Tarjetas estudiadas"
              value={String(global?.studiedCards ?? 0)}
            />
            <StatCard
              accent
              icon="school"
              label="Dominio"
              value={`${global?.mastery ?? 0}%`}
            />
            <StatCard
              accent
              icon="check"
              label="Acierto en primera pasada"
              value={`${global?.firstPassAccuracy ?? 0}%`}
            />
            <StatCard
              accent
              icon="refresh"
              label="Promedio de pasadas"
              value={formatAverage(global?.averagePasses ?? 0)}
            />
          </section>

          <Card className="mt-7">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Evolución del rendimiento</h2>
              <Chip>
                {global?.sessions ?? 0}{" "}
                {(global?.sessions ?? 0) === 1 ? "sesión" : "sesiones"}
              </Chip>
            </div>
            <PerformanceChart points={global?.performance ?? []} />
          </Card>

          <Card className="mt-7">
            <h2 className="text-xl font-semibold">Resultado por dificultad</h2>
            <div className="mt-7">
              <div className="mb-2 flex justify-between text-xs">
                <span>Primera pasada</span>
                <strong>
                  {global?.firstPassCards ?? 0}{" "}
                  {(global?.firstPassCards ?? 0) === 1
                    ? "tarjeta"
                    : "tarjetas"}
                </strong>
              </div>
              <ProgressBar tone="green" value={firstPassPercentage} />
              <div className="mb-2 mt-5 flex justify-between text-xs">
                <span>Varias pasadas</span>
                <strong className="text-blaze">
                  {global?.multiPassCards ?? 0}{" "}
                  {(global?.multiPassCards ?? 0) === 1
                    ? "tarjeta"
                    : "tarjetas"}
                </strong>
              </div>
              <ProgressBar value={multiPassPercentage} />
            </div>
          </Card>

          <Card className="mt-7">
            <h2 className="text-xl font-semibold">Modo examen</h2>
            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div>
                <strong className="block text-2xl text-blaze">
                  {global?.exam.sessions ?? 0}
                </strong>
                <span className="mt-2 block text-[11px] muted-text">
                  EXÁMENES
                </span>
              </div>
              <div>
                <strong className="block text-2xl text-blaze">
                  {global?.exam.answeredCards ?? 0}
                </strong>
                <span className="mt-2 block text-[11px] muted-text">
                  RESPUESTAS
                </span>
              </div>
              <div>
                <strong className="block text-2xl text-blaze">
                  {global?.exam.accuracy ?? 0}%
                </strong>
                <span className="mt-2 block text-[11px] muted-text">
                  ACIERTO
                </span>
              </div>
            </div>
          </Card>

          <Card className="mt-7">
            <h2 className="text-xl font-semibold">Temas con más errores</h2>
            <div className="mt-5">
              {dashboard?.topicsWithMostErrors.length ? (
                dashboard.topicsWithMostErrors.map((topic) => (
                  <button
                    className="flex min-h-14 w-full items-center justify-between gap-4 border-b subtle-divider py-3 text-left last:border-0"
                    key={topic.topicId}
                    onClick={() =>
                      history.push(`/estadisticas/temas/${topic.topicId}`)
                    }
                    type="button"
                  >
                    <span className="line-clamp-1 text-sm">{topic.title}</span>
                    <Chip className="shrink-0" tone="danger">
                      {topic.errorCount} errores
                    </Chip>
                  </button>
                ))
              ) : (
                <p className="py-5 text-sm muted-text">
                  Todavía no hay errores registrados en este periodo.
                </p>
              )}
            </div>
          </Card>

          <section className="mt-9">
            <h2 className="text-xl font-semibold">Resumen por curso</h2>
            <div className="mt-5 space-y-4">
              {(dashboard?.courses ?? []).map((course) => (
                <button
                  className="block w-full text-left"
                  key={course.courseId}
                  onClick={() => setView("courses")}
                  type="button"
                >
                  <Card className="p-4">
                    <div className="mb-3 flex justify-between gap-4 text-xs font-semibold">
                      <span className="line-clamp-1">{course.name}</span>
                      <span className="text-blaze">{course.mastery}%</span>
                    </div>
                    <ProgressBar value={course.mastery} />
                  </Card>
                </button>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="mt-7 space-y-5">
          {(dashboard?.courses ?? []).map((course) => {
            const topics = dashboard?.topics.filter(
              (topic) => topic.courseId === course.courseId,
            );
            return (
              <Card key={course.courseId}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">{course.name}</h2>
                    <p className="mt-2 text-xs muted-text">
                      {course.topicCount}{" "}
                      {course.topicCount === 1 ? "tema" : "temas"} ·{" "}
                      {course.cardCount}{" "}
                      {course.cardCount === 1 ? "tarjeta" : "tarjetas"}
                    </p>
                  </div>
                  <strong className="text-2xl text-blaze">
                    {course.historicalAccuracy}%
                  </strong>
                </div>
                <ProgressBar className="mt-5" value={course.mastery} />
                <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-slate/5 p-3">
                    <span className="block text-xs muted-text">Sesiones</span>
                    <strong className="mt-1 block">{course.sessions}</strong>
                  </div>
                  <div className="rounded-xl bg-slate/5 p-3">
                    <span className="block text-xs muted-text">
                      Promedio pasadas
                    </span>
                    <strong className="mt-1 block">
                      {formatAverage(course.averagePasses)}
                    </strong>
                  </div>
                  <div className="rounded-xl bg-slate/5 p-3">
                    <span className="block text-xs muted-text">Exámenes</span>
                    <strong className="mt-1 block">{course.examSessions}</strong>
                  </div>
                  <div className="rounded-xl bg-slate/5 p-3">
                    <span className="block text-xs muted-text">
                      Último estudio
                    </span>
                    <strong className="mt-1 block text-xs">
                      {formatRelativeStudyDate(course.lastStudiedAt)}
                    </strong>
                  </div>
                </div>
                <div className="mt-6 border-t subtle-divider pt-3">
                  {topics?.length ? (
                    topics.map((topic) => (
                      <button
                        className="flex min-h-14 w-full items-center justify-between gap-3 border-b subtle-divider py-3 text-left last:border-0"
                        key={topic.topicId}
                        onClick={() =>
                          history.push(`/estadisticas/temas/${topic.topicId}`)
                        }
                        type="button"
                      >
                        <span className="min-w-0">
                          <span className="line-clamp-1 block text-sm">
                            {topic.title}
                          </span>
                          <span className="mt-1 block text-xs muted-text">
                            {topic.sessions}{" "}
                            {topic.sessions === 1 ? "sesión" : "sesiones"} ·{" "}
                            {topic.mastery}% dominio
                          </span>
                        </span>
                        <AppIcon
                          className="shrink-0 text-xl"
                          name="chevron-forward"
                        />
                      </button>
                    ))
                  ) : (
                    <p className="py-4 text-sm muted-text">
                      Este curso todavía no tiene temas.
                    </p>
                  )}
                </div>
              </Card>
            );
          })}
        </section>
      )}
    </ScreenContainer>
  );
}
