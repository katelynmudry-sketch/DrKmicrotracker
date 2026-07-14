import { createServerFn } from "@tanstack/react-start";
import { requireFirebaseAuth } from "@/integrations/firebase/auth-middleware";
import { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";
import type { Firestore } from "firebase-admin/firestore";
import {
  MealAnalysisSchema,
  EditableMealAnalysisSchema,
  type MealAnalysis,
} from "@/lib/analysis.schema";
import {
  RECORD_READING_TOOL,
  RECORD_READING_TOOL_NAME,
  buildSystemPrompt,
} from "@/lib/clinical-spine";

// Sized against the Vercel function's 60s maxDuration (see vite.config.ts):
// a failed first attempt plus the one corrective retry is at most 2x this,
// leaving headroom for the photo download/upload and Firestore writes around
// it. Do not raise this without also raising maxDuration.
const ANALYSIS_TIMEOUT_MS = 25_000;
const DEFAULT_MODEL = "claude-sonnet-4-6";

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

async function assertCanAccessMeal(adminDb: Firestore, userId: string, patientId: string) {
  if (patientId === userId) return;
  const userSnap = await adminDb.collection("users").doc(userId).get();
  if (userSnap.data()?.role !== "doctor") throw new Error("Forbidden");
}

// A schema-mismatch failure that carries the model's raw output so the retry
// can feed it back for correction (network/timeout failures don't have one).
class InvalidReadingError extends Error {
  constructor(
    message: string,
    public readonly badInput: unknown,
  ) {
    super(message);
    this.name = "InvalidReadingError";
  }
}

// One call to the model that must return a single validated tool_use block.
// Thrown errors (network, timeout, schema mismatch) are caught by the caller,
// which retries once with the bad output fed back for correction.
async function callAnalysisModel(
  anthropic: Anthropic,
  model: string,
  systemPrompt: string,
  content: Anthropic.MessageParam["content"],
  correction?: { badInput: unknown; issue: string },
): Promise<MealAnalysis> {
  const messages: Anthropic.MessageParam[] = [{ role: "user", content }];
  if (correction) {
    messages.push(
      { role: "assistant", content: JSON.stringify(correction.badInput) },
      {
        role: "user",
        content: `That reading didn't match the required shape: ${correction.issue}. Call ${RECORD_READING_TOOL_NAME} again with a corrected reading.`,
      },
    );
  }

  const response = await anthropic.messages.create({
    model,
    max_tokens: 2048,
    system: systemPrompt,
    messages,
    tools: [RECORD_READING_TOOL],
    tool_choice: { type: "tool", name: RECORD_READING_TOOL_NAME },
  });

  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock =>
      b.type === "tool_use" && b.name === RECORD_READING_TOOL_NAME,
  );
  if (!toolUse) throw new Error("The model didn't return a structured reading");
  const parsed = MealAnalysisSchema.safeParse(toolUse.input);
  if (!parsed.success) throw new InvalidReadingError(parsed.error.message, toolUse.input);
  return parsed.data;
}

async function runAnalysis(mealId: string, userId: string) {
  const { adminDb, adminStorage } = await import("@/integrations/firebase/admin.server");

  const mealRef = adminDb.collection("meals").doc(mealId);
  const mealSnap = await mealRef.get();
  if (!mealSnap.exists) throw new Error("Meal not found");
  const meal = mealSnap.data()!;

  await assertCanAccessMeal(adminDb, userId, meal.patientId);

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
    const systemPrompt = buildSystemPrompt(rubricContext);

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("AI service is not configured");
    const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const anthropic = new Anthropic({ apiKey });

    let content: Anthropic.MessageParam["content"];
    if (inputMethod === "text") {
      const userText = `Patient label: ${meal.mealLabel ?? "(none)"}\nPatient notes: ${meal.patientNotes ?? "(none)"}\nMeal description (no photo available): ${meal.mealDescription}\nAnalyze this described meal. Make reasonable estimates and note any ambiguity in \`uncertainty\`.`;
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

    let analysis: MealAnalysis;
    try {
      analysis = await withTimeout(
        callAnalysisModel(anthropic, model, systemPrompt, content),
        ANALYSIS_TIMEOUT_MS,
        "Analysis timed out",
      );
    } catch (firstErr) {
      // One corrective retry: most failures here are a schema mismatch on the
      // model's first attempt, not a systemic outage — worth one more try
      // before giving up and marking the meal failed.
      // Only frame the retry as a correction when we actually have the bad
      // output — a timeout/network failure just gets a clean second attempt.
      const correction =
        firstErr instanceof InvalidReadingError
          ? { badInput: firstErr.badInput, issue: firstErr.message }
          : undefined;
      analysis = await withTimeout(
        callAnalysisModel(anthropic, model, systemPrompt, content, correction),
        ANALYSIS_TIMEOUT_MS,
        "Analysis timed out",
      );
    }

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

const AnalyzeInput = z.object({ mealId: z.string().min(1) });

// Runs the reading. Used for the initial automatic analysis right after a
// meal is logged, the patient/doctor "Retry" action on a failed or stuck
// meal, and the doctor's "Re-analyze with current rubric" action — all three
// are the same operation (score this meal against the currently active
// rubrics), just triggered from different places.
export const analyzeMeal = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((input: unknown) => AnalyzeInput.parse(input))
  .handler(async ({ data, context }) => runAnalysis(data.mealId, context.userId));

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
