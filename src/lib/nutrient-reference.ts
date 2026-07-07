// A small, hand-curated whole-foods reference — NOT a Canadian Nutrient File
// import (see docs/PLAN.md Phase 4b: no live CNF dataset was available to
// import in this environment, and this app never grades meals against a food
// database anyway — see docs/ETHOS.md). Used only to rank "worth adding"
// suggestions for a nutrient that's come up light lately. Foods are ordered
// food-first per Dr. K's positions (docs/PLAN.md Part 1); never surfaced with
// a number, only a name and a short reason.
//
// Cultural relevance (docs/ETHOS.md principle 8): a patient's own food should
// be recognizable here, not translated into a Western analog first. `cuisine`
// is tagged on entries specific to one of the standardized categories in
// src/lib/cuisines.ts, matching what a patient picks in Settings
// (`preferredCuisine`, on their `users/{uid}` doc). That tag is internal only
// — it's never rendered to the patient, only used by `splitFoodsForNutrient`
// to put food close to their own background first. Entries with no `cuisine`
// are broadly familiar staples that don't belong to one place in particular.
// This list is still hand-curated and necessarily incomplete — see
// `src/lib/cultural-food.functions.ts` for the AI-generated fallback when a
// patient names a cuisine or region that isn't represented here at all.
import type { TrackedNutrient } from "@/lib/analysis.schema";

