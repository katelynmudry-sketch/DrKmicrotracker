// Preview mode: when Firebase isn't configured yet, the app runs entirely on
// in-memory fixture data so the UI can be reviewed without a backend.
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
