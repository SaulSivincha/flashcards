import { Button } from "../ui/Button";
import { AppIcon } from "../ui/AppIcon";

type StudyActionBarProps = {
  answerVisible: boolean;
  onReveal?: () => void;
  onCorrect?: () => void;
  onIncorrect?: () => void;
};

export function StudyActionBar({
  answerVisible,
  onReveal,
  onCorrect,
  onIncorrect,
}: StudyActionBarProps) {
  if (!answerVisible) {
    return (
      <Button
        className="min-h-16 rounded-[24px] border-0 shadow-[0_10px_24px_rgba(242,100,25,0.22)]"
        onClick={onReveal}
      >
        <AppIcon className="text-2xl" name="eye" />
        Ver respuesta
      </Button>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <Button
        className="min-h-16 rounded-[24px] bg-white shadow-[0_10px_24px_rgba(10,18,42,0.08)]"
        onClick={onIncorrect}
        variant="danger"
      >
        <AppIcon className="text-xl" name="close-circle" />
        No la sabía
      </Button>
      <Button
        className="min-h-16 rounded-[24px] border-slate bg-slate text-white shadow-[0_10px_24px_rgba(37,89,87,0.20)]"
        onClick={onCorrect}
        variant="soft"
      >
        <AppIcon className="text-xl" name="check" />
        La sabía
      </Button>
    </div>
  );
}
