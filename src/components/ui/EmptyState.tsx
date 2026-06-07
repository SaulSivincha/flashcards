import { AppIcon } from "./AppIcon";
import { Card } from "./Card";

type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <Card className="text-center">
      <AppIcon className="mx-auto text-4xl text-slate" name="folder" />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm muted-text">{description}</p>
    </Card>
  );
}
