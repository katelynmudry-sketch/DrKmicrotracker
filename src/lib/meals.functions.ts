import { createServerFn } from "@tanstack/react-start";
import { requireFirebaseAuth } from "@/integrations/firebase/auth-middleware";
import { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";

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

    const inputMethod = meal.inputMethod ?? "photo";

    const rubricsSnap = await adminDb.collection("rubrics").where("isActive", "==", true).get();
    const rubricContext = rubricsSnap.docs
      .map((d) => {
        const r = d.data();
        return `### ${r.title}\n${r.description ?? ""}\n${r.extractedText ?? ""}`.trim();
      })
      .join("\n\n---\n\n");

    const systemPrompt = `You are a clinical nutrition assistant supporting a naturopathic doctor.
Analyze the meal (from a photo or the patient's text description) and return STRICT JSON only matching this TypeScript type:

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

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("AI service is not configured");

    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const anthropic = new Anthropic({ apiKey });

    let content: Anthropic.MessageParam["content"];
    if (inputMethod === "text") {
      const userText = `Patient label: ${meal.mealLabel ?? "(none)"}\nPatient notes: ${meal.patientNotes ?? "(none)"}\nMeal description (no photo available): ${meal.mealDescription}\nAnalyze this described meal. Make reasonable estimates and flag any ambiguity in concerns.`;
      content = [{ type: "text", text: userText }];
    } else {
      const file = adminStorage.bucket().file(meal.storagePath);
      const [buf] = await file.download();
      const [meta] = await file.getMetadata();
      const mime = meta.contentType || "image/jpeg";
      const base64 = buf.toString("base64");
      const userText = `Patient label: ${meal.mealLabel ?? "(none)"}\nPatient notes: ${meal.patientNotes ?? "(none)"}\nPlease analyze the attached meal photo.`;
      content = [
        { type: "text", text: userText },
        {
          type: "image",
          source: {
            type: "base64",
            media_type: mime as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
            data: base64,
          },
        },
      ];
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const responseText = textBlock && textBlock.type === "text" ? textBlock.text : "{}";
    let analysis: unknown;
    try {
      analysis = JSON.parse(responseText);
    } catch {
      const m = responseText.match(/\{[\s\S]*\}/);
      analysis = m ? JSON.parse(m[0]) : { raw: responseText };
    }

    await mealRef.update({ analysis, status: "analyzed" });

    return { ok: true, analysis };
  });

const KeyMicroSchema = z.object({
  name: z.string().min(1),
  amount: z.string().min(1),
  daily_value_pct: z.number().nullable(),
});

const EditableAnalysisSchema = z.object({
  meal_name: z.string().min(1).optional(),
  estimated_portion: z.string().optional(),
  macros: z
    .object({
      calories_kcal: z.number().min(0),
      protein_g: z.number().min(0),
      carbs_g: z.number().min(0),
      fat_g: z.number().min(0),
      fiber_g: z.number().min(0),
      sugar_g: z.number().min(0),
    })
    .partial()
    .optional(),
  key_micros: z.array(KeyMicroSchema).optional(),
});

const UpdateAnalysisInput = z.object({
  mealId: z.string().min(1),
  analysis: EditableAnalysisSchema,
});

export const updateMealAnalysis = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((input: unknown) => UpdateAnalysisInput.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { adminDb } = await import("@/integrations/firebase/admin.server");

    const mealRef = adminDb.collection("meals").doc(data.mealId);
    const mealSnap = await mealRef.get();
    if (!mealSnap.exists) throw new Error("Meal not found");
    const meal = mealSnap.data()!;

    if (meal.patientId !== userId) {
      const userSnap = await adminDb.collection("users").doc(userId).get();
      if (userSnap.data()?.role !== "doctor") throw new Error("Forbidden");
    }

    const existingAnalysis = (meal.analysis ?? {}) as Record<string, unknown>;
    const mergedAnalysis = {
      ...existingAnalysis,
      ...data.analysis,
      macros: { ...(existingAnalysis.macros as object), ...(data.analysis.macros ?? {}) },
      ...(data.analysis.key_micros ? { key_micros: data.analysis.key_micros } : {}),
    };

    await mealRef.update({
      analysis: mergedAnalysis,
      analysisEditedAt: new Date().toISOString(),
      analysisEditedBy: userId,
    });

    return { ok: true, analysis: mergedAnalysis };
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
