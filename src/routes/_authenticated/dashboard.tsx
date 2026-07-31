import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/integrations/firebase/client";
import { useAuth } from "@/hooks/use-auth";
import { isMockMode, previewAiRunsRemaining, recordPreviewAiRun, PREVIEW_AI_DAILY_LIMIT } from "@/lib/mock-mode";
import { AppShell } from "@/components/app/app-shell";
import { AnalysisView } from "@/components/app/analysis-view";
import { DownloadReadingPdf } from "@/components/app/download-reading-pdf";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Camera, Loader2, NotebookPen, Upload, X } from "lucide-react";
import { analyzeMeal } from "@/lib/meals.functions";
import { analyzeMealPreview } from "@/lib/meals-preview.functions";
import { addLocalPreviewMeal } from "@/lib/preview-meals-store";
import { fileToBase64 } from "@/lib/file-base64";
import {
  NUTRIENT_LABELS,
  TIER_LABELS,
  type Meal,
  type MealStatus,
  type MealAnalysis,
} from "@/lib/analysis.schema";
import { errorMessage } from "@/lib/error-message";
import { prepareImage } from "@/lib/image-prep";
import {
  MEAL_TIMINGS,
  MEAL_TIMING_LABELS,
  inferMealTiming,
  toDatetimeLocalValue,
  type MealTiming,
} from "@/lib/meal-timing";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Your meals — Vital Table" }] }),
  component: PatientDashboard,
});

const TextMealSchema = z.object({
  mealLabel: z.string().optional(),
  patientNotes: z.string().optional(),
  mealDescription: z.string().min(3, "Describe what you ate"),
});
type TextMealValues = z.infer<typeof TextMealSchema>;

