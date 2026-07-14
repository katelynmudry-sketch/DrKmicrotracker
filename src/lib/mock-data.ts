// Fixture data used only in preview/mock mode (see mock-mode.ts).
import type { Meal, TrackedNutrient } from "@/lib/analysis.schema";
import type { GroceryListItem, PantryItem } from "@/lib/pantry.schema";

const photo = (seed: string) => `https://picsum.photos/seed/${seed}/640/480`;

export const MOCK_PATIENT_ID = "mock-user-1";

export const mockMeals: Meal[] = [
  {
    id: "meal-1",
    patientId: MOCK_PATIENT_ID,
    mealLabel: "Lunch — grilled salmon bowl",
    eatenAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    createdAt: null,
    status: "analyzed",
    storagePath: photo("salmon"),
    inputMethod: "photo",
    mealDescription: null,
    patientNotes: "Felt good, not too full.",
    doctorNotes: null,
    analysisEditedAt: null,
    analysisEditedBy: null,
    rubricIds: ["rubric-1"],
    analyzedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    statusError: null,
    analysis: {
      meal_name: "Grilled salmon bowl",
      identified_items: ["Salmon", "Quinoa", "Spinach", "Avocado"],
      estimated_portion: "~450g",
      opening_note:
        "This bowl is doing exactly what we hoped for your energy this week — nice work!",
      building_blocks: {
        protein_g: 38,
        fiber_g: 8,
        healthy_fat_sources: ["Salmon", "Avocado"],
        carb_quality: "mostly_complex",
      },
      micronutrients: [
        {
          nutrient: "omega_3",
          level: "strong",
          from: "Salmon",
          amount_estimate: { low: 1.2, high: 1.8 },
        },
        {
          nutrient: "vitamin_d",
          level: "present",
          from: "Salmon",
          amount_estimate: { low: 8, high: 12 },
        },
        {
          nutrient: "iron",
          level: "light",
          from: "Spinach",
          amount_estimate: { low: 1, high: 2 },
        },
        {
          nutrient: "selenium",
          level: "strong",
          from: "Salmon",
          amount_estimate: { low: 35, high: 45 },
        },
        {
          nutrient: "vitamin_c",
          level: "light",
          from: "Spinach",
          amount_estimate: { low: 5, high: 10 },
        },
      ],
      offered: ["Beautiful colours on that plate", "A strong omega-3 source"],
      worth_trying: ["A squeeze of lemon over the spinach would help the iron land further."],
      absorption_notes: [
        "Vitamin C alongside the spinach's iron would help it absorb better — a little lemon or citrus does the job.",
      ],
      protocol_fit: {
        tier: "aligned",
        note: "Right in line with the anti-inflammatory protocol — great omega-3 source.",
      },
      uncertainty: null,
      estimation_basis: "reference_object",
    },
  },
  {
    id: "meal-2",
    patientId: MOCK_PATIENT_ID,
    mealLabel: "Breakfast — oatmeal & berries",
    eatenAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    createdAt: null,
    status: "analyzed",
    storagePath: photo("oatmeal"),
    inputMethod: "photo",
    mealDescription: null,
    patientNotes: null,
    doctorNotes: "Great consistent breakfast choice — keep it up.",
    analysisEditedAt: null,
    analysisEditedBy: null,
    rubricIds: ["rubric-1"],
    analyzedAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    statusError: null,
    analysis: {
      meal_name: "Oatmeal with mixed berries",
      identified_items: ["Oats", "Blueberries", "Strawberries", "Chia seeds"],
      estimated_portion: "~300g",
      opening_note: "A gentle, steady start — this one's built for lasting energy.",
      building_blocks: {
        protein_g: 10,
        fiber_g: 11,
        healthy_fat_sources: ["Chia seeds"],
        carb_quality: "mostly_complex",
      },
      micronutrients: [
        {
          nutrient: "magnesium",
          level: "present",
          from: "Chia seeds",
          amount_estimate: { low: 40, high: 60 },
        },
      ],
      offered: ["Good fiber content", "Colourful berries"],
      worth_trying: ["Adding a protein source would slow the morning glucose curve even further."],
      absorption_notes: [],
      protocol_fit: {
        tier: "getting_there",
        note: "Solid fiber — a bit more protein would round it out.",
      },
      uncertainty: null,
      estimation_basis: "unaided_estimate",
    },
  },
  {
    id: "meal-3",
    patientId: MOCK_PATIENT_ID,
    mealLabel: "Dinner — pasta night",
    eatenAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    createdAt: null,
    status: "analyzing",
    storagePath: photo("pasta"),
    inputMethod: "photo",
    mealDescription: null,
    patientNotes: "Date night, didn't track exact portions.",
    doctorNotes: null,
    analysisEditedAt: null,
    analysisEditedBy: null,
    rubricIds: [],
    analyzedAt: null,
    statusError: null,
    analysis: null,
  },
  {
    id: "meal-4",
    patientId: MOCK_PATIENT_ID,
    mealLabel: null,
    eatenAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
    createdAt: null,
    status: "failed",
    storagePath: photo("mystery"),
    inputMethod: "photo",
    mealDescription: null,
    patientNotes: null,
    doctorNotes: null,
    analysisEditedAt: null,
    analysisEditedBy: null,
    rubricIds: [],
    analyzedAt: null,
    statusError: "AI service is not configured",
    analysis: null,
  },
  {
    id: "meal-5",
    patientId: MOCK_PATIENT_ID,
    mealLabel: "Snack — described, no photo",
    eatenAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    createdAt: null,
    status: "analyzed",
    storagePath: null,
    inputMethod: "text",
    mealDescription: "A handful of almonds and an apple, eaten at my desk.",
    patientNotes: null,
    doctorNotes: null,
    analysisEditedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    analysisEditedBy: MOCK_PATIENT_ID,
    rubricIds: ["rubric-1"],
    analyzedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    statusError: null,
    analysis: {
      meal_name: "Almonds and apple",
      identified_items: ["Almonds", "Apple"],
      estimated_portion: "~30g almonds, 1 medium apple",
      opening_note: "A steady little snack — good fiber-to-sweetness balance.",
      building_blocks: {
        protein_g: 7,
        fiber_g: 6,
        healthy_fat_sources: ["Almonds"],
        carb_quality: "mostly_complex",
      },
      micronutrients: [
        {
          nutrient: "magnesium",
          level: "present",
          from: "Almonds",
          amount_estimate: { low: 60, high: 80 },
        },
      ],
      offered: ["Good fiber-to-sugar ratio for a snack"],
      worth_trying: [
        "Pairing with a protein source if it's more than two hours before your next meal.",
      ],
      absorption_notes: [],
      protocol_fit: { tier: "aligned", note: "A well-balanced snack for between-meal energy." },
      uncertainty: null,
      estimation_basis: "unaided_estimate",
    },
  },
];

