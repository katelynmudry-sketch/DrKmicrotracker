import type { MealStyleCategory } from "@/lib/analysis.schema";

// Dr. K's approved opening_note copy, verbatim. The AI classifies a meal's
// meal_style (see MEAL_STYLE_GUIDANCE in clinical-spine.ts); it never writes
// this prose itself, so any wording change belongs here, not in a prompt.
export const MEAL_STYLE_LINES: Record<MealStyleCategory, string[]> = {
  nutrient_dense: [
    "Solid, steady nourishment that carries you through the afternoon.",
    "This plate covers a wide range, with protein, minerals and fibre showing up.",
    "Deep, even nourishment across the macronutrients.",
    "A plate with range, built to keep your energy level for hours.",
    "Broad coverage here, with the parts contributing something your body uses.",
  ],
  protein_fat_forward: [
    "Rich and grounding, with enough protein and fat to hold you for hours.",
    "This one burns slow, so hunger stays away past the next meal.",
    "Dense fuel that releases steadily, keeping your blood sugar even.",
    "Substantial and warming, the kind of plate that settles the nervous system.",
    "Deep protein and healthy fat, working together for long, steady energy.",
  ],
  simple_few_ingredients: [
    "Simple food, well chosen, with the ingredients earning their place.",
    "A short list of ingredients delivering deep nourishment.",
    "Clear food and clean energy from a handful of well selected components.",
    "Plain and generous, with real nutrition in a small number of parts.",
    "A solid base you can build on whenever you have more time.",
  ],
  fresh_veg_forward: [
    "Bright, mineral-rich and refreshing, with colour doing the nutritional work.",
    "Green and mineral-dense, easy on digestion and quick to absorb.",
    "Light and fresh, giving your system minerals without much effort to break down.",
    "Colour in abundance here, which means a wide spread of minerals and antioxidants.",
    "Crisp and cooling, with plenty of magnesium, potassium and folate.",
  ],
  assembled_plate: [
    "Small parts adding up to a satisfying meal, with real nutrition across the plate.",
    "A gathered plate that nourishes as well as anything you'd cook from scratch.",
    "Odds and ends coming together into steady, satisfying nutrition.",
    "Bits and pieces that add up well, covering protein, carbohydrate and colour.",
    "A collected plate, well fed and quietly balanced.",
  ],
  rich_celebratory: [
    "Rich, generous and worth savouring, with pleasure as part of the nourishment.",
    "Deep flavour and deep nutrition arriving together.",
    "Abundant and satisfying, the kind of meal that feeds more than hunger.",
    "Rich and generous, wide open in flavour.",
  ],
  quick_convenient: [
    "Quick comfort and easy energy, warm and ready in ten minutes.",
    "Fast, warm and filling, giving your body accessible fuel right away.",
    "Soft, familiar food that lands gently and gets energy into you quickly.",
    "Easy fuel with a warm landing, suited to a short evening.",
  ],
  carb_forward_lower_protein: [
    "Warm, quick energy your body can use right away.",
    "Grounding carbohydrate, gentle on digestion and easy to absorb.",
    "Soft fuel that lifts your energy fast and sits comfortably.",
  ],
};

export function pickOpeningNote(category: MealStyleCategory): string {
  const lines = MEAL_STYLE_LINES[category];
  return lines[Math.floor(Math.random() * lines.length)];
}
