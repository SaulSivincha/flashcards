import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { useParams } from "react-router-dom";
import { TopicSortableList } from "../../components/courses/TopicSortableList";
import { PageHeader } from "../../components/layout/PageHeader";
import { ScreenContainer } from "../../components/layout/ScreenContainer";
import { AppIcon } from "../../components/ui/AppIcon";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Chip } from "../../components/ui/Chip";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { EmptyState } from "../../components/ui/EmptyState";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { useCourseStore } from "../../stores/courseStore";
import { useStatsStore } from "../../stores/statsStore";
import { useStudyStore } from "../../stores/studyStore";
import { useTopicStore } from "../../stores/topicStore";

export function CourseDetailPage() {
  const history = useHistory();
  const { courseId } = useParams<{ courseId: string }>();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const course = useCourseStore((state) =>
    state.courses.find((item) => item.id === courseId),
  );
  const deleteCourse = useCourseStore((state) => state.deleteCourse);
  const topics = useTopicStore((state) => state.topics);
  const loadByCourse = useTopicStore((state) => state.loadByCourse);
  const saveOrder = useTopicStore((state) => state.saveOrder);

  useEffect(() => {
    void loadByCourse(courseId);
  }, [courseId, loadByCourse]);

  async function confirmDelete() {
    setIsDeleting(true);
    setDeleteError("");
    try {
      await deleteCourse(courseId);
      await Promise.all([
        useTopicStore.getState().loadRecent(),
        useStatsStore.getState().load(),
        useStudyStore.getState().loadActiveSession(),
      ]);
      history.replace("/cursos");
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el curso.",
      );
      setIsDeleting(false);
    }
  }

  return (
    <ScreenContainer>
      <PageHeader back title={course?.name ?? "Curso"} />

      <Card>
        <div className="mb-5 flex items-center justify-between">
          <span className="text-lg muted-text">
            {course?.topicCount ?? 0} temas · {course?.cardCount ?? 0} tarjetas
          </span>
          <strong className="text-xl">{course?.progress ?? 0}%</strong>
        </div>
        <ProgressBar value={course?.progress ?? 0} />
      </Card>

      <Button
        className="mt-7"
        onClick={() => history.push(`/cursos/${courseId}/importar`)}
      >
        <AppIcon className="text-2xl" name="upload" />
        Agregar tema CSV
      </Button>

      <section className="mt-10">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Temas del curso</h2>
            <p className="mt-1 text-sm muted-text">
              Mantén pulsado para reordenar
            </p>
          </div>
          <Chip>
            <AppIcon className="mr-1 text-lg" name="menu" />
            Ordenando
          </Chip>
        </div>
        {topics.length > 0 ? (
          <TopicSortableList
            onReorder={(topicIds) => saveOrder(courseId, topicIds)}
            topics={topics}
          />
        ) : (
          <EmptyState
            description="Importa un CSV para agregar el primer tema."
            title="Este curso está vacío"
          />
        )}
      </section>

      <Button
        className="mt-10"
        onClick={() => {
          setDeleteError("");
          setDeleteOpen(true);
        }}
        variant="danger"
      >
        <AppIcon className="text-xl" name="trash" />
        Eliminar curso
      </Button>
      {deleteError ? (
        <p className="mt-3 text-sm text-mahogany">{deleteError}</p>
      ) : null}

      <ConfirmDialog
        busy={isDeleting}
        confirmLabel="Eliminar"
        description={`Se eliminará “${course?.name ?? "este curso"}” junto con todos sus temas, flashcards, sesiones y estadísticas. Esta acción no se puede deshacer.`}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => void confirmDelete()}
        open={deleteOpen}
        title="Eliminar curso"
      />
    </ScreenContainer>
  );
}
