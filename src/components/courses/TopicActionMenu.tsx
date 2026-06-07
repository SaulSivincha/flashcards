import { useHistory } from "react-router-dom";
import { AppIcon } from "../ui/AppIcon";

type TopicActionMenuProps = {
  topicId: string;
  onClose: () => void;
};

export function TopicActionMenu({
  topicId,
  onClose,
}: TopicActionMenuProps) {
  const history = useHistory();

  return (
    <div className="absolute right-2 top-12 z-10 w-52 rounded-xl bg-white py-2 text-ink shadow-active">
      <button
        aria-disabled="true"
        className="flex min-h-12 w-full cursor-not-allowed items-center gap-3 px-4 text-left text-sm opacity-45"
        disabled
        title="Mover entre cursos quedará preparado para una fase posterior"
        type="button"
      >
        <AppIcon className="text-xl" name="move" />
        Mover a otro curso
      </button>
      <button
        className="flex min-h-12 w-full items-center gap-3 px-4 text-left text-sm hover:bg-mist"
        onClick={() => {
          onClose();
          history.push(`/temas/${topicId}`);
        }}
        type="button"
      >
        <AppIcon className="text-xl" name="files" />
        Abrir tema
      </button>
    </div>
  );
}
