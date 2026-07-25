import { createMiddleware } from "@tanstack/react-start";
import { auth } from "./client";
import { isMockMode } from "@/lib/mock-mode";

// Registered as a global `functionMiddleware` in `src/start.ts`; attaches the
// signed-in user's ID token as a bearer header to every server function call.
// Skipped entirely in mock mode — Firebase isn't configured there, so even
// touching `auth.currentUser` would throw (see client.ts's config check).
// This matters beyond the classic fixture-browsing Preview mode: it's also
// what lets analyzeMealPreview (an intentionally unauthenticated server fn —
// see meals-preview.functions.ts) be called at all when Firebase is absent.
export const attachFirebaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    if (isMockMode) return next({ headers: {} });
    const user = auth.currentUser;
    const token = user ? await user.getIdToken() : undefined;
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
);
