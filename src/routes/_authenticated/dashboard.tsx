import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Camera, Loader2, NotebookPen, Sparkles, Stethoscope } from "lucide-react";
import { analyzeMeal } from "@/lib/meals.functions";
import { NUTRIENT_LABELS, TIER_LABELS, type Meal, type MealStatus } from "@/lib/analysis.schema";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Your meals — Dr. K's Kitchen" }] }),
  component: PatientDashboard,
});

const TextMealSchema = z.object({
  mealLabel: z.string().optional(),
  patientNotes: z.string().optional(),
  mealDescription: z.string().min(3, "Describe what you ate"),
});
type TextMealValues = z.infer<typeof TextMealSchema>;

function PatientDashboard() {
  const { user, isDoctor } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const analyzeFn = useServerFn(analyzeMeal);
  const fileRef = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);

  const textForm = useForm<TextMealValues>({
    resolver: zodResolver(TextMealSchema),
    defaultValues: { mealLabel: "", patientNotes: "", mealDescription: "" },
  });
  const [logging, setLogging] = useState(false);

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

  const afterLog = (mealId: string) => {
    qc.invalidateQueries({ queryKey: ["meals", user!.uid] });
    analyzeFn({ data: { mealId } })
      .then(() => {
        toast.success("Reading ready");
        qc.invalidateQueries({ queryKey: ["meals", user!.uid] });
      })
      .catch((e) => {
        // The server has already marked the meal "failed" with a reason
        // (status is server-owned — the client never writes it) — just
        // refetch so the badge reflects that, and let the patient retry
        // from the meal detail page.
        toast.error(e?.message ?? "Reading failed");
        qc.invalidateQueries({ queryKey: ["meals", user!.uid] });
      });
  };

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
        inputMethod: "photo",
        mealDescription: null,
        mealLabel: label || null,
        patientNotes: notes || null,
        doctorNotes: null,
        status: "pending",
        analysis: null,
        eatenAt: new Date().toISOString(),
        createdAt: serverTimestamp(),
      });
      toast.success("Photo uploaded — reading it now…");
      setLabel("");
      setNotes("");
      if (fileRef.current) fileRef.current.value = "";
      afterLog(mealRef.id);
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const logTextMeal = async (values: TextMealValues) => {
    if (!user) return;
    if (isMockMode) return toast.info("Preview mode — uploads aren't saved.");
    setLogging(true);
    try {
      const mealRef = await addDoc(collection(db, "meals"), {
        patientId: user.uid,
        storagePath: null,
        inputMethod: "text",
        mealDescription: values.mealDescription,
        mealLabel: values.mealLabel || null,
        patientNotes: values.patientNotes || null,
        doctorNotes: null,
        status: "pending",
        analysis: null,
        eatenAt: new Date().toISOString(),
        createdAt: serverTimestamp(),
      });
      toast.success("Meal logged — reading it now…");
      textForm.reset();
      afterLog(mealRef.id);
    } catch (e: any) {
      toast.error(e?.message ?? "Logging failed");
    } finally {
      setLogging(false);
    }
  };

  return (
    <AppShell
      nav={
        isDoctor ? (
          <Button size="sm" variant="outline" asChild>
            <Link to="/doctor">
              <Stethoscope className="mr-1 h-4 w-4" />
              Doctor view
            </Link>
          </Button>
        ) : null
      }
    >
      <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
        <Card className="h-fit p-5">
          <h2 className="mb-1 text-base font-semibold">Log a meal</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Snap a photo or describe what you ate. We'll have a reading ready shortly.
          </p>
          <Tabs defaultValue="photo">
            <TabsList className="mb-3 grid w-full grid-cols-2">
              <TabsTrigger value="photo">Photo</TabsTrigger>
              <TabsTrigger value="text">Describe instead</TabsTrigger>
            </TabsList>
            <TabsContent value="photo">
              <div className="space-y-3">
                <div>
                  <Label className="mb-1.5">Photo</Label>
                  <Input ref={fileRef} type="file" accept="image/*" capture="environment" />
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
            </TabsContent>
            <TabsContent value="text">
              <form className="space-y-3" onSubmit={textForm.handleSubmit(logTextMeal)}>
                <div>
                  <Label className="mb-1.5">What did you eat?</Label>
                  <Textarea
                    placeholder="2 eggs, 2 slices whole wheat toast, avocado, black coffee, about 1 plate"
                    rows={3}
                    {...textForm.register("mealDescription")}
                  />
                  {textForm.formState.errors.mealDescription && (
                    <p className="mt-1 text-xs text-destructive">
                      {textForm.formState.errors.mealDescription.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="mb-1.5">Label (optional)</Label>
                  <Input placeholder="Lunch — Tuesday" {...textForm.register("mealLabel")} />
                </div>
                <div>
                  <Label className="mb-1.5">Notes</Label>
                  <Textarea
                    placeholder="How you felt, hunger, time of day…"
                    rows={3}
                    {...textForm.register("patientNotes")}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={logging}>
                  {logging ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <NotebookPen className="h-4 w-4" />
                  )}
                  Log meal
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Your meal history</h2>
            <span className="text-xs text-muted-foreground">{meals.data?.length ?? 0} meals</span>
          </div>
          {meals.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !meals.data || meals.data.length === 0 ? (
            <Card className="grid place-items-center p-12 text-center">
              <Sparkles className="mb-3 h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-medium">No meals yet</p>
              <p className="text-xs text-muted-foreground">
                Upload your first meal photo to see its reading here.
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
                  {m.storagePath ? (
                    <MealPhoto path={m.storagePath} className="h-40 w-full object-cover" />
                  ) : (
                    <div className="grid h-40 w-full place-items-center bg-secondary">
                      <NotebookPen className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{m.mealLabel ?? "Untitled meal"}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(m.eatenAt).toLocaleString()}
                        </p>
                      </div>
                      <StatusBadge status={m.status} />
                    </div>
                    {m.analysis && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {attributePills(m).map((pill) => (
                          <span
                            key={pill}
                            className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-secondary-foreground"
                          >
                            {pill}
                          </span>
                        ))}
                      </div>
                    )}
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

// Attribute pills on meal cards — a quick, qualitative read at a glance.
// Leads with protocol fit, then the strongest micronutrient sources.
function attributePills(m: Meal): string[] {
  if (!m.analysis) return [];
  const pills = [TIER_LABELS[m.analysis.protocol_fit.tier]];
  m.analysis.micronutrients
    .filter((n) => n.level === "strong")
    .slice(0, 2)
    .forEach((n) => pills.push(`${NUTRIENT_LABELS[n.nutrient]}-rich`));
  return pills;
}

const STATUS_LABELS: Record<MealStatus, string> = {
  pending: "Logged",
  analyzing: "Reading…",
  analyzed: "Ready",
  failed: "Needs a retry",
};

function StatusBadge({ status }: { status: MealStatus }) {
  const map: Record<MealStatus, string> = {
    analyzed: "bg-accent/15 text-accent-foreground",
    analyzing: "bg-secondary text-secondary-foreground",
    pending: "bg-secondary text-muted-foreground",
    failed: "bg-destructive/15 text-destructive",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${map[status] ?? "bg-secondary"}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
