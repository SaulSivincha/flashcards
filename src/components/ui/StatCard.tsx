import type { AppIconName } from "./AppIcon";
import { AppIcon } from "./AppIcon";
import { Card } from "./Card";

type StatCardProps = {
  value: string;
  label: string;
  icon?: AppIconName;
  accent?: boolean;
  compact?: boolean;
};

export function StatCard({
  value,
  label,
  icon,
  accent = false,
  compact = false,
}: StatCardProps) {
  return (
    <Card className={compact ? "p-4" : "p-5"}>
      {icon ? (
        <AppIcon
          className="mb-5 text-2xl text-slate dark:text-paper/70"
          name={icon}
        />
      ) : null}
      <p
        className={`font-semibold leading-none ${compact ? "text-2xl" : "text-3xl"} ${
          accent ? "text-blaze" : "text-[var(--fs-text)]"
        }`}
      >
        {value}
      </p>
      <p className="mt-3 text-xs font-medium tracking-wide muted-text">{label}</p>
    </Card>
  );
}
