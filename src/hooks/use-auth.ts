import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/integrations/firebase/client";
import { isMockMode, getMockRole, onMockRoleChange } from "@/lib/mock-mode";
import { MOCK_PATIENT_ID } from "@/lib/mock-data";

export type AppRole = "doctor" | "patient";

const MOCK_USER = {
  uid: MOCK_PATIENT_ID,
  email: "preview@example.com",
  displayName: "Preview User",
} as unknown as User;

export function useAuth() {
  const [user, setUser] = useState<User | null>(isMockMode ? MOCK_USER : null);
  const [role, setRole] = useState<AppRole | null>(isMockMode ? getMockRole() : null);
  const [loading, setLoading] = useState(!isMockMode);

  useEffect(() => {
    if (isMockMode) {
      return onMockRoleChange(() => setRole(getMockRole()));
    }
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, "users", u.uid));
        setRole((snap.data()?.role as AppRole) ?? null);
      } else {
        setRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return {
    user,
    role,
    isDoctor: role === "doctor",
    isPatient: role === "patient",
    loading,
    signOut: () => (isMockMode ? Promise.resolve() : firebaseSignOut(auth)),
  };
}
