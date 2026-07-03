import { useHistory } from "react-router-dom";
import type { CourseSummary } from "../../types/course";
import { BrandMark } from "../brand/BrandMark";
import { AppIcon } from "../ui/AppIcon";
import { Card } from "../ui/Card";
import { ProgressBar } from "../ui/ProgressBar";

type CourseCardProps = {
  course: CourseSummary;
};

export function CourseCard({ course }: CourseCardProps) {
  const history = useHistory();
  const empty = course.cardCount === 0;

  return (
    <button
      className="w-full text-left"
      onClick={() => history.push(`/cursos/${course.id}`)}
      type="button"
    >
      <Card className="p-5 transition-transform active:scale-[0.99]">
        <div className="flex items-start gap-3">
          <BrandMark className="h-11 w-11 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <h2 className="line-clamp-1 text-lg font-semibold">{course.name}</h2>
              <AppIcon className="text-xl text-slate" name="chevron-forward" />
            </div>
            <p className="mt-1 text-sm text-slate">
              {course.topicCount} temas, {course.cardCount} flashcards
            </p>
          </div>
        </div>
        {empty ? (
          <p className="mt-5 text-xs font-semibold muted-text">Sin contenido</p>
        ) : (
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs text-slate">
              <span>Progreso</span>
              <span>{course.progress}%</span>
            </div>
            <ProgressBar value={course.progress} />
          </div>
        )}
      </Card>
    </button>
  );
}
