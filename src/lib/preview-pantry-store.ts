// Local, per-browser pantry + grocery list for the no-account beta (see
// preview-meals-store.ts). Unlike meals, these are ongoing lists rather than
// a daily log, so entries persist indefinitely per browser instead of
// resetting each day — the only reset is clearing site data. Once
// accounts/Firestore land for these users, this store goes away.
import { MOCK_PATIENT_ID } from "@/lib/mock-data";
import type { GroceryListItem, GroceryItemReason, PantryItem } from "@/lib/pantry.schema";

const PANTRY_STORAGE_KEY = "previewPantryItems";
const GROCERY_STORAGE_KEY = "previewGroceryItems";

function readList<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

function writeList<T>(key: string, list: T[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(list));
}

function newId(prefix: string): string {
  return `preview-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getLocalPantryItems(): PantryItem[] {
  return readList<PantryItem>(PANTRY_STORAGE_KEY);
}

function addPantryItem(name: string): PantryItem {
  const item: PantryItem = {
    id: newId("pantry"),
    patientId: MOCK_PATIENT_ID,
    name,
    status: "active",
    createdAt: new Date().toISOString(),
  };
  const items = getLocalPantryItems();
  items.unshift(item);
  writeList(PANTRY_STORAGE_KEY, items);
  return item;
}

export function addLocalPantryItem(name: string): PantryItem {
  return addPantryItem(name);
}

export function addLocalPantryItems(names: string[]): PantryItem[] {
  return names.map((name) => addPantryItem(name));
}

export function getLocalGroceryItems(): GroceryListItem[] {
  return readList<GroceryListItem>(GROCERY_STORAGE_KEY);
}

export function addLocalGroceryItem(item: {
  name: string;
  reason: GroceryItemReason;
  note?: string | null;
}): GroceryListItem {
  const groceryItem: GroceryListItem = {
    id: newId("grocery"),
    patientId: MOCK_PATIENT_ID,
    name: item.name,
    reason: item.reason,
    note: item.note ?? null,
    checkedAt: null,
    createdAt: new Date().toISOString(),
  };
  const items = getLocalGroceryItems();
  items.unshift(groceryItem);
  writeList(GROCERY_STORAGE_KEY, items);
  return groceryItem;
}

export function toggleLocalGroceryItemChecked(id: string): void {
  const items = getLocalGroceryItems();
  const item = items.find((i) => i.id === id);
  if (!item) return;
  item.checkedAt = item.checkedAt ? null : new Date().toISOString();
  writeList(GROCERY_STORAGE_KEY, items);
}

// Mirrors pantry.tsx's markUsedUp: flip status, then add to the grocery list
// unless an unchecked "used_up" entry for the same name already exists.
export function markLocalPantryItemUsedUp(id: string): void {
  const items = getLocalPantryItems();
  const item = items.find((i) => i.id === id);
  if (!item) return;
  item.status = "used_up";
  writeList(PANTRY_STORAGE_KEY, items);

  const groceryItems = getLocalGroceryItems();
  const alreadyOnList = groceryItems.some(
    (g) => g.name === item.name && g.reason === "used_up" && g.checkedAt == null,
  );
  if (!alreadyOnList) {
    addLocalGroceryItem({ name: item.name, reason: "used_up", note: null });
  }
}

export function restockLocalPantryItem(id: string): void {
  const items = getLocalPantryItems();
  const item = items.find((i) => i.id === id);
  if (!item) return;
  item.status = "active";
  writeList(PANTRY_STORAGE_KEY, items);
}

export function removeLocalPantryItem(id: string): void {
  writeList(
    PANTRY_STORAGE_KEY,
    getLocalPantryItems().filter((i) => i.id !== id),
  );
}
