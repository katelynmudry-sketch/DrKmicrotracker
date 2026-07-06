// Firestore `pantry_items/{id}` and `grocery_list_items/{id}` shapes (Post-demo
// milestone #1, docs/PLAN.md). Both are entirely patient-owned — unlike meals,
// there's no doctor view or server-owned lifecycle here, so the client reads
// and writes these directly under firestore.rules' per-owner scoping.
export const PANTRY_STATUSES = ["active", "used_up"] as const;
export type PantryStatus = (typeof PANTRY_STATUSES)[number];

export interface PantryItemDoc {
  patientId: string;
  name: string;
  status: PantryStatus;
  createdAt: unknown;
}
export type PantryItem = PantryItemDoc & { id: string };

export const GROCERY_ITEM_REASONS = ["used_up", "gap_suggestion", "manual"] as const;
export type GroceryItemReason = (typeof GROCERY_ITEM_REASONS)[number];

export const GROCERY_REASON_LABELS: Record<GroceryItemReason, string> = {
  used_up: "Ran out",
  gap_suggestion: "Worth adding",
  manual: "Added by you",
};

export interface GroceryListItemDoc {
  patientId: string;
  name: string;
  reason: GroceryItemReason;
  note: string | null;
  checkedAt: string | null;
  createdAt: unknown;
}
export type GroceryListItem = GroceryListItemDoc & { id: string };
