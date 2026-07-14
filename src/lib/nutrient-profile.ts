// The daily Nutrient Profile — a deliberate, narrow exception to trends.ts's
// "no percentage" rule, scoped to this file only (see docs/ETHOS.md
// principle 2's second carve-out). Detailed mode shows the percentage;
// Simple mode shows only the qualitative band word. Population-average
// reference values, never personalized — see NUTRIENT_DAILY_VALUES.
import {
  TRACKED_NUTRIENTS,
  NUTRIENT_LABELS,
  NUTRIENT_UNITS,
  NUTRIENT_DAILY_VALUES,
  type Meal,
  type TrackedNutrient,
} from "@/lib/analysis.schema";

export const PROFILE_BANDS = ["good_focus", "building_up", "well_covered"] as const;
export type ProfileBand = (typeof PROFILE_BANDS)[number];

// First-draft wording — these haven't had the "tuned with Katelyn" pass the
// existing tier labels got (see docs/VOICE.md). Not blocking; refine later.
export const PROFILE_BAND_LABELS: Record<ProfileBand, string> = {
  good_focus: "A good focus for today",
  building_up: "Building up",
  well_covered: "Well covered",
};

function bandForPct(pct: number): ProfileBand {
  if (pct >= 75) return "well_covered";
  if (pct >= 25) return "building_up";
  return "good_focus";
}

export type NutrientProfileEntry = {
  nutrient: TrackedNutrient;
  label: string;
  totalAmount: number;
  unit: "mg" | "mcg" | "g";
  dailyValue: number;
  // Uncapped — the UI is responsible for display-capping at "100%+" so an
  // overage never reads as "you exceeded" (this app never uses limit
  // language, see docs/VOICE.md).
  pct: number;
  band: ProfileBand;
};

function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// A single calendar day in the caller's local time zone (not UTC — avoids
// misattributing a late-night meal), keyed off each meal's eatenAt. Sums the
// midpoint of amount_estimate.low/high per nutrient across that day's
// analyzed meals.
export function computeDailyNutrientProfile(
  meals: Meal[],
  date: Date = new Date(),
): NutrientProfileEntry[] {
  const dayKey = localDateKey(date);
  const dayMeals = meals.filter(
    (m) => m.status === "analyzed" && m.analysis && localDateKey(new Date(m.eatenAt)) === dayKey,
  );

  return TRACKED_NUTRIENTS.map((nutrient) => {
    let total = 0;
    for (const m of dayMeals) {
      const entry = m.analysis!.micronutrients.find((n) => n.nutrient === nutrient);
      if (entry?.amount_estimate) {
        total += (entry.amount_estimate.low + entry.amount_estimate.high) / 2;
      }
    }
    const dailyValue = NUTRIENT_DAILY_VALUES[nutrient];
    const pct = dailyValue > 0 ? Math.round((total / dailyValue) * 100) : 0;
    return {
      nutrient,
      label: NUTRIENT_LABELS[nutrient],
      totalAmount: Math.round(total * 10) / 10,
      unit: NUTRIENT_UNITS[nutrient],
      dailyValue,
      pct,
      band: bandForPct(pct),
    };
  });
}
