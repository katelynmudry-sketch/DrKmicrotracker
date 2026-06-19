import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { isMockMode } from "@/lib/mock-mode";
import { mockMeals } from "@/lib/mock-data";
import { AppShell } from "@/components/app/app-shell";
import { MealPhoto } from "@/components/app/meal-photo";
import { AnalysisView } from "@/components/app/analysis-view";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, NotebookPen } from "lucide-react";

export const Route = createFileRoute("/_authenticated/meals/$mealId")({
  head: () => ({ meta: [{ title: "Meal — Nourish" }] }),
  component: MealDetail,
});

function MealDetail() {
  const { mealId } = useParams({ from: "/_authenticated/meals/$mealId" });
  const qc = useQueryClient();
  const meal = useQuery({
    queryKey: ["meal", mealId],
    queryFn: async () => {
      if (isMockMode) {
        const m = mockMeals.find((m) => m.id === mealId);
        if (!m) throw new Error("Meal not found");
        return m;
      }
      const snap = await getDoc(doc(db, "meals", mealId));
      if (!snap.exists()) throw new Error("Meal not found");
      return { id: snap.id, ...snap.data() } as any;
    },
  });

  return (
    <AppShell
      nav={
        <Button size="sm" variant="ghost" asChild>
          <Link to="/dashboard">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Link>
        </Button>
      }
    >
      {meal.isLoading || !meal.data ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-[1fr_1.5fr]">
          <div className="space-y-3">
            <Card className="overflow-hidden">
              {meal.data.storagePath ? (
                <MealPhoto path={meal.data.storagePath} className="h-80 w-full object-cover" />
              ) : (
                <div className="grid h-80 w-full place-items-center bg-secondary">
                  <NotebookPen className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </Card>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {new Date(meal.data.eatenAt).toLocaleString()}
              </p>
              <h1 className="text-xl font-semibold tracking-tight">
                {meal.data.mealLabel ?? "Untitled meal"}
              </h1>
              {meal.data.inputMethod === "text" && meal.data.mealDescription && (
                <p className="mt-2 text-sm">Logged via description: {meal.data.mealDescription}</p>
              )}
              {meal.data.patientNotes && (
                <p className="mt-2 text-sm text-muted-foreground">{meal.data.patientNotes}</p>
              )}
              {meal.data.doctorNotes && (
                <div className="mt-3 rounded-md border border-accent/40 bg-accent/5 p-3 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Doctor notes
                  </p>
                  <p className="mt-1">{meal.data.doctorNotes}</p>
                </div>
              )}
            </Card>
          </div>
          <Card className="p-6">
            {meal.data.status === "analyzing" ? (
              <p className="text-sm text-muted-foreground">Analysis in progress…</p>
            ) : meal.data.status === "failed" ? (
              <p className="text-sm text-destructive">Analysis failed. Try uploading again.</p>
            ) : (
              <AnalysisView
                analysis={meal.data.analysis}
                mealId={meal.data.id}
                editable
                onSaved={() => qc.invalidateQueries({ queryKey: ["meal", mealId] })}
              />
            )}
          </Card>
        </div>
      )}
    </AppShell>
  );
}
