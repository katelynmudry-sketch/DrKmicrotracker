// Preview mode: when Firebase isn't configured yet, the app runs entirely on
// in-memory fixture data so the UI can be reviewed without a backend.
import { DEFAULT_DETAIL_LEVEL, type DetailLevel } from "@/lib/users.schema";

export const isMockMode = !import.meta.env.VITE_FIREBASE_API_KEY;

export type MockRole = "doctor" | "patient";

const STORAGE_KEY = "mockRole";
const ROLE_CHANGE_EVENT = "mock-role-change";

export function getMockRole(): MockRole {
  if (typeof window === "undefined") return "patient";
  return (localStorage.getItem(STORAGE_KEY) as MockRole) || "patient";
}

export function setMockRole(role: MockRole) {
  localStorage.setItem(STORAGE_KEY, role);
  window.dispatchEvent(new Event(ROLE_CHANGE_EVENT));
}

export function onMockRoleChange(cb: () => void) {
  window.addEventListener(ROLE_CHANGE_EVENT, cb);
  return () => window.removeEventListener(ROLE_CHANGE_EVENT, cb);
}

const DETAIL_LEVEL_STORAGE_KEY = "mockDetailLevel";
const DETAIL_LEVEL_CHANGE_EVENT = "mock-detail-level-change";

export function getMockDetailLevel(): DetailLevel {
  if (typeof window === "undefined") return DEFAULT_DETAIL_LEVEL;
  return (localStorage.getItem(DETAIL_LEVEL_STORAGE_KEY) as DetailLevel) || DEFAULT_DETAIL_LEVEL;
}

export function setMockDetailLevel(detailLevel: DetailLevel) {
  localStorage.setItem(DETAIL_LEVEL_STORAGE_KEY, detailLevel);
  window.dispatchEvent(new Event(DETAIL_LEVEL_CHANGE_EVENT));
}

export function onMockDetailLevelChange(cb: () => void) {
  window.addEventListener(DETAIL_LEVEL_CHANGE_EVENT, cb);
  return () => window.removeEventListener(DETAIL_LEVEL_CHANGE_EVENT, cb);
}
