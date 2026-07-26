import type { TrackedNutrient } from "@/lib/analysis.schema";

// Named condition presets over the app's existing focus-nutrient system
// (src/lib/users.schema.ts's doctorFocusNutrients/patientFocusNutrients,
// already wired into the AI prompt via clinical-spine.ts's
// buildFocusGuidance). A profile is purely a one-click shortcut that
// populates the same focus-nutrient checkboxes the doctor already has
// (FocusNutrientPicker) — it is not a separate field, doesn't touch the
// schema, and the doctor can freely hand-adjust the checkboxes after
// applying one.
//
// PRODUCT OWNER (Dr. K): these nutrient sets are research-informed (PubMed/
// web search compiled while building this), not a substitute for your
// clinical judgment — review before real patient use.
export const CARE_PROFILES = [
  "iron_deficiency",
  "prenatal",
  "menopausal",
  "ovarian_hormone_support",
  "testosterone_support",
  "nervous_system_support",
] as const;
export type CareProfile = (typeof CARE_PROFILES)[number];

export const CARE_PROFILE_LABELS: Record<CareProfile, string> = {
  iron_deficiency: "Iron deficiency",
  prenatal: "Prenatal",
  menopausal: "Menopausal",
  ovarian_hormone_support: "Ovarian hormone support",
  testosterone_support: "Testosterone support",
  nervous_system_support: "Nervous system support",
};

export const CARE_PROFILE_NUTRIENTS: Record<CareProfile, TrackedNutrient[]> = {
  iron_deficiency: ["iron", "vitamin_c"],
  prenatal: ["iron", "folate", "vitamin_d", "calcium", "iodine", "choline", "omega_3", "b12"],
  menopausal: ["calcium", "vitamin_d", "magnesium"],
  ovarian_hormone_support: [
    "iron",
    "vitamin_b6",
    "folate",
    "zinc",
    "vitamin_d",
    "magnesium",
    "b12",
  ],
  testosterone_support: ["zinc", "vitamin_d", "magnesium"],
  nervous_system_support: ["magnesium", "vitamin_b6", "b12", "folate"],
};
