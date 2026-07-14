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

// The mock patient's "where do you currently live" / "what's your food
// heritage" picks (docs/ETHOS.md principle 8) — no real users/{uid} doc to
// read/write in mock mode, so this stands in for it.
const CURRENT_REGIONS_STORAGE_KEY = "mockCurrentRegions";
const CURRENT_REGIONS_CHANGE_EVENT = "mock-current-regions-change";

export function getMockCurrentRegions(): string[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(CURRENT_REGIONS_STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function setMockCurrentRegions(regions: string[]) {
  localStorage.setItem(CURRENT_REGIONS_STORAGE_KEY, JSON.stringify(regions));
  window.dispatchEvent(new Event(CURRENT_REGIONS_CHANGE_EVENT));
}

export function onMockCurrentRegionsChange(cb: () => void) {
  window.addEventListener(CURRENT_REGIONS_CHANGE_EVENT, cb);
  return () => window.removeEventListener(CURRENT_REGIONS_CHANGE_EVENT, cb);
}

const FOOD_HERITAGE_STORAGE_KEY = "mockFoodHeritage";
const FOOD_HERITAGE_CHANGE_EVENT = "mock-food-heritage-change";

export function getMockFoodHeritage(): string[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(FOOD_HERITAGE_STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function setMockFoodHeritage(heritage: string[]) {
  localStorage.setItem(FOOD_HERITAGE_STORAGE_KEY, JSON.stringify(heritage));
  window.dispatchEvent(new Event(FOOD_HERITAGE_CHANGE_EVENT));
}

export function onMockFoodHeritageChange(cb: () => void) {
  window.addEventListener(FOOD_HERITAGE_CHANGE_EVENT, cb);
  return () => window.removeEventListener(FOOD_HERITAGE_CHANGE_EVENT, cb);
}
