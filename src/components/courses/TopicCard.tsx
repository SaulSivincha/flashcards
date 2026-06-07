import {
  useState,
  type ComponentPropsWithRef,
} from "react";
import { useHistory } from "react-router-dom";
import type { TopicSummary } from "../../types/topic";
import { formatRelativeStudyDate } from "../../utils/dates";
import { AppIcon } from "../ui/AppIcon";
import { Chip } from "../ui/Chip";
import { TopicActionMenu } from "./TopicActionMenu";

type TopicCardProps = {
  topic: TopicSummary;
  dragHandleProps?: ComponentPropsWithRef<"button">;
  isDragging?: boolean;
};

export function TopicCard({
  topic,
  dragHandleProps,
  isDragging = false,
}: TopicCardProps) {
  const history = useHistory();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <article
      className={`academic-card relative flex items-start gap-2 border border-transparent p-4 transition-[box-shadow,transform,opacity] ${
        isDragging
          ? "scale-[1.02] cursor-grabbing border-blaze/30 opacity-90 shadow-active"
          : ""
      }`}
    >
      <button
        aria-label="Reordenar tema"
        className="flex h-12 w-9 shrink-0 touch-none items-center justify-center text-slate/60 outline-none focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-blaze active:cursor-grabbing"
        type="button"
        {...dragHandleProps}
      >
        <AppIcon name="menu" />
      </button>
      <button
        className="min-w-0 flex-1 text-left"
        onClick={() => history.push(`/temas/${topic.id}`)}
        type="button"
      >
        <h3 className="pr-8 text-base font-semibold leading-snug">{topic.title}</h3>
        <p className="mt-2 text-sm muted-text">
          {topic.unit} · {topic.cardCount} preguntas
        </p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-sm muted-text">
            {topic.progress}% · {formatRelativeStudyDate(topic.lastStudiedAt)}
          </span>
          <Chip tone={topic.progress === 0 ? "neutral" : "success"}>
            {topic.progress === 0 ? "Pendiente" : "En progreso"}
          </Chip>
        </div>
      </button>
      <button
        aria-expanded={menuOpen}
        aria-label="Opciones del tema"
        className="absolute right-2 top-2 flex h-12 w-10 items-center justify-center rounded-full"
        onClick={() => setMenuOpen((current) => !current)}
        type="button"
      >
        <AppIcon className="text-xl muted-text" name="more" />
      </button>
      {menuOpen ? (
        <TopicActionMenu onClose={() => setMenuOpen(false)} topicId={topic.id} />
      ) : null}
    </article>
  );
}
