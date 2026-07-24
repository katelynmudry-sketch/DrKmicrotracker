import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "@/lib/clinical-spine";
import { DEFAULT_FOCUS_NUTRIENTS } from "@/lib/users.schema";
import { DEFAULT_MODEL, runAnalysisModel } from "@/lib/analysis-engine";

// Preview-mode reading: no account, no Firestore/Storage. Deliberately
// separate from meals.functions.ts's analyzeMeal — this is the demo path
// for showing a real Claude reading before Firestore/Storage clear a
// PHI/PIPEDA review, so it must never read or write a meal document. The
// meal photo/description still goes to Anthropic in transit (same as the
// real flow); what's different is that nothing is persisted anywhere after.
//
// Gated by PREVIEW_AI_ENABLED, a separate deliberate opt-in from merely
// having ANTHROPIC_API_KEY set — the owner turns this on only for a
// supervised demo, since there is no auth check on this endpoint (see
// docs/OWNER-TODO.md for the cost-exposure tradeoff this accepts).

const PreviewAnalyzeInput = z.discriminatedUnion("inputMethod", [
  z.object({
    inputMethod: z.literal("text"),
    mealLabel: z.string().max(200).optional(),
    patientNotes: z.string().max(500).optional(),
    mealDescription: z.string().min(3).max(2000),
  }),
  z.object({
    inputMethod: z.literal("photo"),
    mealLabel: z.string().max(200).optional(),
    patientNotes: z.string().max(500).optional(),
    base64: z.string().min(1),
    mime: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
  }),
]);

export const analyzeMealPreview = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PreviewAnalyzeInput.parse(input))
  .handler(async ({ data }) => {
    if (process.env.PREVIEW_AI_ENABLED !== "true") {
      throw new Error("Preview readings are turned off right now");
    }
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("AI service is not configured");
    const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

    // No rubric context and the default focus list — there's no doctor's
    // active rubric or patient doc to look up outside a real account.
    const systemPrompt = buildSystemPrompt("", DEFAULT_FOCUS_NUTRIENTS);

    let content: Anthropic.MessageParam["content"];
    if (data.inputMethod === "text") {
      const userText = `Patient label: ${data.mealLabel || "(none)"}\nPatient notes: ${data.patientNotes || "(none)"}\nMeal description (no photo available): ${data.mealDescription}\nAnalyze this described meal. Make reasonable estimates and note any ambiguity in \`uncertainty\`.`;
      content = [{ type: "text", text: userText }];
    } else {
      const userText = `Patient label: ${data.mealLabel || "(none)"}\nPatient notes: ${data.patientNotes || "(none)"}\nPlease analyze the attached meal photo.`;
      content = [
        { type: "text", text: userText },
        {
          type: "image",
          source: { type: "base64", media_type: data.mime, data: data.base64 },
        },
      ];
    }

    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const anthropic = new Anthropic({ apiKey });

    const analysis = await runAnalysisModel(anthropic, model, systemPrompt, content);
    return { ok: true, analysis };
  });
