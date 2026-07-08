// Demo seed content (docs/PLAN.md Phase 4d / docs/DEMO.md). Hand-written, not
// AI-generated — costs nothing to seed and lets every reading's arc be
// authored on purpose. Each patient tells one story over three weeks; see
// docs/DEMO.md for the walkthrough. Seeded via demo.functions.ts, tagged
// `demo: true` everywhere so it can be removed with one click.
import type { MealAnalysis } from "@/lib/analysis.schema";

export type DemoMealSeed = {
  daysAgo: number;
  hour: number;
  label: string;
  description: string;
  analysis: MealAnalysis;
};

export type DemoPatientSeed = {
  id: string;
  fullName: string;
  email: string;
  meals: DemoMealSeed[];
};

function m(
  daysAgo: number,
  hour: number,
  label: string,
  description: string,
  analysis: MealAnalysis,
): DemoMealSeed {
  return { daysAgo, hour, label, description, analysis };
}

// --- Patient 1: Jordan — the iron arc. Light iron for the first week and a
// half, the lemon/vitamin-C pairing tip lands, and the last week's readings
// show it closing. -----------------------------------------------------------
const JORDAN: DemoMealSeed[] = [
  m(20, 8, "Breakfast", "Oatmeal with a banana and a splash of milk.", {
    meal_name: "Oatmeal with banana",
    identified_items: ["Oats", "Banana", "Milk"],
    estimated_portion: "~300g",
    opening_note: "A steady, easy start to the day.",
    building_blocks: {
      protein_g: 9,
      fiber_g: 5,
      healthy_fat_sources: [],
      carb_quality: "mostly_complex",
    },
    micronutrients: [
      { nutrient: "calcium", level: "present", from: "Milk", amount_estimate: null },
    ],
    offered: ["Good complex carbs to start the day"],
    worth_trying: ["A spoonful of nut butter would add some staying power."],
    absorption_notes: [],
    protocol_fit: {
      tier: "getting_there",
      note: "Solid start — a bit more protein would round it out.",
    },
    uncertainty: null,
    estimation_basis: null,
  }),
  m(19, 13, "Lunch", "Spinach salad with chickpeas and a light dressing, coffee after.", {
    meal_name: "Spinach and chickpea salad",
    identified_items: ["Spinach", "Chickpeas", "Olive oil dressing"],
    estimated_portion: "~350g",
    opening_note: "Lots of good plant material on this plate.",
    building_blocks: {
      protein_g: 12,
      fiber_g: 9,
      healthy_fat_sources: ["Olive oil"],
      carb_quality: "mostly_complex",
    },
    micronutrients: [
      { nutrient: "iron", level: "light", from: "Spinach", amount_estimate: null },
      { nutrient: "magnesium", level: "present", from: "Spinach", amount_estimate: null },
    ],
    offered: ["Great fiber", "A nice dose of leafy greens"],
    worth_trying: [
      "Iron's a little light here — a squeeze of lemon on the spinach would help it land.",
    ],
    absorption_notes: [
      "The coffee right after this meal will blunt the iron from the spinach — worth spacing it out by an hour if you can.",
    ],
    protocol_fit: { tier: "getting_there", note: "Great plant variety — iron could use a boost." },
    uncertainty: null,
    estimation_basis: null,
  }),
  m(18, 19, "Dinner", "Grilled chicken with rice and steamed broccoli.", {
    meal_name: "Grilled chicken with rice and broccoli",
    identified_items: ["Chicken breast", "Rice", "Broccoli"],
    estimated_portion: "~450g",
    opening_note: "A well-balanced, easy dinner.",
    building_blocks: {
      protein_g: 34,
      fiber_g: 4,
      healthy_fat_sources: [],
      carb_quality: "mostly_complex",
    },
    micronutrients: [
      { nutrient: "choline", level: "present", from: "Chicken breast", amount_estimate: null },
    ],
    offered: ["Strong protein source"],
    worth_trying: ["A colourful vegetable or two alongside the broccoli would round this out."],
    absorption_notes: [],
    protocol_fit: { tier: "aligned", note: "Reliable protein-forward dinner." },
    uncertainty: null,
    estimation_basis: null,
  }),
  m(17, 8, "Breakfast", "Two eggs and toast.", {
    meal_name: "Eggs and toast",
    identified_items: ["Eggs", "Whole wheat toast"],
    estimated_portion: "~250g",
    opening_note: "A dependable, protein-forward breakfast.",
    building_blocks: {
      protein_g: 16,
      fiber_g: 3,
      healthy_fat_sources: ["Eggs"],
      carb_quality: "mixed",
    },
    micronutrients: [
      { nutrient: "b12", level: "present", from: "Eggs", amount_estimate: null },
      { nutrient: "choline", level: "strong", from: "Eggs", amount_estimate: null },
    ],
    offered: ["Great choline source"],
    worth_trying: [],
    absorption_notes: [],
    protocol_fit: { tier: "aligned", note: "Good everyday breakfast." },
    uncertainty: null,
    estimation_basis: null,
  }),
  m(15, 13, "Lunch", "Lentil soup with a slice of bread, tea on the side.", {
    meal_name: "Lentil soup",
    identified_items: ["Lentils", "Carrot", "Celery", "Bread"],
    estimated_portion: "~400g",
    opening_note: "A cozy, fiber-rich bowl.",
    building_blocks: {
      protein_g: 15,
      fiber_g: 10,
      healthy_fat_sources: [],
      carb_quality: "mostly_complex",
    },
    micronutrients: [{ nutrient: "iron", level: "light", from: "Lentils", amount_estimate: null }],
    offered: ["Excellent fiber"],
    worth_trying: [
      "Iron's still a little light this week — pumpkin seeds or a squeeze of citrus over the lentils would help.",
    ],
    absorption_notes: [
      "The tea alongside this meal will reduce how much of the lentils' iron you absorb — having it an hour before or after would help.",
    ],
    protocol_fit: {
      tier: "getting_there",
      note: "Good fiber — iron pairing would help this land further.",
    },
    uncertainty: null,
    estimation_basis: null,
  }),
  m(14, 19, "Dinner", "Beef stir fry with peppers and rice.", {
    meal_name: "Beef and pepper stir fry",
    identified_items: ["Beef", "Bell peppers", "Rice"],
    estimated_portion: "~400g",
    opening_note: "This one's doing real work for your iron today.",
    building_blocks: { protein_g: 30, fiber_g: 4, healthy_fat_sources: [], carb_quality: "mixed" },
    micronutrients: [{ nutrient: "iron", level: "strong", from: "Beef", amount_estimate: null }],
    offered: ["Strong iron source", "The peppers' vitamin C alongside it is a great pairing"],
    worth_trying: [],
    absorption_notes: [
      "The bell peppers' vitamin C right alongside the beef is exactly the pairing that helps iron absorb best — nice instinct.",
    ],
    protocol_fit: { tier: "aligned", note: "Iron and vitamin C together — well paired." },
    uncertainty: null,
    estimation_basis: null,
  }),
  m(11, 8, "Breakfast", "Yogurt with berries and a few pumpkin seeds.", {
    meal_name: "Yogurt with berries and pumpkin seeds",
    identified_items: ["Yogurt", "Mixed berries", "Pumpkin seeds"],
    estimated_portion: "~300g",
    opening_note: "A bright, easy morning bowl.",
    building_blocks: {
      protein_g: 14,
      fiber_g: 5,
      healthy_fat_sources: ["Pumpkin seeds"],
      carb_quality: "mostly_complex",
    },
    micronutrients: [
      { nutrient: "calcium", level: "present", from: "Yogurt", amount_estimate: null },
      { nutrient: "iron", level: "present", from: "Pumpkin seeds", amount_estimate: null },
      { nutrient: "magnesium", level: "present", from: "Pumpkin seeds", amount_estimate: null },
    ],
    offered: ["Good iron and magnesium from those pumpkin seeds — nice add"],
    worth_trying: [],
    absorption_notes: [
      "Berries bring some vitamin C along with them, which helps the pumpkin seeds' iron land a little better too.",
    ],
    protocol_fit: { tier: "aligned", note: "The pumpkin seed habit is paying off." },
    uncertainty: null,
    estimation_basis: null,
  }),
  m(9, 13, "Lunch", "Spinach salad with chickpeas, lemon dressing this time.", {
    meal_name: "Spinach and chickpea salad with lemon",
    identified_items: ["Spinach", "Chickpeas", "Lemon dressing"],
    estimated_portion: "~350g",
    opening_note: "Same great bowl — with the pairing that makes it sing.",
    building_blocks: {
      protein_g: 12,
      fiber_g: 9,
      healthy_fat_sources: ["Olive oil"],
      carb_quality: "mostly_complex",
    },
    micronutrients: [
      { nutrient: "iron", level: "present", from: "Spinach", amount_estimate: null },
    ],
    offered: ["That lemon dressing is doing real work for the spinach's iron"],
    worth_trying: [],
    absorption_notes: [
      "The lemon juice's vitamin C is helping the spinach's iron absorb noticeably better than plain oil would.",
    ],
    protocol_fit: { tier: "aligned", note: "The lemon habit is a great addition." },
    uncertainty: null,
    estimation_basis: null,
  }),
  m(6, 19, "Dinner", "Tofu and broccoli stir fry with a squeeze of lime.", {
    meal_name: "Tofu and broccoli stir fry",
    identified_items: ["Tofu", "Broccoli", "Lime"],
    estimated_portion: "~400g",
    opening_note: "A plant-based dinner that's really come together.",
    building_blocks: {
      protein_g: 20,
      fiber_g: 6,
      healthy_fat_sources: [],
      carb_quality: "mostly_complex",
    },
    micronutrients: [{ nutrient: "iron", level: "present", from: "Tofu", amount_estimate: null }],
    offered: ["Iron and vitamin C paired again — that habit is sticking"],
    worth_trying: [],
    absorption_notes: [],
    protocol_fit: { tier: "aligned", note: "Consistent, well-paired plant protein." },
    uncertainty: null,
    estimation_basis: null,
  }),
  m(3, 8, "Breakfast", "Oatmeal with pumpkin seeds and orange slices.", {
    meal_name: "Oatmeal with pumpkin seeds and orange",
    identified_items: ["Oats", "Pumpkin seeds", "Orange"],
    estimated_portion: "~300g",
    opening_note: "This bowl is doing exactly what we hoped for your iron this week — nice work.",
    building_blocks: {
      protein_g: 11,
      fiber_g: 7,
      healthy_fat_sources: ["Pumpkin seeds"],
      carb_quality: "mostly_complex",
    },
    micronutrients: [
      { nutrient: "iron", level: "strong", from: "Pumpkin seeds", amount_estimate: null },
      { nutrient: "magnesium", level: "present", from: "Pumpkin seeds", amount_estimate: null },
    ],
    offered: ["Iron paired with the orange's vitamin C — textbook"],
    worth_trying: [],
    absorption_notes: [],
    protocol_fit: { tier: "aligned", note: "Iron's been consistently strong this week." },
    uncertainty: null,
    estimation_basis: null,
  }),
  m(1, 13, "Lunch", "Lentil and beet salad with orange segments.", {
    meal_name: "Lentil and beet salad",
    identified_items: ["Lentils", "Beets", "Orange segments"],
    estimated_portion: "~380g",
    opening_note: "A colourful, iron-forward bowl — the pattern's really holding.",
    building_blocks: {
      protein_g: 16,
      fiber_g: 11,
      healthy_fat_sources: [],
      carb_quality: "mostly_complex",
    },
    micronutrients: [{ nutrient: "iron", level: "strong", from: "Lentils", amount_estimate: null }],
    offered: ["Strong iron, well paired with citrus", "Beautiful colour on this plate"],
    worth_trying: [],
    absorption_notes: [],
    protocol_fit: {
      tier: "aligned",
      note: "Iron's landed consistently strong for over a week now.",
    },
    uncertainty: null,
    estimation_basis: null,
  }),
  m(0, 8, "Breakfast", "Yogurt with pumpkin seeds and orange slices.", {
    meal_name: "Yogurt with pumpkin seeds and orange",
    identified_items: ["Yogurt", "Pumpkin seeds", "Orange"],
    estimated_portion: "~280g",
    opening_note: "Same great habit this morning — the iron pairing's second nature now.",
    building_blocks: {
      protein_g: 13,
      fiber_g: 4,
      healthy_fat_sources: ["Pumpkin seeds"],
      carb_quality: "mostly_complex",
    },
    micronutrients: [
      { nutrient: "iron", level: "strong", from: "Pumpkin seeds", amount_estimate: null },
    ],
    offered: ["Iron and vitamin C together, first thing in the morning"],
    worth_trying: [],
    absorption_notes: [],
    protocol_fit: { tier: "aligned", note: "A great way to keep the streak going." },
    uncertainty: null,
    estimation_basis: null,
  }),
];

