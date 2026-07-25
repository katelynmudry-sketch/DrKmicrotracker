import type Anthropic from "@anthropic-ai/sdk";
import { MealAnalysisDraftSchema, type MealAnalysis } from "@/lib/analysis.schema";
import { RECORD_READING_TOOL, RECORD_READING_TOOL_NAME } from "@/lib/clinical-spine";
import { pickOpeningNote } from "@/lib/meal-style-lines";

// Shared Anthropic call/retry/timeout logic for both the persisted reading
// flow (meals.functions.ts) and the non-persisting preview flow
// (meals-preview.functions.ts). No Firestore/Storage imports here — keep it
// that way so this module stays reusable by an unauthenticated caller.

// Measured against the real API: a full structured reading (all ~27 tracked
// nutrients plus narrative fields) takes ~44s. Sized with headroom over that
// against the Vercel function's 90s maxDuration (see vite.config.ts), which
// leaves room for photo download/upload and Firestore writes around it. Do
// not raise this without also raising maxDuration.
export const ANALYSIS_TIMEOUT_MS = 55_000;
export const DEFAULT_MODEL = "claude-sonnet-4-6";

export function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
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

// One call to the model that must return a single validated tool_use block.
// No automatic corrective retry: a real full reading takes ~44s, so a
// retry-on-bad-output would need to fit a second ~44s call in the same
// request — it can't. A failure here surfaces as a normal error toast; the
// patient/tester retries manually, same as any other failed reading.
export async function callAnalysisModel(
  anthropic: Anthropic,
  model: string,
  systemPrompt: string,
  content: Anthropic.MessageParam["content"],
): Promise<MealAnalysis> {
  const response = await anthropic.messages.create({
    model,
    // Raised from 2048 now that TRACKED_NUTRIENTS has ~27 entries (was 9) —
    // each micronutrients[] item is a full {nutrient, level, from,
    // amount_estimate} object, so this part of the output roughly tripled.
    // Measured against the real API at ~2,750 output tokens for a full
    // reading — 4096 leaves headroom without being wasteful.
    max_tokens: 4096,
    // Cached: this prompt is identical on every reading for a given
    // rubric/focus-nutrient combination, so caching it cuts cost and shaves
    // latency on repeat calls.
    system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content }],
    tools: [RECORD_READING_TOOL],
    tool_choice: { type: "tool", name: RECORD_READING_TOOL_NAME },
  });

  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock =>
      b.type === "tool_use" && b.name === RECORD_READING_TOOL_NAME,
  );
  if (!toolUse) throw new Error("The model didn't return a structured reading");
  const draft = MealAnalysisDraftSchema.parse(toolUse.input);
  return { ...draft, opening_note: pickOpeningNote(draft.meal_style) };
}

// Runs the call bounded by ANALYSIS_TIMEOUT_MS. Shared by the persisted and
// preview reading flows.
export async function runAnalysisModel(
  anthropic: Anthropic,
  model: string,
  systemPrompt: string,
  content: Anthropic.MessageParam["content"],
): Promise<MealAnalysis> {
  return withTimeout(
    callAnalysisModel(anthropic, model, systemPrompt, content),
    ANALYSIS_TIMEOUT_MS,
    "Analysis timed out",
  );
}
