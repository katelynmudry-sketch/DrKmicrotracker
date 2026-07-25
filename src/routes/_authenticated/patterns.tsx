import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/hooks/use-auth";
import { isInternalPreviewUnlocked, isMockMode } from "@/lib/mock-mode";
import { mockMeals, mockPantryItems } from "@/lib/mock-data";
import { getLocalPreviewMeals } from "@/lib/preview-meals-store";
import { AppShell } from "@/components/app/app-shell";
import { PatternsPanel } from "@/components/app/patterns-panel";
import type { Meal } from "@/lib/analysis.schema";
import type { PantryItem } from "@/lib/pantry.schema";

export const Route = createFileRoute("/_authenticated/patterns")({
  head: () => ({ meta: [{ title: "Patterns — Vital Table" }] }),
  component: PatternsPage,
});

function PatternsPage() {
  const { user, effectiveCuisines, detailLevel, effectiveFocusNutrients } = useAuth();

  const meals = useQuery({
    queryKey: ["meals", user?.uid],
    enabled: !!user,
    queryFn: async () => {
      if (isMockMode) return isInternalPreviewUnlocked() ? mockMeals : getLocalPreviewMeals();
      const q = query(
        collection(db, "meals"),
        where("patientId", "==", user!.uid),
        orderBy("eatenAt", "desc"),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Meal);
    },
  });

  const pantryItems = useQuery({
    queryKey: ["pantry-items", user?.uid],
    enabled: !!user,
    queryFn: async () => {
      if (isMockMode) return mockPantryItems;
      const q = query(collection(db, "pantry_items"), where("patientId", "==", user!.uid));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PantryItem);
    },
  });

  const pantryItemNames = (pantryItems.data ?? [])
    .filter((p) => p.status === "active")
    .map((p) => p.name);

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Nutrient History</h1>
        <p className="text-sm text-muted-foreground">
          See trends over weeks, not just one snapshot — without judgment, just information.
        </p>
      </div>
      {meals.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <PatternsPanel
          meals={meals.data ?? []}
          pantryItemNames={pantryItemNames}
          cuisines={effectiveCuisines}
          focusNutrients={effectiveFocusNutrients}
          detailLevel={detailLevel}
        />
      )}
    </AppShell>
  );
}
