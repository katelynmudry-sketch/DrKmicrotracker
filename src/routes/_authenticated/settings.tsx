import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/hooks/use-auth";
import { isMockMode } from "@/lib/mock-mode";
import { AppShell } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { CUISINE_OPTIONS } from "@/lib/cuisines";

// Cultural relevance (docs/ETHOS.md principle 8): a patient's own cuisine or
// heritage, set once and remembered, so "Try something new" on the Patterns
// page and "Worth adding" on the grocery list lead with food close to home
// instead of a generic pantry list. Stored on users/{uid}.preferredCuisine —
// the only field a patient may write on their own profile doc (firestore.rules).
const NO_PREFERENCE = "none";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Dr. K's Kitchen" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, preferredCuisine } = useAuth();
  const [selected, setSelected] = useState<string>(preferredCuisine ?? NO_PREFERENCE);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelected(preferredCuisine ?? NO_PREFERENCE);
  }, [preferredCuisine]);

  const save = async () => {
    if (!user) return;
    if (isMockMode) return toast.info("Preview mode — nothing is saved.");
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        preferredCuisine: selected === NO_PREFERENCE ? null : selected,
      });
      toast.success("Saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save");
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
      <div className="mx-auto max-w-md">
        <h1 className="mb-1 text-xl font-semibold tracking-tight">Settings</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Tell us a bit about your food background and we'll lead with suggestions that are actually
          close to home — not just a generic pantry list.
        </p>
        <Card className="p-5">
          <p className="mb-2 text-sm font-medium">Cuisine or heritage</p>
          <Select value={selected} onValueChange={setSelected}>
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
          <p className="mt-2 text-xs text-muted-foreground">
            Don't see it, or it's a blend of a few? Leave this as-is — there's a "Don't see food
            from your culture? Ask" option right on the Patterns page too.
          </p>
          <Button className="mt-4" onClick={save} disabled={saving}>
            Save
          </Button>
        </Card>
      </div>
    </AppShell>
  );
}