function PatientDashboard() {
  const { user, detailLevel, effectiveFocusNutrients } = useAuth();
  const qc = useQueryClient();
  const analyzeFn = useServerFn(analyzeMeal);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"photo" | "text">("photo");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  // Preview mode's real-AI demo path: never Firestore (no account to write
  // it against), but it is mirrored into localStorage for the rest of today
  // (see preview-meals-store.ts) so Nutrient History/Meals History can show
  // it. That local copy resets at midnight — download/screenshot for
  // anything longer-lived.
  const [previewAnalysis, setPreviewAnalysis] = useState<MealAnalysis | null>(null);
  const analyzePreviewFn = useServerFn(analyzeMealPreview);

  // Give the patient a visual confirmation that their photo was picked up —
  // without this the only feedback was a line of text below a large button,
  // easy to miss and read as "nothing happened".
  useEffect(() => {
    if (!photoFile) {
      setPhotoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const clearPhoto = () => {
    setPhotoFile(null);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Shared between both tabs — when a meal was eaten. Defaults to right now;
  // the patient can move it, and the breakfast/lunch/dinner/snack guess
  // re-derives from whatever time they land on, unless they've since tapped a
  // label directly (timingTouched).
  const [eatenAt, setEatenAt] = useState(() => new Date());
  const [mealTiming, setMealTiming] = useState<MealTiming>(() => inferMealTiming(new Date()));
  const [timingTouched, setTimingTouched] = useState(false);

  const handleTimeChange = (value: string) => {
    if (!value) return;
    const next = new Date(value);
    if (Number.isNaN(next.getTime())) return;
    setEatenAt(next);
    if (!timingTouched) setMealTiming(inferMealTiming(next));
  };

  const handleTimingChange = (timing: MealTiming) => {
    setTimingTouched(true);
    setMealTiming(timing);
  };

  const resetTiming = () => {
    const now = new Date();
    setEatenAt(now);
    setMealTiming(inferMealTiming(now));
    setTimingTouched(false);
  };

  const textForm = useForm<TextMealValues>({
    resolver: zodResolver(TextMealSchema),
    defaultValues: { mealLabel: "", patientNotes: "", mealDescription: "" },
  });
  const [logging, setLogging] = useState(false);

  const previewAiCapReached = isMockMode && previewAiRunsRemaining() <= 0;

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
        toast.error(errorMessage(e, "Reading failed"));
        qc.invalidateQueries({ queryKey: ["meals", user!.uid] });
      });
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPhotoFile(file);
  };

  const runPreviewReading = async (
    input:
      | { inputMethod: "text"; mealDescription: string; mealLabel?: string; patientNotes?: string }
      | {
          inputMethod: "photo";
          base64: string;
          mime: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
          mealLabel?: string;
          patientNotes?: string;
        },
  ) => {
    if (previewAiRunsRemaining() <= 0) {
      toast.info(`You've reached today's ${PREVIEW_AI_DAILY_LIMIT} readings on this device — come back tomorrow.`);
      return;
    }
    // Incremented before the call, not after success — a failed reading
    // still spends tokens, so the cap has to bound attempts.
    recordPreviewAiRun();
    setUploading(true);
    setPreviewAnalysis(null);
    try {
      const result = await analyzePreviewFn({ data: input });
      setPreviewAnalysis(result.analysis);
      addLocalPreviewMeal(result.analysis, {
        inputMethod: input.inputMethod,
        mealLabel: input.mealLabel,
        mealDescription: input.inputMethod === "text" ? input.mealDescription : undefined,
        patientNotes: input.patientNotes,
        eatenAt,
        mealTiming,
      });
      qc.invalidateQueries({ queryKey: ["meals", user!.uid] });
      setLabel("");
      setNotes("");
      clearPhoto();
      textForm.reset();
    } catch (e: any) {
      toast.error(e?.message ?? "Reading failed");
    } finally {
      setUploading(false);
    }
  };

  const upload = async () => {
    const file = photoFile;
    if (!file || !user) return toast.error("Select a meal photo first");
    if (isMockMode) {
      const base64 = await fileToBase64(file);
      const mime = (file.type || "image/jpeg") as "image/jpeg" | "image/png" | "image/webp" | "image/gif";
      return runPreviewReading({
        inputMethod: "photo",
        base64,
        mime,
        mealLabel: label || undefined,
        patientNotes: notes || undefined,
      });
    }
    setUploading(true);
    try {
      // Re-encode as downscaled JPEG — iPhone pickers hand us HEIC, which the
      // reading model can't accept.
      const photo = await prepareImage(file);
      const path = `meal-photos/${user.uid}/${Date.now()}.jpg`;
      await uploadBytes(ref(storage, path), photo, { contentType: "image/jpeg" });
      const mealRef = await addDoc(collection(db, "meals"), {
        patientId: user.uid,
        storagePath: path,
        inputMethod: "photo",
        mealDescription: null,
        mealLabel: label || null,
        mealTiming,
        patientNotes: notes || null,
        doctorNotes: null,
        status: "pending",
        analysis: null,
        eatenAt: eatenAt.toISOString(),
        createdAt: serverTimestamp(),
      });
      toast.success("Photo uploaded — reading it now…");
      setLabel("");
      setNotes("");
      clearPhoto();
      resetTiming();
      afterLog(mealRef.id);
    } catch (e) {
      toast.error(errorMessage(e, "Upload failed"));
    } finally {
      setUploading(false);
    }
  };

  const logTextMeal = async (values: TextMealValues) => {
    if (!user) return;
    if (isMockMode) {
      return runPreviewReading({
        inputMethod: "text",
        mealDescription: values.mealDescription,
        mealLabel: values.mealLabel || undefined,
        patientNotes: values.patientNotes || undefined,
      });
    }
    setLogging(true);
    try {
      const mealRef = await addDoc(collection(db, "meals"), {
        patientId: user.uid,
        storagePath: null,
        inputMethod: "text",
        mealDescription: values.mealDescription,
        mealLabel: values.mealLabel || null,
        mealTiming,
        patientNotes: values.patientNotes || null,
        doctorNotes: null,
        status: "pending",
        analysis: null,
        eatenAt: eatenAt.toISOString(),
        createdAt: serverTimestamp(),
      });
      toast.success("Meal logged — reading it now…");
      textForm.reset();
      resetTiming();
      afterLog(mealRef.id);
    } catch (e) {
      toast.error(errorMessage(e, "Logging failed"));
    } finally {
      setLogging(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-md">
        <Card className="p-5">
          <div className="mb-5 space-y-2">
            <Label className="mb-1.5">When did you eat this?</Label>
            <Input
              type="datetime-local"
              value={toDatetimeLocalValue(eatenAt)}
              onChange={(e) => handleTimeChange(e.target.value)}
            />
            <div className="flex flex-wrap gap-1.5">
              {MEAL_TIMINGS.map((timing) => (
                <button
                  key={timing}
                  type="button"
                  onClick={() => handleTimingChange(timing)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                    mealTiming === timing
                      ? "bg-accent/15 text-accent-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {MEAL_TIMING_LABELS[timing]}
                </button>
              ))}
            </div>
          </div>

          {mode === "photo" ? (
            <div className="flex flex-col items-center gap-4 py-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="grid h-40 w-40 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg transition hover:brightness-110"
              >
                <Camera className="mb-1.5 h-9 w-9" />
                <span className="px-6 text-center text-sm font-semibold leading-tight">
                  Snap your bowl, plate, or the stove
                </span>
              </button>
              <p className="max-w-[240px] text-center text-xs text-muted-foreground">
                We'll read what's there and help you round it out — same reading, just a look at it
                before you eat.
              </p>
              {detailLevel === "detailed" && (
                <p className="max-w-[260px] text-center text-xs text-muted-foreground">
                  Tip: pop a spoon, coin, credit card, or your hand next to the plate — it helps us
                  judge portion size more precisely.
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-1 h-3.5 w-3.5" />
                  Upload a photo instead
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setMode("text")}>
                  Describe instead
                </Button>
              </div>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileSelect}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />

              {photoFile && (
                <div className="w-full space-y-3 border-t border-border pt-4">
                  <div className="relative overflow-hidden rounded-lg border border-border">
                    {photoPreviewUrl && (
                      <img
                        src={photoPreviewUrl}
                        alt="Selected meal"
                        className="max-h-64 w-full object-contain bg-secondary"
                      />
                    )}
                    <button
                      type="button"
                      onClick={clearPhoto}
                      aria-label="Remove photo"
                      className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-background/90 text-foreground shadow"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div>
                    <Label className="mb-1.5">Label (optional)</Label>
                    <Input
                      placeholder="…"
                      className="placeholder:text-muted-foreground/40"
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
                  <Button
                    className="w-full"
                    onClick={upload}
                    disabled={uploading || previewAiCapReached}
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                    Upload meal
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <form className="space-y-3" onSubmit={textForm.handleSubmit(logTextMeal)}>
              <div className="flex items-center justify-between">
                <Label className="mb-1.5">What did you eat?</Label>
                <Button type="button" size="sm" variant="ghost" onClick={() => setMode("photo")}>
                  <Camera className="mr-1 h-3.5 w-3.5" />
                  Take a photo instead
                </Button>
              </div>
              <Textarea
                placeholder="…"
                className="placeholder:text-muted-foreground/40"
                rows={3}
                {...textForm.register("mealDescription")}
              />
              {textForm.formState.errors.mealDescription && (
                <p className="mt-1 text-xs text-destructive">
                  {textForm.formState.errors.mealDescription.message}
                </p>
              )}
              <div>
                <Label className="mb-1.5">Label (optional)</Label>
                <Input
                  placeholder="…"
                  className="placeholder:text-muted-foreground/40"
                  {...textForm.register("mealLabel")}
                />
              </div>
              <div>
                <Label className="mb-1.5">Notes</Label>
                <Textarea
                  placeholder="How you felt, hunger, time of day…"
                  rows={3}
                  {...textForm.register("patientNotes")}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={logging || uploading || previewAiCapReached}
              >
                {logging || uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <NotebookPen className="h-4 w-4" />
                )}
                Analysis
              </Button>
            </form>
          )}
          {isMockMode && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {previewAiCapReached
                ? `You've used today's ${PREVIEW_AI_DAILY_LIMIT} readings on this device — come back tomorrow`
                : `${previewAiRunsRemaining()} of ${PREVIEW_AI_DAILY_LIMIT} readings left today on this device`}
            </p>
          )}
        </Card>

        {isMockMode && previewAnalysis && (
          <Card className="printable-reading mt-4 p-5">
            <div className="mb-4 space-y-3 print:hidden">
              <p className="rounded-lg bg-secondary p-3 text-xs text-muted-foreground">
                This reading is saved on this device for today only — download a copy or take a
                screenshot to keep it longer.
              </p>
              <DownloadReadingPdf />
            </div>
            <AnalysisView
              analysis={previewAnalysis}
              editable={false}
              initialDetailLevel={detailLevel}
              focusNutrients={effectiveFocusNutrients}
            />
          </Card>
        )}
      </div>
    </AppShell>
  );
}