// --- Patient 2: Morgan — the plant-variety arc. Same handful of staples at
// first, then colour and variety climb week over week. -----------------------
const MORGAN: DemoMealSeed[] = [
  m(19, 8, "Breakfast", "Toast with butter.", {
    meal_name: "Toast with butter",
    identified_items: ["Toast", "Butter"],
    estimated_portion: "~120g",
    opening_note: "A quick, simple start today.",
    building_blocks: {
      protein_g: 4,
      fiber_g: 2,
      healthy_fat_sources: ["Butter"],
      carb_quality: "mostly_refined",
    },
    micronutrients: [],
    offered: [],
    worth_trying: [
      "A piece of fruit alongside this would bring some colour and fiber to the morning.",
    ],
    absorption_notes: [],
    protocol_fit: { tier: "worth_a_look", note: "A light start — there's room to build this out." },
    uncertainty: null,
    estimation_basis: null,
  }),
  m(18, 13, "Lunch", "Chicken sandwich with lettuce.", {
    meal_name: "Chicken sandwich",
    identified_items: ["Chicken", "Bread", "Lettuce"],
    estimated_portion: "~300g",
    opening_note: "A reliable, easy lunch.",
    building_blocks: { protein_g: 22, fiber_g: 2, healthy_fat_sources: [], carb_quality: "mixed" },
    micronutrients: [
      { nutrient: "choline", level: "present", from: "Chicken", amount_estimate: null },
    ],
    offered: ["Solid protein"],
    worth_trying: ["Adding tomato or another vegetable would bring some colour and variety in."],
    absorption_notes: [],
    protocol_fit: {
      tier: "getting_there",
      note: "Good protein — could use more plants alongside it.",
    },
    uncertainty: null,
    estimation_basis: null,
  }),
  m(16, 19, "Dinner", "Pasta with tomato sauce.", {
    meal_name: "Pasta with tomato sauce",
    identified_items: ["Pasta", "Tomato sauce"],
    estimated_portion: "~350g",
    opening_note: "A comforting, familiar dinner.",
    building_blocks: {
      protein_g: 9,
      fiber_g: 4,
      healthy_fat_sources: [],
      carb_quality: "mostly_refined",
    },
    micronutrients: [],
    offered: ["The tomato sauce brings some colour"],
    worth_trying: ["A handful of spinach stirred in would bring a whole new colour to the plate."],
    absorption_notes: [],
    protocol_fit: { tier: "worth_a_look", note: "Worth building in a plant or two here." },
    uncertainty: null,
    estimation_basis: null,
  }),
  m(14, 8, "Breakfast", "Toast with peanut butter and banana.", {
    meal_name: "Toast with peanut butter and banana",
    identified_items: ["Toast", "Peanut butter", "Banana"],
    estimated_portion: "~200g",
    opening_note: "A nice little upgrade on the usual toast.",
    building_blocks: {
      protein_g: 9,
      fiber_g: 4,
      healthy_fat_sources: ["Peanut butter"],
      carb_quality: "mixed",
    },
    micronutrients: [
      { nutrient: "magnesium", level: "present", from: "Peanut butter", amount_estimate: null },
    ],
    offered: ["The banana adds a new colour to the week"],
    worth_trying: [],
    absorption_notes: [],
    protocol_fit: { tier: "getting_there", note: "A good small step — more fruit is showing up." },
    uncertainty: null,
    estimation_basis: null,
  }),
  m(12, 13, "Lunch", "Chicken sandwich with lettuce, tomato, and avocado.", {
    meal_name: "Chicken, avocado, and tomato sandwich",
    identified_items: ["Chicken", "Bread", "Lettuce", "Tomato", "Avocado"],
    estimated_portion: "~350g",
    opening_note: "Look at that plant list growing — nice work.",
    building_blocks: {
      protein_g: 24,
      fiber_g: 6,
      healthy_fat_sources: ["Avocado"],
      carb_quality: "mixed",
    },
    micronutrients: [
      { nutrient: "magnesium", level: "present", from: "Avocado", amount_estimate: null },
    ],
    offered: ["Three plants on one sandwich — great variety", "Nice healthy fat from the avocado"],
    worth_trying: [],
    absorption_notes: [],
    protocol_fit: { tier: "aligned", note: "Variety is really building here." },
    uncertainty: null,
    estimation_basis: null,
  }),
  m(10, 19, "Dinner", "Pasta with tomato sauce, spinach, and mushrooms.", {
    meal_name: "Pasta with tomato, spinach, and mushroom",
    identified_items: ["Pasta", "Tomato sauce", "Spinach", "Mushrooms"],
    estimated_portion: "~380g",
    opening_note: "This is the same cozy dinner with a whole new range of colour.",
    building_blocks: { protein_g: 13, fiber_g: 7, healthy_fat_sources: [], carb_quality: "mixed" },
    micronutrients: [
      { nutrient: "iron", level: "present", from: "Spinach", amount_estimate: null },
    ],
    offered: ["Three plants stirred into a familiar favourite — great instinct"],
    worth_trying: [],
    absorption_notes: [],
    protocol_fit: {
      tier: "aligned",
      note: "Same comfort food, a lot more going on nutritionally.",
    },
    uncertainty: null,
    estimation_basis: null,
  }),
  m(7, 8, "Breakfast", "Smoothie with spinach, banana, berries, and almond milk.", {
    meal_name: "Green smoothie",
    identified_items: ["Spinach", "Banana", "Mixed berries", "Almond milk"],
    estimated_portion: "~400ml",
    opening_note: "Four plants before 9am — this week's really taking off.",
    building_blocks: {
      protein_g: 6,
      fiber_g: 8,
      healthy_fat_sources: [],
      carb_quality: "mostly_complex",
    },
    micronutrients: [
      { nutrient: "magnesium", level: "present", from: "Spinach", amount_estimate: null },
      { nutrient: "iron", level: "light", from: "Spinach", amount_estimate: null },
    ],
    offered: ["Great colour and fiber to start the day"],
    worth_trying: ["A squeeze of orange in the blend would help the spinach's iron along."],
    absorption_notes: [],
    protocol_fit: { tier: "aligned", note: "A genuinely plant-forward start." },
    uncertainty: null,
    estimation_basis: null,
  }),
  m(5, 13, "Lunch", "Big bowl with quinoa, chickpeas, cucumber, tomato, peppers, and feta.", {
    meal_name: "Mediterranean grain bowl",
    identified_items: ["Quinoa", "Chickpeas", "Cucumber", "Tomato", "Bell peppers", "Feta"],
    estimated_portion: "~450g",
    opening_note: "Six plants on one plate — this is exactly the range we love to see.",
    building_blocks: {
      protein_g: 18,
      fiber_g: 11,
      healthy_fat_sources: ["Feta"],
      carb_quality: "mostly_complex",
    },
    micronutrients: [
      { nutrient: "calcium", level: "present", from: "Feta", amount_estimate: null },
    ],
    offered: ["Beautiful colour and variety on this plate", "Excellent fiber"],
    worth_trying: [],
    absorption_notes: [],
    protocol_fit: { tier: "aligned", note: "A genuinely varied, well-built bowl." },
    uncertainty: null,
    estimation_basis: null,
  }),
  m(2, 19, "Dinner", "Stir fry with tofu, broccoli, carrots, snap peas, and bell peppers.", {
    meal_name: "Rainbow tofu stir fry",
    identified_items: ["Tofu", "Broccoli", "Carrots", "Snap peas", "Bell peppers"],
    estimated_portion: "~420g",
    opening_note: "This plate has more colours on it than most weeks used to have all week.",
    building_blocks: {
      protein_g: 19,
      fiber_g: 9,
      healthy_fat_sources: [],
      carb_quality: "mostly_complex",
    },
    micronutrients: [{ nutrient: "iron", level: "present", from: "Tofu", amount_estimate: null }],
    offered: ["Five plants, four colours — genuinely impressive variety"],
    worth_trying: [],
    absorption_notes: [],
    protocol_fit: { tier: "aligned", note: "This is the range we were hoping to build toward." },
    uncertainty: null,
    estimation_basis: null,
  }),
  m(0, 8, "Breakfast", "Smoothie with spinach, mango, and chia seeds.", {
    meal_name: "Mango spinach smoothie",
    identified_items: ["Spinach", "Mango", "Chia seeds"],
    estimated_portion: "~350ml",
    opening_note: "Another colourful morning — this has become the new normal.",
    building_blocks: {
      protein_g: 7,
      fiber_g: 9,
      healthy_fat_sources: ["Chia seeds"],
      carb_quality: "mostly_complex",
    },
    micronutrients: [
      { nutrient: "magnesium", level: "present", from: "Chia seeds", amount_estimate: null },
    ],
    offered: ["Three plants and real colour, first thing in the morning"],
    worth_trying: [],
    absorption_notes: [],
    protocol_fit: { tier: "aligned", note: "The variety habit is holding strong." },
    uncertainty: null,
    estimation_basis: null,
  }),
];

