import { createServerFn } from "@tanstack/react-start";
import { requireFirebaseAuth } from "@/integrations/firebase/auth-middleware";
import { z } from "zod";
import { DETAIL_LEVELS } from "@/lib/users.schema";

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
