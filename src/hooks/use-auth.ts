import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useServerFn } from "@tanstack/react-start";
import { auth, db } from "@/integrations/firebase/client";
import {
  isMockMode,
  getMockRole,
  onMockRoleChange,
  getMockDetailLevel,
  setMockDetailLevel,
  onMockDetailLevelChange,
  getMockDoctorFocusNutrients,
  onMockDoctorFocusNutrientsChange,
  getMockPatientFocusNutrients,
  setMockPatientFocusNutrients,
  onMockPatientFocusNutrientsChange,
  getMockCurrentRegions,
  setMockCurrentRegions,
  onMockCurrentRegionsChange,
  getMockFoodHeritage,
  setMockFoodHeritage,
  onMockFoodHeritageChange,
} from "@/lib/mock-mode";
import { MOCK_PATIENT_ID } from "@/lib/mock-data";
import { isDoctorFeatureEnabled } from "@/lib/doctor-feature";
import { ensureRole } from "@/lib/rubrics.functions";
import {
  setDetailLevel,
  setPatientFocusNutrients,
  setCurrentRegions,
  setFoodHeritage,
} from "@/lib/users.functions";
import {
  DEFAULT_DETAIL_LEVEL,
  resolveEffectiveFocusNutrients,
  resolveEffectiveCuisines,
  type DetailLevel,
} from "@/lib/users.schema";
import type { TrackedNutrient } from "@/lib/analysis.schema";

export type AppRole = "doctor" | "patient";

const MOCK_USER = {
  uid: MOCK_PATIENT_ID,
  email: "preview@example.com",
  displayName: "Preview User",
} as unknown as User;

