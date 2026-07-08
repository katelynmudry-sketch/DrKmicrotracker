// Standardized cuisine/heritage categories (docs/ETHOS.md principle 8).
// Matches the organizing structure of Dr. K's master food priority list
// (13 primary regional categories, ~42 foods each, plus a few well-represented
// additions from her own notes: Andean/South American, Irish/Maritime
// Canadian). Deliberately regions, not individual countries beyond what the
// source data itself distinguishes — a fixed list is what a patient can
// actually pick from in Settings, and what src/lib/nutrient-reference.ts
// tags its entries with so the two line up. Never shown to the patient as a
// label on a food suggestion — used only to decide which suggestions lead.
export const CUISINE_OPTIONS = [
  "Canadian / North American",
  "Ukrainian / Eastern European",
  "Italian",
  "Spanish / Mediterranean",
  "Mexican",
  "Cuban / Caribbean",
  "Andean / South American",
  "West African",
  "East African",
  "South Asian (Indian)",
  "Southeast Asian",
  "East Asian",
  "Middle Eastern",
  "Irish / Maritime Canadian",
] as const;

export type Cuisine = (typeof CUISINE_OPTIONS)[number];
