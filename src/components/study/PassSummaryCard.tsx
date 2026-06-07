import { Card } from "../ui/Card";
import { ProgressBar } from "../ui/ProgressBar";

type PassSummaryCardProps = {
  pass: number;
  score: number;
  detail: string;
};

export function PassSummaryCard({
  pass,
  score,
  detail,
}: PassSummaryCardProps) {
  return (
    <Card>
      <div className="mb-2 flex items-end justify-between">
        <span className="text-sm font-semibold">Pasada {pass}</span>
        <span className="text-xs muted-text">{detail}</span>
        <span className="text-sm font-semibold">{score}%</span>
      </div>
      <ProgressBar value={score} />
    </Card>
  );
}
