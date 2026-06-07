import { useState, type FormEvent } from "react";
import { BottomSheet } from "../../components/ui/BottomSheet";
import { Button } from "../../components/ui/Button";

type CreateCourseSheetProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
};

export function CreateCourseSheet({
  open,
  onClose,
  onCreate,
}: CreateCourseSheetProps) {
  const [name, setName] = useState("Derecho Empresarial");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (name.trim()) {
      setError("");
      setIsSubmitting(true);
      try {
        await onCreate(name.trim());
        setName("");
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : "No se pudo crear el curso.",
        );
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  return (
    <BottomSheet onClose={onClose} open={open} title="Crear nuevo curso">
      <form className="mt-9" onSubmit={handleSubmit}>
        <label className="text-sm font-medium text-slate" htmlFor="course-name">
          Nombre del curso
        </label>
        <input
          autoFocus
          className="mt-2 h-12 w-full rounded-xl border border-ink bg-paper px-3 outline-none focus:ring-2 focus:ring-blaze/30"
          id="course-name"
          onChange={(event) => setName(event.target.value)}
          value={name}
        />
        <p className="mt-1 text-xs font-medium text-slate">
          Podrás agregar temas mediante CSV
        </p>
        {error ? (
          <p className="mt-3 text-sm font-medium text-mahogany" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-16 space-y-3">
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? "Creando…" : "Crear curso"}
          </Button>
          <Button onClick={onClose} variant="secondary">
            Cancelar
          </Button>
        </div>
      </form>
    </BottomSheet>
  );
}