export function useAuth() {
  const [user, setUser] = useState<User | null>(isMockMode ? MOCK_USER : null);
  const [role, setRole] = useState<AppRole | null>(isMockMode ? getMockRole() : null);
  const [detailLevel, setDetailLevelState] = useState<DetailLevel>(
    isMockMode ? getMockDetailLevel() : DEFAULT_DETAIL_LEVEL,
  );
  const [doctorFocusNutrients, setDoctorFocusNutrientsState] = useState<
    TrackedNutrient[] | undefined
  >(isMockMode ? getMockDoctorFocusNutrients() : undefined);
  const [patientFocusNutrients, setPatientFocusNutrientsState] = useState<
    TrackedNutrient[] | null | undefined
  >(isMockMode ? getMockPatientFocusNutrients() : undefined);
  // The patient's own "where do you currently live" / "what's your food
  // heritage" picks (docs/ETHOS.md principle 8), set on the Settings page
  // and stored on their users/{uid} doc. Not fetchable in mock mode from
  // Firestore — mock-mode.ts's localStorage stand-in covers it there
  // instead.
  const [currentRegions, setCurrentRegionsState] = useState<string[]>(
    isMockMode ? getMockCurrentRegions() : [],
  );
  const [foodHeritage, setFoodHeritageState] = useState<string[]>(
    isMockMode ? getMockFoodHeritage() : [],
  );
  const [loading, setLoading] = useState(!isMockMode);
  const ensureRoleFn = useServerFn(ensureRole);
  const setDetailLevelFn = useServerFn(setDetailLevel);
  const setPatientFocusNutrientsFn = useServerFn(setPatientFocusNutrients);
  const setCurrentRegionsFn = useServerFn(setCurrentRegions);
  const setFoodHeritageFn = useServerFn(setFoodHeritage);

  useEffect(() => {
    if (isMockMode) {
      const offRole = onMockRoleChange(() => setRole(getMockRole()));
      const offDetail = onMockDetailLevelChange(() => setDetailLevelState(getMockDetailLevel()));
      const offDoctorFocus = onMockDoctorFocusNutrientsChange(() =>
        setDoctorFocusNutrientsState(getMockDoctorFocusNutrients()),
      );
      const offPatientFocus = onMockPatientFocusNutrientsChange(() =>
        setPatientFocusNutrientsState(getMockPatientFocusNutrients()),
      );
      const offRegions = onMockCurrentRegionsChange(() =>
        setCurrentRegionsState(getMockCurrentRegions()),
      );
      const offHeritage = onMockFoodHeritageChange(() =>
        setFoodHeritageState(getMockFoodHeritage()),
      );
      return () => {
        offRole();
        offDetail();
        offDoctorFocus();
        offPatientFocus();
        offRegions();
        offHeritage();
      };
    }
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, "users", u.uid));
        if (snap.exists()) {
          const data = snap.data();
          setRole((data?.role as AppRole) ?? null);
          setDetailLevelState((data?.detailLevel as DetailLevel) ?? DEFAULT_DETAIL_LEVEL);
          setDoctorFocusNutrientsState(data?.doctorFocusNutrients as TrackedNutrient[] | undefined);
          setPatientFocusNutrientsState(
            data?.patientFocusNutrients as TrackedNutrient[] | null | undefined,
          );
          setCurrentRegionsState((data?.currentRegions as string[] | undefined) ?? []);
          setFoodHeritageState((data?.foodHeritage as string[] | undefined) ?? []);
        } else {
          // First sign-in: no profile yet — the server decides the role
          // (DOCTOR_EMAILS allowlist) and creates it, seeded with the default
          // detail level. Never written by the client. Focus nutrients start
          // unset (no doctor default yet) until the doctor sets one.
          const { role: assignedRole } = await ensureRoleFn({});
          setRole(assignedRole);
          setDetailLevelState(DEFAULT_DETAIL_LEVEL);
          setDoctorFocusNutrientsState(undefined);
          setPatientFocusNutrientsState(undefined);
          setCurrentRegionsState([]);
          setFoodHeritageState([]);
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [ensureRoleFn]);

  const setDetailLevelPreference = async (next: DetailLevel) => {
    setDetailLevelState(next);
    if (isMockMode) {
      setMockDetailLevel(next);
      return;
    }
    await setDetailLevelFn({ data: { detailLevel: next } });
  };

  const setPatientFocusNutrientsPreference = async (next: TrackedNutrient[] | null) => {
    setPatientFocusNutrientsState(next);
    if (isMockMode) {
      setMockPatientFocusNutrients(next);
      return;
    }
    await setPatientFocusNutrientsFn({ data: { focusNutrients: next } });
  };

  const setCurrentRegionsPreference = async (next: string[]) => {
    setCurrentRegionsState(next);
    if (isMockMode) {
      setMockCurrentRegions(next);
      return;
    }
    await setCurrentRegionsFn({ data: { regions: next } });
  };

  const setFoodHeritagePreference = async (next: string[]) => {
    setFoodHeritageState(next);
    if (isMockMode) {
      setMockFoodHeritage(next);
      return;
    }
    await setFoodHeritageFn({ data: { heritage: next } });
  };

  const effectiveFocusNutrients = resolveEffectiveFocusNutrients({
    doctorFocusNutrients,
    patientFocusNutrients,
  });
  const effectiveCuisines = resolveEffectiveCuisines({ currentRegions, foodHeritage });

  return {
    user,
    role,
    // The doctor side is disabled for this test round (see
    // docs/OWNER-TODO.md) — gating here cascades to every doctor-only route
    // and UI element that keys off isDoctor, without touching them directly.
    isDoctor: role === "doctor" && isDoctorFeatureEnabled,
    isPatient: role === "patient",
    detailLevel,
    setDetailLevelPreference,
    doctorFocusNutrients,
    patientFocusNutrients,
    effectiveFocusNutrients,
    setPatientFocusNutrientsPreference,
    currentRegions,
    setCurrentRegionsPreference,
    foodHeritage,
    setFoodHeritagePreference,
    effectiveCuisines,
    loading,
    signOut: () => (isMockMode ? Promise.resolve() : firebaseSignOut(auth)),
  };
}
