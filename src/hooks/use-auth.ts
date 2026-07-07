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
} from "@/lib/mock-mode";
import { MOCK_PATIENT_ID } from "@/lib/mock-data";
import { ensureRole } from "@/lib/rubrics.functions";
import { setDetailLevel } from "@/lib/users.functions";
import { DEFAULT_DETAIL_LEVEL, type DetailLevel } from "@/lib/users.schema";

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
  const [loading, setLoading] = useState(!isMockMode);
  const ensureRoleFn = useServerFn(ensureRole);
  const setDetailLevelFn = useServerFn(setDetailLevel);

  useEffect(() => {
    if (isMockMode) {
      const offRole = onMockRoleChange(() => setRole(getMockRole()));
      const offDetail = onMockDetailLevelChange(() => setDetailLevelState(getMockDetailLevel()));
      return () => {
        offRole();
        offDetail();
      };
    }
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, "users", u.uid));
        if (snap.exists()) {
          setRole((snap.data()?.role as AppRole) ?? null);
          setDetailLevelState((snap.data()?.detailLevel as DetailLevel) ?? DEFAULT_DETAIL_LEVEL);
        } else {
          // First sign-in: no profile yet — the server decides the role
          // (DOCTOR_EMAILS allowlist) and creates it, seeded with the default
          // detail level. Never written by the client.
          const { role: assignedRole } = await ensureRoleFn({});
          setRole(assignedRole);
          setDetailLevelState(DEFAULT_DETAIL_LEVEL);
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

  return {
    user,
    role,
    isDoctor: role === "doctor",
    isPatient: role === "patient",
    detailLevel,
    setDetailLevelPreference,
    loading,
    signOut: () => (isMockMode ? Promise.resolve() : firebaseSignOut(auth)),
  };
}
