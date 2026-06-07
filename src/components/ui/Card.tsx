import type { HTMLAttributes, PropsWithChildren } from "react";

export function Card({
  children,
  className = "",
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div className={`academic-card p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}
