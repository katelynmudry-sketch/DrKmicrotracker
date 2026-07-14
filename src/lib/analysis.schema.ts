import { z } from "zod";
import type { MealTiming } from "@/lib/meal-timing";

// The reading shape produced by the AI and rendered by the UI. See
// docs/ETHOS.md and docs/VOICE.md — this schema is the enforcement mechanism
// for the hard rules in CLAUDE.md, not just a data contract:
//   - there is no calories field anywhere below, by construction.
//   - protocol_fit is a qualitative tier, never a number — no exception.
//   - TRACKED_NUTRIENTS is the full set of nutrients Dr. K tracks (as of this
//     writing, a nutrition-label-style set including selenium — the prior
//     standing exclusion on selenium was deliberately reversed on her
//     direction; see docs/ETHOS.md principle 3).
//   - micronutrients[].amount_estimate and estimation_basis are a deliberate,
//     narrow exception to "qualitative tiers only" — a Detailed mode
//     approximate range, never a score/grade. See docs/ETHOS.md principle 2
//     and CLAUDE.md's hard rules. The Nutrient Profile page's daily
//     percentage (src/lib/nutrient-profile.ts) is a second, similarly scoped
//     exception.
//   - The tool schema's micronutrients.items.properties.nutrient.enum below
//     references TRACKED_NUTRIENTS directly, so growing this list alone is
//     enough to keep the AI tool schema in sync — no manual mirroring needed
//     for nutrient additions specifically (other enums in the tool schema
//     below, e.g. carb_quality/protocol_fit.tier, are still hand-kept).

export const TRACKED_NUTRIENTS = [
  // original 9
  "iron",
  "b12",
  "vitamin_d",
  "calcium",
  "omega_3",
  "iodine",
  "zinc",
  "choline",
  "magnesium",
  // restored — see docs/ETHOS.md principle 3
  "selenium",
  // vitamins
  "vitamin_a",
  "vitamin_c",
  "vitamin_e",
  "vitamin_k",
  "thiamin",
  "riboflavin",
  "niacin",
  "vitamin_b6",
  "folate",
  "biotin",
  "pantothenic_acid",
  // minerals
  "phosphorus",
  "potassium",
  "copper",
  "manganese",
  "chromium",
  "molybdenum",
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
  selenium: "Selenium",
  vitamin_a: "Vitamin A",
  vitamin_c: "Vitamin C",
  vitamin_e: "Vitamin E",
  vitamin_k: "Vitamin K",
  thiamin: "Thiamin (B1)",
  riboflavin: "Riboflavin (B2)",
  niacin: "Niacin (B3)",
  vitamin_b6: "Vitamin B6",
  folate: "Folate (B9)",
  biotin: "Biotin",
  pantothenic_acid: "Pantothenic acid (B5)",
  phosphorus: "Phosphorus",
  potassium: "Potassium",
  copper: "Copper",
  manganese: "Manganese",
  chromium: "Chromium",
  molybdenum: "Molybdenum",
};

// Display unit per nutrient — fixed in code (not model-chosen) so the same
// nutrient always renders in the same unit across readings. Only consulted
// in Detailed mode; see docs/ETHOS.md principle 2.
export const NUTRIENT_UNITS: Record<TrackedNutrient, "mg" | "mcg" | "g"> = {
  iron: "mg",
  b12: "mcg",
  vitamin_d: "mcg",
  calcium: "mg",
  omega_3: "g",
  iodine: "mcg",
  zinc: "mg",
  choline: "mg",
  magnesium: "mg",
  selenium: "mcg",
  vitamin_a: "mcg",
  vitamin_c: "mg",
  vitamin_e: "mg",
  vitamin_k: "mcg",
  thiamin: "mg",
  riboflavin: "mg",
  niacin: "mg",
  vitamin_b6: "mg",
  folate: "mcg",
  biotin: "mcg",
  pantothenic_acid: "mg",
  phosphorus: "mg",
  potassium: "mg",
  copper: "mg",
  manganese: "mg",
  chromium: "mcg",
  molybdenum: "mcg",
};

