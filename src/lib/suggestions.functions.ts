import { createServerFn } from "@tanstack/react-start";
import { requireFirebaseAuth } from "@/integrations/firebase/auth-middleware";
import { z } from "zod";
import type { FoodReferenceRow } from "@/lib/food-reference.functions";

export type NutrientColumn =
  | "vitamin_a_rae_mcg"
  | "vitamin_c_mg"
  | "vitamin_d_mcg"
  | "iron_mg"
  | "calcium_mg"
  | "zinc_mg"
  | "magnesium_mg"
  | "potassium_mg";

const NUTRIENT_NAME_TO_COLUMN: Record<string, NutrientColumn> = {
  "vitamin a": "vitamin_a_rae_mcg",
  "vitamin c": "vitamin_c_mg",
  "vitamin d": "vitamin_d_mcg",
  iron: "iron_mg",
  calcium: "calcium_mg",
  zinc: "zinc_mg",
  magnesium: "magnesium_mg",
  potassium: "potassium_mg",
};

export type MealMicroEntry = { name: string; daily_value_pct: number | null };
export type MealAnalysisLike = { key_micros?: MealMicroEntry[] | null } | null | undefined;

export type NutrientGap = {
  nutrient: string;
  column: NutrientColumn | null;
  avgDailyValuePct: number;
  mealCount: number;
};

const GAP_THRESHOLD_PCT = 70;

function normalizeNutrientName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Averages daily_value_pct per nutrient across recent meal analyses and
 * flags anything consistently below GAP_THRESHOLD_PCT as a gap. Pure
 * function (no IO) so it's testable independent of Firestore/Supabase.
 */
export function computeNutrientGaps(analyses: MealAnalysisLike[]): NutrientGap[] {
  const totals = new Map<string, { displayName: string; sum: number; count: number }>();

  for (const analysis of analyses) {
    for (const micro of analysis?.key_micros ?? []) {
      if (micro.daily_value_pct == null) continue;
      const key = normalizeNutrientName(micro.name);
      const entry = totals.get(key) ?? { displayName: micro.name, sum: 0, count: 0 };
      entry.sum += micro.daily_value_pct;
      entry.count += 1;
      totals.set(key, entry);
    }
  }

  const gaps: NutrientGap[] = [];
  for (const [key, { displayName, sum, count }] of totals) {
    const avg = sum / count;
    if (avg >= GAP_THRESHOLD_PCT) continue;
    gaps.push({
      nutrient: displayName,
      column: NUTRIENT_NAME_TO_COLUMN[key] ?? null,
      avgDailyValuePct: Math.round(avg),
      mealCount: count,
    });
  }

  return gaps.sort((a, b) => a.avgDailyValuePct - b.avgDailyValuePct);
}

/**
 * Ranks candidate foods for a gap nutrient by amount of that nutrient
 * (simple arithmetic — no ML). Used for both the pantry-first basic tier
 * and the food_reference-wide expanded tier.
 */
export function rankByNutrient(
  foods: FoodReferenceRow[],
  column: NutrientColumn,
  limit: number,
): FoodReferenceRow[] {
  return [...foods]
    .filter((f) => f[column] != null)
    .sort((a, b) => (b[column] ?? 0) - (a[column] ?? 0))
    .slice(0, limit);
}

export type NutrientSuggestion = {
  nutrient: string;
  avgDailyValuePct: number;
  basicTier: Array<{ food_code: number; food_name: string; amount: number | null }>;
  expandedTier: Array<{ food_code: number; food_name: string; amount: number | null }>;
};

async function assertOwnsOrDoctor(userId: string, patientId: string) {
  if (userId === patientId) return;
  const { adminDb } = await import("@/integrations/firebase/admin.server");
  const snap = await adminDb.collection("users").doc(userId).get();
  if (snap.data()?.role !== "doctor") throw new Error("Forbidden");
}

async function fetchRecentAnalyses(patientId: string, days: number): Promise<MealAnalysisLike[]> {
  const { adminDb } = await import("@/integrations/firebase/admin.server");
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const snap = await adminDb
    .collection("meals")
    .where("patientId", "==", patientId)
    .where("status", "==", "analyzed")
    .get();
  return snap.docs
    .map((d) => d.data())
    .filter((m) => new Date(m.eatenAt).getTime() >= cutoff)
    .map((m) => m.analysis as MealAnalysisLike);
}

const GapsInput = z.object({
  patientId: z.string().min(1).optional(),
  days: z.number().optional(),
});

export const getNutrientGaps = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((input: unknown) => GapsInput.parse(input))
  .handler(async ({ data, context }) => {
    const patientId = data.patientId ?? context.userId;
    await assertOwnsOrDoctor(context.userId, patientId);
    const analyses = await fetchRecentAnalyses(patientId, data.days ?? 14);
    return { gaps: computeNutrientGaps(analyses) };
  });

export const getNutrientSuggestions = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((input: unknown) => GapsInput.parse(input))
  .handler(async ({ data, context }) => {
    const patientId = data.patientId ?? context.userId;
    await assertOwnsOrDoctor(context.userId, patientId);

    const analyses = await fetchRecentAnalyses(patientId, data.days ?? 14);
    const gaps = computeNutrientGaps(analyses);

    const { isSupabaseConfigured, supabaseAdmin } =
      await import("@/integrations/supabase/admin.server");
    if (!isSupabaseConfigured) {
      return {
        suggestions: gaps.map((g) => ({
          nutrient: g.nutrient,
          avgDailyValuePct: g.avgDailyValuePct,
          basicTier: [],
          expandedTier: [],
        })) as NutrientSuggestion[],
      };
    }

    const { adminDb } = await import("@/integrations/firebase/admin.server");
    const pantrySnap = await adminDb
      .collection("pantry_items")
      .where("patientId", "==", patientId)
      .where("status", "==", "active")
      .get();
    const pantryFoodCodes = [
      ...new Set(
        pantrySnap.docs
          .map((d) => d.data().cnfFoodCode as number | null)
          .filter((code): code is number => code != null),
      ),
    ];

    const pantryFoods: FoodReferenceRow[] = pantryFoodCodes.length
      ? (((await supabaseAdmin.from("food_reference").select("*").in("food_code", pantryFoodCodes))
          .data as FoodReferenceRow[] | null) ?? [])
      : [];

    const suggestions: NutrientSuggestion[] = [];
    for (const gap of gaps) {
      if (!gap.column) {
        suggestions.push({
          nutrient: gap.nutrient,
          avgDailyValuePct: gap.avgDailyValuePct,
          basicTier: [],
          expandedTier: [],
        });
        continue;
      }

      const basicTier = rankByNutrient(pantryFoods, gap.column, 5).map((f) => ({
        food_code: f.food_code,
        food_name: f.food_name,
        amount: f[gap.column!],
      }));

      let expandedTier: NutrientSuggestion["expandedTier"] = [];
      if (basicTier.length < 2) {
        const { data: candidates } = await supabaseAdmin
          .from("food_reference")
          .select("*")
          .order(gap.column, { ascending: false })
          .limit(20);
        expandedTier = ((candidates as FoodReferenceRow[] | null) ?? [])
          .filter((f) => !pantryFoodCodes.includes(f.food_code))
          .slice(0, 5)
          .map((f) => ({ food_code: f.food_code, food_name: f.food_name, amount: f[gap.column!] }));
      }

      suggestions.push({
        nutrient: gap.nutrient,
        avgDailyValuePct: gap.avgDailyValuePct,
        basicTier,
        expandedTier,
      });
    }

    return { suggestions };
  });
