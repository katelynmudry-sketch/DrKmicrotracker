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
      naturopathic_recommendations: ["Add a source of vitamin C to improve iron absorption from spinach."],
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
      macros: { calories_kcal: 340, protein_g: 10, carbs_g: 58, fat_g: 8, fiber_g: 11, sugar_g: 14 },
      key_micros: [{ name: "Vitamin C", amount: "45mg", daily_value_pct: 50 }],
      rubric_notes: ["Good fiber content."],
      naturopathic_recommendations: ["Consider adding a protein source to slow the glucose response."],
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
