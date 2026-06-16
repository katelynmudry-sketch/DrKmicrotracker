import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app/app-shell";
import { MealPhoto } from "@/components/app/meal-photo";
import { AnalysisView } from "@/components/app/analysis-view";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/doctor/patient/$patientId")({
  head: () => ({ meta: [{ title: "Patient — Nourish" }] }),
  component: PatientView,
});

function PatientView() {
  const { patientId } = useParams({ from: "/_authenticated/doctor/patient/$patientId" });
  const [selected, setSelected] = useState<string | null>(null);

  const profile = useQuery({
    queryKey: ["profile", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", patientId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const meals = useQuery({
    queryKey: ["doctor", "meals", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meals")
        .select("*")
        .eq("patient_id", patientId)
        .order("eaten_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const active = meals.data?.find((m) => m.id === selected) ?? meals.data?.[0];

  return (
    <AppShell
      nav={
        <Button size="sm" variant="ghost" asChild>
          <Link to="/doctor">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Patients
          </Link>
        </Button>
      }
    >
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">
          {profile.data?.full_name ?? profile.data?.email ?? "Patient"}
        </h1>
        <p className="text-sm text-muted-foreground">{profile.data?.email}</p>
      </div>
      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Meals
          </p>
          {meals.data?.length ? (
            meals.data.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelected(m.id)}
                className={`block w-full rounded-lg border p-3 text-left transition ${
                  active?.id === m.id
                    ? "border-accent bg-accent/5"
                    : "border-border bg-card hover:border-accent/40"
                }`}
              >
                <p className="text-sm font-medium">
                  {m.meal_label ?? "Untitled meal"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(m.eaten_at).toLocaleString()}
                </p>
              </button>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No meals yet.</p>
          )}
        </div>
        {active ? <MealReview key={active.id} meal={active} /> : null}
      </div>
    </AppShell>
  );
}

function MealReview({ meal }: { meal: any }) {
  const [notes, setNotes] = useState<string>(meal.doctor_notes ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("meals")
      .update({ doctor_notes: notes })
      .eq("id", meal.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Notes saved");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
      <div className="space-y-3">
        <Card className="overflow-hidden">
          <MealPhoto path={meal.storage_path} className="h-72 w-full object-cover" />
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {new Date(meal.eaten_at).toLocaleString()}
          </p>
          <p className="font-semibold">{meal.meal_label ?? "Untitled meal"}</p>
          {meal.patient_notes && (
            <p className="mt-2 text-sm text-muted-foreground">
              Patient note: {meal.patient_notes}
            </p>
          )}
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Your in-office notes
            </p>
            <Textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes for the next visit…"
            />
            <Button size="sm" onClick={save} disabled={saving}>
              Save notes
            </Button>
          </div>
        </Card>
      </div>
      <Card className="p-6">
        <AnalysisView analysis={meal.analysis} />
      </Card>
    </div>
  );
}