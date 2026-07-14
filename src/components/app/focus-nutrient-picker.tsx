import { NUTRIENT_LABELS, type TrackedNutrient } from "@/lib/analysis.schema";

// Same grouping as clinical-spine.ts's CLINICAL_POSITIONS, for consistency
// between what the doctor/patient picks from and how the AI reasons about it.
const NUTRIENT_GROUPS: { title: string; nutrients: TrackedNutrient[] }[] = [
  {
    title: "Minerals",
    nutrients: [
      "iron",
      "zinc",
      "magnesium",
      "calcium",
      "iodine",
      "selenium",
      "phosphorus",
      "potassium",
      "copper",
      "manganese",
      "chromium",
      "molybdenum",
    ],
  },
  {
    title: "Fat-soluble vitamins",
    nutrients: ["vitamin_d", "vitamin_a", "vitamin_e", "vitamin_k", "omega_3"],
  },
  {
    title: "B-vitamins",
    nutrients: [
      "b12",
      "choline",
      "thiamin",
      "riboflavin",
      "niacin",
      "vitamin_b6",
      "folate",
      "biotin",
      "pantothenic_acid",
    ],
  },
  { title: "Vitamin C", nutrients: ["vitamin_c"] },
];

// A grouped checkbox picker over the full tracked-nutrient list, shared by
// the doctor's per-patient focus editor and the patient's own Settings page.
export function FocusNutrientPicker({
  value,
  onChange,
}: {
  value: TrackedNutrient[];
  onChange: (next: TrackedNutrient[]) => void;
}) {
  const toggle = (n: TrackedNutrient) => {
    onChange(value.includes(n) ? value.filter((x) => x !== n) : [...value, n]);
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {NUTRIENT_GROUPS.map((group) => (
        <div key={group.title}>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {group.title}
          </p>
          <div className="space-y-1">
            {group.nutrients.map((n) => (
              <label key={n} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={value.includes(n)}
                  onChange={() => toggle(n)}
                  className="h-4 w-4 rounded border-input"
                />
                {NUTRIENT_LABELS[n]}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
