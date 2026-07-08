// A hand-curated whole-foods reference, grown from Dr. K's own master food
// priority list (docs/PLAN.md Post-demo milestone #3) rather than a live CNF
// import. Used to rank "worth adding" suggestions for a nutrient that's come
// up light lately, and to give a meal reading's `amount` figure something to
// sit next to. Foods are ordered food-first per Dr. K's positions
// (docs/PLAN.md Part 1); the qualitative `reason` is always the headline —
// `amount`/`servingSize` are detail underneath (docs/ETHOS.md principle 2).
//
// Cultural relevance (docs/ETHOS.md principle 8): a patient's own food should
// be recognizable here, not translated into a Western analog first. `cuisines`
// tags entries specific to one or more of the standardized categories in
// src/lib/cuisines.ts, matching what a patient picks in Settings
// (`preferredCuisine`, on their `users/{uid}` doc). That tag is internal only
// — it's never rendered to the patient, only used by `splitFoodsForNutrient`
// to put food close to their own background first. Entries with no `cuisines`
// are broadly familiar staples that don't belong to one place in particular.
// This list is still hand-curated and necessarily incomplete — see
// `src/lib/cultural-food.functions.ts` for the AI-generated fallback when a
// patient names a cuisine or region that isn't represented here at all.
//
// This file holds the hand-authored core; src/lib/nutrient-reference.data.ts
// holds the bulk import from the master list (generated — see that file's
// header for how to regenerate it) and is merged in below.
import { TRACKED_NUTRIENTS, type TrackedNutrient } from "@/lib/analysis.schema";
import { IMPORTED_FOODS } from "@/lib/nutrient-reference.data";

export type NutrientFood = {
  name: string;
  reason: string;
  cuisines?: string[];
  // Y/N in the source list — vegan status of this specific food/prep, stored
  // for a possible future filter; not surfaced anywhere today.
  vegan?: boolean;
  // Best-effort amount in the nutrient's canonical unit (rdi-reference.ts),
  // for one servingSize — same "real number as detail, not verdict" rule as
  // a meal reading's micronutrient.amount.
  amount?: number;
  servingSize?: string;
};

