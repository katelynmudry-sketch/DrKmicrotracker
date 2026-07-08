import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { isMockMode } from "@/lib/mock-mode";
import { mockMeals } from "@/lib/mock-data";
import { AppShell } from "@/components/app/app-shell";
import { MealPhoto } from "@/components/app/meal-photo";
import { AnalysisView } from "@/components/app/analysis-view";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, NotebookPen, RotateCw } from "lucide-react";
import { analyzeMeal } from "@/lib/meals.functions";
import { toast } from "sonner";
import type { Meal } from "@/lib/analysis.schema";
import { mealTimingLabel } from "@/lib/meal-timing";

export const Route = createFileRoute("/_authenticated/meals/$mealId")({
  head: () => ({ meta: [{ title: "Meal — Dr. K's Kitchen" }] }),
  component: MealDetail,
});

function MealDetail() {
  const { mealId } = useParams({ from: "/_authenticated/meals/$mealId" });
  const qc = useQueryClient();
  const analyzeFn = useServerFn(analyzeMeal);
  const [retrying, setRetrying] = useState(false);
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
      return { id: snap.id, ...snap.data() } as Meal;
    },
  });

  const retry = async () => {
    if (isMockMode) return toast.info("Preview mode — nothing to retry.");
    setRetrying(true);
    try {
      await analyzeFn({ data: { mealId } });
      toast.success("Reading ready");
    } catch (e: any) {
      toast.error(e?.message ?? "Reading failed");
    } finally {
      setRetrying(false);
      qc.invalidateQueries({ queryKey: ["meal", mealId] });
    }
  };

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
                {mealTimingLabel(meal.data)} · {new Date(meal.data.eatenAt).toLocaleString()}
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
            {meal.data.status === "pending" || meal.data.status === "analyzing" ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">We're reading this meal…</p>
                <Button size="sm" variant="outline" onClick={retry} disabled={retrying}>
                  {retrying ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCw className="mr-1 h-4 w-4" />
                  )}
                  Taking a while? Retry
                </Button>
              </div>
            ) : meal.data.status === "failed" ? (
              <div className="space-y-3">
                <p className="text-sm text-destructive">
                  {meal.data.statusError ?? "The reading didn't come through."}
                </p>
                <Button size="sm" variant="outline" onClick={retry} disabled={retrying}>
                  {retrying ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCw className="mr-1 h-4 w-4" />
                  )}
                  Retry
                </Button>
              </div>
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
