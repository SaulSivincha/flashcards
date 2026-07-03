import { useEffect, useState, type FormEvent } from "react";
import { BottomSheet } from "./BottomSheet";
import { Button } from "./Button";

type NameEditorSheetProps = {
  open: boolean;
  title: string;
  label: string;
  initialName?: string;
  helperText?: string;
  submitLabel: string;
  submittingLabel: string;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
};

export function NameEditorSheet({
  open,
  title,
  label,
  initialName = "",
  helperText,
  submitLabel,
  submittingLabel,
  onClose,
  onSubmit,
}: NameEditorSheetProps) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setError("");
    }
  }, [initialName, open]);

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    const nextName = name.trim();
    if (!nextName) {
      setError(`${label} es obligatorio.`);
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      await onSubmit(nextName);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo guardar el nombre.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <BottomSheet onClose={onClose} open={open} title={title}>
      <form className="mt-9" onSubmit={handleSubmit}>
        <label className="text-sm font-medium text-slate" htmlFor="item-name">
          {label}
        </label>
        <input
          autoFocus
          className="mt-2 h-12 w-full rounded-xl border border-ink bg-paper px-3 outline-none focus:ring-2 focus:ring-blaze/30"
          id="item-name"
          onChange={(event) => setName(event.target.value)}
          value={name}
        />
        {helperText ? (
          <p className="mt-1 text-xs font-medium text-slate">{helperText}</p>
        ) : null}
        {error ? (
          <p className="mt-3 text-sm font-medium text-mahogany" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-16 space-y-3">
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? submittingLabel : submitLabel}
          </Button>
          <Button disabled={isSubmitting} onClick={onClose} variant="secondary">
            Cancelar
          </Button>
        </div>
      </form>
    </BottomSheet>
  );
}
