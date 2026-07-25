import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { analyzeMeal, updateMealAnalysis } from "@/lib/meals.functions";
import { isMockMode } from "@/lib/mock-mode";
import {
  TRACKED_NUTRIENTS,
  NUTRIENT_LABELS,
  NUTRIENT_LEVELS,
  LEVEL_LABELS,
  NUTRIENT_UNITS,
  NUTRIENT_DAILY_VALUES,
  ESTIMATION_BASIS_LABELS,
  CARB_QUALITIES,
  CARB_QUALITY_LABELS,
  type MealAnalysis,
  type Micronutrient,
  type NutrientLevel,
  type TrackedNutrient,
} from "@/lib/analysis.schema";
import type { DetailLevel } from "@/lib/users.schema";

// The nutrient-card visual pass (docs/PLAN.md Phase 3 / the "2a" design
// handoff): hit/miss reads via tile fill first, numbers second (see
// tileVariant below). Protocol Fit is deliberately not shown on this card —
// it still renders as a tier chip on the meals-history list; see the design
// handoff and CLAUDE.md's hard rules for why the tier itself never becomes a
// number here.

// Fill = hit, tint = present/partial, dashed = not seen — collapses the
// schema's 4 levels to the design's 3 visual buckets ("present" and "light"
// share the same tint treatment; see docs/ETHOS.md principle 3, TIER_LABELS
// still carries the distinct wording).
function tileVariant(level: NutrientLevel): "strong" | "partial" | "notseen" {
  if (level === "strong") return "strong";
  if (level === "not_seen") return "notseen";
  return "partial";
}

// Detailed-mode-only supporting number under the status word (never the
// primary signal — see docs/ETHOS.md principle 2). Population-average
// reference value, same as nutrient-profile.ts — not personalized.
function pctOfDailyValue(m: Micronutrient): number | null {
  if (!m.amount_estimate) return null;
  const dv = NUTRIENT_DAILY_VALUES[m.nutrient];
  if (!dv) return null;
  const mid = (m.amount_estimate.low + m.amount_estimate.high) / 2;
  return Math.round((mid / dv) * 100);
}

type EditValues = {
  meal_name: string;
  estimated_portion: string;
  identified_items: string;
  building_blocks: {
    protein_g: number;
    fiber_g: number;
    healthy_fat_sources: string;
    carb_quality: (typeof CARB_QUALITIES)[number];
  };
  micronutrients: Micronutrient[];
};

