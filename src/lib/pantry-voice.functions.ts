import { createServerFn } from "@tanstack/react-start";
import { requireFirebaseAuth } from "@/integrations/firebase/auth-middleware";
import { z } from "zod";

const ParsedItem = z.object({
  food_name: z.string().min(1),
  quantity: z.number().nullable().optional(),
  unit: z.string().nullable().optional(),
});

/**
 * Turns a raw voice transcript ("I've got two cans of chickpeas, some
 * spinach, a bag of rice...") into structured pantry items via Claude, and
 * logs the transcript + parsed result as a pantry_scans doc so it can be
 * confirmed through the same confirmPantryScan flow as photo scans.
 */
export const parseVoiceTranscript = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((input: unknown) => z.object({ transcript: z.string().min(1) }).parse(input))
  .handler(async ({ data, context }) => {
    const { adminDb } = await import("@/integrations/firebase/admin.server");

    const systemPrompt = `You are a pantry-inventory assistant. The user spoke aloud a description of the food they have on hand. Return STRICT JSON only matching this TypeScript type:

{ "items": Array<{ "food_name": string, "quantity": number | null, "unit": string | null }> }

Extract each distinct food item mentioned, with quantity and unit if stated (e.g. "2", "cans"; "1", "bag"). If no quantity was said, use null for both. Return ONLY the JSON object, no markdown fences, no preface.`;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("AI service is not configured");
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: data.transcript }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const content = textBlock && textBlock.type === "text" ? textBlock.text : "{}";
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      const m = content.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : { items: [] };
    }
    const items = z
      .object({ items: z.array(ParsedItem) })
      .catch({ items: [] })
      .parse(parsed).items;

    const scanRef = await adminDb.collection("pantry_scans").add({
      patientId: context.userId,
      source: "voice",
      storagePath: null,
      transcript: data.transcript,
      parsedItems: items,
      status: "analyzed",
      createdAt: new Date().toISOString(),
    });

    return { scanId: scanRef.id, items };
  });
