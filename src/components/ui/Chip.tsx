import type { PropsWithChildren } from "react";

type ChipProps = PropsWithChildren<{
  tone?: "neutral" | "success" | "danger" | "orange";
  className?: string;
}>;

const tones = {
  neutral: "bg-slate/10 text-slate dark:bg-white/10 dark:text-paper",
  success: "bg-slate text-white",
  danger: "bg-mahogany/10 text-mahogany",
  orange: "bg-blaze/10 text-blaze",
};

export function Chip({
  children,
  tone = "neutral",
  className = "",
}: ChipProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
