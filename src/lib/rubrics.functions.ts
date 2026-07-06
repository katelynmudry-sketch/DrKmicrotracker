import { createServerFn } from "@tanstack/react-start";
import { requireFirebaseAuth } from "@/integrations/firebase/auth-middleware";
import { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";

async function assertDoctor(userId: string) {
  const { adminDb } = await import("@/integrations/firebase/admin.server");
  const snap = await adminDb.collection("users").doc(userId).get();
  if (snap.data()?.role !== "doctor") throw new Error("Forbidden: doctor only");
}

const EXTRACTION_TIMEOUT_MS = 45_000;

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

const ExtractRubricInput = z.object({ base64: z.string().min(1) });

// Reads an uploaded rubric PDF directly (as an Anthropic document content
// block) and returns a plain-text protocol summary the doctor can review and
// edit before it's saved as `extractedText` — the same field a hand-pasted
// summary would fill (see meals.functions.ts, which injects it into every
// reading's system prompt). Non-PDF uploads (doc/docx) keep the manual paste
// flow; Claude only accepts PDF as a document block today.
export const extractRubricPdf = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((input: unknown) => ExtractRubricInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertDoctor(context.userId);

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("AI service is not configured");
    const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const anthropic = new Anthropic({ apiKey });

    const response = await withTimeout(
      anthropic.messages.create({
        model,
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: { type: "base64", media_type: "application/pdf", data: data.base64 },
              },
              {
                type: "text",
                text: "Extract this document's dietary/nutrition protocol guidance as a concise plain-text summary — food groups to prioritize or avoid, target macros, any protocol-fit rules, absorption or pairing guidance. This text is pasted directly into an AI prompt, so write it as instructions, not prose about the document. Return only the summary, no preamble.",
              },
            ],
          },
        ],
      }),
      EXTRACTION_TIMEOUT_MS,
      "Extraction timed out",
    );

    const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
    if (!textBlock?.text) throw new Error("Couldn't extract text from that document");
    return { text: textBlock.text.trim() };
  });

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
