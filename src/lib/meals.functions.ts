import { createServerFn } from "@tanstack/react-start";
import { requireFirebaseAuth } from "@/integrations/firebase/auth-middleware";
import { z } from "zod";
import type { FoodReferenceRow } from "@/lib/food-reference.functions";
import { NUTRIENT_DISPLAY, type NutrientColumn } from "@/lib/nutrient-reference";

const AnalyzeInput = z.object({ mealId: z.string().min(1) });

export const analyzeMeal = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((input: unknown) => AnalyzeInput.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { adminDb, adminStorage } = await import("@/integrations/firebase/admin.server");

    const mealRef = adminDb.collection("meals").doc(data.mealId);
    const mealSnap = await mealRef.get();
    if (!mealSnap.exists) throw new Error("Meal not found");
    const meal = mealSnap.data()!;

    if (meal.patientId !== userId) {
      const userSnap = await adminDb.collection("users").doc(userId).get();
      if (userSnap.data()?.role !== "doctor") throw new Error("Forbidden");
    }

    const file = adminStorage.bucket().file(meal.storagePath);
    const [buf] = await file.download();
    const [meta] = await file.getMetadata();
    const mime = meta.contentType || "image/jpeg";
    const base64 = buf.toString("base64");

    const rubricsSnap = await adminDb.collection("rubrics").where("isActive", "==", true).get();
    const rubricContext = rubricsSnap.docs
      .map((d) => {
        const r = d.data();
        return `### ${r.title}\n${r.description ?? ""}\n${r.extractedText ?? ""}`.trim();
      })
      .join("\n\n---\n\n");

    const systemPrompt = `You are a clinical nutrition assistant supporting a naturopathic doctor.
Analyze the meal photo and return STRICT JSON only matching this TypeScript type:

{
  "meal_name": string,
  "identified_items": string[],
  "estimated_portion": string,
  "macros": { "calories_kcal": number, "protein_g": number, "carbs_g": number, "fat_g": number, "fiber_g": number, "sugar_g": number },
  "key_micros": Array<{ "name": string, "amount": string, "daily_value_pct": number | null }>,
  "rubric_notes": string[],
  "naturopathic_recommendations": string[],
  "concerns": string[],
  "overall_score": number  // 1-10 alignment with the doctor's rubric
}

Use the doctor's rubric below to tailor every comment. If the photo is unclear, make reasonable estimates and flag uncertainty in concerns.
Return ONLY the JSON object, no markdown fences, no preface.

DOCTOR'S RUBRIC AND DIETARY GUIDELINES:
${rubricContext || "(no rubric provided yet — use evidence-based naturopathic nutrition defaults)"}`;

    const userText = `Patient label: ${meal.mealLabel ?? "(none)"}\nPatient notes: ${meal.patientNotes ?? "(none)"}\nPlease analyze the attached meal photo.`;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("AI service is not configured");

    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: userText },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mime as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
                data: base64,
              },
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const content = textBlock && textBlock.type === "text" ? textBlock.text : "{}";
    let analysis: unknown;
    try {
      analysis = JSON.parse(content);
    } catch {
      const m = content.match(/\{[\s\S]*\}/);
      analysis = m ? JSON.parse(m[0]) : { raw: content };
    }

    await mealRef.update({ analysis, status: "analyzed" });

    return { ok: true, analysis };
  });

const SignInput = z.object({ path: z.string().min(1) });

export const getMealPhotoUrl = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((input: unknown) => SignInput.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { adminDb, adminStorage } = await import("@/integrations/firebase/admin.server");

    const owns = data.path.startsWith(`meal-photos/${userId}/`);
    if (!owns) {
      const userSnap = await adminDb.collection("users").doc(userId).get();
      if (userSnap.data()?.role !== "doctor") throw new Error("Forbidden");
    }

    const [url] = await adminStorage
      .bucket()
      .file(data.path)
      .getSignedUrl({ action: "read", expires: Date.now() + 60 * 60 * 1000 });
    return { url };
  });

const MACRO_COLUMNS = [
  "calories_kcal",
  "protein_g",
  "carbs_g",
  "fat_g",
  "fiber_g",
  "sugar_g",
] as const;

const LogManualInput = z.object({
  items: z.array(z.object({ food_code: z.number(), grams: z.number().positive() })).min(1),
  mealLabel: z.string().nullable().optional(),
  patientNotes: z.string().nullable().optional(),
});

/**
 * "Analog mode" meal logging: no AI, no photo — just whole foods from the
 * CNF food_reference table scaled by grams and summed. Produces the same
 * analysis shape AnalysisView expects so manually-logged and photo-analyzed
 * meals render identically.
 */
export const logMealManual = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((input: unknown) => LogManualInput.parse(input))
  .handler(async ({ data, context }) => {
    const { isSupabaseConfigured, supabaseAdmin } =
      await import("@/integrations/supabase/admin.server");
    if (!isSupabaseConfigured) throw new Error("Food database isn't configured yet");

    const codes = data.items.map((i) => i.food_code);
    const { data: rows, error } = await supabaseAdmin
      .from("food_reference")
      .select("*")
      .in("food_code", codes);
    if (error || !rows) throw new Error("Couldn't load food data");
    const byCode = new Map((rows as FoodReferenceRow[]).map((r) => [r.food_code, r]));

    const macros: Record<(typeof MACRO_COLUMNS)[number], number> = {
      calories_kcal: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sugar_g: 0,
    };
    const microTotals = new Map<NutrientColumn, number>();
    const identifiedItems: string[] = [];

    for (const item of data.items) {
      const food = byCode.get(item.food_code);
      if (!food) continue;
      const factor = item.grams / 100;
      identifiedItems.push(`${food.food_name} (${item.grams}g)`);
      for (const column of MACRO_COLUMNS) {
        macros[column] += (food[column] ?? 0) * factor;
      }
      for (const column of Object.keys(NUTRIENT_DISPLAY) as NutrientColumn[]) {
        const amount = food[column];
        if (amount == null) continue;
        microTotals.set(column, (microTotals.get(column) ?? 0) + amount * factor);
      }
    }

    if (identifiedItems.length === 0) throw new Error("None of the selected foods were found");

    const roundedMacros = Object.fromEntries(
      MACRO_COLUMNS.map((column) => [column, Math.round(macros[column] * 10) / 10]),
    );

    const keyMicros = [...microTotals.entries()].map(([column, amount]) => {
      const meta = NUTRIENT_DISPLAY[column];
      return {
        name: meta.label,
        amount: `${Math.round(amount * 10) / 10}${meta.unit}`,
        daily_value_pct: Math.round((amount / meta.dailyValue) * 100),
      };
    });

    const analysis = {
      meal_name: data.mealLabel || identifiedItems.join(", "),
      identified_items: identifiedItems,
      estimated_portion: identifiedItems.join(", "),
      macros: roundedMacros,
      key_micros: keyMicros,
      rubric_notes: [],
      naturopathic_recommendations: [],
      concerns: [],
    };

    const { adminDb } = await import("@/integrations/firebase/admin.server");
    const mealRef = await adminDb.collection("meals").add({
      patientId: context.userId,
      mealLabel: data.mealLabel || null,
      patientNotes: data.patientNotes || null,
      doctorNotes: null,
      status: "analyzed",
      storagePath: null,
      analysis,
      eatenAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    return { id: mealRef.id };
  });
