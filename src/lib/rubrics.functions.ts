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
 * Bootstrap a user's Firestore profile on first sign-in. Role is decided
 * server-side from the DOCTOR_EMAILS allowlist — never client-writable.
 * Additional doctors beyond the allowlist are added via promoteToDoctor.
 */
export const ensureRole = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .handler(async ({ context }) => {
    const { adminDb } = await import("@/integrations/firebase/admin.server");
    const ref = adminDb.collection("users").doc(context.userId);
    const snap = await ref.get();
    if (snap.exists) return { role: snap.data()?.role as "doctor" | "patient" };

    const email = (context.claims.email as string | undefined) ?? null;
    const doctorEmails = (process.env.DOCTOR_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const role = email && doctorEmails.includes(email.toLowerCase()) ? "doctor" : "patient";

    await ref.set({
      email,
      fullName: (context.claims.name as string | undefined) ?? null,
      role,
      createdAt: new Date().toISOString(),
    });
    return { role };
  });
