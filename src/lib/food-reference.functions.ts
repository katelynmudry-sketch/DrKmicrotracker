import { createServerFn } from "@tanstack/react-start";
import { requireFirebaseAuth } from "@/integrations/firebase/auth-middleware";
import { z } from "zod";

export type FoodReferenceRow = {
  food_code: number;
  food_name: string;
  food_group: string | null;
  calories_kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  sugar_g: number | null;
  vitamin_a_rae_mcg: number | null;
  vitamin_c_mg: number | null;
  vitamin_d_mcg: number | null;
  iron_mg: number | null;
  calcium_mg: number | null;
  zinc_mg: number | null;
  magnesium_mg: number | null;
  potassium_mg: number | null;
};

export type FoodMatch = {
  matched: boolean;
  confidence: "high" | "low" | null;
  food?: FoodReferenceRow;
};

/**
 * Fuzzy-matches free-text food names (from photo/voice parsing) against the
 * CNF `food_reference` table. Pre-filters via Postgres full-text search on the
 * first significant word, then ranks candidates with Fuse for typo tolerance.
 * Returns matched: false (not an error) when Supabase isn't configured yet or
 * no row clears the confidence threshold — callers should treat unmatched
 * items as "estimated" rather than failing the pantry flow.
 */
export async function matchFoodToReference(foodName: string): Promise<FoodMatch> {
  const { isSupabaseConfigured, supabaseAdmin } =
    await import("@/integrations/supabase/admin.server");
  if (!isSupabaseConfigured) return { matched: false, confidence: null };

  const normalized = foodName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
  if (!normalized) return { matched: false, confidence: null };
  const firstWord = normalized.split(/\s+/)[0];

  const { data, error } = await supabaseAdmin
    .from("food_reference")
    .select("*")
    .ilike("food_name", `%${firstWord}%`)
    .limit(25);
  if (error || !data || data.length === 0) return { matched: false, confidence: null };

  const { default: Fuse } = await import("fuse.js");
  const fuse = new Fuse(data as FoodReferenceRow[], { keys: ["food_name"], threshold: 0.4 });
  const [best] = fuse.search(normalized);
  if (!best) return { matched: false, confidence: null };

  return {
    matched: true,
    confidence: best.score !== undefined && best.score < 0.2 ? "high" : "low",
    food: best.item,
  };
}

const SearchInput = z.object({ query: z.string().min(1) });

export const searchFoodReference = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((input: unknown) => SearchInput.parse(input))
  .handler(async ({ data }) => {
    const { isSupabaseConfigured, supabaseAdmin } =
      await import("@/integrations/supabase/admin.server");
    if (!isSupabaseConfigured) return { results: [] as FoodReferenceRow[] };

    const { data: rows, error } = await supabaseAdmin
      .from("food_reference")
      .select("*")
      .ilike("food_name", `%${data.query}%`)
      .limit(20);
    if (error) return { results: [] as FoodReferenceRow[] };
    return { results: (rows ?? []) as FoodReferenceRow[] };
  });
