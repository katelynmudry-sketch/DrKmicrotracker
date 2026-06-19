import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { updateMealAnalysis } from "@/lib/meals.functions";
import { isMockMode } from "@/lib/mock-mode";

type Macros = {
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
};

type KeyMicro = { name: string; amount: string; daily_value_pct: number | null };

type Analysis = {
  meal_name?: string;
  identified_items?: string[];
  estimated_portion?: string;
  macros?: Partial<Macros>;
  key_micros?: KeyMicro[];
  rubric_notes?: string[];
  naturopathic_recommendations?: string[];
  concerns?: string[];
  overall_score?: number;
};

const macroLabels: Record<string, string> = {
  calories_kcal: "Calories (kcal)",
  protein_g: "Protein (g)",
  carbs_g: "Carbs (g)",
  fat_g: "Fat (g)",
  fiber_g: "Fiber (g)",
  sugar_g: "Sugar (g)",
};

type EditValues = {
  meal_name: string;
  estimated_portion: string;
  macros: Macros;
  key_micros: KeyMicro[];
};

export function AnalysisView({
  analysis,
  mealId,
  editable,
  onSaved,
}: {
  analysis: unknown;
  mealId?: string;
  editable?: boolean;
  onSaved?: (analysis: unknown) => void;
}) {
  const updateFn = useServerFn(updateMealAnalysis);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const a = (analysis ?? {}) as Analysis;

  const snapshot = (): EditValues => ({
    meal_name: a.meal_name ?? "",
    estimated_portion: a.estimated_portion ?? "",
    macros: {
      calories_kcal: a.macros?.calories_kcal ?? 0,
      protein_g: a.macros?.protein_g ?? 0,
      carbs_g: a.macros?.carbs_g ?? 0,
      fat_g: a.macros?.fat_g ?? 0,
      fiber_g: a.macros?.fiber_g ?? 0,
      sugar_g: a.macros?.sugar_g ?? 0,
    },
    key_micros: a.key_micros ?? [],
  });

  const form = useForm<EditValues>({ defaultValues: snapshot() });
  const microFields = useFieldArray({ control: form.control, name: "key_micros" });

  const canEdit = !!editable && !!mealId;

  if (!analysis) {
    return <p className="text-sm text-muted-foreground">No analysis yet.</p>;
  }

  const startEditing = () => {
    form.reset(snapshot());
    setEditing(true);
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
            macros: values.macros,
            key_micros: values.key_micros,
          },
        },
      });
      toast.success("Analysis updated");
      setEditing(false);
      onSaved?.(result.analysis);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    form.reset();
    setEditing(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          {editing ? (
            <Input
              {...form.register("meal_name")}
              className="text-lg font-semibold"
              placeholder="Meal name"
            />
          ) : (
            <h3 className="text-lg font-semibold tracking-tight">
              {a.meal_name ?? "Meal analysis"}
            </h3>
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
        <div className="flex items-center gap-2">
          {typeof a.overall_score === "number" && (
            <div className="rounded-full border border-border bg-accent/10 px-3 py-1 text-sm font-semibold text-accent-foreground">
              Rubric score {a.overall_score}/10
            </div>
          )}
          {canEdit && !editing && (
            <Button size="icon" variant="ghost" onClick={startEditing}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>
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

      <Card className="p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Macronutrients
        </p>
        {editing ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {Object.keys(macroLabels).map((k) => (
              <div key={k}>
                <label className="text-xs text-muted-foreground">{macroLabels[k]}</label>
                <Input
                  type="number"
                  step="any"
                  {...form.register(`macros.${k as keyof Macros}`, { valueAsNumber: true })}
                />
              </div>
            ))}
          </div>
        ) : (
          a.macros && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {Object.entries(a.macros).map(([k, v]) => (
                <div key={k} className="rounded-lg bg-secondary p-3">
                  <p className="text-xs text-muted-foreground">{macroLabels[k] ?? k}</p>
                  <p className="text-lg font-semibold">{Math.round(Number(v))}</p>
                </div>
              ))}
            </div>
          )
        )}
      </Card>

      {(editing || (a.key_micros && a.key_micros.length > 0)) && (
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Key micronutrients
            </p>
            {editing && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => microFields.append({ name: "", amount: "", daily_value_pct: null })}
              >
                <Plus className="mr-1 h-3 w-3" />
                Add
              </Button>
            )}
          </div>
          {editing ? (
            <div className="space-y-2">
              {microFields.fields.map((field, i) => (
                <div key={field.id} className="flex items-center gap-2">
                  <Input
                    placeholder="Name"
                    className="flex-1"
                    {...form.register(`key_micros.${i}.name`)}
                  />
                  <Input
                    placeholder="Amount"
                    className="flex-1"
                    {...form.register(`key_micros.${i}.amount`)}
                  />
                  <Input
                    type="number"
                    step="any"
                    placeholder="% DV"
                    className="w-20"
                    {...form.register(`key_micros.${i}.daily_value_pct`, {
                      setValueAs: (v) => (v === "" ? null : Number(v)),
                    })}
                  />
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
          ) : (
            <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {a.key_micros!.map((m, i) => (
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
          )}
        </Card>
      )}

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
