import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { collection, doc, getDoc, getDocs, orderBy, query, updateDoc, where } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
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
      const snap = await getDoc(doc(db, "users", patientId));
      return { id: snap.id, ...snap.data() } as { id: string; fullName: string | null; email: string | null };
    },
  });

  const meals = useQuery({
    queryKey: ["doctor", "meals", patientId],
    queryFn: async () => {
      const q = query(
        collection(db, "meals"),
        where("patientId", "==", patientId),
        orderBy("eatenAt", "desc"),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as any);
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
                  {m.mealLabel ?? "Untitled meal"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(m.eatenAt).toLocaleString()}
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
  const [notes, setNotes] = useState<string>(meal.doctorNotes ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
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
          <MealPhoto path={meal.storagePath} className="h-72 w-full object-cover" />
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {new Date(meal.eatenAt).toLocaleString()}
          </p>
          <p className="font-semibold">{meal.mealLabel ?? "Untitled meal"}</p>
          {meal.patientNotes && (
            <p className="mt-2 text-sm text-muted-foreground">
              Patient note: {meal.patientNotes}
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
