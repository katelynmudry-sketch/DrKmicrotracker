import { createServerFn } from "@tanstack/react-start";
import { requireFirebaseAuth } from "@/integrations/firebase/auth-middleware";
import { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";
import { TRACKED_NUTRIENTS } from "@/lib/analysis.schema";
import {
  RECORD_CULTURAL_FOODS_TOOL,
  RECORD_CULTURAL_FOODS_TOOL_NAME,
  buildCulturalFoodSuggestionPrompt,
} from "@/lib/clinical-spine";
import type { NutrientFood } from "@/lib/nutrient-reference";

// AI-generated fallback for src/lib/nutrient-reference.ts's hand-curated list
// (docs/ETHOS.md's cultural-relevance principle): when a patient's cuisine or
// region isn't represented there yet, this generates 2-3 real, specific foods
// from what they name, in the same {name, reason} shape and voice as the
// static list — never a Western substitute standing in for their own food.
// Nothing here is persisted; it's suggestion-only, same as the static list.

function getApiKey() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("AI service is not configured");
  return apiKey;
}

const SuggestInput = z.object({
  nutrient: z.enum(TRACKED_NUTRIENTS),
  cuisineOrRegion: z.string().trim().min(1).max(80),
});

const ResultSchema = z.object({
  items: z
    .array(z.object({ name: z.string().min(1), reason: z.string().min(1) }))
    .min(1)
    .max(3),
});

export const suggestCulturalFoods = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((input: unknown) => SuggestInput.parse(input))
  .handler(async ({ data }): Promise<{ items: NutrientFood[] }> => {
    const apiKey = getApiKey();
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
      max_tokens: 512,
      system: buildCulturalFoodSuggestionPrompt(),
      messages: [
        {
          role: "user",
          content: `Cuisine or region: "${data.cuisineOrRegion}"\nNutrient that's come up light: ${data.nutrient}`,
        },
      ],
      tools: [RECORD_CULTURAL_FOODS_TOOL],
      tool_choice: { type: "tool", name: RECORD_CULTURAL_FOODS_TOOL_NAME },
    });

    const toolUse = response.content.find(
      (b): b is Anthropic.ToolUseBlock =>
        b.type === "tool_use" && b.name === RECORD_CULTURAL_FOODS_TOOL_NAME,
    );
    if (!toolUse) return { items: [] };

    const parsed = ResultSchema.catch({ items: [] }).parse(toolUse.input);
    const cuisine = data.cuisineOrRegion.trim();
    return { items: parsed.items.map((i) => ({ ...i, cuisine })) };
  });
