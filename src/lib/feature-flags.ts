// Client-visible feature flags for gating features that aren't ready for
// every user yet. Deliberately independent of isMockMode (mock-mode.ts) —
// the beta's live meal-reading path also runs with isMockMode true (no
// Firebase configured), so pantry/grocery visibility can't piggyback on
// that check without also unlocking for beta testers.
export const arePantryFeaturesEnabled = import.meta.env.VITE_PANTRY_ENABLED === "true";