export type MockPatient = {
  id: string;
  fullName: string | null;
  email: string | null;
  currentRegions?: string[] | null;
  foodHeritage?: string[] | null;
  // Exercises resolveEffectiveFocusNutrients's fallback chain in Preview
  // mode's doctor view — see src/lib/users.schema.ts.
  doctorFocusNutrients?: TrackedNutrient[];
  patientFocusNutrients?: TrackedNutrient[] | null;
};

export const mockPatients: MockPatient[] = [
  {
    id: MOCK_PATIENT_ID,
    fullName: "Preview Patient",
    email: "preview@example.com",
    currentRegions: null,
    foodHeritage: null,
  },
  {
    id: "patient-2",
    fullName: "Casey Rivera",
    email: "casey@example.com",
    currentRegions: ["Canadian / North American"],
    foodHeritage: ["Mexican"],
    doctorFocusNutrients: ["iron", "vitamin_d", "b12", "magnesium"],
  },
  {
    id: "patient-3",
    fullName: null,
    email: "sam@example.com",
    currentRegions: ["Canadian / North American"],
    foodHeritage: ["East African"],
    doctorFocusNutrients: ["iron", "vitamin_d", "b12", "magnesium"],
    patientFocusNutrients: ["iron", "vitamin_c", "selenium"],
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

export const mockPantryItems: PantryItem[] = [
  {
    id: "pantry-1",
    patientId: MOCK_PATIENT_ID,
    name: "Pumpkin seeds",
    status: "active",
    createdAt: null,
  },
  {
    id: "pantry-2",
    patientId: MOCK_PATIENT_ID,
    name: "Chia seeds",
    status: "active",
    createdAt: null,
  },
  { id: "pantry-3", patientId: MOCK_PATIENT_ID, name: "Oats", status: "active", createdAt: null },
  { id: "pantry-4", patientId: MOCK_PATIENT_ID, name: "Eggs", status: "used_up", createdAt: null },
];

export const mockGroceryListItems: GroceryListItem[] = [
  {
    id: "grocery-1",
    patientId: MOCK_PATIENT_ID,
    name: "Eggs",
    reason: "used_up",
    note: null,
    checkedAt: null,
    createdAt: null,
  },
  {
    id: "grocery-2",
    patientId: MOCK_PATIENT_ID,
    name: "Sardines",
    reason: "gap_suggestion",
    note: "small, mighty, and easy on the budget",
    checkedAt: null,
    createdAt: null,
  },
];
