// A small, hand-curated whole-foods reference — NOT a Canadian Nutrient File
// import (see docs/PLAN.md Phase 4b: no live CNF dataset was available to
// import in this environment, and this app never grades meals against a food
// database anyway — see docs/ETHOS.md). Used only to rank "worth adding"
// suggestions for a nutrient that's come up light lately. Foods are ordered
// food-first per Dr. K's positions (docs/PLAN.md Part 1); never surfaced with
// a number, only a name and a short reason.
import type { TrackedNutrient } from "@/lib/analysis.schema";

export type NutrientFood = { name: string; reason: string };

export const NUTRIENT_FOODS: Record<TrackedNutrient, NutrientFood[]> = {
  iron: [
    {
      name: "Pumpkin seeds",
      reason: "a handful goes a long way, especially with a squeeze of citrus",
    },
    { name: "Blackstrap molasses", reason: "a spoonful stirred into oatmeal or tea" },
    { name: "Lentils", reason: "pair with something vitamin C-rich to help it land" },
    { name: "Cooked spinach", reason: "cooking helps release the iron; add lemon for absorption" },
    { name: "Tofu", reason: "a steady plant-based source" },
  ],
  b12: [
    {
      name: "Nutritional yeast",
      reason: "fortified — an easy plant-based add to popcorn or pasta",
    },
    { name: "Sardines", reason: "small, mighty, and easy on the budget" },
    { name: "Eggs", reason: "a reliable everyday source" },
    { name: "Salmon", reason: "worth having on rotation" },
    { name: "Fortified plant milk", reason: "check the label — many brands fortify with B12" },
  ],
  vitamin_d: [
    { name: "Salmon", reason: "one of the few foods naturally rich in it" },
    { name: "Sardines", reason: "a pantry staple with real vitamin D" },
    { name: "Egg yolks", reason: "an easy everyday boost" },
    { name: "Fortified plant milk", reason: "many brands fortify — worth checking the label" },
    {
      name: "Mushrooms (UV-exposed)",
      reason: 'look for "vitamin D" on the label — not all are exposed',
    },
  ],
  calcium: [
    { name: "Tahini / sesame seeds", reason: "a spoonful on veggies or in dressing" },
    { name: "Sardines with bones", reason: "the bones are the calcium — worth it" },
    {
      name: "Collard greens or bok choy",
      reason: "cooked greens with better calcium availability than spinach",
    },
    { name: "Fortified plant milk", reason: "check the label for added calcium" },
    { name: "Yogurt", reason: "an easy everyday source" },
  ],
  omega_3: [
    { name: "Ground flaxseed", reason: "grinding it helps your body actually use it" },
    { name: "Chia seeds", reason: "easy to add to oatmeal or a smoothie" },
    { name: "Walnuts", reason: "a handful as a snack or salad topper" },
    { name: "Salmon or sardines", reason: "the most direct source" },
    { name: "Hemp seeds", reason: "a mild, easy sprinkle-on option" },
  ],
  iodine: [
    { name: "Seaweed (nori, kelp)", reason: "even a little goes a long way — easy on sushi night" },
    { name: "Cod or shrimp", reason: "a reliable seafood source" },
    { name: "Iodized salt", reason: "worth checking whether the salt at home is iodized" },
    { name: "Dairy", reason: "a steady everyday source for most people" },
  ],
  zinc: [
    { name: "Pumpkin seeds", reason: "soaking or sprouting helps your body absorb more" },
    { name: "Chickpeas", reason: "pair well with a squeeze of lemon" },
    { name: "Cashews", reason: "an easy snack-time add" },
    { name: "Oysters", reason: "one of the richest sources, if that's an option" },
    { name: "Hemp seeds", reason: "a mild, versatile sprinkle-on" },
  ],
  choline: [
    { name: "Eggs", reason: "one of the most concentrated everyday sources" },
    { name: "Salmon", reason: "worth having in rotation" },
    { name: "Soybeans or edamame", reason: "a solid plant-based option" },
    { name: "Chicken breast", reason: "a reliable everyday source" },
  ],
  magnesium: [
    { name: "Pumpkin seeds", reason: "an easy everyday snack" },
    { name: "Almonds", reason: "a handful between meals" },
    { name: "Cooked spinach", reason: "also brings iron along with it" },
    { name: "Black beans", reason: "an easy add to a bowl or salad" },
    { name: "Dark chocolate (70%+)", reason: "a genuinely good source, not just a treat" },
  ],
  selenium: [
    { name: "Brazil nuts", reason: "just one or two covers a lot of ground" },
    { name: "Sardines", reason: "a pantry staple that pulls double duty" },
    { name: "Eggs", reason: "an easy everyday source" },
    { name: "Sunflower seeds", reason: "a simple sprinkle-on" },
    { name: "Mushrooms", reason: "an easy swap into almost any sauté" },
  ],
  vitamin_a: [
    { name: "Sweet potato", reason: "a little goes a long way, roasted or mashed" },
    { name: "Carrots", reason: "easy raw or cooked" },
    { name: "Cooked spinach", reason: "cooking helps release it" },
    { name: "Eggs", reason: "an easy everyday source" },
    { name: "Dried apricots", reason: "a handful as a snack" },
  ],
  vitamin_c: [
    { name: "Citrus", reason: "a wedge alongside a meal does double duty with iron" },
    { name: "Bell peppers", reason: "raw or roasted, either way" },
    { name: "Strawberries", reason: "an easy add to breakfast" },
    { name: "Broccoli", reason: "a steady everyday source" },
    { name: "Kiwi", reason: "small but mighty" },
  ],
  vitamin_e: [
    { name: "Almonds", reason: "a handful between meals" },
    { name: "Sunflower seeds", reason: "an easy sprinkle-on" },
    { name: "Avocado", reason: "brings healthy fat along with it" },
    { name: "Cooked spinach", reason: "an easy everyday add" },
  ],
  vitamin_k: [
    { name: "Kale", reason: "a little cooked or raw in a salad" },
    { name: "Cooked spinach", reason: "an easy everyday add" },
    { name: "Broccoli", reason: "a steady everyday source" },
    { name: "Brussels sprouts", reason: "roasted is an easy way in" },
    { name: "Olive oil", reason: "helps it absorb alongside the greens above" },
  ],
  thiamin: [
    { name: "Whole grains", reason: "an easy everyday base for a bowl" },
    { name: "Pork", reason: "one of the richest everyday sources" },
    { name: "Sunflower seeds", reason: "an easy sprinkle-on" },
    { name: "Lentils", reason: "an easy add to a soup or bowl" },
    { name: "Oats", reason: "a steady everyday source" },
  ],
  riboflavin: [
    { name: "Eggs", reason: "an easy everyday source" },
    { name: "Almonds", reason: "a handful between meals" },
    { name: "Mushrooms", reason: "an easy swap into almost any sauté" },
    { name: "Yogurt", reason: "an easy everyday source" },
    { name: "Cooked spinach", reason: "an easy everyday add" },
  ],
  niacin: [
    { name: "Chicken breast", reason: "a reliable everyday source" },
    { name: "Tuna", reason: "an easy source, canned or fresh" },
    { name: "Peanuts", reason: "a handful as a snack" },
    { name: "Mushrooms", reason: "an easy swap into almost any sauté" },
    { name: "Brown rice", reason: "an easy everyday base for a bowl" },
  ],
  vitamin_b6: [
    { name: "Chickpeas", reason: "an easy add to a bowl or salad" },
    { name: "Salmon", reason: "worth having in rotation" },
    { name: "Potatoes", reason: "a steady everyday source" },
    { name: "Bananas", reason: "an easy grab-and-go" },
    { name: "Chicken breast", reason: "a reliable everyday source" },
  ],
  folate: [
    { name: "Lentils", reason: "pair with something vitamin C-rich to help it land" },
    { name: "Cooked spinach", reason: "an easy everyday add" },
    { name: "Asparagus", reason: "a steady seasonal source" },
    { name: "Avocado", reason: "brings healthy fat along with it" },
    { name: "Black beans", reason: "an easy add to a bowl or salad" },
  ],
  biotin: [
    { name: "Eggs (cooked)", reason: "cooking helps your body actually use it" },
    { name: "Almonds", reason: "a handful between meals" },
    { name: "Sweet potato", reason: "a little goes a long way, roasted or mashed" },
    { name: "Salmon", reason: "worth having in rotation" },
  ],
  pantothenic_acid: [
    { name: "Mushrooms", reason: "an easy swap into almost any sauté" },
    { name: "Avocado", reason: "brings healthy fat along with it" },
    { name: "Sweet potato", reason: "a little goes a long way, roasted or mashed" },
    { name: "Eggs", reason: "an easy everyday source" },
    { name: "Chicken breast", reason: "a reliable everyday source" },
  ],
  phosphorus: [
    { name: "Yogurt", reason: "an easy everyday source" },
    { name: "Salmon", reason: "worth having in rotation" },
    { name: "Lentils", reason: "an easy add to a soup or bowl" },
    { name: "Pumpkin seeds", reason: "an easy everyday snack" },
    { name: "Chicken breast", reason: "a reliable everyday source" },
  ],
  potassium: [
    { name: "Bananas", reason: "an easy grab-and-go" },
    { name: "Sweet potato", reason: "a little goes a long way, roasted or mashed" },
    { name: "White beans", reason: "an easy add to a bowl or salad" },
    { name: "Cooked spinach", reason: "an easy everyday add" },
    { name: "Avocado", reason: "brings healthy fat along with it" },
  ],
  copper: [
    { name: "Cashews", reason: "a handful between meals" },
    { name: "Shiitake mushrooms", reason: "an easy swap into almost any sauté" },
    { name: "Chickpeas", reason: "an easy add to a bowl or salad" },
    { name: "Dark chocolate (70%+)", reason: "a genuinely good source, not just a treat" },
    { name: "Sesame seeds", reason: "an easy sprinkle-on" },
  ],
  manganese: [
    { name: "Pineapple", reason: "an easy, bright everyday add" },
    { name: "Brown rice", reason: "an easy everyday base for a bowl" },
    { name: "Chickpeas", reason: "an easy add to a bowl or salad" },
    { name: "Cooked spinach", reason: "an easy everyday add" },
    { name: "Pecans", reason: "a handful as a snack" },
  ],
  chromium: [
    { name: "Broccoli", reason: "a steady everyday source" },
    { name: "Green beans", reason: "an easy everyday side" },
    { name: "Whole grains", reason: "an easy everyday base for a bowl" },
    { name: "Turkey", reason: "a reliable everyday source" },
  ],
  molybdenum: [
    { name: "Lentils", reason: "an easy add to a soup or bowl" },
    { name: "Black beans", reason: "an easy add to a bowl or salad" },
    { name: "Whole grains", reason: "an easy everyday base for a bowl" },
    { name: "Cooked spinach", reason: "an easy everyday add" },
  ],
};

export function foodsForNutrient(nutrient: TrackedNutrient, limit = 3): NutrientFood[] {
  return NUTRIENT_FOODS[nutrient].slice(0, limit);
}

// Pantry-first tier (post-demo milestone #1, docs/PLAN.md): a gap suggestion
// the patient already has on hand is worth surfacing separately from one
// that means a grocery trip. Loose substring match in both directions is
// enough here — "pumpkin seeds" in the pantry should match the "Pumpkin
// seeds" suggestion without needing exact casing or pluralization.
function namesOverlap(a: string, b: string): boolean {
  const x = a.trim().toLowerCase();
  const y = b.trim().toLowerCase();
  return x.length > 0 && y.length > 0 && (x.includes(y) || y.includes(x));
}

export function splitFoodsForNutrient(
  nutrient: TrackedNutrient,
  pantryItemNames: string[],
  limit = 3,
): { inPantry: NutrientFood[]; tryNew: NutrientFood[] } {
  const foods = NUTRIENT_FOODS[nutrient];
  const inPantry = foods.filter((f) => pantryItemNames.some((p) => namesOverlap(f.name, p)));
  const tryNew = foods.filter((f) => !inPantry.includes(f)).slice(0, limit);
  return { inPantry, tryNew };
}