export type NutrientFood = { name: string; reason: string; cuisine?: string };

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
    {
      name: "Masoor dal (red lentil dal)",
      reason: "a weeknight staple — a squeeze of lime while it's still warm helps it land",
      cuisine: "South Asian",
    },
    {
      name: "Black sesame paste",
      reason: "stirred into congee or desserts, a genuinely concentrated iron source",
      cuisine: "East Asian",
    },
    {
      name: "Morning glory (water spinach)",
      reason: "a quick stir-fry green — good with a splash of vinegar or lime",
      cuisine: "Southeast Asian",
    },
    {
      name: "Ful medames (stewed fava beans)",
      reason: "traditionally finished with lemon and parsley — the vitamin C is already built in",
      cuisine: "Middle Eastern",
    },
    {
      name: "Kasha (buckwheat porridge)",
      reason: "higher in iron than most grains, and a genuine comfort-food staple",
      cuisine: "Eastern European",
    },
    {
      name: "Octopus",
      reason: "an underrated iron source, grilled or in a salad",
      cuisine: "Mediterranean",
    },
    {
      name: "Callaloo or amaranth greens",
      reason: "cooked greens, good with a squeeze of lime",
      cuisine: "Caribbean",
    },
    {
      name: "Efo riro (leafy greens stew)",
      reason: "a greens-forward stew that's easy to make a weekly habit",
      cuisine: "West African",
    },
    {
      name: "Teff or injera",
      reason: "the bread itself is the iron source here, not just what's scooped onto it",
      cuisine: "East African",
    },
    {
      name: "Black beans",
      reason: "an easy everyday add — pair with something citrusy to help it land",
      cuisine: "Latin American",
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
      cuisine: "South Asian",
    },
    {
      name: "Clams",
      reason: "one of the most concentrated sources there is, in a soup or stir-fry",
      cuisine: "East Asian",
    },
    {
      name: "Dried shrimp",
      reason: "a small handful stirred into broths or sauces adds real B12",
      cuisine: "Southeast Asian",
    },
    {
      name: "Lamb liver",
      reason: "a small skewer or two carries a genuinely strong dose",
      cuisine: "Middle Eastern",
    },
    {
      name: "Pickled herring",
      reason: "a pantry staple that quietly covers a lot of ground",
      cuisine: "Eastern European",
    },
    {
      name: "Anchovies",
      reason: "a few fillets stirred into a sauce go further than they look",
      cuisine: "Mediterranean",
    },
    {
      name: "Saltfish (bacalao)",
      reason: "drying and salting concentrate it — a classic breakfast staple",
      cuisine: "Caribbean",
    },
    {
      name: "Smoked or dried fish",
      reason: "worked into a stew, a dependable everyday source",
      cuisine: "West African",
    },
    {
      name: "Kitfo (seasoned beef)",
      reason: "any style your family makes it — a strong source either way",
      cuisine: "East African",
    },
    {
      name: "Ceviche",
      reason: "raw fish or shellfish is one of the more concentrated sources around",
      cuisine: "Latin American",
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
      cuisine: "East Asian",
    },
    {
      name: "Rohu or other fatty freshwater fish",
      reason: "a fish curry staple that's a genuine source of D",
      cuisine: "South Asian",
    },
    {
      name: "Grilled mackerel",
      reason: "an oily fish that's a dependable everyday source",
      cuisine: "Southeast Asian",
    },
    { name: "Tuna", reason: "an easy pantry source, fresh or tinned", cuisine: "Middle Eastern" },
    {
      name: "Cod liver oil",
      reason: "a spoonful is a traditional, concentrated way to cover this",
      cuisine: "Eastern European",
    },
    {
      name: "Swordfish",
      reason: "a coastal staple and a strong vitamin D source",
      cuisine: "Mediterranean",
    },
    { name: "Kingfish", reason: "a reliable everyday fish source", cuisine: "Caribbean" },
    { name: "Catfish", reason: "a common, affordable everyday source", cuisine: "West African" },
    {
      name: "Dagaa or omena (dried lake fish)",
      reason: "small dried fish, easy to add to a stew or ugali",
      cuisine: "East African",
    },
    {
      name: "Trout",
      reason: "a highland staple and a genuine source of D",
      cuisine: "Latin American",
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
      cuisine: "South Asian",
    },
    {
      name: "Fortified or calcium-set tofu",
      reason: "check the label — some tofu is set with a calcium coagulant",
      cuisine: "East Asian",
    },
    {
      name: "Whitebait or small fish eaten whole",
      reason: "eating the whole fish, bones included, is where the calcium is",
      cuisine: "Southeast Asian",
    },
    {
      name: "Halva (sesame-based)",
      reason: "made from tahini, so the calcium comes along with it",
      cuisine: "Middle Eastern",
    },
    {
      name: "Poppy seeds",
      reason: "as in a poppy-seed filling or kutia — a surprisingly strong source",
      cuisine: "Eastern European",
    },
    {
      name: "Feta cheese",
      reason: "an easy everyday add to a salad or eggs",
      cuisine: "Mediterranean",
    },
    {
      name: "Sesame seed candy",
      reason: "a treat that's genuinely calcium-rich",
      cuisine: "Caribbean",
    },
    {
      name: "Moringa leaves",
      reason: "dried and stirred into a stew, one of the richest plant sources around",
      cuisine: "West African",
    },
    {
      name: "Dried dagaa or omena",
      reason: "small whole fish, bones and all — a strong calcium source",
      cuisine: "East African",
    },
    {
      name: "Nopales (cactus paddles)",
      reason: "grilled or in a salad, an easy everyday source",
      cuisine: "Latin American",
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
      cuisine: "South Asian",
    },
    {
      name: "Perilla seeds or perilla oil",
      reason: "a traditional source of ALA, drizzled over rice or greens",
      cuisine: "East Asian",
    },
    {
      name: "Grilled mackerel or sardines",
      reason: "an easy, direct way to get the real thing",
      cuisine: "Southeast Asian",
    },
    {
      name: "Muhammara (walnut and red pepper spread)",
      reason: "walnuts are one of the best plant sources of ALA, and it's a genuine crowd-pleaser",
      cuisine: "Middle Eastern",
    },
    {
      name: "Flaxseed oil",
      reason: "a drizzle over a finished dish is a simple, direct source",
      cuisine: "Eastern European",
    },
    {
      name: "Purslane",
      reason: "an easy addition to a salad, and unusually rich in ALA for a leafy green",
      cuisine: "Mediterranean",
    },
    { name: "Flying fish", reason: "a well-loved everyday source", cuisine: "Caribbean" },
    {
      name: "Bonga fish (or other small oily fish)",
      reason: "a dependable everyday source",
      cuisine: "West African",
    },
    {
      name: "Nile perch or tilapia",
      reason: "an easy, familiar everyday source",
      cuisine: "East African",
    },
    {
      name: "Sacha inchi seeds",
      reason: "one of the highest ALA contents around, eaten roasted as a snack",
      cuisine: "Latin American",
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
      cuisine: "South Asian",
    },
    {
      name: "Kombu or wakame in broth",
      reason: "even a small piece simmered into a soup base adds real iodine",
      cuisine: "East Asian",
    },
    {
      name: "Fish sauce",
      reason: "already in the pantry, and a genuine everyday source",
      cuisine: "Southeast Asian",
    },
    {
      name: "Sea bream",
      reason: "a coastal staple worth having in rotation",
      cuisine: "Middle Eastern",
    },
    {
      name: "Pickled herring",
      reason: "a pantry staple that covers iodine along with B12",
      cuisine: "Eastern European",
    },
    { name: "Mussels", reason: "one of the richest sources around", cuisine: "Mediterranean" },
    {
      name: "Bacalao (salted, dried cod)",
      reason: "the drying and salting concentrate the iodine",
      cuisine: "Caribbean",
    },
    {
      name: "Ground dried crayfish",
      reason: "already a common soup base — a genuine everyday iodine source",
      cuisine: "West African",
    },
    {
      name: "Dagaa or omena (dried lake fish)",
      reason: "small dried fish, easy to add to a stew",
      cuisine: "East African",
    },
    {
      name: "Shrimp ceviche",
      reason: "a bright, easy way to get a real dose",
      cuisine: "Latin American",
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
      cuisine: "South Asian",
    },
    { name: "Edamame", reason: "a simple, steady plant-based source", cuisine: "East Asian" },
    {
      name: "Crab",
      reason: "worth having on rotation where it's available",
      cuisine: "Southeast Asian",
    },
    {
      name: "Lamb kofta",
      reason: "a strong zinc source any way it's prepared",
      cuisine: "Middle Eastern",
    },
    {
      name: "Sunflower seeds",
      reason: "an easy everyday snacking habit",
      cuisine: "Eastern European",
    },
    {
      name: "Pine nuts",
      reason: "a small handful stirred into a dish adds real zinc",
      cuisine: "Mediterranean",
    },
    {
      name: "Conch",
      reason: "a local specialty and a genuinely strong source",
      cuisine: "Caribbean",
    },
    {
      name: "Suya spice mix on lamb or goat",
      reason: "the meat itself is a strong zinc source, any way it's prepared",
      cuisine: "West African",
    },
    {
      name: "Groundnuts (peanuts)",
      reason: "an easy stir-in for a stew or sauce",
      cuisine: "East African",
    },
    {
      name: "Pepitas in mole",
      reason: "ground pumpkin seeds are a base of the sauce, not just a garnish",
      cuisine: "Latin American",
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
      cuisine: "South Asian",
    },
    {
      name: "Fish roe",
      reason: "small amounts carry a surprising amount of choline",
      cuisine: "East Asian",
    },
    {
      name: "Salted duck egg",
      reason: "a small addition to a meal with a real choline boost",
      cuisine: "Southeast Asian",
    },
    {
      name: "Chicken liver skewers",
      reason: "a mezze favourite and a strong source",
      cuisine: "Middle Eastern",
    },
    {
      name: "Tvorog (farmer's cheese)",
      reason: "an easy everyday breakfast source",
      cuisine: "Eastern European",
    },
    {
      name: "Calamari",
      reason: "a simple, direct source when it's on the menu",
      cuisine: "Mediterranean",
    },
    {
      name: "Ackee and saltfish",
      reason: "a classic breakfast that carries real choline along with it",
      cuisine: "Caribbean",
    },
    {
      name: "Moin moin (steamed bean pudding)",
      reason: "made with beans and eggs — both choline sources at once",
      cuisine: "West African",
    },
    {
      name: "Doro wat (chicken and egg stew)",
      reason: "traditionally served with hard-boiled eggs, doubling up on choline",
      cuisine: "East African",
    },
    {
      name: "Quinoa",
      reason: "brings choline along with a full amino acid profile",
      cuisine: "Latin American",
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
      cuisine: "South Asian",
    },
    { name: "Millet porridge", reason: "a warm, easy everyday source", cuisine: "East Asian" },
    {
      name: "Jackfruit seeds",
      reason: "roasted or boiled, an easy and unexpected source",
      cuisine: "Southeast Asian",
    },
    {
      name: "Freekeh (roasted green wheat)",
      reason: "a grain that carries real magnesium alongside fiber",
      cuisine: "Middle Eastern",
    },
    {
      name: "Buckwheat (soba or kasha)",
      reason: "a grain that carries meaningfully more magnesium than most",
      cuisine: "Eastern European",
    },
    {
      name: "Artichokes",
      reason: "an easy, flavourful way to add magnesium",
      cuisine: "Mediterranean",
    },
    {
      name: "Okra",
      reason: "stewed or grilled, a good source that's easy to add often",
      cuisine: "Caribbean",
    },
    {
      name: "Black-eyed peas",
      reason: "an easy stew or side that quietly covers a lot of magnesium",
      cuisine: "West African",
    },
    {
      name: "Genfo (teff or barley porridge)",
      reason: "a warming everyday source",
      cuisine: "East African",
    },
    {
      name: "Champurrado or drinking cacao",
      reason: "unsweetened cacao carries real magnesium, not just flavour",
      cuisine: "Latin American",
    },
  ],
};

// Bring the patient's own cuisine to the front without hiding everything
// else — this is priority ordering, not filtering. Foods with no cuisine tag
// (broadly familiar staples) and foods from other cuisines both stay in the
// list, just after the match.
function prioritizeByCuisine(
  foods: NutrientFood[],
  preferredCuisine?: string | null,
): NutrientFood[] {
  if (!preferredCuisine) return foods;
  const matched = foods.filter((f) => f.cuisine === preferredCuisine);
  const rest = foods.filter((f) => f.cuisine !== preferredCuisine);
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
