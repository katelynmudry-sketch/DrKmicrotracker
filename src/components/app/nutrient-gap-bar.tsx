import { Progress } from "@/components/ui/progress";

export function NutrientGapBar({
  nutrient,
  avgDailyValuePct,
}: {
  nutrient: string;
  avgDailyValuePct: number;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium">{nutrient}</span>
        <span className="text-muted-foreground">{avgDailyValuePct}% of daily value</span>
      </div>
      <Progress value={avgDailyValuePct} className="h-2" />
    </div>
  );
}