// Only the original 9 nutrients have hand-authored entries — the 5 added in
// Post-demo milestone #3 (folate, B6, potassium, C, A) come entirely from the
// imported master list below, until/unless they're worth hand-curating too.
const HAND_CURATED_FOODS: Partial<Record<TrackedNutrient, NutrientFood[]>> = {
  iron: [
    {
      name: "Pumpkin seeds",
      reason: "a handful goes a long way, especially with a squeeze of citrus",
    },
    { name: "Blackstrap molasses", reason: "a spoonful stirred into oatmeal or tea" },
    { name: "Lentils", reason: "pair with something vitamin C-rich to help it land" },
    { name: "Cooked spinach", reason: "cooking helps release the iron; add lemon for absorption" },
    { name: "Tofu", reason: "a steady plant-based source" },
    {
      name: "Masoor dal (red lentil dal)",
      reason: "a weeknight staple — a squeeze of lime while it's still warm helps it land",
      cuisines: ["South Asian (Indian)"],
    },
    {
      name: "Black sesame paste",
      reason: "stirred into congee or desserts, a genuinely concentrated iron source",
      cuisines: ["East Asian"],
    },
    {
      name: "Morning glory (water spinach)",
      reason: "a quick stir-fry green — good with a splash of vinegar or lime",
      cuisines: ["Southeast Asian"],
    },
    {
      name: "Ful medames (stewed fava beans)",
      reason: "traditionally finished with lemon and parsley — the vitamin C is already built in",
      cuisines: ["Middle Eastern"],
    },
    {
      name: "Kasha (buckwheat porridge)",
      reason: "higher in iron than most grains, and a genuine comfort-food staple",
      cuisines: ["Ukrainian / Eastern European"],
    },
    {
      name: "Octopus",
      reason: "an underrated iron source, grilled or in a salad",
      cuisines: ["Spanish / Mediterranean"],
    },
    {
      name: "Callaloo or amaranth greens",
      reason: "cooked greens, good with a squeeze of lime",
      cuisines: ["Cuban / Caribbean"],
    },
    {
      name: "Efo riro (leafy greens stew)",
      reason: "a greens-forward stew that's easy to make a weekly habit",
      cuisines: ["West African"],
    },
    {
      name: "Teff or injera",
      reason: "the bread itself is the iron source here, not just what's scooped onto it",
      cuisines: ["East African"],
    },
    {
      name: "Black beans",
      reason: "an easy everyday add — pair with something citrusy to help it land",
      cuisines: ["Mexican"],
    },
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
    {
      name: "Liver (any style your family makes it)",
      reason: "a small amount goes a very long way for B12",
    },
    {
      name: "Lassi or paneer",
      reason: "an easy everyday dairy habit if that fits your kitchen",
      cuisines: ["South Asian (Indian)"],
    },
    {
      name: "Clams",
      reason: "one of the most concentrated sources there is, in a soup or stir-fry",
      cuisines: ["East Asian"],
    },
    {
      name: "Dried shrimp",
      reason: "a small handful stirred into broths or sauces adds real B12",
      cuisines: ["Southeast Asian"],
    },
    {
      name: "Lamb liver",
      reason: "a small skewer or two carries a genuinely strong dose",
      cuisines: ["Middle Eastern"],
    },
    {
      name: "Pickled herring",
      reason: "a pantry staple that quietly covers a lot of ground",
      cuisines: ["Ukrainian / Eastern European"],
    },
    {
      name: "Anchovies",
      reason: "a few fillets stirred into a sauce go further than they look",
      cuisines: ["Spanish / Mediterranean"],
    },
    {
      name: "Saltfish (bacalao)",
      reason: "drying and salting concentrate it — a classic breakfast staple",
      cuisines: ["Cuban / Caribbean"],
    },
    {
      name: "Smoked or dried fish",
      reason: "worked into a stew, a dependable everyday source",
      cuisines: ["West African"],
    },
    {
      name: "Kitfo (seasoned beef)",
      reason: "any style your family makes it — a strong source either way",
      cuisines: ["East African"],
    },
    {
      name: "Ceviche",
      reason: "raw fish or shellfish is one of the more concentrated sources around",
      cuisines: ["Andean / South American"],
    },
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
    {
      name: "Shiitake mushrooms (sun-dried)",
      reason: "sun-drying meaningfully boosts the vitamin D here",
      cuisines: ["East Asian"],
    },
    {
      name: "Rohu or other fatty freshwater fish",
      reason: "a fish curry staple that's a genuine source of D",
      cuisines: ["South Asian (Indian)"],
    },
    {
      name: "Grilled mackerel",
      reason: "an oily fish that's a dependable everyday source",
      cuisines: ["Southeast Asian"],
    },
    {
      name: "Tuna",
      reason: "an easy pantry source, fresh or tinned",
      cuisines: ["Middle Eastern"],
    },
    {
      name: "Cod liver oil",
      reason: "a spoonful is a traditional, concentrated way to cover this",
      cuisines: ["Ukrainian / Eastern European"],
    },
    {
      name: "Swordfish",
      reason: "a coastal staple and a strong vitamin D source",
      cuisines: ["Spanish / Mediterranean"],
    },
    {
      name: "Kingfish",
      reason: "a reliable everyday fish source",
      cuisines: ["Cuban / Caribbean"],
    },
    { name: "Catfish", reason: "a common, affordable everyday source", cuisines: ["West African"] },
    {
      name: "Dagaa or omena (dried lake fish)",
      reason: "small dried fish, easy to add to a stew or ugali",
      cuisines: ["East African"],
    },
    {
      name: "Trout",
      reason: "a highland staple and a genuine source of D",
      cuisines: ["Andean / South American"],
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
    {
      name: "Paneer",
      reason: "a fresh cheese that holds up well in a curry — a solid everyday calcium source",
      cuisines: ["South Asian (Indian)"],
    },
    {
      name: "Fortified or calcium-set tofu",
      reason: "check the label — some tofu is set with a calcium coagulant",
      cuisines: ["East Asian"],
    },
    {
      name: "Whitebait or small fish eaten whole",
      reason: "eating the whole fish, bones included, is where the calcium is",
      cuisines: ["Southeast Asian"],
    },
    {
      name: "Halva (sesame-based)",
      reason: "made from tahini, so the calcium comes along with it",
      cuisines: ["Middle Eastern"],
    },
    {
      name: "Poppy seeds",
      reason: "as in a poppy-seed filling or kutia — a surprisingly strong source",
      cuisines: ["Ukrainian / Eastern European"],
    },
    {
      name: "Feta cheese",
      reason: "an easy everyday add to a salad or eggs",
      cuisines: ["Spanish / Mediterranean"],
    },
    {
      name: "Sesame seed candy",
      reason: "a treat that's genuinely calcium-rich",
      cuisines: ["Cuban / Caribbean"],
    },
    {
      name: "Moringa leaves",
      reason: "dried and stirred into a stew, one of the richest plant sources around",
      cuisines: ["West African"],
    },
    {
      name: "Dried dagaa or omena",
      reason: "small whole fish, bones and all — a strong calcium source",
      cuisines: ["East African"],
    },
    {
      name: "Nopales (cactus paddles)",
      reason: "grilled or in a salad, an easy everyday source",
      cuisines: ["Mexican"],
    },
  ],
  omega_3: [
    { name: "Ground flaxseed", reason: "grinding it helps your body actually use it" },
    { name: "Chia seeds", reason: "easy to add to oatmeal or a smoothie" },
    { name: "Walnuts", reason: "a handful as a snack or salad topper" },
    { name: "Salmon or sardines", reason: "the most direct source" },
    { name: "Hemp seeds", reason: "a mild, easy sprinkle-on option" },
    {
      name: "Flaxseed chutney (alsi)",
      reason: "a spoonful alongside a meal is a traditional, easy way to get ALA",
      cuisines: ["South Asian (Indian)"],
    },
    {
      name: "Perilla seeds or perilla oil",
      reason: "a traditional source of ALA, drizzled over rice or greens",
      cuisines: ["East Asian"],
    },
    {
      name: "Grilled mackerel or sardines",
      reason: "an easy, direct way to get the real thing",
      cuisines: ["Southeast Asian"],
    },
    {
      name: "Muhammara (walnut and red pepper spread)",
      reason: "walnuts are one of the best plant sources of ALA, and it's a genuine crowd-pleaser",
      cuisines: ["Middle Eastern"],
    },
    {
      name: "Flaxseed oil",
      reason: "a drizzle over a finished dish is a simple, direct source",
      cuisines: ["Ukrainian / Eastern European"],
    },
    {
      name: "Purslane",
      reason: "an easy addition to a salad, and unusually rich in ALA for a leafy green",
      cuisines: ["Spanish / Mediterranean"],
    },
    {
      name: "Flying fish",
      reason: "a well-loved everyday source",
      cuisines: ["Cuban / Caribbean"],
    },
    {
      name: "Bonga fish (or other small oily fish)",
      reason: "a dependable everyday source",
      cuisines: ["West African"],
    },
    {
      name: "Nile perch or tilapia",
      reason: "an easy, familiar everyday source",
      cuisines: ["East African"],
    },
    {
      name: "Sacha inchi seeds",
      reason: "one of the highest ALA contents around, eaten roasted as a snack",
      cuisines: ["Andean / South American"],
    },
  ],
  iodine: [
    { name: "Seaweed (nori, kelp)", reason: "even a little goes a long way — easy on sushi night" },
    { name: "Cod or shrimp", reason: "a reliable seafood source" },
    { name: "Iodized salt", reason: "worth checking whether the salt at home is iodized" },
    { name: "Dairy", reason: "a steady everyday source for most people" },
    {
      name: "Pomfret or other sea fish",
      reason: "a coastal staple and a real iodine source",
      cuisines: ["South Asian (Indian)"],
    },
    {
      name: "Kombu or wakame in broth",
      reason: "even a small piece simmered into a soup base adds real iodine",
      cuisines: ["East Asian"],
    },
    {
      name: "Fish sauce",
      reason: "already in the pantry, and a genuine everyday source",
      cuisines: ["Southeast Asian"],
    },
    {
      name: "Sea bream",
      reason: "a coastal staple worth having in rotation",
      cuisines: ["Middle Eastern"],
    },
    {
      name: "Pickled herring",
      reason: "a pantry staple that covers iodine along with B12",
      cuisines: ["Ukrainian / Eastern European"],
    },
    {
      name: "Mussels",
      reason: "one of the richest sources around",
      cuisines: ["Spanish / Mediterranean"],
    },
    {
      name: "Bacalao (salted, dried cod)",
      reason: "the drying and salting concentrate the iodine",
      cuisines: ["Cuban / Caribbean"],
    },
    {
      name: "Ground dried crayfish",
      reason: "already a common soup base — a genuine everyday iodine source",
      cuisines: ["West African"],
    },
    {
      name: "Dagaa or omena (dried lake fish)",
      reason: "small dried fish, easy to add to a stew",
      cuisines: ["East African"],
    },
    {
      name: "Shrimp ceviche",
      reason: "a bright, easy way to get a real dose",
      cuisines: ["Andean / South American"],
    },
  ],
  zinc: [
    { name: "Pumpkin seeds", reason: "soaking or sprouting helps your body absorb more" },
    { name: "Chickpeas", reason: "pair well with a squeeze of lemon" },
    { name: "Cashews", reason: "an easy snack-time add" },
    { name: "Oysters", reason: "one of the richest sources, if that's an option" },
    { name: "Hemp seeds", reason: "a mild, versatile sprinkle-on" },
    {
      name: "Roasted chana",
      reason: "an easy snack that's also a real zinc source",
      cuisines: ["South Asian (Indian)"],
    },
    { name: "Edamame", reason: "a simple, steady plant-based source", cuisines: ["East Asian"] },
    {
      name: "Crab",
      reason: "worth having on rotation where it's available",
      cuisines: ["Southeast Asian"],
    },
    {
      name: "Lamb kofta",
      reason: "a strong zinc source any way it's prepared",
      cuisines: ["Middle Eastern"],
    },
    {
      name: "Sunflower seeds",
      reason: "an easy everyday snacking habit",
      cuisines: ["Ukrainian / Eastern European"],
    },
    {
      name: "Pine nuts",
      reason: "a small handful stirred into a dish adds real zinc",
      cuisines: ["Spanish / Mediterranean"],
    },
    {
      name: "Conch",
      reason: "a local specialty and a genuinely strong source",
      cuisines: ["Cuban / Caribbean"],
    },
    {
      name: "Suya spice mix on lamb or goat",
      reason: "the meat itself is a strong zinc source, any way it's prepared",
      cuisines: ["West African"],
    },
    {
      name: "Groundnuts (peanuts)",
      reason: "an easy stir-in for a stew or sauce",
      cuisines: ["East African"],
    },
    {
      name: "Pepitas in mole",
      reason: "ground pumpkin seeds are a base of the sauce, not just a garnish",
      cuisines: ["Mexican"],
    },
  ],
  choline: [
    { name: "Eggs", reason: "one of the most concentrated everyday sources" },
    { name: "Salmon", reason: "worth having in rotation" },
    { name: "Soybeans or edamame", reason: "a solid plant-based option" },
    { name: "Chicken breast", reason: "a reliable everyday source" },
    {
      name: "Rajma (kidney beans)",
      reason: "a weeknight staple that quietly covers some choline",
      cuisines: ["South Asian (Indian)"],
    },
    {
      name: "Fish roe",
      reason: "small amounts carry a surprising amount of choline",
      cuisines: ["East Asian"],
    },
    {
      name: "Salted duck egg",
      reason: "a small addition to a meal with a real choline boost",
      cuisines: ["Southeast Asian"],
    },
    {
      name: "Chicken liver skewers",
      reason: "a mezze favourite and a strong source",
      cuisines: ["Middle Eastern"],
    },
    {
      name: "Tvorog (farmer's cheese)",
      reason: "an easy everyday breakfast source",
      cuisines: ["Ukrainian / Eastern European"],
    },
    {
      name: "Calamari",
      reason: "a simple, direct source when it's on the menu",
      cuisines: ["Spanish / Mediterranean"],
    },
    {
      name: "Ackee and saltfish",
      reason: "a classic breakfast that carries real choline along with it",
      cuisines: ["Cuban / Caribbean"],
    },
    {
      name: "Moin moin (steamed bean pudding)",
      reason: "made with beans and eggs — both choline sources at once",
      cuisines: ["West African"],
    },
    {
      name: "Doro wat (chicken and egg stew)",
      reason: "traditionally served with hard-boiled eggs, doubling up on choline",
      cuisines: ["East African"],
    },
    {
      name: "Quinoa",
      reason: "brings choline along with a full amino acid profile",
      cuisines: ["Andean / South American"],
    },
  ],
  magnesium: [
    { name: "Pumpkin seeds", reason: "an easy everyday snack" },
    { name: "Almonds", reason: "a handful between meals" },
    { name: "Cooked spinach", reason: "also brings iron along with it" },
    { name: "Black beans", reason: "an easy add to a bowl or salad" },
    { name: "Dark chocolate (70%+)", reason: "a genuinely good source, not just a treat" },
    {
      name: "Bajra (pearl millet) roti",
      reason: "a grain that carries meaningfully more magnesium than most",
      cuisines: ["South Asian (Indian)"],
    },
    { name: "Millet porridge", reason: "a warm, easy everyday source", cuisines: ["East Asian"] },
    {
      name: "Jackfruit seeds",
      reason: "roasted or boiled, an easy and unexpected source",
      cuisines: ["Southeast Asian"],
    },
    {
      name: "Freekeh (roasted green wheat)",
      reason: "a grain that carries real magnesium alongside fiber",
      cuisines: ["Middle Eastern"],
    },
    {
      name: "Buckwheat (soba or kasha)",
      reason: "a grain that carries meaningfully more magnesium than most",
      cuisines: ["Ukrainian / Eastern European"],
    },
    {
      name: "Artichokes",
      reason: "an easy, flavourful way to add magnesium",
      cuisines: ["Spanish / Mediterranean"],
    },
    {
      name: "Okra",
      reason: "stewed or grilled, a good source that's easy to add often",
      cuisines: ["Cuban / Caribbean"],
    },
    {
      name: "Black-eyed peas",
      reason: "an easy stew or side that quietly covers a lot of magnesium",
      cuisines: ["West African"],
    },
    {
      name: "Genfo (teff or barley porridge)",
      reason: "a warming everyday source",
      cuisines: ["East African"],
    },
    {
      name: "Champurrado or drinking cacao",
      reason: "unsweetened cacao carries real magnesium, not just flavour",
      cuisines: ["Mexican"],
    },
  ],
};

// Exact-name match only (case/whitespace-insensitive) — deliberately not
// fuzzy. A parenthetical dish name like "Lentils (misir wot)" is a
// culturally distinct entry from plain "Lentils," not a duplicate of it, and
// both need to survive the merge; only a true same-name collision (e.g. both
// files having "Pumpkin seeds") should be deduped.
function normalizeFoodName(name: string): string {
  return name.trim().toLowerCase();
}

// Keep every hand-curated entry; append only the imported entries that don't
// already name the same food for this nutrient — "merge: keep existing
// entries, add the master list's new coverage" (docs/PLAN.md Post-demo
// milestone #3), not a wholesale replacement of last session's voice-checked
// copy.
function mergeFoodLists(curated: NutrientFood[], imported: NutrientFood[]): NutrientFood[] {
  const existingNames = new Set(curated.map((f) => normalizeFoodName(f.name)));
  const additions = imported.filter((f) => !existingNames.has(normalizeFoodName(f.name)));
  return [...curated, ...additions];
}

export const NUTRIENT_FOODS: Record<TrackedNutrient, NutrientFood[]> = Object.fromEntries(
  TRACKED_NUTRIENTS.map((nutrient) => [
    nutrient,
    mergeFoodLists(HAND_CURATED_FOODS[nutrient] ?? [], IMPORTED_FOODS[nutrient] ?? []),
  ]),
) as Record<TrackedNutrient, NutrientFood[]>;

// Bring the patient's own cuisine to the front without hiding everything
// else — this is priority ordering, not filtering. Foods with no cuisines tag
// (broadly familiar staples) and foods from other cuisines both stay in the
// list, just after the match.
function prioritizeByCuisine(
  foods: NutrientFood[],
  preferredCuisine?: string | null,
): NutrientFood[] {
  if (!preferredCuisine) return foods;
  const matched = foods.filter((f) => f.cuisines?.includes(preferredCuisine));
  const rest = foods.filter((f) => !f.cuisines?.includes(preferredCuisine));
  return [...matched, ...rest];
}

export function foodsForNutrient(
  nutrient: TrackedNutrient,
  limit = 3,
  preferredCuisine?: string | null,
): NutrientFood[] {
  return prioritizeByCuisine(NUTRIENT_FOODS[nutrient], preferredCuisine).slice(0, limit);
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
  preferredCuisine?: string | null,
): { inPantry: NutrientFood[]; tryNew: NutrientFood[] } {
  const foods = prioritizeByCuisine(NUTRIENT_FOODS[nutrient], preferredCuisine);
  const inPantry = foods.filter((f) => pantryItemNames.some((p) => namesOverlap(f.name, p)));
  const tryNew = foods.filter((f) => !inPantry.includes(f)).slice(0, limit);
  return { inPantry, tryNew };
}
