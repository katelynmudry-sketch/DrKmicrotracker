import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/hooks/use-auth";
import { isMockMode } from "@/lib/mock-mode";
import { mockMeals } from "@/lib/mock-data";
import { AppShell } from "@/components/app/app-shell";
import { PatternsPanel } from "@/components/app/patterns-panel";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { Meal } from "@/lib/analysis.schema";

export const Route = createFileRoute("/_authenticated/patterns")({
  head: () => ({ meta: [{ title: "Patterns — Dr. K's Kitchen" }] }),
  component: PatternsPage,
});

function PatternsPage() {
  const { user } = useAuth();

  const meals = useQuery({
    queryKey: ["meals", user?.uid],
    enabled: !!user,
    queryFn: async () => {
      if (isMockMode) return mockMeals;
      const q = query(
        collection(db, "meals"),
        where("patientId", "==", user!.uid),
        orderBy("eatenAt", "desc"),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Meal);
    },
  });

  return (
    <AppShell
      nav={
        <Button size="sm" variant="ghost" asChild>
          <Link to="/dashboard">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Your meals
          </Link>
        </Button>
      }
    >
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Patterns</h1>
        <p className="text-sm text-muted-foreground">
          See trends over weeks, not just one snapshot — without judgment, just information.
        </p>
      </div>
      {meals.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <PatternsPanel meals={meals.data ?? []} />
      )}
    </AppShell>
  );
}
