// Firestore `users/{uid}` document shape. Entirely server-owned (see
// firestore.rules: `allow create, update, delete: if false`) — writes go
// through Admin-SDK server functions only (ensureRole in rubrics.functions.ts,
// setDetailLevel/setPatientFocusNutrients/setDoctorFocusNutrients/
// setPreferredCuisine in users.functions.ts), never a direct client write.
import type { TrackedNutrient } from "@/lib/analysis.schema";

export const DETAIL_LEVELS = ["simple", "detailed"] as const;
export type DetailLevel = (typeof DETAIL_LEVELS)[number];

// Detailed is the primary experience; Simple is the explicit opt-out for
// patients who find numbers overwhelming. See docs/ETHOS.md principle 2.
export const DEFAULT_DETAIL_LEVEL: DetailLevel = "detailed";

// Sensible fallback before any doctor default exists for a patient — the
// original 9 nutrients, pre-expansion. See docs/ETHOS.md principle 3.
export const DEFAULT_FOCUS_NUTRIENTS: TrackedNutrient[] = [
  "iron",
  "b12",
  "vitamin_d",
  "calcium",
  "omega_3",
  "iodine",
  "zinc",
  "choline",
  "magnesium",
];

export interface UserDoc {
  email: string | null;
  fullName: string | null;
  role: "doctor" | "patient";
  createdAt: unknown;
  // Absent on pre-migration docs — treat as DEFAULT_DETAIL_LEVEL.
  detailLevel?: DetailLevel;
  // Doctor-set default focus list for this patient (present on patient docs
  // only) — written by setDoctorFocusNutrients.
  doctorFocusNutrients?: TrackedNutrient[];
  // Patient's own override. null/unset = not customized, falls back to
  // doctorFocusNutrients. An explicit [] is a deliberate "no focus" choice,
  // distinct from unset — see resolveEffectiveFocusNutrients below.
  patientFocusNutrients?: TrackedNutrient[] | null;
  // The patient's own cuisine/heritage pick (docs/ETHOS.md principle 8, one
  // of src/lib/cuisines.ts's CUISINE_OPTIONS) — prioritizes, never filters,
  // src/lib/nutrient-reference.ts's suggestions. null/unset = no preference.
  preferredCuisine?: string | null;
}

// Patient override (if explicitly set, including []) → doctor default (if
// non-empty) → the pre-expansion 9 as a last resort. See docs/ETHOS.md
// principle 3 / principle 7.
export function resolveEffectiveFocusNutrients(
  doc: Pick<UserDoc, "doctorFocusNutrients" | "patientFocusNutrients">,
): TrackedNutrient[] {
  if (doc.patientFocusNutrients != null) return doc.patientFocusNutrients;
  if (doc.doctorFocusNutrients && doc.doctorFocusNutrients.length > 0) {
    return doc.doctorFocusNutrients;
  }
  return DEFAULT_FOCUS_NUTRIENTS;
}
