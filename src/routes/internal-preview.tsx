import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { setMockRole, unlockInternalPreview } from "@/lib/mock-mode";
import { Button } from "@/components/ui/button";
import { Leaf } from "lucide-react";

// Unlisted on purpose — not linked from the landing page or any nav. Only
// reachable by typing this URL directly. This is Katelyn's own entry point
// for browsing fixture data as either role before full launch; public beta
// testers never see this page and land straight on /dashboard instead (see
// src/routes/index.tsx), where the live meal-reading demo runs with no
// "Preview mode" banner and no role switcher.
export const Route = createFileRoute("/internal-preview")({
  head: () => ({ meta: [{ title: "Internal preview — Vital Table" }] }),
  component: InternalPreviewPage,
});

function InternalPreviewPage() {
  const navigate = useNavigate();
  const enter = (role: "patient" | "doctor") => {
    unlockInternalPreview();
    setMockRole(role);
    navigate({ to: role === "doctor" ? "/doctor" : "/dashboard" });
  };
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-2">
          <span className="grid h-8 w-8 -rotate-6 place-items-center rounded-lg bg-accent text-accent-foreground">
            <Leaf className="h-4 w-4" />
          </span>
          <span className="font-serif text-base font-semibold tracking-tight">Vital Table</span>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="mb-1 text-sm font-semibold">Internal preview</p>
          <p className="mb-6 text-sm text-muted-foreground">
            Pick a view to browse the full UI with sample data — patients and their history, pantry,
            grocery list, and the doctor's review tools.
          </p>
          <div className="space-y-2">
            <Button className="w-full" onClick={() => enter("patient")}>
              Continue as patient
            </Button>
            <Button variant="outline" className="w-full" onClick={() => enter("doctor")}>
              Continue as doctor
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
