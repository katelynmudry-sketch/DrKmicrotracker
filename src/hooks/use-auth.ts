import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useServerFn } from "@tanstack/react-start";
import { auth, db } from "@/integrations/firebase/client";
import { isMockMode, getMockRole, onMockRoleChange } from "@/lib/mock-mode";
import { MOCK_PATIENT_ID } from "@/lib/mock-data";
import { ensureRole } from "@/lib/rubrics.functions";

export type AppRole = "doctor" | "patient";

const MOCK_USER = {
  uid: MOCK_PATIENT_ID,
  email: "preview@example.com",
  displayName: "Preview User",
} as unknown as User;

export function useAuth() {
  const [user, setUser] = useState<User | null>(isMockMode ? MOCK_USER : null);
  const [role, setRole] = useState<AppRole | null>(isMockMode ? getMockRole() : null);
  // The patient's own cuisine/heritage pick (docs/ETHOS.md principle 8), set on
  // the Settings page and stored on their users/{uid} doc. Not fetchable in
  // mock mode — there's no Firestore doc to read there (see isMockMode below).
  const [preferredCuisine, setPreferredCuisine] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isMockMode);
  const ensureRoleFn = useServerFn(ensureRole);

  useEffect(() => {
    if (isMockMode) {
      return onMockRoleChange(() => setRole(getMockRole()));
    }
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, "users", u.uid));
        if (snap.exists()) {
          const data = snap.data();
          setRole((data?.role as AppRole) ?? null);
          setPreferredCuisine((data?.preferredCuisine as string | undefined) ?? null);
        } else {
          // First sign-in: no profile yet — the server decides the role
          // (DOCTOR_EMAILS allowlist) and creates it. Never written by the client.
          const { role: assignedRole } = await ensureRoleFn({});
          setRole(assignedRole);
          setPreferredCuisine(null);
        }
      } else {
        setRole(null);
        setPreferredCuisine(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [ensureRoleFn]);

  return {
    user,
    role,
    preferredCuisine,
    isDoctor: role === "doctor",
    isPatient: role === "patient",
    loading,
    signOut: () => (isMockMode ? Promise.resolve() : firebaseSignOut(auth)),
  };
}
