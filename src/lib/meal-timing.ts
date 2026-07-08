// When a meal was eaten drives an automatic breakfast/lunch/dinner/snack
// label — a best guess from the clock, never a claim about what's on the
// plate. The patient can always move the time (and the guess re-derives) or
// tap a different label directly.

export const MEAL_TIMINGS = ["breakfast", "lunch", "dinner", "snack"] as const;
export type MealTiming = (typeof MEAL_TIMINGS)[number];

export const MEAL_TIMING_LABELS: Record<MealTiming, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

export function inferMealTiming(date: Date): MealTiming {
  const hour = date.getHours();
  if (hour >= 5 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 15) return "lunch";
  if (hour >= 17 && hour < 21) return "dinner";
  return "snack";
}

// Formats a Date for an <input type="datetime-local"> value, in local time
// (toISOString would shift to UTC and show the wrong clock time to the patient).
export function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Meals logged before this field existed have no stored mealTiming — fall
// back to inferring it from eatenAt so old meals still show a label.
export function mealTimingLabel(meal: { eatenAt: string; mealTiming?: MealTiming }): string {
  return MEAL_TIMING_LABELS[meal.mealTiming ?? inferMealTiming(new Date(meal.eatenAt))];
}