// --- Patient 3: Sam — steady on the fertility/anti-inflammatory protocol,
// omega-3 and protein rhythm the throughline. --------------------------------
const SAM: DemoMealSeed[] = [
  m(18, 8, "Breakfast", "Chia pudding with almond milk and blueberries.", {
    meal_name: "Chia pudding with blueberries",
    identified_items: ["Chia seeds", "Almond milk", "Blueberries"],
    estimated_portion: "~250g",
    opening_note: "A great omega-3 start to the day.",
    building_blocks: {
      protein_g: 8,
      fiber_g: 9,
      healthy_fat_sources: ["Chia seeds"],
      carb_quality: "mostly_complex",
    },
    micronutrients: [
      { nutrient: "omega_3", level: "strong", from: "Chia seeds", amount_estimate: null },
    ],
    offered: ["Strong omega-3 source", "Good fiber"],
    worth_trying: [],
    absorption_notes: [],
    protocol_fit: { tier: "aligned", note: "Right on protocol — great omega-3 start." },
    uncertainty: null,
    estimation_basis: null,
  }),
  m(16, 13, "Lunch", "Salmon salad with mixed greens and walnuts.", {
    meal_name: "Salmon salad with walnuts",
    identified_items: ["Salmon", "Mixed greens", "Walnuts"],
    estimated_portion: "~350g",
    opening_note: "This bowl is doing exactly what we hoped for this week — nice work.",
    building_blocks: {
      protein_g: 30,
      fiber_g: 4,
      healthy_fat_sources: ["Salmon", "Walnuts"],
      carb_quality: "mostly_complex",
    },
    micronutrients: [
      { nutrient: "omega_3", level: "strong", from: "Salmon", amount_estimate: null },
      { nutrient: "vitamin_d", level: "present", from: "Salmon", amount_estimate: null },
    ],
    offered: ["Excellent omega-3 and protein together"],
    worth_trying: [],
    absorption_notes: [],
    protocol_fit: { tier: "aligned", note: "A model anti-inflammatory lunch." },
    uncertainty: null,
    estimation_basis: null,
  }),
  m(14, 19, "Dinner", "Grilled tofu with quinoa and roasted vegetables.", {
    meal_name: "Grilled tofu with quinoa",
    identified_items: ["Tofu", "Quinoa", "Roasted vegetables"],
    estimated_portion: "~400g",
    opening_note: "A well-rounded, protein-forward dinner.",
    building_blocks: {
      protein_g: 24,
      fiber_g: 8,
      healthy_fat_sources: [],
      carb_quality: "mostly_complex",
    },
    micronutrients: [
      { nutrient: "magnesium", level: "present", from: "Quinoa", amount_estimate: null },
    ],
    offered: ["Good plant protein and fiber together"],
    worth_trying: ["A drizzle of flax oil would bring some omega-3 into this one too."],
    absorption_notes: [],
    protocol_fit: { tier: "aligned", note: "Solid, well-rounded protocol fit." },
    uncertainty: null,
    estimation_basis: null,
  }),
  m(11, 8, "Breakfast", "Eggs with avocado on sourdough.", {
    meal_name: "Eggs and avocado on sourdough",
    identified_items: ["Eggs", "Avocado", "Sourdough"],
    estimated_portion: "~280g",
    opening_note: "A steady, satisfying start.",
    building_blocks: {
      protein_g: 15,
      fiber_g: 5,
      healthy_fat_sources: ["Avocado"],
      carb_quality: "mixed",
    },
    micronutrients: [{ nutrient: "choline", level: "strong", from: "Eggs", amount_estimate: null }],
    offered: ["Great choline source"],
    worth_trying: [],
    absorption_notes: [],
    protocol_fit: { tier: "aligned", note: "A reliable, well-balanced breakfast." },
    uncertainty: null,
    estimation_basis: null,
  }),
  m(9, 13, "Lunch", "Sardine and white bean salad with lemon.", {
    meal_name: "Sardine and white bean salad",
    identified_items: ["Sardines", "White beans", "Lemon", "Mixed greens"],
    estimated_portion: "~320g",
    opening_note: "Small fish, big nutritional payoff.",
    building_blocks: {
      protein_g: 26,
      fiber_g: 9,
      healthy_fat_sources: ["Sardines"],
      carb_quality: "mostly_complex",
    },
    micronutrients: [
      { nutrient: "omega_3", level: "strong", from: "Sardines", amount_estimate: null },
      { nutrient: "calcium", level: "present", from: "Sardines", amount_estimate: null },
      { nutrient: "vitamin_d", level: "present", from: "Sardines", amount_estimate: null },
    ],
    offered: ["Three strong nutrients from one small fish"],
    worth_trying: [],
    absorption_notes: [],
    protocol_fit: { tier: "aligned", note: "About as protocol-aligned as it gets." },
    uncertainty: null,
    estimation_basis: null,
  }),
  m(6, 19, "Dinner", "Baked cod with lentils and roasted brussels sprouts.", {
    meal_name: "Baked cod with lentils",
    identified_items: ["Cod", "Lentils", "Brussels sprouts"],
    estimated_portion: "~420g",
    opening_note: "A steady, protocol-aligned dinner.",
    building_blocks: {
      protein_g: 32,
      fiber_g: 10,
      healthy_fat_sources: [],
      carb_quality: "mostly_complex",
    },
    micronutrients: [{ nutrient: "iodine", level: "present", from: "Cod", amount_estimate: null }],
    offered: ["Good iodine source, which doesn't show up often"],
    worth_trying: [],
    absorption_notes: [],
    protocol_fit: { tier: "aligned", note: "Well-rounded and protocol-aligned." },
    uncertainty: null,
    estimation_basis: null,
  }),
  m(3, 8, "Breakfast", "Flaxseed oatmeal with walnuts and berries.", {
    meal_name: "Flaxseed oatmeal with walnuts",
    identified_items: ["Oats", "Ground flaxseed", "Walnuts", "Berries"],
    estimated_portion: "~300g",
    opening_note: "A steady omega-3 habit, week after week.",
    building_blocks: {
      protein_g: 10,
      fiber_g: 9,
      healthy_fat_sources: ["Flaxseed", "Walnuts"],
      carb_quality: "mostly_complex",
    },
    micronutrients: [
      { nutrient: "omega_3", level: "strong", from: "Ground flaxseed", amount_estimate: null },
    ],
    offered: ["Consistent, strong omega-3 source"],
    worth_trying: [],
    absorption_notes: [],
    protocol_fit: { tier: "aligned", note: "This has become a great everyday habit." },
    uncertainty: null,
    estimation_basis: null,
  }),
  m(1, 13, "Lunch", "Salmon and quinoa bowl with roasted vegetables.", {
    meal_name: "Salmon and quinoa bowl",
    identified_items: ["Salmon", "Quinoa", "Roasted vegetables"],
    estimated_portion: "~400g",
    opening_note: "Right in line with the protocol again — a really consistent few weeks.",
    building_blocks: {
      protein_g: 33,
      fiber_g: 7,
      healthy_fat_sources: ["Salmon"],
      carb_quality: "mostly_complex",
    },
    micronutrients: [
      { nutrient: "omega_3", level: "strong", from: "Salmon", amount_estimate: null },
      { nutrient: "vitamin_d", level: "present", from: "Salmon", amount_estimate: null },
    ],
    offered: ["Consistently strong omega-3 and protein together"],
    worth_trying: [],
    absorption_notes: [],
    protocol_fit: {
      tier: "aligned",
      note: "Three weeks of steady protocol fit — great consistency.",
    },
    uncertainty: null,
    estimation_basis: null,
  }),
  m(0, 8, "Breakfast", "Chia pudding with walnuts and berries.", {
    meal_name: "Chia pudding with walnuts",
    identified_items: ["Chia seeds", "Walnuts", "Berries"],
    estimated_portion: "~260g",
    opening_note: "Same steady omega-3 habit this morning.",
    building_blocks: {
      protein_g: 9,
      fiber_g: 8,
      healthy_fat_sources: ["Chia seeds", "Walnuts"],
      carb_quality: "mostly_complex",
    },
    micronutrients: [
      { nutrient: "omega_3", level: "strong", from: "Chia seeds", amount_estimate: null },
    ],
    offered: ["Another strong omega-3 morning"],
    worth_trying: [],
    absorption_notes: [],
    protocol_fit: { tier: "aligned", note: "The consistency here is the whole story." },
    uncertainty: null,
    estimation_basis: null,
  }),
];

export const DEMO_PATIENTS: DemoPatientSeed[] = [
  {
    id: "demo-patient-jordan",
    fullName: "Jordan (demo)",
    email: "demo-jordan@example.com",
    meals: JORDAN,
  },
  {
    id: "demo-patient-morgan",
    fullName: "Morgan (demo)",
    email: "demo-morgan@example.com",
    meals: MORGAN,
  },
  { id: "demo-patient-sam", fullName: "Sam (demo)", email: "demo-sam@example.com", meals: SAM },
];

export const DEMO_RUBRIC = {
  title: "Fertility & anti-inflammatory protocol (demo)",
  description: "Sample protocol used for the demo walkthrough — omega-3 forward, iron-aware.",
  extractedText:
    "Prioritize omega-3 sources (fatty fish, flax, chia, walnuts) at most meals. Pair iron-rich " +
    "foods with a vitamin C source and keep coffee/tea an hour from iron-rich meals. Protein at " +
    "every meal. Encourage plant variety and colour over any single 'superfood'. Food-first for " +
    "calcium and vitamin D where possible.",
};
