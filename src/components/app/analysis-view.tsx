import { Card } from "@/components/ui/card";

type Analysis = {
  meal_name?: string;
  identified_items?: string[];
  estimated_portion?: string;
  macros?: Record<string, number>;
  key_micros?: Array<{ name: string; amount: string; daily_value_pct: number | null }>;
  rubric_notes?: string[];
  naturopathic_recommendations?: string[];
  concerns?: string[];
  overall_score?: number;
};

export function AnalysisView({ analysis }: { analysis: unknown }) {
  if (!analysis) {
    return (
      <p className="text-sm text-muted-foreground">No analysis yet.</p>
    );
  }
  const a = analysis as Analysis;

  const macroLabels: Record<string, string> = {
    calories_kcal: "Calories (kcal)",
    protein_g: "Protein (g)",
    carbs_g: "Carbs (g)",
    fat_g: "Fat (g)",
    fiber_g: "Fiber (g)",
    sugar_g: "Sugar (g)",
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">
            {a.meal_name ?? "Meal analysis"}
          </h3>
          {a.estimated_portion && (
            <p className="text-sm text-muted-foreground">
              Portion: {a.estimated_portion}
            </p>
          )}
        </div>
        {typeof a.overall_score === "number" && (
          <div className="rounded-full border border-border bg-accent/10 px-3 py-1 text-sm font-semibold text-accent-foreground">
            Rubric score {a.overall_score}/10
          </div>
        )}
      </div>

      {a.identified_items && a.identified_items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {a.identified_items.map((i, idx) => (
            <span
              key={idx}
              className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground"
            >
              {i}
            </span>
          ))}
        </div>
      )}

      {a.macros && (
        <Card className="p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Macronutrients
          </p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {Object.entries(a.macros).map(([k, v]) => (
              <div key={k} className="rounded-lg bg-secondary p-3">
                <p className="text-xs text-muted-foreground">
                  {macroLabels[k] ?? k}
                </p>
                <p className="text-lg font-semibold">{Math.round(Number(v))}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {a.key_micros && a.key_micros.length > 0 && (
        <Card className="p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Key micronutrients
          </p>
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {a.key_micros.map((m, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm"
              >
                <span>{m.name}</span>
                <span className="text-muted-foreground">
                  {m.amount}
                  {m.daily_value_pct != null ? ` · ${m.daily_value_pct}% DV` : ""}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {a.rubric_notes && a.rubric_notes.length > 0 && (
        <Section title="Rubric notes" items={a.rubric_notes} tone="accent" />
      )}
      {a.naturopathic_recommendations && a.naturopathic_recommendations.length > 0 && (
        <Section title="Naturopathic recommendations" items={a.naturopathic_recommendations} />
      )}
      {a.concerns && a.concerns.length > 0 && (
        <Section title="Concerns / uncertainty" items={a.concerns} tone="warn" />
      )}
    </div>
  );
}

function Section({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone?: "accent" | "warn";
}) {
  const toneCls =
    tone === "accent"
      ? "border-accent/40 bg-accent/5"
      : tone === "warn"
        ? "border-destructive/30 bg-destructive/5"
        : "border-border bg-card";
  return (
    <div className={`rounded-xl border p-4 ${toneCls}`}>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <ul className="list-disc space-y-1 pl-5 text-sm">
        {items.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </div>
  );
}