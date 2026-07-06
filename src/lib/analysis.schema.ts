import { z } from "zod";

// The reading shape produced by the AI and rendered by the UI. See
// docs/ETHOS.md and docs/VOICE.md — this schema is the enforcement mechanism
// for the hard rules in CLAUDE.md, not just a data contract:
//   - there is no calories field anywhere below, by construction.
//   - protocol_fit is a qualitative tier, never a number.
//   - TRACKED_NUTRIENTS is a closed enum that does not include selenium, so a
//     reading literally cannot flag it — the model can't emit an enum value
//     that doesn't exist in the schema.

export const TRACKED_NUTRIENTS = [
  "iron",
  "b12",
  "vitamin_d",
  "calcium",
  "omega_3",
  "iodine",
  "zinc",
  "choline",
  "magnesium",
] as const;
export type TrackedNutrient = (typeof TRACKED_NUTRIENTS)[number];

export const NUTRIENT_LABELS: Record<TrackedNutrient, string> = {
  iron: "Iron",
  b12: "B12",
  vitamin_d: "Vitamin D",
  calcium: "Calcium",
  omega_3: "Omega-3",
  iodine: "Iodine",
  zinc: "Zinc",
  choline: "Choline",
  magnesium: "Magnesium",
};

export const NUTRIENT_LEVELS = ["strong", "present", "light", "not_seen"] as const;
export type NutrientLevel = (typeof NUTRIENT_LEVELS)[number];

export const LEVEL_LABELS: Record<NutrientLevel, string> = {
  strong: "Strong source",
  present: "Present",
  light: "A little light",
  not_seen: "Not seen",
};

export const CARB_QUALITIES = ["mostly_complex", "mixed", "mostly_refined"] as const;
export type CarbQuality = (typeof CARB_QUALITIES)[number];

export const CARB_QUALITY_LABELS: Record<CarbQuality, string> = {
  mostly_complex: "Mostly complex",
  mixed: "Mixed",
  mostly_refined: "Mostly refined",
};

export const PROTOCOL_FIT_TIERS = ["aligned", "getting_there", "worth_a_look"] as const;
export type ProtocolFitTier = (typeof PROTOCOL_FIT_TIERS)[number];

export const TIER_LABELS: Record<ProtocolFitTier, string> = {
  aligned: "Aligned",
  getting_there: "Getting there",
  worth_a_look: "Worth a look",
};

export const MEAL_STATUSES = ["pending", "analyzing", "analyzed", "failed"] as const;
export type MealStatus = (typeof MEAL_STATUSES)[number];

export const MicronutrientSchema = z.object({
  nutrient: z.enum(TRACKED_NUTRIENTS),
  level: z.enum(NUTRIENT_LEVELS),
  from: z.string().min(1),
});
export type Micronutrient = z.infer<typeof MicronutrientSchema>;

export const BuildingBlocksSchema = z.object({
  protein_g: z.number().min(0),
  fiber_g: z.number().min(0),
  healthy_fat_sources: z.array(z.string().min(1)),
  carb_quality: z.enum(CARB_QUALITIES),
});
export type BuildingBlocks = z.infer<typeof BuildingBlocksSchema>;

export const ProtocolFitSchema = z.object({
  tier: z.enum(PROTOCOL_FIT_TIERS),
  note: z.string().min(1),
});
export type ProtocolFit = z.infer<typeof ProtocolFitSchema>;

export const MealAnalysisSchema = z.object({
  meal_name: z.string().min(1),
  identified_items: z.array(z.string().min(1)).min(1),
  estimated_portion: z.string().min(1),
  opening_note: z.string().min(1),
  building_blocks: BuildingBlocksSchema,
  micronutrients: z.array(MicronutrientSchema),
  offered: z.array(z.string().min(1)),
  worth_trying: z.array(z.string().min(1)),
  absorption_notes: z.array(z.string().min(1)),
  protocol_fit: ProtocolFitSchema,
  uncertainty: z.string().nullable(),
});
export type MealAnalysis = z.infer<typeof MealAnalysisSchema>;

