import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useServerFn } from "@tanstack/react-start";
import { db } from "@/integrations/firebase/client";
import { isMockMode } from "@/lib/mock-mode";
import { mockMeals, mockPatients } from "@/lib/mock-data";
import { AppShell } from "@/components/app/app-shell";
import { MealPhoto } from "@/components/app/meal-photo";
import { AnalysisView } from "@/components/app/analysis-view";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, RotateCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { analyzeMeal } from "@/lib/meals.functions";
import type { Meal } from "@/lib/analysis.schema";

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
      if (isMockMode)
        return (
          mockPatients.find((p) => p.id === patientId) ?? {
            id: patientId,
            fullName: null,
            email: null,
          }
        );
      const snap = await getDoc(doc(db, "users", patientId));
      return { id: snap.id, ...snap.data() } as {
        id: string;
        fullName: string | null;
        email: string | null;
      };
    },
  });

  const meals = useQuery({
    queryKey: ["doctor", "meals", patientId],
    queryFn: async () => {
      if (isMockMode) return mockMeals;
      const q = query(
        collection(db, "meals"),
        where("patientId", "==", patientId),
        orderBy("eatenAt", "desc"),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Meal);
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
          {profile.data?.fullName ?? profile.data?.email ?? "Patient"}
        </h1>
        <p className="text-sm text-muted-foreground">{profile.data?.email}</p>
      </div>
      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Meals</p>
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
                <p className="text-sm font-medium">{m.mealLabel ?? "Untitled meal"}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(m.eatenAt).toLocaleString()}
                </p>
              </button>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No meals yet.</p>
          )}
        </div>
        {active ? <MealReview key={active.id} meal={active} patientId={patientId} /> : null}
      </div>
    </AppShell>
  );
}

function MealReview({ meal, patientId }: { meal: Meal; patientId: string }) {
  const qc = useQueryClient();
  const analyzeFn = useServerFn(analyzeMeal);
  const [notes, setNotes] = useState<string>(meal.doctorNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["doctor", "meals", patientId] });

  const reanalyze = async () => {
    if (isMockMode) return toast.info("Preview mode — nothing to re-analyze.");
    setReanalyzing(true);
    try {
      await analyzeFn({ data: { mealId: meal.id } });
      toast.success("Re-analyzed against the current rubric");
    } catch (e: any) {
      toast.error(e?.message ?? "Re-analysis failed");
    } finally {
      setReanalyzing(false);
      invalidate();
    }
  };

  const save = async () => {
    if (isMockMode) return toast.info("Preview mode — changes aren't saved.");
    setSaving(true);
    try {
      await updateDoc(doc(db, "meals", meal.id), { doctorNotes: notes });
      toast.success("Notes saved");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save notes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
      <div className="space-y-3">
        <Card className="overflow-hidden">
          {meal.storagePath ? (
            <MealPhoto path={meal.storagePath} className="h-72 w-full object-cover" />
          ) : (
            <div className="grid h-72 w-full place-items-center bg-secondary text-sm text-muted-foreground">
              Logged via description
            </div>
          )}
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {new Date(meal.eatenAt).toLocaleString()}
          </p>
          <p className="font-semibold">{meal.mealLabel ?? "Untitled meal"}</p>
          {meal.patientNotes && (
            <p className="mt-2 text-sm text-muted-foreground">Patient note: {meal.patientNotes}</p>
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
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {meal.status === "pending" || meal.status === "analyzing"
              ? "Reading in progress…"
              : meal.status === "failed"
                ? (meal.statusError ?? "Reading failed")
                : "Reading"}
          </p>
          <Button size="sm" variant="outline" onClick={reanalyze} disabled={reanalyzing}>
            {reanalyzing ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <RotateCw className="mr-1 h-4 w-4" />
            )}
            Re-analyze with current rubric
          </Button>
        </div>
        <AnalysisView analysis={meal.analysis} mealId={meal.id} editable onSaved={invalidate} />
      </Card>
    </div>
  );
}
