import { Card } from "@/components/ui/card";
import { type Meal } from "@/lib/analysis.schema";
import {
  computeDailyNutrientProfile,
  PROFILE_BAND_LABELS,
  type NutrientProfileEntry,
} from "@/lib/nutrient-profile";
import type { DetailLevel } from "@/lib/users.schema";
import type { TrackedNutrient } from "@/lib/analysis.schema";

// Today's nutrient rollup — a sibling to PatternsPanel, not merged into it,
// since it's the one place in the app that shows a percentage (Detailed mode
// only). See docs/ETHOS.md principle 2's second carve-out and
// src/lib/nutrient-profile.ts.
export function NutrientProfilePanel({
  meals,
  detailLevel,
  focusNutrients = [],
}: {
  meals: Meal[];
  detailLevel: DetailLevel;
  focusNutrients?: TrackedNutrient[];
}) {
  const analyzedCount = meals.filter((m) => m.status === "analyzed" && m.analysis).length;
  if (analyzedCount < 1) return null;

  const profile = computeDailyNutrientProfile(meals);
  const isFocus = (n: TrackedNutrient) => focusNutrients.includes(n);
  const rows = [...profile].sort(
    (x, y) => Number(isFocus(y.nutrient)) - Number(isFocus(x.nutrient)),
  );

  return (
    <Card className="p-5">
      <p className="mb-1 text-sm font-semibold">Nutrient Profile — today</p>
      <p className="mb-4 text-xs text-muted-foreground">
        {detailLevel === "detailed"
          ? "A rough estimate against general adult reference values — not personalized to you; we don't collect age, sex, or weight."
          : "How today's meals are adding up, in plain terms."}
      </p>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {rows.map((entry) => (
          <ProfileRow key={entry.nutrient} entry={entry} detailLevel={detailLevel} />
        ))}
      </div>
    </Card>
  );
}

function ProfileRow({
  entry,
  detailLevel,
}: {
  entry: NutrientProfileEntry;
  detailLevel: DetailLevel;
}) {
  const displayPct = entry.pct > 100 ? "100%+" : `${entry.pct}%`;
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm">
      <span>{entry.label}</span>
      <span className="text-muted-foreground">
        {detailLevel === "detailed"
          ? `${entry.totalAmount}${entry.unit} · ${displayPct}`
          : PROFILE_BAND_LABELS[entry.band]}
      </span>
    </div>
  );
}