// The patient/doctor may correct factual, quantifiable fields after the fact
// (portion size, identified items, macro estimates, a nutrient level) without
// triggering a re-score — that's what the separate "Re-analyze" action is
// for. The AI's synthesized voice (opening_note, offered, worth_trying,
// absorption_notes, protocol_fit, uncertainty) isn't hand-editable; if it's
// wrong, re-analyze against the current rubric instead.
export const EditableMealAnalysisSchema = z.object({
  meal_name: z.string().min(1).optional(),
  identified_items: z.array(z.string().min(1)).optional(),
  estimated_portion: z.string().min(1).optional(),
  building_blocks: BuildingBlocksSchema.partial().optional(),
  micronutrients: z.array(MicronutrientSchema).optional(),
});
export type EditableMealAnalysis = z.infer<typeof EditableMealAnalysisSchema>;

// Hand-kept in sync with MealAnalysisSchema above — the Anthropic tool-use
// API takes a plain JSON Schema object, not a zod schema. `strict: true` on
// the tool definition (see clinical-spine.ts) has Claude enforce this schema
// server-side, including the enum closures.
export const MEAL_ANALYSIS_TOOL_SCHEMA = {
  type: "object",
  properties: {
    meal_name: { type: "string" },
    identified_items: { type: "array", items: { type: "string" } },
    estimated_portion: { type: "string" },
    opening_note: {
      type: "string",
      description: "One warm sentence in Dr. K's voice — the 'love note from your body' line.",
    },
    building_blocks: {
      type: "object",
      properties: {
        protein_g: { type: "number" },
        fiber_g: { type: "number" },
        healthy_fat_sources: { type: "array", items: { type: "string" } },
        carb_quality: { type: "string", enum: CARB_QUALITIES },
      },
      required: ["protein_g", "fiber_g", "healthy_fat_sources", "carb_quality"],
    },
    micronutrients: {
      type: "array",
      items: {
        type: "object",
        properties: {
          nutrient: { type: "string", enum: TRACKED_NUTRIENTS },
          level: { type: "string", enum: NUTRIENT_LEVELS },
          from: { type: "string", description: "Which identified food this reading comes from." },
        },
        required: ["nutrient", "level", "from"],
      },
    },
    offered: {
      type: "array",
      items: { type: "string" },
      description: "Nourishment highlights — what this meal offered.",
    },
    worth_trying: {
      type: "array",
      items: { type: "string" },
      description: "Food-first additions, framed as an opportunity, never a correction.",
    },
    absorption_notes: {
      type: "array",
      items: { type: "string" },
      description:
        "Specific pairing/timing tips tied to this meal (vitamin C+iron, coffee/tea timing, etc).",
    },
    protocol_fit: {
      type: "object",
      properties: {
        tier: { type: "string", enum: PROTOCOL_FIT_TIERS },
        note: { type: "string" },
      },
      required: ["tier", "note"],
    },
    uncertainty: {
      type: ["string", "null"],
      description:
        "Plain statement of what couldn't be determined, or null if nothing was ambiguous.",
    },
  },
  required: [
    "meal_name",
    "identified_items",
    "estimated_portion",
    "opening_note",
    "building_blocks",
    "micronutrients",
    "offered",
    "worth_trying",
    "absorption_notes",
    "protocol_fit",
    "uncertainty",
  ],
} as const;

// Firestore `meals/{mealId}` document shape. status/analysis/rubricIds are
// server-owned (see meals.functions.ts) — the client only ever writes the
// fields set at creation time.
export const MEAL_INPUT_METHODS = ["photo", "text"] as const;
export type MealInputMethod = (typeof MEAL_INPUT_METHODS)[number];

export interface MealDoc {
  patientId: string;
  storagePath: string | null;
  inputMethod: MealInputMethod;
  mealDescription: string | null;
  mealLabel: string | null;
  patientNotes: string | null;
  doctorNotes: string | null;
  status: MealStatus;
  analysis: MealAnalysis | null;
  eatenAt: string;
  createdAt: unknown;
  // Only present once the corresponding lifecycle event has happened.
  statusError?: string | null;
  rubricIds?: string[];
  analyzedAt?: string | null;
  analysisEditedAt?: string | null;
  analysisEditedBy?: string | null;
}

export type Meal = MealDoc & { id: string };
