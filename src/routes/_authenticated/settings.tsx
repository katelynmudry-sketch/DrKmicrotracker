import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/app-shell";
import { FocusNutrientPicker } from "@/components/app/focus-nutrient-picker";
import { CheckboxOptionList } from "@/components/app/checkbox-option-list";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { TrackedNutrient } from "@/lib/analysis.schema";
import { CUISINE_OPTIONS, type Cuisine } from "@/lib/cuisines";

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
    currentRegions,
    setCurrentRegionsPreference,
    foodHeritage,
    setFoodHeritagePreference,
  } = useAuth();
  const [selected, setSelected] = useState<TrackedNutrient[]>(effectiveFocusNutrients);
  const [saving, setSaving] = useState(false);
  const [selectedRegions, setSelectedRegions] = useState<Cuisine[]>(currentRegions as Cuisine[]);
  const [savingRegions, setSavingRegions] = useState(false);
  const [selectedHeritage, setSelectedHeritage] = useState<Cuisine[]>(foodHeritage as Cuisine[]);
  const [savingHeritage, setSavingHeritage] = useState(false);

  useEffect(() => {
    setSelected(effectiveFocusNutrients);
    // Only re-sync when the underlying preference actually changes, not on
    // every render (effectiveFocusNutrients is a new array each render).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorFocusNutrients, patientFocusNutrients]);

  useEffect(() => {
    setSelectedRegions(currentRegions as Cuisine[]);
  }, [currentRegions]);

  useEffect(() => {
    setSelectedHeritage(foodHeritage as Cuisine[]);
  }, [foodHeritage]);

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

  const saveRegions = async () => {
    setSavingRegions(true);
    try {
      await setCurrentRegionsPreference(selectedRegions);
      toast.success("Saved");
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't save");
    } finally {
      setSavingRegions(false);
    }
  };

  const saveHeritage = async () => {
    setSavingHeritage(true);
    try {
      await setFoodHeritagePreference(selectedHeritage);
      toast.success("Saved");
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't save");
    } finally {
      setSavingHeritage(false);
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
          Your reading detail level lives in the header toggle above. Your doctor's focus nutrients,
          where you live, and your food heritage are yours to tune here.
        </p>
      </div>

      <Card className="mb-4 p-4">
        <p className="mb-1 text-sm font-semibold">Focus nutrients</p>
        <p className="mb-3 text-xs text-muted-foreground">
          Set by your doctor first, yours to fine-tune second. Emphasized on every reading and in
          Simple mode — every nutrient is still evaluated regardless of what's checked here.
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

      <Card className="mb-4 p-4">
        <p className="mb-1 text-sm font-semibold">Where you currently live</p>
        <p className="mb-3 text-xs text-muted-foreground">
          We'll lead with suggestions that are actually close to home — not just a generic pantry
          list. Pick as many as apply.
        </p>
        <CheckboxOptionList
          options={CUISINE_OPTIONS}
          value={selectedRegions}
          onChange={setSelectedRegions}
        />
        <Button size="sm" className="mt-4" onClick={saveRegions} disabled={savingRegions}>
          Save
        </Button>
      </Card>

      <Card className="p-4">
        <p className="mb-1 text-sm font-semibold">Food heritage</p>
        <p className="mb-3 text-xs text-muted-foreground">
          Tell us a bit about your food background and we'll lead with suggestions from it too.
          Don't see it, or it's a blend of a few? There's a "Don't see food from your culture? Ask"
          option right on the Patterns page.
        </p>
        <CheckboxOptionList
          options={CUISINE_OPTIONS}
          value={selectedHeritage}
          onChange={setSelectedHeritage}
        />
        <Button size="sm" className="mt-4" onClick={saveHeritage} disabled={savingHeritage}>
          Save
        </Button>
      </Card>
    </AppShell>
  );
}
