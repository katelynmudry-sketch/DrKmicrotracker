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
  getMockPreferredCuisine,
  setMockPreferredCuisine,
  onMockPreferredCuisineChange,
} from "@/lib/mock-mode";
import { MOCK_PATIENT_ID } from "@/lib/mock-data";
import { ensureRole } from "@/lib/rubrics.functions";
import {
  setDetailLevel,
  setPatientFocusNutrients,
  setPreferredCuisine,
} from "@/lib/users.functions";
import {
  DEFAULT_DETAIL_LEVEL,
  resolveEffectiveFocusNutrients,
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
  // The patient's own cuisine/heritage pick (docs/ETHOS.md principle 8), set
  // on the Settings page and stored on their users/{uid} doc. Not fetchable
  // in mock mode from Firestore — mock-mode.ts's localStorage stand-in
  // covers it there instead.
  const [preferredCuisine, setPreferredCuisineState] = useState<string | null>(
    isMockMode ? getMockPreferredCuisine() : null,
  );
  const [loading, setLoading] = useState(!isMockMode);
  const ensureRoleFn = useServerFn(ensureRole);
  const setDetailLevelFn = useServerFn(setDetailLevel);
  const setPatientFocusNutrientsFn = useServerFn(setPatientFocusNutrients);
  const setPreferredCuisineFn = useServerFn(setPreferredCuisine);

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
      const offCuisine = onMockPreferredCuisineChange(() =>
        setPreferredCuisineState(getMockPreferredCuisine()),
      );
      return () => {
        offRole();
        offDetail();
        offDoctorFocus();
        offPatientFocus();
        offCuisine();
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
          setPreferredCuisineState((data?.preferredCuisine as string | undefined) ?? null);
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
          setPreferredCuisineState(null);
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

  const setPreferredCuisinePreference = async (next: string | null) => {
    setPreferredCuisineState(next);
    if (isMockMode) {
      setMockPreferredCuisine(next);
      return;
    }
    await setPreferredCuisineFn({ data: { preferredCuisine: next } });
  };

  const effectiveFocusNutrients = resolveEffectiveFocusNutrients({
    doctorFocusNutrients,
    patientFocusNutrients,
  });

  return {
    user,
    role,
    isDoctor: role === "doctor",
    isPatient: role === "patient",
    detailLevel,
    setDetailLevelPreference,
    doctorFocusNutrients,
    patientFocusNutrients,
    effectiveFocusNutrients,
    setPatientFocusNutrientsPreference,
    preferredCuisine,
    setPreferredCuisinePreference,
    loading,
    signOut: () => (isMockMode ? Promise.resolve() : firebaseSignOut(auth)),
  };
}