export function AnalysisView({
  analysis,
  mealId,
  editable,
  onSaved,
  initialDetailLevel,
  focusNutrients,
  allowAddConfirmation,
  onAddingChange,
}: {
  analysis: MealAnalysis | null;
  mealId?: string;
  editable?: boolean;
  onSaved?: (analysis: MealAnalysis) => void;
  initialDetailLevel: DetailLevel;
  focusNutrients: TrackedNutrient[];
  // Patient-only "I added: ___" confirm control (see the promoted card below)
  // — omitted entirely in the doctor's view, which has no reason to add to a
  // patient's plate. Distinct from `editable`, which is true in both views.
  allowAddConfirmation?: boolean;
  // Lets the caller keep the reading visible during the ~10-25s re-analysis
  // this triggers, even if a background refetch would otherwise briefly show
  // status "analyzing" (see meals.$mealId.tsx).
  onAddingChange?: (busy: boolean) => void;
}) {
  const updateFn = useServerFn(updateMealAnalysis);
  const analyzeFn = useServerFn(analyzeMeal);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addingText, setAddingText] = useState("");
  const [addingBusy, setAddingBusy] = useState(false);
  // Per-meal override of the user's default — never persisted, resets to the
  // default on next render (see docs/ETHOS.md principle 2).
  const [mode, setMode] = useState<DetailLevel>(initialDetailLevel);

  const canEdit = !!editable && !!mealId;

  // Hooks must run unconditionally on every render (a meal can transition
  // from no-reading to has-reading while this component stays mounted), so
  // useForm/useFieldArray are declared before the early return below rather
  // than after it.
  const snapshot = (): EditValues =>
    analysis
      ? {
          meal_name: analysis.meal_name,
          estimated_portion: analysis.estimated_portion,
          identified_items: analysis.identified_items.join(", "),
          building_blocks: {
            protein_g: analysis.building_blocks.protein_g,
            fiber_g: analysis.building_blocks.fiber_g,
            healthy_fat_sources: analysis.building_blocks.healthy_fat_sources.join(", "),
            carb_quality: analysis.building_blocks.carb_quality,
          },
          // Normalized to a concrete object here so the edit form always has
          // a stable shape to bind number inputs to; saved back as-is.
          micronutrients: analysis.micronutrients.map((m) => ({
            ...m,
            amount_estimate: m.amount_estimate ?? { low: 0, high: 0 },
          })),
        }
      : {
          meal_name: "",
          estimated_portion: "",
          identified_items: "",
          building_blocks: {
            protein_g: 0,
            fiber_g: 0,
            healthy_fat_sources: "",
            carb_quality: "mixed",
          },
          micronutrients: [],
        };

  const form = useForm<EditValues>({ defaultValues: snapshot() });
  const microFields = useFieldArray({ control: form.control, name: "micronutrients" });

  if (!analysis) {
    return <p className="text-sm text-muted-foreground">No reading yet.</p>;
  }
  const a = analysis;

  // Simple mode = focus nutrients only (tier-only, including not_seen — "your
  // iron didn't show up" is useful, non-overwhelming signal). Detailed mode =
  // every nutrient that isn't not_seen, plus any not_seen focus nutrient,
  // with focus nutrients pinned to the top. See docs/ETHOS.md principle 3.
  const isFocus = (n: TrackedNutrient) => focusNutrients.includes(n);
  const displayedMicronutrients =
    mode === "simple"
      ? a.micronutrients.filter((m) => isFocus(m.nutrient))
      : [...a.micronutrients]
          .filter((m) => isFocus(m.nutrient) || m.level !== "not_seen")
          .sort((x, y) => Number(isFocus(y.nutrient)) - Number(isFocus(x.nutrient)));

  const startEditing = () => {
    form.reset(snapshot());
    setEditing(true);
  };

  const cancel = () => {
    form.reset();
    setEditing(false);
  };

  const save = async (values: EditValues) => {
    if (!mealId) return;
    if (isMockMode) {
      toast.info("Preview mode — edits aren't saved.");
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const result = await updateFn({
        data: {
          mealId,
          analysis: {
            meal_name: values.meal_name,
            estimated_portion: values.estimated_portion,
            identified_items: values.identified_items
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
            building_blocks: {
              protein_g: values.building_blocks.protein_g,
              fiber_g: values.building_blocks.fiber_g,
              healthy_fat_sources: values.building_blocks.healthy_fat_sources
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
              carb_quality: values.building_blocks.carb_quality,
            },
            micronutrients: values.micronutrients,
          },
        },
      });
      toast.success("Reading updated");
      setEditing(false);
      onSaved?.(result.analysis as MealAnalysis);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const confirmAddition = async () => {
    if (!mealId || !addingText.trim()) return;
    if (isMockMode) {
      toast.info("Preview mode — nothing to update.");
      return;
    }
    setAddingBusy(true);
    onAddingChange?.(true);
    try {
      const result = await analyzeFn({ data: { mealId, patientAddition: addingText.trim() } });
      toast.success("We've updated your reading with what you added.");
      setAddingText("");
      onSaved?.(result.analysis as MealAnalysis);
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't update your reading — try again.");
    } finally {
      setAddingBusy(false);
      onAddingChange?.(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {editing ? (
            <Input
              {...form.register("meal_name")}
              className="text-lg font-semibold"
              placeholder="Meal name"
            />
          ) : (
            <h3 className="text-lg font-semibold tracking-tight">{a.meal_name}</h3>
          )}
          {editing ? (
            <Input
              {...form.register("estimated_portion")}
              className="mt-1.5"
              placeholder="Estimated portion"
            />
          ) : (
            a.estimated_portion && (
              <p className="text-sm text-muted-foreground">Portion: {a.estimated_portion}</p>
            )
          )}
        </div>
        {canEdit && !editing && (
          <Button size="icon" variant="ghost" onClick={startEditing}>
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </div>

      {editing ? (
        <Input
          {...form.register("identified_items")}
          placeholder="Identified items, comma separated"
        />
      ) : (
        a.identified_items.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {a.identified_items.map((item, idx) => (
              <span
                key={idx}
                className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground"
              >
                {item}
              </span>
            ))}
          </div>
        )
      )}

      {/* The reading's hero — statement first (docs/PLAN.md Phase 3 / the "2a"
          nutrient-card handoff): the plain-language line is the single
          largest, boldest text on the card, and hit/miss on key nutrients
          reads via tile fill before any number does. */}
      <Card className="rounded-lg p-6">
        <h3 className="mb-5 font-serif text-2xl leading-tight font-semibold tracking-tight text-balance">
          {a.opening_note}
        </h3>

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="font-label text-xs tracking-widest text-muted-foreground uppercase">
            Your key nutrients
          </p>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-full bg-secondary p-0.5 text-xs">
              {(["simple", "detailed"] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setMode(level)}
                  className={`rounded-full px-2 py-0.5 capitalize transition-colors ${
                    mode === level
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            {editing && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() =>
                  microFields.append({
                    nutrient: "iron",
                    level: "present",
                    from: "",
                    amount_estimate: null,
                  })
                }
              >
                <Plus className="mr-1 h-3 w-3" />
                Add
              </Button>
            )}
          </div>
        </div>
        {mode === "detailed" && a.estimation_basis && (
          <p className="mb-3 text-xs text-muted-foreground">
            {ESTIMATION_BASIS_LABELS[a.estimation_basis]}
          </p>
        )}
        {editing ? (
          <div className="space-y-2">
            {microFields.fields.map((field, i) => (
              <div key={field.id} className="flex items-center gap-2">
                <select
                  className="h-9 flex-1 rounded-md border border-input bg-transparent px-2 text-sm"
                  {...form.register(`micronutrients.${i}.nutrient`)}
                >
                  {TRACKED_NUTRIENTS.map((n) => (
                    <option key={n} value={n}>
                      {NUTRIENT_LABELS[n]}
                    </option>
                  ))}
                </select>
                <select
                  className="h-9 flex-1 rounded-md border border-input bg-transparent px-2 text-sm"
                  {...form.register(`micronutrients.${i}.level`)}
                >
                  {NUTRIENT_LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {LEVEL_LABELS[l]}
                    </option>
                  ))}
                </select>
                <Input
                  placeholder="From which food"
                  className="flex-1"
                  {...form.register(`micronutrients.${i}.from`)}
                />
                {mode === "detailed" && (
                  <>
                    <Input
                      type="number"
                      step="any"
                      placeholder="Low"
                      className="w-20"
                      {...form.register(`micronutrients.${i}.amount_estimate.low`, {
                        valueAsNumber: true,
                      })}
                    />
                    <Input
                      type="number"
                      step="any"
                      placeholder="High"
                      className="w-20"
                      {...form.register(`micronutrients.${i}.amount_estimate.high`, {
                        valueAsNumber: true,
                      })}
                    />
                  </>
                )}
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => microFields.remove(i)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : displayedMicronutrients.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {displayedMicronutrients.map((m, i) => {
              const variant = tileVariant(m.level);
              const pct = mode === "detailed" ? pctOfDailyValue(m) : null;
              return (
                <div
                  key={i}
                  className={`flex flex-col gap-0.5 rounded-xl p-3 ${
                    variant === "strong"
                      ? "border border-primary bg-primary"
                      : variant === "partial"
                        ? "border border-border bg-secondary"
                        : "border border-dashed border-border"
                  }`}
                >
                  <span
                    className={`font-label text-[11px] tracking-wide uppercase ${
                      variant === "strong"
                        ? "text-gold-300"
                        : variant === "partial"
                          ? "text-muted-foreground"
                          : "text-muted-foreground/80"
                    }`}
                  >
                    {NUTRIENT_LABELS[m.nutrient] ?? m.nutrient}
                  </span>
                  <span
                    className={`font-serif text-[1.05rem] leading-tight ${
                      variant === "strong"
                        ? "font-semibold text-primary-foreground"
                        : variant === "partial"
                          ? "font-semibold text-primary"
                          : "font-normal text-muted-foreground"
                    }`}
                  >
                    {LEVEL_LABELS[m.level] ?? m.level}
                  </span>
                  {mode === "detailed" && m.amount_estimate && pct !== null && (
                    <span
                      className={`text-[11px] tabular-nums ${
                        variant === "strong"
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      ~{m.amount_estimate.low}–{m.amount_estimate.high}
                      {NUTRIENT_UNITS[m.nutrient]} · {pct}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : a.micronutrients.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing tracked for this reading.</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            No focus nutrients chosen yet — pick a few in Settings to see them here.
          </p>
        )}

        {a.offered.length > 0 && (
          <div className="mt-5 border-t border-border pt-4">
            <p className="mb-2 font-label text-[11px] tracking-widest text-muted-foreground uppercase">
              Also worth noting
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {a.offered.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        )}

        {(a.worth_trying.length > 0 || a.absorption_notes.length > 0) && (
          <div className="mt-4 border-t border-border pt-4">
            <p className="mb-2.5 font-label text-xs tracking-widest text-primary uppercase">
              Worth trying for these
            </p>
            {a.worth_trying.length > 0 && (
              <ul className="list-disc space-y-1.5 pl-5 text-sm">
                {a.worth_trying.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            )}
            {a.absorption_notes.length > 0 && (
              <div className={a.worth_trying.length > 0 ? "mt-3" : undefined}>
                <p className="mb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  Pairing &amp; timing
                </p>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {a.absorption_notes.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
            )}
            {allowAddConfirmation && mealId && (
              <div className="mt-3 border-t border-border/60 pt-3">
                <div className="flex gap-2">
                  <Input
                    value={addingText}
                    onChange={(e) => setAddingText(e.target.value)}
                    placeholder="I added…"
                    maxLength={300}
                    disabled={addingBusy || editing}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") confirmAddition();
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={confirmAddition}
                    disabled={addingBusy || editing || !addingText.trim()}
                  >
                    {addingBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Update my reading"
                    )}
                  </Button>
                </div>
                {addingBusy && (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Updating your reading with what you added…
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Deliberately gold, not plum — informational, not target-tracked, so
          it reads as a different, lower-priority system from the tile grid
          above (design handoff hierarchy rule 4). */}
      <div>
        <p className="mb-2 font-label text-[11px] tracking-widest text-muted-foreground uppercase">
          Unchanged below
        </p>
        <Card className="p-4">
          {editing ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <div>
                <label className="text-xs text-muted-foreground">Protein (g)</label>
                <Input
                  type="number"
                  step="any"
                  {...form.register("building_blocks.protein_g", { valueAsNumber: true })}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Fiber (g)</label>
                <Input
                  type="number"
                  step="any"
                  {...form.register("building_blocks.fiber_g", { valueAsNumber: true })}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Carb quality</label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  {...form.register("building_blocks.carb_quality")}
                >
                  {CARB_QUALITIES.map((q) => (
                    <option key={q} value={q}>
                      {CARB_QUALITY_LABELS[q]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2 md:col-span-3">
                <label className="text-xs text-muted-foreground">
                  Healthy fat sources, comma separated
                </label>
                <Input {...form.register("building_blocks.healthy_fat_sources")} />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-border bg-gold-100 p-3">
                  <p className="font-label text-[11px] tracking-wide text-chart-5 uppercase">
                    Protein
                  </p>
                  <p className="text-lg font-semibold text-muted-foreground">
                    {Math.round(a.building_blocks.protein_g)}g
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-gold-100 p-3">
                  <p className="font-label text-[11px] tracking-wide text-chart-5 uppercase">
                    Fiber
                  </p>
                  <p className="text-lg font-semibold text-muted-foreground">
                    {Math.round(a.building_blocks.fiber_g)}g
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-gold-100 p-3">
                  <p className="font-label text-[11px] tracking-wide text-chart-5 uppercase">
                    Carbs
                  </p>
                  <p className="text-lg font-semibold text-muted-foreground">
                    {CARB_QUALITY_LABELS[a.building_blocks.carb_quality]}
                  </p>
                </div>
              </div>
              {a.building_blocks.healthy_fat_sources.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Healthy fats: {a.building_blocks.healthy_fat_sources.join(", ")}
                </p>
              )}
            </div>
          )}
        </Card>
      </div>

      {editing && (
        <div className="flex gap-2">
          <Button onClick={form.handleSubmit(save)} disabled={saving}>
            Save
          </Button>
          <Button type="button" variant="outline" onClick={cancel} disabled={saving}>
            <X className="mr-1 h-4 w-4" />
            Cancel
          </Button>
        </div>
      )}

      {a.uncertainty && (
        <p className="text-sm text-muted-foreground">We couldn't quite see: {a.uncertainty}</p>
      )}
    </div>
  );
}
