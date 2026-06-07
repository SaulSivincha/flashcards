import type { ButtonHTMLAttributes } from "react";
import type { AppIconName } from "./AppIcon";
import { AppIcon } from "./AppIcon";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: AppIconName;
  label: string;
};

export function IconButton({
  icon,
  label,
  className = "",
  ...props
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-slate/10 active:scale-95 ${className}`}
      type="button"
      {...props}
    >
      <AppIcon name={icon} />
    </button>
  );
}
