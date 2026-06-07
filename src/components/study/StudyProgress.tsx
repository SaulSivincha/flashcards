type StudyProgressProps = {
  current?: number;
  total?: number;
  pass?: number;
  dark?: boolean;
};

export function StudyProgress({
  current = 5,
  total = 31,
  pass = 1,
}: StudyProgressProps) {
  const progress = total === 0 ? 0 : Math.round((current / total) * 100);

  return (
    <section className="pb-4">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.08em] text-blaze">
            Siguiente objetivo
          </span>
          <span className="inline-flex rounded-full bg-slate px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white">
            Pasada {pass}
          </span>
        </div>
        <span className="text-right text-sm font-semibold text-[var(--fs-text-muted)]">
          <strong className="text-[var(--fs-text)]">{current}</strong> / {total}{" "}
          preguntas
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink/5 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-blaze shadow-[0_0_8px_rgba(242,100,25,0.4)] transition-[width] duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </section>
  );
}
