import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, FlaskConical, Loader2, Users } from "lucide-react";
import { promoteToDoctor } from "@/lib/rubrics.functions";
import { seedDemoData, clearDemoData } from "@/lib/demo.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/doctor/")({
  head: () => ({ meta: [{ title: "Doctor portal — Dr. K's Kitchen" }] }),
  component: DoctorHome,
});

function DoctorHome() {
  const { isDoctor, loading } = useAuth();
  const qc = useQueryClient();

  const patients = useQuery({
    queryKey: ["doctor", "patients"],
    enabled: isDoctor,
    queryFn: async () => {
      if (isMockMode) {
        const byPatient = new Map<string, number>();
        mockMeals.forEach((m) => byPatient.set(m.patientId, (byPatient.get(m.patientId) ?? 0) + 1));
        return mockPatients.map((p) => ({ ...p, mealCount: byPatient.get(p.id) ?? 0 }));
      }
      const patientsSnap = await getDocs(
        query(collection(db, "users"), where("role", "==", "patient")),
      );
      const patients = patientsSnap.docs.map(
        (d) =>
          ({ id: d.id, ...d.data() }) as {
            id: string;
            fullName: string | null;
            email: string | null;
          },
      );
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
            You don't have doctor access yet. Ask the practice to add your email to the doctor
            allowlist, or have an existing doctor add you below from their Patients page.
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
      <AddDoctorCard onAdded={() => qc.invalidateQueries({ queryKey: ["doctor", "patients"] })} />
      <DemoDataCard onChanged={() => qc.invalidateQueries({ queryKey: ["doctor", "patients"] })} />
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

// Doctor-only Seed/Clear demo data (docs/DEMO.md). The buttons are always
// rendered here — the server fn is the actual DEMO_MODE gate (see
// demo.functions.ts) so this stays safe to ship even when demo mode is off;
// clicking then just surfaces a clear "not enabled" toast.
function DemoDataCard({ onChanged }: { onChanged: () => void }) {
  const seed = useServerFn(seedDemoData);
  const clear = useServerFn(clearDemoData);
  const [busy, setBusy] = useState<"seed" | "clear" | null>(null);

  const runSeed = async () => {
    if (isMockMode) return toast.info("Preview mode — nothing to seed.");
    setBusy("seed");
    try {
      const result = await seed({});
      toast.success(`Seeded ${result.patients} demo patients and ${result.meals} meals.`);
      onChanged();
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't seed demo data");
    } finally {
      setBusy(null);
    }
  };

  const runClear = async () => {
    if (isMockMode) return toast.info("Preview mode — nothing to clear.");
    setBusy("clear");
    try {
      const result = await clear({});
      toast.success(`Removed ${result.deleted} demo records.`);
      onChanged();
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't clear demo data");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="mb-6 p-4">
      <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
        <FlaskConical className="h-4 w-4" />
        Demo data
      </p>
      <p className="mb-3 text-xs text-muted-foreground">
        Seed three demo patients with three weeks of pre-written readings for a walkthrough (see
        docs/DEMO.md), or remove everything demo-tagged. Only works when DEMO_MODE=true.
      </p>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={runSeed} disabled={busy !== null}>
          {busy === "seed" && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
          Seed demo data
        </Button>
        <Button size="sm" variant="ghost" onClick={runClear} disabled={busy !== null}>
          {busy === "clear" && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
          Clear demo data
        </Button>
      </div>
    </Card>
  );
}

function AddDoctorCard({ onAdded }: { onAdded: () => void }) {
  const promote = useServerFn(promoteToDoctor);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim()) return;
    if (isMockMode) return toast.info("Preview mode — changes aren't saved.");
    setBusy(true);
    try {
      await promote({ data: { email: email.trim() } });
      toast.success(`${email.trim()} can now sign in as a doctor.`);
      setEmail("");
      onAdded();
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't add doctor");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="mb-6 p-4">
      <p className="mb-2 text-sm font-semibold">Add a doctor</p>
      <p className="mb-3 text-xs text-muted-foreground">
        Grant doctor access to another account by email (they must have already signed up).
      </p>
      <div className="flex gap-2">
        <div className="flex-1">
          <Label className="sr-only">Email</Label>
          <Input
            type="email"
            placeholder="colleague@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button onClick={submit} disabled={busy}>
          Add
        </Button>
      </div>
    </Card>
  );
}
