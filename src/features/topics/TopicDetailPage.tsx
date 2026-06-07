import { useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { PageHeader } from "../../components/layout/PageHeader";
import { ScreenContainer } from "../../components/layout/ScreenContainer";
import { AppIcon } from "../../components/ui/AppIcon";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { useTopicStore } from "../../stores/topicStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { formatRelativeStudyDate } from "../../utils/dates";

export function TopicDetailPage() {
  const history = useHistory();
  const { topicId } = useParams<{ topicId: string }>();
  const topic = useTopicStore((state) => state.currentTopic);
  const isLoading = useTopicStore((state) => state.isLoading);
  const loadDetails = useTopicStore((state) => state.loadDetails);
  const defaultStudyOrder = useSettingsStore(
    (state) => state.settings?.defaultStudyOrder,
  );
  const [studyOrder, setStudyOrder] = useState<"normal" | "random">(
    defaultStudyOrder ?? "normal",
  );

  useEffect(() => {
    void loadDetails(topicId);
  }, [loadDetails, topicId]);

  useEffect(() => {
    if (defaultStudyOrder) {
      setStudyOrder(defaultStudyOrder);
    }
  }, [defaultStudyOrder]);

  function studyUrl(category?: string): string {
    const query = new URLSearchParams({
      new: "1",
      order: studyOrder,
    });
    if (category) {
      query.set("category", category);
    }
    return `/estudio/${topicId}?${query.toString()}`;
  }

  if (!topic && !isLoading) {
    return (
      <ScreenContainer>
        <PageHeader back title="Tema" />
        <EmptyState
          description="El tema solicitado no existe en la base de datos local."
          title="Tema no encontrado"
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <PageHeader back more title="Categorías del tema" />

      <section>
        <p className="text-xs font-medium uppercase tracking-[0.16em] muted-text">
          {topic?.courseName ?? "Cargando"} · {topic?.unit ?? ""}
        </p>
        <h1 className="mt-5 text-[32px] font-bold leading-[1.28]">
          {topic?.title ?? "Cargando tema…"}
        </h1>
        <p className="mt-6 text-sm muted-text">
          {topic?.cardCount ?? 0} tarjetas · {topic?.categoryCount ?? 0}{" "}
          {(topic?.categoryCount ?? 0) === 1 ? "categoría" : "categorías"} ·
          Última práctica:{" "}
          {formatRelativeStudyDate(topic?.lastStudiedAt).replace("Estudiado ", "")}
        </p>
      </section>

      <Card className="mt-10">
        <div className="flex rounded-xl bg-slate/10 p-1">
          <button
            className={`h-12 flex-1 rounded-lg text-sm ${
              studyOrder === "normal" ? "bg-white shadow-sm" : "muted-text"
            }`}
            onClick={() => setStudyOrder("normal")}
            type="button"
          >
            En orden
          </button>
          <button
            className={`h-12 flex-1 rounded-lg text-sm ${
              studyOrder === "random" ? "bg-white shadow-sm" : "muted-text"
            }`}
            onClick={() => setStudyOrder("random")}
            type="button"
          >
            Aleatorio
          </button>
        </div>
        <p className="mt-4 text-center text-xs font-semibold muted-text">
          El orden se mantendrá durante esta sesión
        </p>
        <Button
          className="mt-8"
          disabled={!topic?.cardCount}
          onClick={() => history.push(studyUrl())}
        >
          <AppIcon className="text-xl" name="play" />
          Estudiar todo el tema
        </Button>
        <Button
          className="mt-3"
          disabled={!topic?.cardCount}
          onClick={() =>
            history.push(`/examen/${topicId}?new=1&order=${studyOrder}`)
          }
          variant="secondary"
        >
          Modo examen
        </Button>
      </Card>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Categorías</h2>
        <p className="mt-2 muted-text">Elige una categoría para practicarla</p>
        <div className="mt-7 space-y-3">
          {(topic?.categories ?? []).map((category, index) => (
            <button
              className="academic-card relative flex w-full items-center gap-4 overflow-hidden p-4 text-left active:scale-[0.99]"
              key={category.name}
              onClick={() => history.push(studyUrl(category.name))}
              type="button"
            >
              {category.progress === 100 ? (
                <span className="absolute right-0 top-0 rounded-bl-lg bg-slate px-3 py-1 text-[10px] font-bold text-white">
                  DOMINADA
                </span>
              ) : null}
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate/10 text-sm">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-1 block text-sm">
                  {category.name}
                </span>
                <span className="mt-2 flex items-center justify-between text-xs font-semibold">
                  <span>{category.cardCount} preguntas</span>
                  <span>{category.progress}%</span>
                </span>
                <ProgressBar
                  className="mt-2 h-1"
                  tone={category.progress === 100 ? "green" : "orange"}
                  value={category.progress}
                />
              </span>
              <AppIcon className="text-xl" name="chevron-forward" />
            </button>
          ))}
        </div>
      </section>
    </ScreenContainer>
  );
}
