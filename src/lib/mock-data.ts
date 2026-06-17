// Fixture data used only in preview/mock mode (see mock-mode.ts).
export type MockMeal = {
  id: string;
  patientId: string;
  mealLabel: string | null;
  eatenAt: string;
  status: "analyzed" | "analyzing" | "failed";
  storagePath: string;
  patientNotes: string | null;
  doctorNotes: string | null;
  analysis: unknown;
};

const photo = (seed: string) => `https://picsum.photos/seed/${seed}/640/480`;

export const MOCK_PATIENT_ID = "mock-user-1";

export const mockMeals: MockMeal[] = [
  {
    id: "meal-1",
    patientId: MOCK_PATIENT_ID,
    mealLabel: "Lunch — grilled salmon bowl",
    eatenAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    status: "analyzed",
    storagePath: photo("salmon"),
    patientNotes: "Felt good, not too full.",
    doctorNotes: null,
    analysis: {
      meal_name: "Grilled salmon bowl",
      identified_items: ["Salmon", "Quinoa", "Spinach", "Avocado"],
      estimated_portion: "~450g",
      macros: { calories_kcal: 520, protein_g: 38, carbs_g: 32, fat_g: 24, fiber_g: 8, sugar_g: 3 },
      key_micros: [
        { name: "Omega-3", amount: "1.8g", daily_value_pct: 120 },
        { name: "Vitamin D", amount: "12mcg", daily_value_pct: 60 },
      ],
      rubric_notes: ["Aligned with anti-inflammatory protocol — good omega-3 source."],
      naturopathic_recommendations: [
        "Add a source of vitamin C to improve iron absorption from spinach.",
      ],
      concerns: [],
      overall_score: 8,
    },
  },
  {
    id: "meal-2",
    patientId: MOCK_PATIENT_ID,
    mealLabel: "Breakfast — oatmeal & berries",
    eatenAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    status: "analyzed",
    storagePath: photo("oatmeal"),
    patientNotes: null,
    doctorNotes: "Great consistent breakfast choice — keep it up.",
    analysis: {
      meal_name: "Oatmeal with mixed berries",
      identified_items: ["Oats", "Blueberries", "Strawberries", "Chia seeds"],
      estimated_portion: "~300g",
      macros: {
        calories_kcal: 340,
        protein_g: 10,
        carbs_g: 58,
        fat_g: 8,
        fiber_g: 11,
        sugar_g: 14,
      },
      key_micros: [{ name: "Vitamin C", amount: "45mg", daily_value_pct: 50 }],
      rubric_notes: ["Good fiber content."],
      naturopathic_recommendations: [
        "Consider adding a protein source to slow the glucose response.",
      ],
      concerns: ["Moderate sugar from fruit — fine given the fiber content."],
      overall_score: 7,
    },
  },
  {
    id: "meal-3",
    patientId: MOCK_PATIENT_ID,
    mealLabel: "Dinner — pasta night",
    eatenAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    status: "analyzing",
    storagePath: photo("pasta"),
    patientNotes: "Date night, didn't track exact portions.",
    doctorNotes: null,
    analysis: null,
  },
  {
    id: "meal-4",
    patientId: MOCK_PATIENT_ID,
    mealLabel: null,
    eatenAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
    status: "failed",
    storagePath: photo("mystery"),
    patientNotes: null,
    doctorNotes: null,
    analysis: null,
  },
];

export type MockPatient = { id: string; fullName: string | null; email: string | null };

export const mockPatients: MockPatient[] = [
  { id: MOCK_PATIENT_ID, fullName: "Preview Patient", email: "preview@example.com" },
  { id: "patient-2", fullName: "Casey Rivera", email: "casey@example.com" },
  { id: "patient-3", fullName: null, email: "sam@example.com" },
];

export type MockPantryItem = {
  id: string;
  patientId: string;
  foodName: string;
  quantity: number | null;
  unit: string | null;
  cnfFoodCode: number | null;
  matchConfidence: "high" | "low" | null;
  source: "photo" | "voice" | "manual";
  addedAt: string;
  depletedAt: string | null;
  status: "active" | "depleted" | "removed";
};

