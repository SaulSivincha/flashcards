import { AnimatePresence, motion } from "framer-motion";
import { Button } from "./Button";
import { Card } from "./Card";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  busy?: boolean;
};

export function ConfirmDialog({
  open,
  title,
  description,
  onCancel,
  onConfirm,
  confirmLabel = "Confirmar",
  busy = false,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/55 p-6"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
        >
          <motion.div
            animate={{ scale: 1, y: 0 }}
            className="w-full max-w-sm"
            exit={{ scale: 0.96, y: 12 }}
            initial={{ scale: 0.96, y: 12 }}
          >
            <Card>
              <h2 className="text-xl font-semibold">{title}</h2>
              <p className="mt-3 text-sm muted-text">{description}</p>
              <div className="mt-6 flex gap-3">
                <Button disabled={busy} onClick={onCancel} variant="secondary">
                  Cancelar
                </Button>
                <Button disabled={busy} onClick={onConfirm} variant="danger">
                  {busy ? "Procesando…" : confirmLabel}
                </Button>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
