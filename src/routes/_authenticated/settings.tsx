import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/app-shell";
import { FocusNutrientPicker } from "@/components/app/focus-nutrient-picker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { TrackedNutrient } from "@/lib/analysis.schema";

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
  } = useAuth();
  const [selected, setSelected] = useState<TrackedNutrient[]>(effectiveFocusNutrients);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelected(effectiveFocusNutrients);
    // Only re-sync when the underlying preference actually changes, not on
    // every render (effectiveFocusNutrients is a new array each render).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorFocusNutrients, patientFocusNutrients]);

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
          Your reading detail level lives in the header toggle above. Focus nutrients are yours to
          tune here.
        </p>
      </div>
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
