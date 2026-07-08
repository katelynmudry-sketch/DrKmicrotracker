import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/app-shell";
import { FocusNutrientPicker } from "@/components/app/focus-nutrient-picker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { TrackedNutrient } from "@/lib/analysis.schema";
import { CUISINE_OPTIONS } from "@/lib/cuisines";

// Cultural relevance (docs/ETHOS.md principle 8): a patient's own cuisine or
// heritage, set once and remembered, so "Try something new" on the Patterns
// page and "Worth adding" on the grocery list lead with food close to home
// instead of a generic pantry list. Stored on users/{uid}.preferredCuisine,
// written via setPreferredCuisine (users.functions.ts) — same Admin-SDK,
// self-only pattern as detail level and focus nutrients below.
const NO_PREFERENCE = "none";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Dr. K's Kitchen" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const {
    doctorFocusNutrients,
    patientFocusNutrients,
    effectiveFocusNutrients,
    setPatientFocusNutrientsPreference,
    preferredCuisine,
    setPreferredCuisinePreference,
  } = useAuth();
  const [selected, setSelected] = useState<TrackedNutrient[]>(effectiveFocusNutrients);
  const [saving, setSaving] = useState(false);
  const [selectedCuisine, setSelectedCuisine] = useState<string>(preferredCuisine ?? NO_PREFERENCE);
  const [savingCuisine, setSavingCuisine] = useState(false);

  useEffect(() => {
    setSelected(effectiveFocusNutrients);
    // Only re-sync when the underlying preference actually changes, not on
    // every render (effectiveFocusNutrients is a new array each render).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorFocusNutrients, patientFocusNutrients]);

  useEffect(() => {
    setSelectedCuisine(preferredCuisine ?? NO_PREFERENCE);
  }, [preferredCuisine]);

  const save = async () => {
    setSaving(true);
    try {
      await setPatientFocusNutrientsPreference(selected);
      toast.success("Focus nutrients updated");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save focus nutrients");
    } finally {
      setSaving(false);
    }
  };

  const resetToDoctorDefault = async () => {
    setSaving(true);
    try {
      await setPatientFocusNutrientsPreference(null);
      toast.success("Reset to your doctor's picks");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to reset");
    } finally {
      setSaving(false);
    }
  };

  const saveCuisine = async () => {
    setSavingCuisine(true);
    try {
      await setPreferredCuisinePreference(
        selectedCuisine === NO_PREFERENCE ? null : selectedCuisine,
      );
      toast.success("Saved");
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't save");
    } finally {
      setSavingCuisine(false);
    }
  };

  return (
    <AppShell
      nav={
        <Button size="sm" variant="ghost" asChild>
          <Link to="/dashboard">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Your meals
          </Link>
        </Button>
      }
    >
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Your reading detail level lives in the header toggle above. Focus nutrients and your
          cuisine are yours to tune here.
        </p>
      </div>

      <Card className="mb-4 p-4">
        <p className="mb-1 text-sm font-semibold">Cuisine or heritage</p>
        <p className="mb-3 text-xs text-muted-foreground">
          Tell us a bit about your food background and we'll lead with suggestions that are actually
          close to home — not just a generic pantry list. Don't see it, or it's a blend of a few?
          There's a "Don't see food from your culture? Ask" option right on the Patterns page too.
        </p>
        <Select value={selectedCuisine} onValueChange={setSelectedCuisine}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_PREFERENCE}>No preference</SelectItem>
            {CUISINE_OPTIONS.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" className="mt-4" onClick={saveCuisine} disabled={savingCuisine}>
          Save
        </Button>
      </Card>

      <Card className="p-4">
        <p className="mb-1 text-sm font-semibold">Focus nutrients</p>
        <p className="mb-3 text-xs text-muted-foreground">
          Emphasized on every reading and in Simple mode. Every nutrient is still evaluated
          regardless of what's checked here.
        </p>
        <FocusNutrientPicker value={selected} onChange={setSelected} />
        <div className="mt-4 flex gap-2">
          <Button size="sm" onClick={save} disabled={saving}>
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={resetToDoctorDefault} disabled={saving}>
            Reset to your doctor's picks
          </Button>
        </div>
      </Card>
    </AppShell>
  );
}
