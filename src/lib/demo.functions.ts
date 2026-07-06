import { createServerFn } from "@tanstack/react-start";
import { requireFirebaseAuth } from "@/integrations/firebase/auth-middleware";
import { DEMO_PATIENTS, DEMO_RUBRIC } from "@/lib/demo-data";

// Demo seed/clear (docs/PLAN.md Phase 4d, docs/DEMO.md). Gated by DEMO_MODE
// so a production deployment can't accidentally seed or wipe demo-tagged
// data — the doctor-only UI in doctor.index.tsx only renders the buttons
// when this is also true, but the server fn is the actual gate.
function assertDemoModeEnabled() {
  if (process.env.DEMO_MODE !== "true") {
    throw new Error("Demo mode isn't enabled — set DEMO_MODE=true to seed or clear demo data.");
  }
}

async function assertDoctor(userId: string) {
  const { adminDb } = await import("@/integrations/firebase/admin.server");
  const snap = await adminDb.collection("users").doc(userId).get();
  if (snap.data()?.role !== "doctor") throw new Error("Forbidden: doctor only");
}

const DAY_MS = 24 * 60 * 60 * 1000;

export const seedDemoData = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .handler(async ({ context }) => {
    assertDemoModeEnabled();
    await assertDoctor(context.userId);
    const { adminDb } = await import("@/integrations/firebase/admin.server");

    const now = Date.now();
    const writes: Promise<unknown>[] = [];

    for (const patient of DEMO_PATIENTS) {
      writes.push(
        adminDb.collection("users").doc(patient.id).set({
          fullName: patient.fullName,
          email: patient.email,
          role: "patient",
          demo: true,
          createdAt: new Date().toISOString(),
        }),
      );

      for (const meal of patient.meals) {
        const eatenAt = new Date(now - meal.daysAgo * DAY_MS);
        eatenAt.setHours(meal.hour, 0, 0, 0);
        const mealRef = adminDb.collection("meals").doc();
        writes.push(
          mealRef.set({
            patientId: patient.id,
            storagePath: null,
            inputMethod: "text",
            mealDescription: meal.description,
            mealLabel: meal.label,
            patientNotes: null,
            doctorNotes: null,
            status: "analyzed",
            analysis: meal.analysis,
            eatenAt: eatenAt.toISOString(),
            createdAt: eatenAt.toISOString(),
            analyzedAt: eatenAt.toISOString(),
            statusError: null,
            rubricIds: ["demo-rubric"],
            demo: true,
          }),
        );
      }
    }

    writes.push(
      adminDb.collection("rubrics").doc("demo-rubric").set({
        uploadedBy: context.userId,
        title: DEMO_RUBRIC.title,
        description: DEMO_RUBRIC.description,
        extractedText: DEMO_RUBRIC.extractedText,
        storagePath: "",
        fileName: "demo-protocol.txt",
        isActive: true,
        demo: true,
        createdAt: new Date().toISOString(),
      }),
    );

    await Promise.all(writes);
    const mealCount = DEMO_PATIENTS.reduce((n, p) => n + p.meals.length, 0);
    return { ok: true, patients: DEMO_PATIENTS.length, meals: mealCount };
  });

export const clearDemoData = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .handler(async ({ context }) => {
    assertDemoModeEnabled();
    await assertDoctor(context.userId);
    const { adminDb } = await import("@/integrations/firebase/admin.server");

    const [usersSnap, mealsSnap, rubricsSnap] = await Promise.all([
      adminDb.collection("users").where("demo", "==", true).get(),
      adminDb.collection("meals").where("demo", "==", true).get(),
      adminDb.collection("rubrics").where("demo", "==", true).get(),
    ]);
    const docs = [...usersSnap.docs, ...mealsSnap.docs, ...rubricsSnap.docs];
    await Promise.all(docs.map((d) => d.ref.delete()));
    return { ok: true, deleted: docs.length };
  });
