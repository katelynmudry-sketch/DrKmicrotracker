import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app/app-shell";
import { MealPhoto } from "@/components/app/meal-photo";
import { AnalysisView } from "@/components/app/analysis-view";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/meals/$mealId")({
  head: () => ({ meta: [{ title: "Meal — Nourish" }] }),
  component: MealDetail,
});

function MealDetail() {
  const { mealId } = useParams({ from: "/_authenticated/meals/$mealId" });
  const meal = useQuery({
    queryKey: ["meal", mealId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meals")
        .select("*")
        .eq("id", mealId)
        .single();
      if (error) throw error;
      return data;
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
              <MealPhoto path={meal.data.storage_path} className="h-80 w-full object-cover" />
            </Card>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {new Date(meal.data.eaten_at).toLocaleString()}
              </p>
              <h1 className="text-xl font-semibold tracking-tight">
                {meal.data.meal_label ?? "Untitled meal"}
              </h1>
              {meal.data.patient_notes && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {meal.data.patient_notes}
                </p>
              )}
              {meal.data.doctor_notes && (
                <div className="mt-3 rounded-md border border-accent/40 bg-accent/5 p-3 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Doctor notes
                  </p>
                  <p className="mt-1">{meal.data.doctor_notes}</p>
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
              <AnalysisView analysis={meal.data.analysis} />
            )}
          </Card>
        </div>
      )}
    </AppShell>
  );
}