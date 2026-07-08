import { NUTRIENT_UNITS, NUTRIENT_DAILY_VALUES, type TrackedNutrient } from "@/lib/analysis.schema";

// Thin formatting helpers over analysis.schema.ts's canonical NUTRIENT_UNITS/
// NUTRIENT_DAILY_VALUES (general adult reference values, not personalized —
// see that file's header and docs/ETHOS.md principle 2). Distinct from
// src/lib/nutrient-profile.ts's daily rollup: this is for a single food
// suggestion's amount (src/lib/nutrient-reference.ts), not a day's total.

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
  const target = NUTRIENT_DAILY_VALUES[nutrient];
  const ratio = amount / target;
  for (const [threshold, phrase] of FRACTION_PHRASES) {
    if (ratio >= threshold) return phrase;
  }
  return "a small contribution toward a typical day's target";
}

// "6.6mg", "700mcg" — NUTRIENT_UNITS is always mg/mcg/g, all flush-set.
export function formatAmount(nutrient: TrackedNutrient, amount: number): string {
  const unit = NUTRIENT_UNITS[nutrient];
  const rounded = amount >= 10 ? Math.round(amount) : Math.round(amount * 10) / 10;
  return `${rounded}${unit}`;
}
