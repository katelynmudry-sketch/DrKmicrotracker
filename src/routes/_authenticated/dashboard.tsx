import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/integrations/firebase/client";
import { useAuth } from "@/hooks/use-auth";
import { isMockMode } from "@/lib/mock-mode";
import { mockMeals } from "@/lib/mock-data";
import { AppShell } from "@/components/app/app-shell";
import { MealPhoto } from "@/components/app/meal-photo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Camera, Loader2, Package, Sparkles, Stethoscope } from "lucide-react";
import { analyzeMeal } from "@/lib/meals.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Your meals — Nourish" }] }),
  component: PatientDashboard,
});

type Meal = {
  id: string;
  mealLabel: string | null;
  eatenAt: string;
  status: string;
  storagePath: string;
  analysis: unknown;
};

function PatientDashboard() {
  const { user, isDoctor } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const analyzeFn = useServerFn(analyzeMeal);
  const fileRef = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);

  const meals = useQuery({
    queryKey: ["meals", user?.uid],
    enabled: !!user,
    queryFn: async () => {
      if (isMockMode) return mockMeals as unknown as Meal[];
      const q = query(
        collection(db, "meals"),
        where("patientId", "==", user!.uid),
        orderBy("eatenAt", "desc"),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Meal);
    },
  });

  const upload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file || !user) return toast.error("Select a meal photo first");
    if (isMockMode) return toast.info("Preview mode — uploads aren't saved.");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `meal-photos/${user.uid}/${Date.now()}.${ext}`;
      await uploadBytes(ref(storage, path), file, { contentType: file.type });
      const mealRef = await addDoc(collection(db, "meals"), {
        patientId: user.uid,
        storagePath: path,
        mealLabel: label || null,
        patientNotes: notes || null,
        doctorNotes: null,
        status: "analyzing",
        analysis: null,
        eatenAt: new Date().toISOString(),
        createdAt: serverTimestamp(),
      });
      toast.success("Photo uploaded — analyzing…");
      setLabel("");
      setNotes("");
      if (fileRef.current) fileRef.current.value = "";
      qc.invalidateQueries({ queryKey: ["meals", user.uid] });
      analyzeFn({ data: { mealId: mealRef.id } })
        .then(() => {
          toast.success("Analysis ready");
          qc.invalidateQueries({ queryKey: ["meals", user.uid] });
        })
        .catch((e) => {
          toast.error(e?.message ?? "Analysis failed");
          updateDoc(doc(db, "meals", mealRef.id), { status: "failed" }).then(() => {
            qc.invalidateQueries({ queryKey: ["meals", user.uid] });
          });
        });
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <AppShell
      nav={
        <>
          <Button size="sm" variant="outline" asChild>
            <Link to="/pantry">
              <Package className="mr-1 h-4 w-4" />
              Pantry
            </Link>
          </Button>
          {isDoctor && (
            <Button size="sm" variant="outline" asChild>
              <Link to="/doctor">
                <Stethoscope className="mr-1 h-4 w-4" />
                Doctor view
              </Link>
            </Button>
          )}
        </>
      }
    >
      <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
        <Card className="h-fit p-5">
          <h2 className="mb-1 text-base font-semibold">Log a meal</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Snap or upload a photo. Analysis runs in the background.
          </p>
          <div className="space-y-3">
            <div>
              <Label className="mb-1.5">Photo</Label>
              <Input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
              />
            </div>
            <div>
              <Label className="mb-1.5">Label (optional)</Label>
              <Input
                placeholder="Lunch — Tuesday"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1.5">Notes</Label>
              <Textarea
                placeholder="How you felt, hunger, time of day…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
            <Button className="w-full" onClick={upload} disabled={uploading}>
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              Upload meal
            </Button>
          </div>
        </Card>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Your meal history</h2>
            <span className="text-xs text-muted-foreground">
              {meals.data?.length ?? 0} meals
            </span>
          </div>
          {meals.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !meals.data || meals.data.length === 0 ? (
            <Card className="grid place-items-center p-12 text-center">
              <Sparkles className="mb-3 h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-medium">No meals yet</p>
              <p className="text-xs text-muted-foreground">
                Upload your first meal photo to see your analysis here.
              </p>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {meals.data.map((m) => (
                <button
                  key={m.id}
                  onClick={() => navigate({ to: "/meals/$mealId", params: { mealId: m.id } })}
                  className="group overflow-hidden rounded-xl border border-border bg-card text-left transition hover:border-accent/50"
                >
                  <MealPhoto path={m.storagePath} className="h-40 w-full object-cover" />
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">
                          {m.mealLabel ?? "Untitled meal"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(m.eatenAt).toLocaleString()}
                        </p>
                      </div>
                      <StatusBadge status={m.status} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    analyzed: "bg-accent/15 text-accent-foreground",
    analyzing: "bg-secondary text-secondary-foreground",
    pending: "bg-secondary text-muted-foreground",
    failed: "bg-destructive/15 text-destructive",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${map[status] ?? "bg-secondary"}`}>
      {status}
    </span>
  );
}
