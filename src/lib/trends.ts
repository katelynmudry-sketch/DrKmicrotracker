// Pure functions behind the Patterns page (docs/PLAN.md Phase 4a). No IO —
// takes the meals a caller already fetched and returns plain data for charts.
// Everything here reports counts and qualitative coverage only (see
// CLAUDE.md's hard rules) — there is deliberately no "percentage" or "0-100"
// value exposed to the UI.
import {
  TRACKED_NUTRIENTS,
  NUTRIENT_LABELS,
  type Meal,
  type TrackedNutrient,
} from "@/lib/analysis.schema";

function withinDays(eatenAt: string, days: number, now = Date.now()): boolean {
  return now - new Date(eatenAt).getTime() <= days * 24 * 60 * 60 * 1000;
}

function analyzedInWindow(meals: Meal[], days: number): Meal[] {
  return meals.filter((m) => m.status === "analyzed" && m.analysis && withinDays(m.eatenAt, days));
}

export type NutrientCoverage = {
  nutrient: TrackedNutrient;
  label: string;
  strongCount: number;
  totalReadings: number;
  isGap: boolean;
};

const GAP_COVERAGE_RATIO = 0.4;

// For each tracked nutrient: how many of the window's readings called it out
// as a strong or present source. A nutrient that clears the bar in fewer than
// GAP_COVERAGE_RATIO of readings is a gap — a candidate for "Try something
// new" (see nutrient-reference.ts), never a warning.
export function computeNutrientCoverage(meals: Meal[], days = 14): NutrientCoverage[] {
  const readings = analyzedInWindow(meals, days);
  const totalReadings = readings.length;

  return TRACKED_NUTRIENTS.map((nutrient) => {
    const strongCount = readings.filter((m) =>
      m.analysis!.micronutrients.some((n) => n.nutrient === nutrient && n.level === "strong"),
    ).length;
    const isGap = totalReadings > 0 && strongCount / totalReadings < GAP_COVERAGE_RATIO;
    return { nutrient, label: NUTRIENT_LABELS[nutrient], strongCount, totalReadings, isGap };
  }).sort(
    (a, b) => a.strongCount / (a.totalReadings || 1) - b.strongCount / (b.totalReadings || 1),
  );
}

// Lightweight keyword heuristics, not a botanical or nutrition database — good
// enough to celebrate variety and colour on the Patterns page without a second
// data source. False negatives (an unrecognized plant) undercount; that's the
// safe direction for a "counts, never grades" feature.
const ANIMAL_KEYWORDS = [
  "chicken",
  "beef",
  "pork",
  "turkey",
  "lamb",
  "salmon",
  "tuna",
  "fish",
  "shrimp",
  "prawn",
  "egg",
  "milk",
  "cheese",
  "yogurt",
  "yoghurt",
  "butter",
  "cream",
  "bacon",
  "sausage",
  "ham",
  "whey",
  "gelatin",
];

function isPlantItem(item: string): boolean {
  const lower = item.toLowerCase();
  return !ANIMAL_KEYWORDS.some((k) => lower.includes(k));
}

export function computePlantVariety(meals: Meal[], days = 7): { count: number; items: string[] } {
  const readings = analyzedInWindow(meals, days);
  const items = new Set<string>();
  for (const m of readings) {
    for (const item of m.analysis!.identified_items) {
      if (isPlantItem(item)) items.add(item.trim().toLowerCase());
    }
  }
  return { count: items.size, items: [...items] };
}

const COLOUR_KEYWORDS: Record<string, string[]> = {
  Green: [
    "spinach",
    "kale",
    "broccoli",
    "lettuce",
    "cucumber",
    "zucchini",
    "pea",
    "edamame",
    "avocado",
    "arugula",
    "brussels",
  ],
  Red: [
    "tomato",
    "strawberr",
    "raspberr",
    "red pepper",
    "cherry",
    "beet",
    "radish",
    "watermelon",
    "pomegranate",
  ],
  "Orange/yellow": [
    "carrot",
    "squash",
    "sweet potato",
    "pumpkin",
    "mango",
    "orange",
    "pineapple",
    "banana",
    "corn",
    "lemon",
    "peach",
    "apricot",
  ],
  "Purple/blue": ["blueberr", "blackberr", "purple cabbage", "eggplant", "plum", "grape", "fig"],
};

export function computeColourDiversity(
  meals: Meal[],
  days = 7,
): { count: number; total: number; colours: string[] } {
  const readings = analyzedInWindow(meals, days);
  const allItems = readings.flatMap((m) =>
    m.analysis!.identified_items.map((i) => i.toLowerCase()),
  );
  const colours = Object.entries(COLOUR_KEYWORDS)
    .filter(([, keywords]) => keywords.some((k) => allItems.some((item) => item.includes(k))))
    .map(([colour]) => colour);
  return { count: colours.length, total: Object.keys(COLOUR_KEYWORDS).length, colours };
}

export type DailyBuildingBlocks = { date: string; protein_g: number; fiber_g: number };

// Average protein/fiber per meal, grouped by the day it was eaten — the
// "rhythm" is meant to be read against a gentle food-first band (see
// PROTEIN_BAND_G / FIBER_BAND_G below), not a hard doctor-set number; no such
// per-patient target exists in the schema yet.
export function computeBuildingBlocksSeries(meals: Meal[], days = 14): DailyBuildingBlocks[] {
  const readings = analyzedInWindow(meals, days);
  const byDay = new Map<string, { protein: number; fiber: number; count: number }>();
  for (const m of readings) {
    const date = m.eatenAt.slice(0, 10);
    const entry = byDay.get(date) ?? { protein: 0, fiber: 0, count: 0 };
    entry.protein += m.analysis!.building_blocks.protein_g;
    entry.fiber += m.analysis!.building_blocks.fiber_g;
    entry.count += 1;
    byDay.set(date, entry);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { protein, fiber, count }]) => ({
      date,
      protein_g: Math.round(protein / count),
      fiber_g: Math.round(fiber / count),
    }));
}

// A generic food-first reference band, not a per-patient prescription — see
// docs/ETHOS.md: protein "at every meal" and fiber are positions Dr. K holds
// for most patients, not a number she sets per patient today.
export const PROTEIN_BAND_G: [number, number] = [20, 30];
export const FIBER_BAND_G: [number, number] = [8, 12];

export function computeLoggingStreak(meals: Meal[]): {
  currentStreakDays: number;
  loggedThisWeek: number;
} {
  const days = new Set(meals.map((m) => m.eatenAt.slice(0, 10)));
  let streak = 0;
  const cursor = new Date();
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (!days.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  const loggedThisWeek = meals.filter((m) => withinDays(m.eatenAt, 7)).length;
  return { currentStreakDays: streak, loggedThisWeek };
}
