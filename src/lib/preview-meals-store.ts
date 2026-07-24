// Local, per-browser record of today's real-AI preview readings (see
// meals-preview.functions.ts). There is no account/Firestore in preview mode,
// so this is the only place a beta tester's own meals live — and only for
// the current day. It resets every day on purpose: there's no login yet, so
// there's no durable identity to keep history against once the day turns
// over. Once accounts/Firestore land for these users, this store goes away.
import { MOCK_PATIENT_ID } from "@/lib/mock-data";
import { inferMealTiming, type MealTiming } from "@/lib/meal-timing";
import type { Meal, MealAnalysis, MealInputMethod } from "@/lib/analysis.schema";

const STORAGE_KEY = "previewMealsToday";

interface PreviewMealsRecord {
  date: string;
  meals: Meal[];
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function readRecord(): PreviewMealsRecord {
  if (typeof window === "undefined") return { date: todayKey(), meals: [] };
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { date: todayKey(), meals: [] };
  try {
    const parsed = JSON.parse(raw) as PreviewMealsRecord;
    if (parsed.date !== todayKey()) return { date: todayKey(), meals: [] };
    return parsed;
  } catch {
    return { date: todayKey(), meals: [] };
  }
}

export function getLocalPreviewMeals(): Meal[] {
  return readRecord().meals;
}

export function addLocalPreviewMeal(
  analysis: MealAnalysis,
  input: {
    inputMethod: MealInputMethod;
    mealLabel?: string;
    mealDescription?: string;
    patientNotes?: string;
    eatenAt: Date;
    mealTiming?: MealTiming;
  },
): Meal {
  const eatenAt = input.eatenAt.toISOString();
  const meal: Meal = {
    id: `preview-${Date.now()}`,
    patientId: MOCK_PATIENT_ID,
    // Not persisted — a preview photo only ever lived in the request to
    // Anthropic, never saved to this device.
    storagePath: null,
    inputMethod: input.inputMethod,
    mealDescription: input.mealDescription || null,
    mealLabel: input.mealLabel || null,
    mealTiming: input.mealTiming ?? inferMealTiming(input.eatenAt),
    patientNotes: input.patientNotes || null,
    doctorNotes: null,
    status: "analyzed",
    analysis,
    eatenAt,
    createdAt: null,
    analyzedAt: eatenAt,
    statusError: null,
    analysisEditedAt: null,
    analysisEditedBy: null,
  };
  const record = readRecord();
  record.meals = [meal, ...record.meals];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  return meal;
}