export const mockPantryItems: MockPantryItem[] = [
  {
    id: "pantry-1",
    patientId: MOCK_PATIENT_ID,
    foodName: "Rolled oats",
    quantity: 1,
    unit: "bag",
    cnfFoodCode: 1011,
    matchConfidence: "high",
    source: "photo",
    addedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    depletedAt: null,
    status: "active",
  },
  {
    id: "pantry-2",
    patientId: MOCK_PATIENT_ID,
    foodName: "Canned chickpeas",
    quantity: 3,
    unit: "cans",
    cnfFoodCode: 2306,
    matchConfidence: "high",
    source: "photo",
    addedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    depletedAt: null,
    status: "active",
  },
  {
    id: "pantry-3",
    patientId: MOCK_PATIENT_ID,
    foodName: "Spinach",
    quantity: 1,
    unit: "bag",
    cnfFoodCode: null,
    matchConfidence: null,
    source: "voice",
    addedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    depletedAt: null,
    status: "active",
  },
  {
    id: "pantry-4",
    patientId: MOCK_PATIENT_ID,
    foodName: "Almond milk",
    quantity: 0,
    unit: "carton",
    cnfFoodCode: null,
    matchConfidence: null,
    source: "manual",
    addedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    depletedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    status: "depleted",
  },
];

export type MockGroceryListItem = {
  id: string;
  patientId: string;
  foodName: string;
  cnfFoodCode: number | null;
  reason: "depleted" | "gap-fill" | "manual";
  addedAt: string;
  checkedAt: string | null;
  sourcePantryItemId: string | null;
};

export const mockGroceryListItems: MockGroceryListItem[] = [
  {
    id: "grocery-1",
    patientId: MOCK_PATIENT_ID,
    foodName: "Almond milk",
    cnfFoodCode: null,
    reason: "depleted",
    addedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    checkedAt: null,
    sourcePantryItemId: "pantry-4",
  },
  {
    id: "grocery-2",
    patientId: MOCK_PATIENT_ID,
    foodName: "Oranges",
    cnfFoodCode: null,
    reason: "gap-fill",
    addedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    checkedAt: null,
    sourcePantryItemId: null,
  },
  {
    id: "grocery-3",
    patientId: MOCK_PATIENT_ID,
    foodName: "Paper towels",
    cnfFoodCode: null,
    reason: "manual",
    addedAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    checkedAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    sourcePantryItemId: null,
  },
];

export type MockNutrientSuggestion = {
  nutrient: string;
  avgDailyValuePct: number;
  basicTier: Array<{ food_code: number; food_name: string; amount: number | null }>;
  expandedTier: Array<{ food_code: number; food_name: string; amount: number | null }>;
};

export const mockNutrientSuggestions: MockNutrientSuggestion[] = [
  {
    nutrient: "Vitamin C",
    avgDailyValuePct: 42,
    basicTier: [{ food_code: 1001, food_name: "Spinach, raw", amount: 28.1 }],
    expandedTier: [
      { food_code: 2002, food_name: "Red bell pepper, raw", amount: 127.7 },
      { food_code: 2003, food_name: "Orange, raw", amount: 53.2 },
    ],
  },
  {
    nutrient: "Vitamin D",
    avgDailyValuePct: 58,
    basicTier: [],
    expandedTier: [
      { food_code: 2004, food_name: "Salmon, cooked", amount: 14.5 },
      { food_code: 2005, food_name: "Egg, whole, cooked", amount: 2.0 },
    ],
  },
];

export type MockRubric = {
  id: string;
  title: string;
  description: string | null;
  extractedText: string | null;
  fileName: string;
  storagePath: string;
  isActive: boolean;
};

export const mockRubrics: MockRubric[] = [
  {
    id: "rubric-1",
    title: "Anti-inflammatory protocol v3",
    description: "Core protocol for autoimmune patients",
    extractedText: "Avoid nightshades and refined sugar. Prioritize omega-3 sources.",
    fileName: "anti-inflammatory-v3.pdf",
    storagePath: "rubrics/mock/anti-inflammatory-v3.pdf",
    isActive: true,
  },
];
