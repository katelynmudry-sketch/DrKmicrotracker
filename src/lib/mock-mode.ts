// Preview mode: when Firebase isn't configured yet, the app runs entirely on
// in-memory fixture data so the UI can be reviewed without a backend.
import {
  DEFAULT_DETAIL_LEVEL,
  DEFAULT_FOCUS_NUTRIENTS,
  type DetailLevel,
} from "@/lib/users.schema";
import type { TrackedNutrient } from "@/lib/analysis.schema";

export const isMockMode = !import.meta.env.VITE_FIREBASE_API_KEY;

// Whenever Firebase isn't configured, meal logging always attempts a real,
// unpersisted Claude reading (see src/lib/meals-preview.functions.ts) — no
// separate client toggle. The server's PREVIEW_AI_ENABLED env var is the
// actual on/off switch (and ANTHROPIC_API_KEY must be set); if either is
// missing, the attempt just fails with a readable error toast instead of
// succeeding. See docs/OWNER-TODO.md.

// Client-side, per-browser daily cap on preview AI runs — a spend-bounding
// guard, not a security control (bypassable via incognito/clearing storage).
// The Anthropic account's own spend cap (docs/OWNER-TODO.md) is the real
// ceiling; this just stops casual repeat/accidental runs on one device.
export const PREVIEW_AI_DAILY_LIMIT = Number(import.meta.env.VITE_PREVIEW_AI_DAILY_LIMIT) || 3;

const PREVIEW_AI_RUNS_KEY = "previewAiRuns";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function readPreviewAiRunsRecord(): { date: string; count: number } {
  if (typeof window === "undefined") return { date: todayKey(), count: 0 };
  const raw = localStorage.getItem(PREVIEW_AI_RUNS_KEY);
  if (!raw) return { date: todayKey(), count: 0 };
  try {
    const parsed = JSON.parse(raw) as { date: string; count: number };
    if (parsed.date !== todayKey()) return { date: todayKey(), count: 0 };
    return parsed;
  } catch {
    return { date: todayKey(), count: 0 };
  }
}

export function getPreviewAiRunsToday(): number {
  return readPreviewAiRunsRecord().count;
}

export function previewAiRunsRemaining(): number {
  return Math.max(0, PREVIEW_AI_DAILY_LIMIT - getPreviewAiRunsToday());
}

// Called before attempting a preview reading, not after success — a burst of
// failed calls still spends tokens, so the cap has to bound attempts, not
// just successes.
export function recordPreviewAiRun(): void {
  if (typeof window === "undefined") return;
  const current = readPreviewAiRunsRecord();
  localStorage.setItem(
    PREVIEW_AI_RUNS_KEY,
    JSON.stringify({ date: todayKey(), count: current.count + 1 }),
  );
}

// Unlocked only via the unlisted /internal-preview route — Katelyn's own
// entry point for browsing fixture data as either a patient or a doctor.
// Public beta testers land straight on /dashboard (see src/routes/index.tsx)
// and never see this flag flip, so they never see the "Preview mode" banner
// or the Patient view/Doctor view switcher (app-shell.tsx) — just the live
// meal-reading demo, patient role only, by default.
const INTERNAL_PREVIEW_KEY = "internalPreviewUnlocked";

export function isInternalPreviewUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(INTERNAL_PREVIEW_KEY) === "true";
}

export function unlockInternalPreview(): void {
  localStorage.setItem(INTERNAL_PREVIEW_KEY, "true");
}

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
