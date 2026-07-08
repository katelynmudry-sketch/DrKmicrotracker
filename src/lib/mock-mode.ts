// Preview mode: when Firebase isn't configured yet, the app runs entirely on
// in-memory fixture data so the UI can be reviewed without a backend.
import {
  DEFAULT_DETAIL_LEVEL,
  DEFAULT_FOCUS_NUTRIENTS,
  type DetailLevel,
} from "@/lib/users.schema";
import type { TrackedNutrient } from "@/lib/analysis.schema";

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

// The single mock patient's doctor-set default focus list — exercises the
// doctor-half of the focus-nutrient flow in Preview mode, where there's only
// one demo profile shared by both the "Patient view"/"Doctor view" switcher.
const DOCTOR_FOCUS_STORAGE_KEY = "mockDoctorFocusNutrients";
const DOCTOR_FOCUS_CHANGE_EVENT = "mock-doctor-focus-change";

export function getMockDoctorFocusNutrients(): TrackedNutrient[] {
  if (typeof window === "undefined") return DEFAULT_FOCUS_NUTRIENTS;
  const raw = localStorage.getItem(DOCTOR_FOCUS_STORAGE_KEY);
  if (!raw) return DEFAULT_FOCUS_NUTRIENTS;
  try {
    return JSON.parse(raw) as TrackedNutrient[];
  } catch {
    return DEFAULT_FOCUS_NUTRIENTS;
  }
}

export function setMockDoctorFocusNutrients(focusNutrients: TrackedNutrient[]) {
  localStorage.setItem(DOCTOR_FOCUS_STORAGE_KEY, JSON.stringify(focusNutrients));
  window.dispatchEvent(new Event(DOCTOR_FOCUS_CHANGE_EVENT));
}

export function onMockDoctorFocusNutrientsChange(cb: () => void) {
  window.addEventListener(DOCTOR_FOCUS_CHANGE_EVENT, cb);
  return () => window.removeEventListener(DOCTOR_FOCUS_CHANGE_EVENT, cb);
}

// The mock patient's own override — null/unset means "use the doctor's
// default," matching resolveEffectiveFocusNutrients's real semantics.
const PATIENT_FOCUS_STORAGE_KEY = "mockPatientFocusNutrients";
const PATIENT_FOCUS_CHANGE_EVENT = "mock-patient-focus-change";

export function getMockPatientFocusNutrients(): TrackedNutrient[] | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(PATIENT_FOCUS_STORAGE_KEY);
  if (raw == null) return null;
  try {
    return JSON.parse(raw) as TrackedNutrient[];
  } catch {
    return null;
  }
}

export function setMockPatientFocusNutrients(focusNutrients: TrackedNutrient[] | null) {
  if (focusNutrients == null) {
    localStorage.removeItem(PATIENT_FOCUS_STORAGE_KEY);
  } else {
    localStorage.setItem(PATIENT_FOCUS_STORAGE_KEY, JSON.stringify(focusNutrients));
  }
  window.dispatchEvent(new Event(PATIENT_FOCUS_CHANGE_EVENT));
}

export function onMockPatientFocusNutrientsChange(cb: () => void) {
  window.addEventListener(PATIENT_FOCUS_CHANGE_EVENT, cb);
  return () => window.removeEventListener(PATIENT_FOCUS_CHANGE_EVENT, cb);
}

// The mock patient's cuisine/heritage pick (docs/ETHOS.md principle 8) — no
// real users/{uid} doc to read/write in mock mode, so this stands in for it.
const PREFERRED_CUISINE_STORAGE_KEY = "mockPreferredCuisine";
const PREFERRED_CUISINE_CHANGE_EVENT = "mock-preferred-cuisine-change";

export function getMockPreferredCuisine(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PREFERRED_CUISINE_STORAGE_KEY);
}

export function setMockPreferredCuisine(preferredCuisine: string | null) {
  if (preferredCuisine == null) {
    localStorage.removeItem(PREFERRED_CUISINE_STORAGE_KEY);
  } else {
    localStorage.setItem(PREFERRED_CUISINE_STORAGE_KEY, preferredCuisine);
  }
  window.dispatchEvent(new Event(PREFERRED_CUISINE_CHANGE_EVENT));
}

export function onMockPreferredCuisineChange(cb: () => void) {
  window.addEventListener(PREFERRED_CUISINE_CHANGE_EVENT, cb);
  return () => window.removeEventListener(PREFERRED_CUISINE_CHANGE_EVENT, cb);
}
