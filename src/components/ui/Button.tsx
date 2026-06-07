import type { PropsWithChildren } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "soft";

type ButtonProps = PropsWithChildren<
  HTMLMotionProps<"button"> & {
    variant?: ButtonVariant;
    fullWidth?: boolean;
  }
>;

const variants: Record<ButtonVariant, string> = {
  primary: "bg-blaze text-white border-blaze",
  secondary: "bg-transparent text-ink dark:text-paper border-ink dark:border-paper",
  ghost: "bg-transparent text-[var(--fs-text)] border-transparent",
  danger: "bg-transparent text-mahogany border-mahogany",
  soft: "bg-slate/10 text-slate dark:text-paper border-transparent",
};

export function Button({
  children,
  variant = "primary",
  fullWidth = true,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={[
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-control border-2 px-5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
      type={type}
      {...props}
    >
      {children}
    </motion.button>
  );
}
