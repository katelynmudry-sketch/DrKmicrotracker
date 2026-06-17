import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/hooks/use-auth";
import { isMockMode } from "@/lib/mock-mode";
import { mockMeals, mockPatients } from "@/lib/mock-data";
import { AppShell } from "@/components/app/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users } from "lucide-react";
import { claimDoctorIfNone } from "@/lib/rubrics.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/doctor")({
  head: () => ({ meta: [{ title: "Doctor portal — Nourish" }] }),
  component: DoctorHome,
});

function DoctorHome() {
  const { isDoctor, loading, user } = useAuth();
  const qc = useQueryClient();
  const claim = useServerFn(claimDoctorIfNone);

  useEffect(() => {
    if (isMockMode) return;
    if (!loading && user && !isDoctor) {
      claim({})
        .then((r) => {
          if (r.claimed) {
            toast.success("Doctor role granted — welcome.");
            qc.invalidateQueries();
          }
        })
        .catch(() => {});
    }
  }, [loading, user, isDoctor, claim, qc]);

  const patients = useQuery({
    queryKey: ["doctor", "patients"],
    enabled: isDoctor,
    queryFn: async () => {
      if (isMockMode) {
        const byPatient = new Map<string, number>();
        mockMeals.forEach((m) => byPatient.set(m.patientId, (byPatient.get(m.patientId) ?? 0) + 1));
        return mockPatients.map((p) => ({ ...p, mealCount: byPatient.get(p.id) ?? 0 }));
      }
      const patientsSnap = await getDocs(query(collection(db, "users"), where("role", "==", "patient")));
      const patients = patientsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as {
        id: string;
        fullName: string | null;
        email: string | null;
      });
      if (patients.length === 0) return [];

      const mealsSnap = await getDocs(collection(db, "meals"));
      const byPatient = new Map<string, number>();
      mealsSnap.docs.forEach((d) => {
        const patientId = d.data().patientId as string;
        byPatient.set(patientId, (byPatient.get(patientId) ?? 0) + 1);
      });
      return patients.map((p) => ({ ...p, mealCount: byPatient.get(p.id) ?? 0 }));
    },
  });

  if (loading) return null;
  if (!isDoctor) {
    return (
      <AppShell>
        <Card className="mx-auto max-w-md p-6 text-center">
          <h2 className="text-lg font-semibold">Doctor access</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You don't have doctor access yet. If you're the first user, refresh
            this page to claim the doctor role.
          </p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell
      nav={
        <Button size="sm" variant="outline" asChild>
          <Link to="/doctor/rubrics">
            <BookOpen className="mr-1 h-4 w-4" />
            Rubrics
          </Link>
        </Button>
      }
    >
      <div className="mb-6 flex items-center gap-2">
        <Users className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-xl font-semibold tracking-tight">Patients</h1>
      </div>
      {patients.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !patients.data || patients.data.length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground">
          No patients yet. Share the sign-up link with your patients.
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {patients.data.map((p) => (
            <Link
              key={p.id}
              to="/doctor/patient/$patientId"
              params={{ patientId: p.id }}
              className="rounded-xl border border-border bg-card p-4 transition hover:border-accent/50"
            >
              <p className="text-sm font-semibold">{p.fullName ?? p.email}</p>
              <p className="text-xs text-muted-foreground">{p.email}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                {p.mealCount} meal{p.mealCount === 1 ? "" : "s"} logged
              </p>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
