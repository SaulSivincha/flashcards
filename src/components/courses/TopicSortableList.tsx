import { useEffect, useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { TopicSummary } from "../../types/topic";
import { TopicCard } from "./TopicCard";

type TopicSortableListProps = {
  topics: TopicSummary[];
  onEdit: (topic: TopicSummary) => void;
  onReorder: (topicIds: string[]) => Promise<void>;
  onDelete: (topic: TopicSummary) => void;
};

function SortableTopicCard({
  disabled,
  onEdit,
  onDelete,
  topic,
}: {
  disabled: boolean;
  onEdit: (topic: TopicSummary) => void;
  onDelete: (topic: TopicSummary) => void;
  topic: TopicSummary;
}) {
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: topic.id,
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 20 : undefined,
      }}
    >
      <TopicCard
        dragHandleProps={{
          ...attributes,
          ...listeners,
          ref: setActivatorNodeRef,
        }}
        isDragging={isDragging}
        onEdit={onEdit}
        onDelete={onDelete}
        topic={topic}
      />
    </div>
  );
}

export function TopicSortableList({
  topics,
  onEdit,
  onDelete,
  onReorder,
}: TopicSortableListProps) {
  const [orderedTopics, setOrderedTopics] = useState(topics);
  const [activeId, setActiveId] = useState<string>();
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    if (!activeId && status !== "saving") {
      setOrderedTopics(topics);
    }
  }, [activeId, status, topics]);

  function handleDragStart(event: DragStartEvent): void {
    setActiveId(String(event.active.id));
    setStatus("idle");
  }

  async function handleDragEnd(event: DragEndEvent): Promise<void> {
    setActiveId(undefined);
    const active = String(event.active.id);
    const over = event.over ? String(event.over.id) : undefined;
    if (!over || active === over) {
      return;
    }

    const oldIndex = orderedTopics.findIndex((topic) => topic.id === active);
    const newIndex = orderedTopics.findIndex((topic) => topic.id === over);
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const nextTopics = arrayMove(orderedTopics, oldIndex, newIndex);
    setOrderedTopics(nextTopics);
    setStatus("saving");

    try {
      await onReorder(nextTopics.map((topic) => topic.id));
      setStatus("saved");
    } catch {
      setOrderedTopics(topics);
      setStatus("error");
    }
  }

  return (
    <>
      <DndContext
        collisionDetection={closestCenter}
        onDragCancel={() => setActiveId(undefined)}
        onDragEnd={(event) => void handleDragEnd(event)}
        onDragStart={handleDragStart}
        sensors={sensors}
      >
        <SortableContext
          items={orderedTopics.map((topic) => topic.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {orderedTopics.map((topic) => (
              <SortableTopicCard
                disabled={status === "saving"}
                key={topic.id}
                onEdit={onEdit}
                onDelete={onDelete}
                topic={topic}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <p
        aria-live="polite"
        className={`mt-3 min-h-5 text-center text-xs ${
          status === "error" ? "text-mahogany" : "muted-text"
        }`}
      >
        {status === "saving"
          ? "Guardando nuevo orden…"
          : status === "saved"
            ? "Orden guardado en este dispositivo."
            : status === "error"
              ? "No se pudo guardar el orden. Se restauró la lista."
              : ""}
      </p>
    </>
  );
}
