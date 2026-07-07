// Firestore `users/{uid}` document shape. Entirely server-owned (see
// firestore.rules: `allow create, update, delete: if false`) — writes go
// through Admin-SDK server functions only (ensureRole in rubrics.functions.ts,
// setDetailLevel in users.functions.ts), never a direct client write.

export const DETAIL_LEVELS = ["simple", "detailed"] as const;
export type DetailLevel = (typeof DETAIL_LEVELS)[number];

// Detailed is the primary experience; Simple is the explicit opt-out for
// patients who find numbers overwhelming. See docs/ETHOS.md principle 2.
export const DEFAULT_DETAIL_LEVEL: DetailLevel = "detailed";

export interface UserDoc {
  email: string | null;
  fullName: string | null;
  role: "doctor" | "patient";
  createdAt: unknown;
  // Absent on pre-migration docs — treat as DEFAULT_DETAIL_LEVEL.
  detailLevel?: DetailLevel;
}
