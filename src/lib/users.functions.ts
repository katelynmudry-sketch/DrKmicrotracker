import { createServerFn } from "@tanstack/react-start";
import { requireFirebaseAuth } from "@/integrations/firebase/auth-middleware";
import { z } from "zod";
import { DETAIL_LEVELS } from "@/lib/users.schema";
import { TRACKED_NUTRIENTS } from "@/lib/analysis.schema";
import { CUISINE_OPTIONS } from "@/lib/cuisines";
import { isDoctorFeatureEnabledServer } from "@/lib/doctor-feature.server";

const SetDetailLevelInput = z.object({ detailLevel: z.enum(DETAIL_LEVELS) });

/**
 * Update the signed-in user's default reading detail level (Simple/Detailed).
 * Always writes to context.userId — a user can only ever set their own
 * preference, never another uid's. users/{uid} is entirely server-owned (see
 * firestore.rules), so this is the only way this field is ever written.
 */
export const setDetailLevel = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((input: unknown) => SetDetailLevelInput.parse(input))
  .handler(async ({ data, context }) => {
    const { adminDb } = await import("@/integrations/firebase/admin.server");
    await adminDb
      .collection("users")
      .doc(context.userId)
      .set({ detailLevel: data.detailLevel }, { merge: true });
    return { detailLevel: data.detailLevel };
  });

const SetPatientFocusNutrientsInput = z.object({
  focusNutrients: z.array(z.enum(TRACKED_NUTRIENTS)).nullable(),
});

/**
 * Update the signed-in patient's own focus-nutrient override. Always writes
 * to context.userId, same self-only rule as setDetailLevel. `null` clears
 * the override back to the doctor's default (see resolveEffectiveFocusNutrients
 * in users.schema.ts); an explicit [] is a deliberate "no focus" choice.
 */
export const setPatientFocusNutrients = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((input: unknown) => SetPatientFocusNutrientsInput.parse(input))
  .handler(async ({ data, context }) => {
    const { adminDb } = await import("@/integrations/firebase/admin.server");
    await adminDb
      .collection("users")
      .doc(context.userId)
      .set({ patientFocusNutrients: data.focusNutrients }, { merge: true });
    return { patientFocusNutrients: data.focusNutrients };
  });

const SetCurrentRegionsInput = z.object({
  regions: z.array(z.enum(CUISINE_OPTIONS)),
});

/**
 * Update the signed-in patient's own "where do you currently live" picks
 * (docs/ETHOS.md principle 8). Always writes to context.userId, same
 * self-only rule as setDetailLevel/setPatientFocusNutrients.
 */
export const setCurrentRegions = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((input: unknown) => SetCurrentRegionsInput.parse(input))
  .handler(async ({ data, context }) => {
    const { adminDb } = await import("@/integrations/firebase/admin.server");
    await adminDb
      .collection("users")
      .doc(context.userId)
      .set({ currentRegions: data.regions }, { merge: true });
    return { currentRegions: data.regions };
  });

const SetFoodHeritageInput = z.object({
  heritage: z.array(z.enum(CUISINE_OPTIONS)),
});

/**
 * Update the signed-in patient's own "what's your food heritage" picks
 * (docs/ETHOS.md principle 8). Always writes to context.userId, same
 * self-only rule as setDetailLevel/setPatientFocusNutrients.
 */
export const setFoodHeritage = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((input: unknown) => SetFoodHeritageInput.parse(input))
  .handler(async ({ data, context }) => {
    const { adminDb } = await import("@/integrations/firebase/admin.server");
    await adminDb
      .collection("users")
      .doc(context.userId)
      .set({ foodHeritage: data.heritage }, { merge: true });
    return { foodHeritage: data.heritage };
  });

async function assertDoctor(userId: string) {
  if (!isDoctorFeatureEnabledServer()) throw new Error("Forbidden: doctor only");
  const { adminDb } = await import("@/integrations/firebase/admin.server");
  const snap = await adminDb.collection("users").doc(userId).get();
  if (snap.data()?.role !== "doctor") throw new Error("Forbidden: doctor only");
}

const SetDoctorFocusNutrientsInput = z.object({
  patientId: z.string().min(1),
  focusNutrients: z.array(z.enum(TRACKED_NUTRIENTS)),
});

/**
 * Doctor sets the default focus-nutrient list for a given patient. Writes to
 * a DIFFERENT uid than the caller, so — unlike setDetailLevel/
 * setPatientFocusNutrients — this must verify the caller is a doctor first
 * (see assertDoctor, mirrors rubrics.functions.ts's version).
 */
export const setDoctorFocusNutrients = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((input: unknown) => SetDoctorFocusNutrientsInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertDoctor(context.userId);
    const { adminDb } = await import("@/integrations/firebase/admin.server");
    await adminDb
      .collection("users")
      .doc(data.patientId)
      .set({ doctorFocusNutrients: data.focusNutrients }, { merge: true });
    return { doctorFocusNutrients: data.focusNutrients };
  });
