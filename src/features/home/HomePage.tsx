import { useHistory } from "react-router-dom";
import { ScreenContainer } from "../../components/layout/ScreenContainer";
import { AppIcon } from "../../components/ui/AppIcon";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { StatCard } from "../../components/ui/StatCard";
import { useCourseStore } from "../../stores/courseStore";
import { useTopicStore } from "../../stores/topicStore";
import { useStudyStore } from "../../stores/studyStore";
import { useStatsStore } from "../../stores/statsStore";
import { formatRelativeStudyDate } from "../../utils/dates";

export function HomePage() {
  const history = useHistory();
  const courses = useCourseStore((state) => state.courses);
  const recentTopics = useTopicStore((state) => state.recentTopics);
  const activeCourses = courses.filter((course) => course.topicCount > 0).length;
  const topicCount = courses.reduce((sum, course) => sum + course.topicCount, 0);
  const firstTopic = recentTopics[0];
  const firstCourse = courses.find((course) => course.id === firstTopic?.courseId);
  const activeSession = useStudyStore((state) => state.activeSession);
  const activeTopic = useStudyStore((state) => state.activeTopic);
  const studyTopic = activeTopic ?? firstTopic;
  const studyCourse = courses.find(
    (course) => course.id === studyTopic?.courseId,
  );
  const currentCard = (activeSession?.currentCardIndex ?? 0) + 1;
  const currentTotal = activeSession?.currentCardIds?.length ?? studyTopic?.cardCount ?? 0;
  const studyProgress = activeSession
    ? currentTotal === 0
      ? 0
      : Math.round((currentCard / currentTotal) * 100)
    : studyTopic?.progress ?? 0;
  const globalStats = useStatsStore((state) => state.dashboard?.global);
  const hasStudyContent = Boolean(studyTopic);

  return (
    <ScreenContainer className="!bg-paper dark:!bg-ink">
      <div className="mb-8 flex items-start justify-between pt-4">
        <div>
          <h1 className="mt-2 text-[29px] font-semibold leading-tight">
            Listo para estudiar
          </h1>
          <p className="mt-2 text-sm muted-text">
            Organiza tus cursos y estudia a tu ritmo
          </p>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-academic">
          <AppIcon className="text-3xl text-ink" name="school" />
        </div>
      </div>

      {hasStudyContent ? (
        <Card className="!bg-ink p-7 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/70">
            Continuar estudio
          </p>
          <h2 className="mt-6 text-2xl font-semibold">
            {studyCourse?.name ?? firstCourse?.name ?? "Curso"}
          </h2>
          <p className="mt-2 text-lg text-white/80">{studyTopic?.title}</p>
          <div className="mt-8 flex items-center justify-between text-sm">
            <span>
              {activeSession
                ? `Pregunta ${currentCard} de ${currentTotal} · Pasada ${activeSession.currentPassNumber ?? 1}`
                : `${currentTotal} tarjetas disponibles`}
            </span>
            <span className="font-semibold text-blaze">{studyProgress}%</span>
          </div>
          <ProgressBar className="mt-3 bg-slate/40" value={studyProgress} />
          <Button
            className="mt-7"
            onClick={() =>
              history.push(
                activeSession?.mode === "exam"
                  ? `/examen/${activeSession.topicId}`
                  : `/estudio/${studyTopic!.id}`,
              )
            }
          >
            <AppIcon className="text-xl" name="play" />
            {activeSession ? "Continuar estudio" : "Iniciar estudio"}
          </Button>
        </Card>
      ) : (
        <Card className="!bg-ink p-7 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/70">
            Comienza desde cero
          </p>
          <h2 className="mt-5 text-2xl font-semibold">Crea tu primer curso</h2>
          <p className="mt-3 text-sm text-white/75">
            Después podrás importar tus temas y flashcards desde archivos CSV.
          </p>
          <Button className="mt-7" onClick={() => history.push("/cursos")}>
            <AppIcon className="text-xl" name="add" />
            Ir a mis cursos
          </Button>
        </Card>
      )}

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Tu progreso</h2>
        <div className="mt-7 grid grid-cols-2 gap-4">
          <StatCard
            icon="book"
            label="Cursos activos"
            value={String(activeCourses)}
          />
          <StatCard
            icon="folder"
            label="Temas cargados"
            value={String(topicCount)}
          />
          <StatCard
            icon="files"
            label="Tarjetas estudiadas"
            value={String(globalStats?.studiedCards ?? 0)}
          />
          <StatCard
            accent
            icon="trending-up"
            label="Avance general"
            value={`${globalStats?.mastery ?? 0}%`}
          />
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Estudiados recientemente</h2>
          <button
            className="min-h-12 px-2 text-sm font-medium text-slate"
            onClick={() => history.push("/cursos")}
            type="button"
          >
            Ver todos
          </button>
        </div>
        <div className="mt-5 space-y-4">
          {recentTopics.slice(0, 2).map((topic) => {
            const course = courses.find((item) => item.id === topic.courseId);
            return (
            <button
              className="block w-full text-left"
              key={topic.id}
              onClick={() => history.push(`/temas/${topic.id}`)}
              type="button"
            >
            <Card className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="line-clamp-1 text-xl">{topic.title}</h3>
                  <p className="mt-1 text-sm">{course?.name ?? "Curso"}</p>
                </div>
                <span className="text-xl">{topic.progress}%</span>
              </div>
              <ProgressBar
                className="mt-5"
                tone="green"
                value={topic.progress}
              />
              <p className="mt-4 text-right text-xs tracking-[0.12em] text-slate/55">
                {formatRelativeStudyDate(topic.lastStudiedAt).toUpperCase()}
              </p>
            </Card>
            </button>
          )})}
          {recentTopics.length === 0 ? (
            <EmptyState
              description="Los temas que estudies aparecerán aquí."
              title="Aún no hay actividad"
            />
          ) : null}
        </div>
      </section>
    </ScreenContainer>
  );
}
