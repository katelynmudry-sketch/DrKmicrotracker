import type { TrackedNutrient } from "@/lib/analysis.schema";

// General adult daily reference amounts (docs/ETHOS.md principle 2) — the
// kind of figure printed on a nutrition-facts panel, not a per-patient
// prescription. Used only to turn a raw amount into a human "about a third of
// a typical day's target" line (see rdiProgressPhrase below); never shown as
// a bare "% RDI" number and never personalized by age/sex/pregnancy — that
// would need a patient profile field this app doesn't have. If Dr. K wants
// per-patient targets later, that's a rubric-level decision, not this table.
export const NUTRIENT_UNITS: Record<TrackedNutrient, string> = {
  iron: "mg",
  b12: "mcg",
  vitamin_d: "IU",
  calcium: "mg",
  omega_3: "g",
  iodine: "mcg",
  zinc: "mg",
  choline: "mg",
  magnesium: "mg",
  folate: "mcg",
  vitamin_b6: "mg",
  potassium: "mg",
  vitamin_c: "mg",
  vitamin_a: "mcg RAE",
};

export const DAILY_TARGET: Record<TrackedNutrient, number> = {
  iron: 18,
  b12: 2.4,
  vitamin_d: 600,
  calcium: 1000,
  omega_3: 1.6,
  iodine: 150,
  zinc: 11,
  choline: 425,
  magnesium: 400,
  folate: 400,
  vitamin_b6: 1.3,
  potassium: 2600,
  vitamin_c: 75,
  vitamin_a: 700,
};

const FRACTION_PHRASES: [number, string][] = [
  [0.9, "about a full day's target"],
  [0.66, "about two-thirds of a typical day's target"],
  [0.4, "close to half of a typical day's target"],
  [0.25, "about a quarter of a typical day's target"],
  [0.1, "a modest step toward a typical day's target"],
];

// A plain-language stand-in for "% RDI" (docs/VOICE.md: never show that
// phrase to a patient). Deliberately coarse buckets, not a precise percentage
// — the underlying amount is itself only ever an estimate.
export function rdiProgressPhrase(nutrient: TrackedNutrient, amount: number): string {
  const target = DAILY_TARGET[nutrient];
  const ratio = amount / target;
  for (const [threshold, phrase] of FRACTION_PHRASES) {
    if (ratio >= threshold) return phrase;
  }
  return "a small contribution toward a typical day's target";
}

// "6.6mg", "600 IU", "700 mcg RAE" — a space only where the unit itself has
// one (IU, mcg RAE aren't SI-style suffixes, mg/mcg/g read fine flush).
export function formatAmount(nutrient: TrackedNutrient, amount: number): string {
  const unit = NUTRIENT_UNITS[nutrient];
  const rounded = amount >= 10 ? Math.round(amount) : Math.round(amount * 10) / 10;
  return unit === "IU" ? `${rounded} IU` : `${rounded}${unit}`;
}
