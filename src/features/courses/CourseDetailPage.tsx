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
import { NameEditorSheet } from "../../components/ui/NameEditorSheet";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { useCourseStore } from "../../stores/courseStore";
import { useStatsStore } from "../../stores/statsStore";
import { useStudyStore } from "../../stores/studyStore";
import { useTopicStore } from "../../stores/topicStore";
import type { TopicSummary } from "../../types/topic";

export function CourseDetailPage() {
  const history = useHistory();
  const { courseId } = useParams<{ courseId: string }>();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [topicToDelete, setTopicToDelete] = useState<TopicSummary>();
  const [isDeletingTopic, setIsDeletingTopic] = useState(false);
  const [topicDeleteError, setTopicDeleteError] = useState("");
  const [courseEditOpen, setCourseEditOpen] = useState(false);
  const [topicToEdit, setTopicToEdit] = useState<TopicSummary>();
  const course = useCourseStore((state) =>
    state.courses.find((item) => item.id === courseId),
  );
  const deleteCourse = useCourseStore((state) => state.deleteCourse);
  const renameCourse = useCourseStore((state) => state.renameCourse);
  const topics = useTopicStore((state) => state.topics);
  const loadByCourse = useTopicStore((state) => state.loadByCourse);
  const saveOrder = useTopicStore((state) => state.saveOrder);
  const deleteTopic = useTopicStore((state) => state.deleteTopic);
  const renameTopic = useTopicStore((state) => state.renameTopic);

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

  async function confirmTopicDelete(): Promise<void> {
    if (!topicToDelete) {
      return;
    }
    setIsDeletingTopic(true);
    setTopicDeleteError("");
    try {
      await deleteTopic(topicToDelete.id);
      useStudyStore.getState().resetState();
      await Promise.all([
        useCourseStore.getState().loadCourses(),
        useStatsStore.getState().load(),
        useStudyStore.getState().loadActiveSession(),
      ]);
      setTopicToDelete(undefined);
    } catch (error) {
      setTopicDeleteError(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el tema.",
      );
    } finally {
      setIsDeletingTopic(false);
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
      <Button
        className="mt-3"
        onClick={() => setCourseEditOpen(true)}
        variant="secondary"
      >
        <AppIcon className="text-xl" name="edit" />
        Editar nombre del curso
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
            onEdit={(topic) => setTopicToEdit(topic)}
            onDelete={(topic) => {
              setTopicDeleteError("");
              setTopicToDelete(topic);
            }}
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
      <ConfirmDialog
        busy={isDeletingTopic}
        confirmLabel="Eliminar tema"
        description={`Se eliminará “${topicToDelete?.title ?? "este tema"}” junto con sus ${topicToDelete?.cardCount ?? 0} tarjetas, sesiones, estadísticas y datos de aprendizaje. Esta acción no se puede deshacer.`}
        onCancel={() => {
          if (!isDeletingTopic) {
            setTopicToDelete(undefined);
          }
        }}
        onConfirm={() => void confirmTopicDelete()}
        open={Boolean(topicToDelete)}
        title="Eliminar tema"
      />
      {topicDeleteError ? (
        <p className="mt-3 text-sm text-mahogany">{topicDeleteError}</p>
      ) : null}
      <NameEditorSheet
        initialName={course?.name}
        label="Nombre del curso"
        onClose={() => setCourseEditOpen(false)}
        onSubmit={async (name) => {
          await renameCourse(courseId, name);
          setCourseEditOpen(false);
        }}
        open={courseEditOpen}
        submitLabel="Guardar nombre"
        submittingLabel="Guardando…"
        title="Editar curso"
      />
      <NameEditorSheet
        initialName={topicToEdit?.title}
        label="Nombre del tema"
        onClose={() => setTopicToEdit(undefined)}
        onSubmit={async (name) => {
          if (!topicToEdit) {
            return;
          }
          await renameTopic(topicToEdit.id, name);
          await Promise.all([
            useCourseStore.getState().loadCourses(),
            useStatsStore.getState().load(),
          ]);
          setTopicToEdit(undefined);
        }}
        open={Boolean(topicToEdit)}
        submitLabel="Guardar nombre"
        submittingLabel="Guardando…"
        title="Editar tema"
      />
    </ScreenContainer>
  );
}
