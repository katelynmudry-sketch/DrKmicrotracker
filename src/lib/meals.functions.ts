import { createServerFn } from "@tanstack/react-start";
import { requireFirebaseAuth } from "@/integrations/firebase/auth-middleware";
import { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";
import type { Firestore } from "firebase-admin/firestore";
import { EditableMealAnalysisSchema } from "@/lib/analysis.schema";
import { buildSystemPrompt, PATIENT_ADDITION_PREFIX } from "@/lib/clinical-spine";
import { resolveEffectiveFocusNutrients } from "@/lib/users.schema";
import { DEFAULT_MODEL, runAnalysisModel } from "@/lib/analysis-engine";

async function assertCanAccessMeal(adminDb: Firestore, userId: string, patientId: string) {
  if (patientId === userId) return;
  const userSnap = await adminDb.collection("users").doc(userId).get();
  if (userSnap.data()?.role !== "doctor") throw new Error("Forbidden");
}

async function runAnalysis(mealId: string, userId: string, patientAddition?: string) {
  const { adminDb, adminStorage } = await import("@/integrations/firebase/admin.server");

  const mealRef = adminDb.collection("meals").doc(mealId);
  const mealSnap = await mealRef.get();
  if (!mealSnap.exists) throw new Error("Meal not found");
  const meal = mealSnap.data()!;

  await assertCanAccessMeal(adminDb, userId, meal.patientId);

  // The patient can't write patientNotes directly (firestore.rules only lets
  // a doctor update doctorNotes on an existing meal) — folding a confirmed
  // plate addition in here, server-side, is the only write path. Appended
  // (not overwritten) so multiple additions over time all survive, and
  // labeled so the prompt (see PATIENT_ADDITION_GUIDANCE in clinical-spine.ts)
  // can tell a real addition apart from ordinary commentary.
  let patientNotes: string | null = meal.patientNotes ?? null;
  if (patientAddition) {
    const line = `${PATIENT_ADDITION_PREFIX} ${patientAddition}`;
    patientNotes = patientNotes ? `${patientNotes}\n\n${line}` : line;
    await mealRef.update({ patientNotes });
  }

  await mealRef.update({ status: "analyzing", statusError: null });

  try {
    const inputMethod = meal.inputMethod ?? "photo";

    const rubricsSnap = await adminDb.collection("rubrics").where("isActive", "==", true).get();
    const rubricIds = rubricsSnap.docs.map((d) => d.id);
    const rubricContext = rubricsSnap.docs
      .map((d) => {
        const r = d.data();
        return `### ${r.title}\n${r.description ?? ""}\n${r.extractedText ?? ""}`.trim();
      })
      .join("\n\n---\n\n");

    const patientSnap = await adminDb.collection("users").doc(meal.patientId).get();
    const focusNutrients = resolveEffectiveFocusNutrients(patientSnap.data() ?? {});

    const systemPrompt = buildSystemPrompt(rubricContext, focusNutrients);

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("AI service is not configured");
    const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const anthropic = new Anthropic({ apiKey });

    let content: Anthropic.MessageParam["content"];
    if (inputMethod === "text") {
      const userText = `Patient label: ${meal.mealLabel ?? "(none)"}\nPatient notes: ${patientNotes ?? "(none)"}\nMeal description (no photo available): ${meal.mealDescription}\nAnalyze this described meal. Make reasonable estimates and note any ambiguity in \`uncertainty\`.`;
      content = [{ type: "text", text: userText }];
    } else {
      const file = adminStorage.bucket().file(meal.storagePath);
      const [buf] = await file.download();
      const [meta] = await file.getMetadata();
      const mime = meta.contentType || "image/jpeg";
      const base64 = buf.toString("base64");
      const userText = `Patient label: ${meal.mealLabel ?? "(none)"}\nPatient notes: ${patientNotes ?? "(none)"}\nPlease analyze the attached meal photo.`;
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

    const analysis = await runAnalysisModel(anthropic, model, systemPrompt, content);

    await mealRef.update({
      analysis,
      status: "analyzed",
      statusError: null,
      rubricIds,
      analyzedAt: new Date().toISOString(),
    });
    return { ok: true, analysis };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    await mealRef.update({ status: "failed", statusError: message });
    throw new Error(message);
  }
}

const AnalyzeInput = z.object({
  mealId: z.string().min(1),
  // Set only by AnalysisView's "I added: ___" confirm control (patient-only)
  // — folded into patientNotes server-side before re-scoring. See
  // PATIENT_ADDITION_PREFIX/PATIENT_ADDITION_GUIDANCE in clinical-spine.ts.
  patientAddition: z.string().min(1).max(300).optional(),
});

// Runs the reading. Used for the initial automatic analysis right after a
// meal is logged, the patient/doctor "Retry" action on a failed or stuck
// meal, the doctor's "Re-analyze with current rubric" action, and the
// patient's "Update my reading" confirm-addition action — all four are the
// same operation (score this meal against the currently active rubrics),
// just triggered from different places.
export const analyzeMeal = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((input: unknown) => AnalyzeInput.parse(input))
  .handler(async ({ data, context }) =>
    runAnalysis(data.mealId, context.userId, data.patientAddition),
  );

const UpdateAnalysisInput = z.object({
  mealId: z.string().min(1),
  analysis: EditableMealAnalysisSchema,
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

    await assertCanAccessMeal(adminDb, userId, meal.patientId);

    const existingAnalysis = (meal.analysis ?? {}) as Record<string, unknown>;
    const mergedAnalysis = {
      ...existingAnalysis,
      ...data.analysis,
      ...(data.analysis.building_blocks
        ? {
            building_blocks: {
              ...(existingAnalysis.building_blocks as object),
              ...data.analysis.building_blocks,
            },
          }
        : {}),
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

    if (!data.path.startsWith("meal-photos/")) throw new Error("Forbidden");

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
