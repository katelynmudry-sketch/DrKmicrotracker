import { createMiddleware } from "@tanstack/react-start";
import { auth } from "./client";

// Registered as a global `functionMiddleware` in `src/start.ts`; attaches the
// signed-in user's ID token as a bearer header to every server function call.
export const attachFirebaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    const user = auth.currentUser;
    const token = user ? await user.getIdToken() : undefined;
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
);
