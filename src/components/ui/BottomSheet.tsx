import type { PropsWithChildren } from "react";
import { AnimatePresence, motion } from "framer-motion";

type BottomSheetProps = PropsWithChildren<{
  open: boolean;
  onClose: () => void;
  title: string;
}>;

export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: BottomSheetProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/45"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.section
            animate={{ y: 0 }}
            aria-label={title}
            aria-modal="true"
            className="w-full max-w-mobile rounded-t-[28px] bg-[var(--fs-surface)] p-6 pb-[calc(24px+env(safe-area-inset-bottom))] text-[var(--fs-text)] shadow-active"
            exit={{ y: "100%" }}
            initial={{ y: "100%" }}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            transition={{ damping: 28, stiffness: 320, type: "spring" }}
          >
            <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-slate/20" />
            <h2 className="text-2xl font-semibold">{title}</h2>
            {children}
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
