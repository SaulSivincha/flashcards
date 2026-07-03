import { useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import { BrandMark } from "../../components/brand/BrandMark";
import { CourseCard } from "../../components/courses/CourseCard";
import { ScreenContainer } from "../../components/layout/ScreenContainer";
import { AppIcon } from "../../components/ui/AppIcon";
import { EmptyState } from "../../components/ui/EmptyState";
import { NameEditorSheet } from "../../components/ui/NameEditorSheet";
import { useCourseStore } from "../../stores/courseStore";

export function CoursesPage() {
  const history = useHistory();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [search, setSearch] = useState("");
  const courses = useCourseStore((state) => state.courses);
  const error = useCourseStore((state) => state.error);
  const createCourse = useCourseStore((state) => state.createCourse);

  const filteredCourses = useMemo(
    () =>
      courses.filter((course) =>
        course.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [courses, search],
  );

  return (
    <ScreenContainer className="!bg-paper">
      <div className="flex items-center gap-2 text-ink">
        <BrandMark className="h-8 w-8" />
        <span className="text-xl font-semibold">FlashStudy</span>
      </div>

      <div className="mt-9 flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-bold leading-tight">Mis cursos</h1>
          <p className="mt-1 text-sm text-slate">
            Organiza tus temas de estudio
          </p>
        </div>
        <button
          aria-label="Crear curso"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-blaze text-white shadow-academic active:scale-95"
          onClick={() => setSheetOpen(true)}
          type="button"
        >
          <AppIcon className="text-3xl" name="add" />
        </button>
      </div>

      <label className="mt-8 flex h-12 items-center gap-3 rounded-xl border border-slate/25 px-3 text-slate">
        <AppIcon className="text-xl" name="search" />
        <input
          aria-label="Buscar curso"
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar curso"
          value={search}
        />
      </label>

      <div className="mt-10 space-y-3">
        {filteredCourses.map((course) => (
          <CourseCard course={course} key={course.id} />
        ))}
        {filteredCourses.length === 0 ? (
          <EmptyState
            description={
              search
                ? "Prueba con otro nombre."
                : "Crea tu primer curso para comenzar."
            }
            title={search ? "No encontramos cursos" : "Aún no hay cursos"}
          />
        ) : null}
        {error ? <p className="text-sm text-mahogany">{error}</p> : null}
      </div>

      <NameEditorSheet
        helperText="Podrás agregar temas mediante CSV"
        label="Nombre del curso"
        onClose={() => setSheetOpen(false)}
        onSubmit={async (name) => {
          const course = await createCourse(name);
          setSheetOpen(false);
          history.push(`/cursos/${course.id}`);
        }}
        open={sheetOpen}
        submitLabel="Crear curso"
        submittingLabel="Creando…"
        title="Crear nuevo curso"
      />
    </ScreenContainer>
  );
}