// General adult Daily Values (FDA/NIH 2020 label figures), same units as
// NUTRIENT_UNITS above. Population-average reference points, not personalized
// — the app collects no age/sex/weight/pregnancy data. Only consulted by the
// Nutrient Profile page (src/lib/nutrient-profile.ts), Detailed mode only;
// see docs/ETHOS.md principle 2's second carve-out.
export const NUTRIENT_DAILY_VALUES: Record<TrackedNutrient, number> = {
  iron: 18,
  b12: 2.4,
  vitamin_d: 20,
  calcium: 1300,
  // omega_3 (ALA) has no official FDA %DV. This is a sex-agnostic
  // approximation — the midpoint of the general adult Adequate Intake range
  // (~1.1g/day women, ~1.6g/day men) — since the app doesn't collect sex.
  omega_3: 1.4,
  iodine: 150,
  zinc: 11,
  choline: 550,
  magnesium: 420,
  selenium: 55,
  vitamin_a: 900,
  vitamin_c: 90,
  vitamin_e: 15,
  vitamin_k: 120,
  thiamin: 1.2,
  riboflavin: 1.3,
  niacin: 16,
  vitamin_b6: 1.7,
  folate: 400,
  biotin: 30,
  pantothenic_acid: 5,
  phosphorus: 1250,
  potassium: 4700,
  copper: 0.9,
  manganese: 2.3,
  chromium: 35,
  molybdenum: 45,
};

export const NUTRIENT_LEVELS = ["strong", "present", "light", "not_seen"] as const;
export type NutrientLevel = (typeof NUTRIENT_LEVELS)[number];

export const LEVEL_LABELS: Record<NutrientLevel, string> = {
  strong: "Strong source",
  present: "Present",
  light: "A little light",
  not_seen: "Not seen",
};

// Detailed-mode only: how the reading's amount_estimate ranges were grounded.
// One value per reading (a photo's reference object calibrates the whole
// reading, not one nutrient at a time) — see docs/ETHOS.md principle 2.
export const ESTIMATION_BASES = ["reference_object", "unaided_estimate"] as const;
export type EstimationBasis = (typeof ESTIMATION_BASES)[number];

export const ESTIMATION_BASIS_LABELS: Record<EstimationBasis, string> = {
  reference_object: "Grounded by your photo's reference object",
  unaided_estimate: "A rough visual estimate",
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

// Detailed-mode only: a wide, honest approximate range in NUTRIENT_UNITS[nutrient].
// Must be null when level is "not_seen" — enforced by prompt instruction (see
// clinical-spine.ts), not a zod refinement.
export const AmountEstimateSchema = z.object({
  low: z.number().min(0),
  high: z.number().min(0),
});
export type AmountEstimate = z.infer<typeof AmountEstimateSchema>;

export const MicronutrientSchema = z.object({
  nutrient: z.enum(TRACKED_NUTRIENTS),
  level: z.enum(NUTRIENT_LEVELS),
  from: z.string().min(1),
  amount_estimate: AmountEstimateSchema.nullable(),
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
  estimation_basis: z.enum(ESTIMATION_BASES).nullable(),
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
          amount_estimate: {
            type: ["object", "null"],
            description:
              "A wide, honest approximate range in this nutrient's fixed unit (see NUTRIENT_UNITS). Null when level is 'not_seen'.",
            properties: {
              low: { type: "number" },
              high: { type: "number" },
            },
            required: ["low", "high"],
          },
        },
        required: ["nutrient", "level", "from", "amount_estimate"],
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
    estimation_basis: {
      type: ["string", "null"],
      enum: [...ESTIMATION_BASES, null],
      description:
        "'reference_object' if a familiar sized object (spoon, coin, card, hand) near the plate was used to calibrate amount_estimate ranges; 'unaided_estimate' otherwise (including text-only readings).",
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
    "estimation_basis",
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
  // Optional so meals logged before this field existed still typecheck —
  // display code falls back to inferMealTiming(eatenAt) when absent.
  mealTiming?: MealTiming;
  // Only present once the corresponding lifecycle event has happened.
  statusError?: string | null;
  rubricIds?: string[];
  analyzedAt?: string | null;
  analysisEditedAt?: string | null;
  analysisEditedBy?: string | null;
  // Set only by demo.functions.ts's seedDemoData — marks a doc as removable
  // by clearDemoData in one shot (see docs/DEMO.md). Never set by real usage.
  demo?: boolean;
}

export type Meal = MealDoc & { id: string };
