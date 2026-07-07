// Standardized cuisine/heritage categories (docs/ETHOS.md's cultural-relevance
// principle). Deliberately broad regions, not individual countries — a fixed,
// short list is what a patient can actually pick from in Settings, and what
// src/lib/nutrient-reference.ts tags its entries with so the two line up.
// Never shown to the patient as a label on a food suggestion — used only to
// decide which suggestions lead the list (see splitFoodsForNutrient).
export const CUISINE_OPTIONS = [
  "South Asian",
  "East Asian",
  "Southeast Asian",
  "Middle Eastern",
  "Eastern European",
  "Mediterranean",
  "Caribbean",
  "West African",
  "East African",
  "Latin American",
] as const;

export type Cuisine = (typeof CUISINE_OPTIONS)[number];
