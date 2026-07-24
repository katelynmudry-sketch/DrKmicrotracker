import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";

// Preview-mode counterparts to scanPantryPhoto/parsePantryVoiceText
// (pantry-scan.functions.ts) — no requireFirebaseAuth, since the no-account
// beta has no login to check. Gated by PREVIEW_AI_ENABLED, same as
// analyzeMealPreview (meals-preview.functions.ts) and the same accepted
// no-auth cost-exposure tradeoff documented in docs/OWNER-TODO.md. Nothing
// this returns is ever written to Firestore — the caller (pantry.tsx) saves
// confirmed items to preview-pantry-store.ts's localStorage instead.

const RECORD_ITEMS_TOOL_NAME = "record_pantry_items";

const RECORD_ITEMS_TOOL: Anthropic.Tool = {
  name: RECORD_ITEMS_TOOL_NAME,
  description: "Record the distinct food items identified.",
  input_schema: {
    type: "object",
    properties: {
      items: {
        type: "array",
        items: { type: "string" },
        description:
          "Distinct food item names, plain and singular-ish (e.g. 'Pumpkin seeds', 'Eggs') — no quantities or units in the name.",
      },
    },
    required: ["items"],
  },
  strict: true,
};

function extractItems(response: Anthropic.Message): string[] {
  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === RECORD_ITEMS_TOOL_NAME,
  );
  if (!toolUse) return [];
  const parsed = z
    .object({ items: z.array(z.string().min(1)) })
    .catch({ items: [] })
    .parse(toolUse.input);
  return parsed.items;
}

function getAnthropic() {
  if (process.env.PREVIEW_AI_ENABLED !== "true") {
    throw new Error("Preview pantry scanning is turned off right now");
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("AI service is not configured");
  return apiKey;
}

const ScanPhotoInput = z.object({
  base64: z.string().min(1),
  mediaType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
});

export const scanPantryPhotoPreview = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ScanPhotoInput.parse(input))
  .handler(async ({ data }) => {
    const apiKey = getAnthropic();
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
      max_tokens: 1024,
      system:
        "You identify food items from a photo of a pantry shelf, fridge, or grocery haul for a pantry-inventory app.",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Identify the distinct food items visible in this photo." },
            {
              type: "image",
              source: { type: "base64", media_type: data.mediaType, data: data.base64 },
            },
          ],
        },
      ],
      tools: [RECORD_ITEMS_TOOL],
      tool_choice: { type: "tool", name: RECORD_ITEMS_TOOL_NAME },
    });

    return { items: extractItems(response) };
  });

const ParseVoiceInput = z.object({ transcript: z.string().min(1) });

export const parsePantryVoiceTextPreview = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ParseVoiceInput.parse(input))
  .handler(async ({ data }) => {
    const apiKey = getAnthropic();
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
      max_tokens: 512,
      system:
        "You parse a spoken, transcribed description of pantry/grocery items into a clean list of distinct food item names for a pantry-inventory app.",
      messages: [
        {
          role: "user",
          content: `Transcript: "${data.transcript}"\n\nExtract the distinct food items mentioned.`,
        },
      ],
      tools: [RECORD_ITEMS_TOOL],
      tool_choice: { type: "tool", name: RECORD_ITEMS_TOOL_NAME },
    });

    return { items: extractItems(response) };
  });
