import { createServerFn } from "@tanstack/react-start";
import { requireFirebaseAuth } from "@/integrations/firebase/auth-middleware";
import { z } from "zod";

async function assertDoctor(userId: string) {
  const { adminDb } = await import("@/integrations/firebase/admin.server");
  const snap = await adminDb.collection("users").doc(userId).get();
  if (snap.data()?.role !== "doctor") throw new Error("Forbidden: doctor only");
}

export const getRubricFileUrl = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((input: unknown) => z.object({ path: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertDoctor(context.userId);
    const { adminStorage } = await import("@/integrations/firebase/admin.server");
    const [url] = await adminStorage
      .bucket()
      .file(data.path)
      .getSignedUrl({ action: "read", expires: Date.now() + 60 * 60 * 1000 });
    return { url };
  });

export const promoteToDoctor = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((input: unknown) => z.object({ email: z.string().email() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertDoctor(context.userId);
    const { adminDb, adminAuth } = await import("@/integrations/firebase/admin.server");
    const userRecord = await adminAuth.getUserByEmail(data.email).catch(() => null);
    if (!userRecord) throw new Error("User with that email not found");
    await adminDb.collection("users").doc(userRecord.uid).set({ role: "doctor" }, { merge: true });
    return { ok: true };
  });

/**
 * Bootstrap: claim doctor role if no doctor exists yet.
 * Open by design for first-run setup of the practice.
 */
export const claimDoctorIfNone = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .handler(async ({ context }) => {
    const { adminDb } = await import("@/integrations/firebase/admin.server");
    const existing = await adminDb.collection("users").where("role", "==", "doctor").limit(1).get();
    if (!existing.empty) return { claimed: false };
    await adminDb.collection("users").doc(context.userId).set({ role: "doctor" }, { merge: true });
    return { claimed: true };
  });
