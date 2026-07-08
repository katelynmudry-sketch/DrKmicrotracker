import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { ChevronDown, Loader2, Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import { analyzeMeal, updateMealAnalysis } from "@/lib/meals.functions";
import { isMockMode } from "@/lib/mock-mode";
import {
  TRACKED_NUTRIENTS,
  NUTRIENT_LABELS,
  NUTRIENT_LEVELS,
  LEVEL_LABELS,
  NUTRIENT_UNITS,
  ESTIMATION_BASIS_LABELS,
  CARB_QUALITIES,
  CARB_QUALITY_LABELS,
  TIER_LABELS,
  type MealAnalysis,
  type Micronutrient,
  type TrackedNutrient,
} from "@/lib/analysis.schema";
import type { DetailLevel } from "@/lib/users.schema";

// Functional rendering of the new reading shape — the Botanical Clinic-style
// visual pass (reading rows, dashed dividers) is Phase 3's job (docs/PLAN.md).
// This pass just needs to show every field correctly and keep inline editing
// working, in the vocabulary from docs/VOICE.md.

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
  isDoctor,
  spotlightLabel = "On your protocol",
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
  // Doctor's Micronutrients card collapses by default (she reviews many
  // meals per patient); the patient's stays expanded, unchanged from before.
  isDoctor?: boolean;
  spotlightLabel?: string;
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
  const [microOpen, setMicroOpen] = useState(!isDoctor);

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
    setMicroOpen(true);
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

      <p className="text-base italic text-foreground">{a.opening_note}</p>

      {(a.worth_trying.length > 0 || a.absorption_notes.length > 0) && (
        <Card className="border-primary/30 bg-primary/5 p-5">
          <div className="mb-2 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Worth trying
            </p>
          </div>
          {a.worth_trying.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {a.worth_trying.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          )}
          {a.absorption_notes.length > 0 && (
            <div className={a.worth_trying.length > 0 ? "mt-3" : undefined}>
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
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
                  {addingBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update my reading"}
                </Button>
              </div>
              {addingBusy && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Updating your reading with what you added…
                </p>
              )}
            </div>
          )}
        </Card>
      )}

      {a.offered.length > 0 && (
        <Section title="What this meal offered" items={a.offered} tone="accent" />
      )}

      <p className="pt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        The full picture
      </p>

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

      <Card className="p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Building blocks
        </p>
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
              <div className="rounded-lg bg-secondary p-3">
                <p className="text-xs text-muted-foreground">Protein</p>
                <p className="text-lg font-semibold">{Math.round(a.building_blocks.protein_g)}g</p>
              </div>
              <div className="rounded-lg bg-secondary p-3">
                <p className="text-xs text-muted-foreground">Fiber</p>
                <p className="text-lg font-semibold">{Math.round(a.building_blocks.fiber_g)}g</p>
              </div>
              <div className="rounded-lg bg-secondary p-3">
                <p className="text-xs text-muted-foreground">Carbs</p>
                <p className="text-lg font-semibold">
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

      <Card className="p-4">
        <Collapsible open={microOpen} onOpenChange={setMicroOpen}>
          <div className="flex items-center justify-between gap-2">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex min-w-0 items-center gap-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                <ChevronDown
                  className={`h-3.5 w-3.5 shrink-0 transition-transform ${microOpen ? "" : "-rotate-90"}`}
                />
                <span>Micronutrients</span>
                {!microOpen && displayedMicronutrients.length > 0 && (
                  <span className="truncate normal-case tracking-normal text-muted-foreground/80">
                    — {summarizeNutrients(displayedMicronutrients)}
                  </span>
                )}
              </button>
            </CollapsibleTrigger>
            <div className="flex shrink-0 items-center gap-2">
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
          <CollapsibleContent className="mt-3">
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
              <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {displayedMicronutrients.map((m, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate">{NUTRIENT_LABELS[m.nutrient] ?? m.nutrient}</span>
                      {mode === "detailed" && isFocus(m.nutrient) && (
                        <Badge variant="secondary" className="shrink-0 text-[10px] font-medium">
                          {spotlightLabel}
                        </Badge>
                      )}
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      {LEVEL_LABELS[m.level] ?? m.level} · {m.from}
                      {mode === "detailed" && m.amount_estimate && (
                        <>
                          {" "}
                          · ~{m.amount_estimate.low}–{m.amount_estimate.high}
                          {NUTRIENT_UNITS[m.nutrient]}
                        </>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            ) : a.micronutrients.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing tracked for this reading.</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No focus nutrients chosen yet — pick a few in Settings to see them here.
              </p>
            )}
          </CollapsibleContent>
        </Collapsible>
      </Card>

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

      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Protocol fit
          </p>
          <p className="mt-1 text-sm">{a.protocol_fit.note}</p>
        </div>
        <span className="whitespace-nowrap rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent-foreground">
          {TIER_LABELS[a.protocol_fit.tier] ?? a.protocol_fit.tier}
        </span>
      </Card>

      {a.uncertainty && (
        <p className="text-sm text-muted-foreground">We couldn't quite see: {a.uncertainty}</p>
      )}
    </div>
  );
}

// Collapsed-state summary for the Micronutrients card — plain nutrient names
// only, never tiers/amounts, so it reads as a name list, not a verdict.
function summarizeNutrients(micronutrients: Micronutrient[]): string {
  const names = micronutrients.map((m) => NUTRIENT_LABELS[m.nutrient] ?? m.nutrient);
  const shown = names.slice(0, 3);
  const rest = names.length - shown.length;
  return rest > 0 ? `${shown.join(", ")} +${rest} more` : shown.join(", ");
}

function Section({ title, items, tone }: { title: string; items: string[]; tone?: "accent" }) {
  const toneCls = tone === "accent" ? "border-accent/40 bg-accent/5" : "border-border bg-card";
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
