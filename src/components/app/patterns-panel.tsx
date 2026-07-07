import { useMemo, type ReactNode } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { NUTRIENT_LABELS, type Meal, type TrackedNutrient } from "@/lib/analysis.schema";
import {
  computeBuildingBlocksSeries,
  computeColourDiversity,
  computeLoggingStreak,
  computeNutrientCoverage,
  computePlantVariety,
  FIBER_BAND_G,
  PROTEIN_BAND_G,
} from "@/lib/trends";
import { splitFoodsForNutrient } from "@/lib/nutrient-reference";
import { NutrientProfilePanel } from "@/components/app/nutrient-profile-panel";
import { DEFAULT_FOCUS_NUTRIENTS, type DetailLevel } from "@/lib/users.schema";
import { Leaf, Palette, Sparkles, Flame } from "lucide-react";

// Patterns — the aggregate view over a patient's readings (docs/PLAN.md Phase
// 4a). Counts and qualitative coverage only, never a percentage or verdict
// (see CLAUDE.md's hard rules — the embedded NutrientProfilePanel is the one
// deliberate exception, scoped to its own component). Shared by the
// patient's own /patterns route and the doctor's per-patient review page.
export function PatternsPanel({
  meals,
  pantryItemNames = [],
  focusNutrients = DEFAULT_FOCUS_NUTRIENTS,
  detailLevel = "simple",
}: {
  meals: Meal[];
  // Active pantry item names, patient's own — omitted entirely in the
  // doctor's embed, where "already have this" isn't meaningful. See
  // src/lib/nutrient-reference.ts's splitFoodsForNutrient.
  pantryItemNames?: string[];
  // Scopes the 14-day coverage section and Nutrient Profile to the patient's
  // focus list — with ~27 tracked nutrients now, showing all of them would
  // undermine the same "don't overwhelm" goal Simple mode exists for.
  focusNutrients?: TrackedNutrient[];
  detailLevel?: DetailLevel;
}) {
  const analyzedCount = useMemo(
    () => meals.filter((m) => m.status === "analyzed" && m.analysis).length,
    [meals],
  );

  if (analyzedCount < 3) {
    return (
      <Card className="grid place-items-center p-10 text-center">
        <Sparkles className="mb-3 h-6 w-6 text-muted-foreground" />
        <p className="text-sm font-medium">Patterns show up after a few more readings</p>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
          Log a few more meals and we'll start showing what's been consistent, what's coming along,
          and what's worth trying next.
        </p>
      </Card>
    );
  }

  const coverage = computeNutrientCoverage(meals, 14, focusNutrients);
  const plants = computePlantVariety(meals);
  const colours = computeColourDiversity(meals);
  const streak = computeLoggingStreak(meals);
  const series = computeBuildingBlocksSeries(meals);
  const gaps = coverage.filter((c) => c.isGap);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          icon={<Leaf className="h-4 w-4" />}
          label="Plant variety this week"
          value={`${plants.count}`}
          hint={plants.count === 1 ? "different plant" : "different plants"}
        />
        <StatTile
          icon={<Palette className="h-4 w-4" />}
          label="Colour diversity this week"
          value={`${colours.count} of ${colours.total}`}
          hint={colours.colours.length ? colours.colours.join(", ") : "no colours logged yet"}
        />
        <StatTile
          icon={<Flame className="h-4 w-4" />}
          label="Logging streak"
          value={`${streak.currentStreakDays}`}
          hint={streak.currentStreakDays === 1 ? "day" : "days"}
        />
      </div>

      <NutrientProfilePanel
        meals={meals}
        detailLevel={detailLevel}
        focusNutrients={focusNutrients}
      />

      <Card className="p-5">
        <p className="mb-1 text-sm font-semibold">Micronutrient coverage</p>
        <p className="mb-4 text-xs text-muted-foreground">
          How often each nutrient showed up as a strong source, out of your last{" "}
          {coverage[0]?.totalReadings ?? 0} readings.
        </p>
        <div className="space-y-2.5">
          {coverage.map((c) => (
            <CoverageRow key={c.nutrient} {...c} />
          ))}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <RhythmChart
          title="Protein rhythm"
          dataKey="protein_g"
          data={series}
          band={PROTEIN_BAND_G}
          color="var(--chart-5)"
        />
        <RhythmChart
          title="Fiber rhythm"
          dataKey="fiber_g"
          data={series}
          band={FIBER_BAND_G}
          color="var(--chart-4)"
        />
      </div>

      {gaps.length > 0 && (
        <Card className="p-5">
          <p className="mb-1 text-sm font-semibold">Try something new</p>
          <p className="mb-4 text-xs text-muted-foreground">
            Food-first ideas for the nutrients that have been a little light lately — never a
            correction, just an easy add.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {gaps.map((g) => {
              const { inPantry, tryNew } = splitFoodsForNutrient(g.nutrient, pantryItemNames);
              return (
                <div key={g.nutrient} className="rounded-xl border border-border bg-card p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {NUTRIENT_LABELS[g.nutrient]}
                  </p>
                  {inPantry.length > 0 && (
                    <>
                      <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-accent-foreground">
                        In your pantry
                      </p>
                      <ul className="mt-1 space-y-1.5 text-sm">
                        {inPantry.map((f) => (
                          <li key={f.name}>
                            <span className="font-medium">{f.name}</span>
                            <span className="text-muted-foreground"> — {f.reason}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {tryNew.length > 0 && (
                    <>
                      {inPantry.length > 0 && (
                        <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          Try something new
                        </p>
                      )}
                      <ul className="mt-1 space-y-1.5 text-sm">
                        {tryNew.map((f) => (
                          <li key={f.name}>
                            <span className="font-medium">{f.name}</span>
                            <span className="text-muted-foreground"> — {f.reason}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-1.5 font-serif text-2xl font-semibold tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </Card>
  );
}

// Plain HTML/CSS bar — a real number in the DOM as the label, not just a
// colour, satisfies the dataviz accessibility bar (see dataviz skill) and
// keeps this readable without recharts for what's fundamentally a small list.
function CoverageRow({
  label,
  strongCount,
  totalReadings,
  isGap,
}: {
  label: string;
  strongCount: number;
  totalReadings: number;
  isGap: boolean;
}) {
  const pct = totalReadings > 0 ? Math.round((strongCount / totalReadings) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-24 shrink-0 truncate">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-[var(--chart-4)]"
          style={{ width: `${Math.max(pct, strongCount > 0 ? 6 : 0)}%` }}
        />
      </div>
      <span className="w-24 shrink-0 text-right text-xs text-muted-foreground">
        {strongCount} of {totalReadings || 0}
        {isGap && totalReadings > 0 ? " · light" : ""}
      </span>
    </div>
  );
}

function RhythmChart({
  title,
  dataKey,
  data,
  band,
  color,
}: {
  title: string;
  dataKey: "protein_g" | "fiber_g";
  data: { date: string; protein_g: number; fiber_g: number }[];
  band: [number, number];
  color: string;
}) {
  return (
    <Card className="p-5">
      <p className="mb-1 text-sm font-semibold">{title}</p>
      <p className="mb-4 text-xs text-muted-foreground">
        Average grams per meal, by day — the shaded band is a gentle food-first range, not a target.
      </p>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">Not enough recent readings yet.</p>
      ) : (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(d: string) =>
                  new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short" })
                }
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value: number) => [
                  `${value}g`,
                  dataKey === "protein_g" ? "Protein" : "Fiber",
                ]}
                labelFormatter={(d: string) => new Date(d).toLocaleDateString()}
              />
              <Area
                dataKey={() => band}
                stroke="none"
                fill="var(--muted)"
                isAnimationActive={false}
                legendType="none"
              />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={2}
                dot={{ r: 3, fill: color, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
