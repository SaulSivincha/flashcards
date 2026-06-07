type ProgressBarProps = {
  value: number;
  tone?: "orange" | "green" | "red";
  className?: string;
};

const tones = {
  orange: "bg-blaze",
  green: "bg-slate",
  red: "bg-mahogany",
};

export function ProgressBar({
  value,
  tone = "orange",
  className = "",
}: ProgressBarProps) {
  const normalized = Math.min(100, Math.max(0, value));

  return (
    <div
      aria-label={`${normalized}% completado`}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={normalized}
      className={`h-2 overflow-hidden rounded-full bg-slate/10 dark:bg-white/10 ${className}`}
      role="progressbar"
    >
      <div
        className={`h-full rounded-full transition-[width] duration-500 ${tones[tone]}`}
        style={{ width: `${normalized}%` }}
      />
    </div>
  );
}
