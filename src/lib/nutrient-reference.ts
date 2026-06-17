// Shared Health Canada Daily Value reference amounts (2016 Nutrition Facts
// Table regulations) for the micronutrient columns we track in
// food_reference. Used both to flag nutrient gaps and to compute
// daily_value_pct for manually-logged meals.
export type NutrientColumn =
  | "vitamin_a_rae_mcg"
  | "vitamin_c_mg"
  | "vitamin_d_mcg"
  | "iron_mg"
  | "calcium_mg"
  | "zinc_mg"
  | "magnesium_mg"
  | "potassium_mg";

export const NUTRIENT_DISPLAY: Record<
  NutrientColumn,
  { label: string; unit: string; dailyValue: number }
> = {
  vitamin_a_rae_mcg: { label: "Vitamin A", unit: "mcg", dailyValue: 900 },
  vitamin_c_mg: { label: "Vitamin C", unit: "mg", dailyValue: 90 },
  vitamin_d_mcg: { label: "Vitamin D", unit: "mcg", dailyValue: 20 },
  iron_mg: { label: "Iron", unit: "mg", dailyValue: 18 },
  calcium_mg: { label: "Calcium", unit: "mg", dailyValue: 1300 },
  zinc_mg: { label: "Zinc", unit: "mg", dailyValue: 11 },
  magnesium_mg: { label: "Magnesium", unit: "mg", dailyValue: 410 },
  potassium_mg: { label: "Potassium", unit: "mg", dailyValue: 3400 },
};

export const NUTRIENT_NAME_TO_COLUMN: Record<string, NutrientColumn> = Object.fromEntries(
  (Object.entries(NUTRIENT_DISPLAY) as Array<[NutrientColumn, { label: string }]>).map(
    ([column, meta]) => [meta.label.toLowerCase(), column],
  ),
);
