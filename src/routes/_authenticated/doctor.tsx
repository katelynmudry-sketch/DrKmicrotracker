import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { isMockMode, isInternalPreviewUnlocked } from "@/lib/mock-mode";

// Pure layout for /doctor/* — file-based routing nests doctor.rubrics.tsx and
// doctor.patient.$patientId.tsx under this route, so it must render <Outlet />
// for their content to appear at all. The actual /doctor index content
// (Patients list, "add a doctor" card) lives in doctor.index.tsx; each child
// route wraps itself in its own <AppShell>, so this layout stays unstyled.
export const Route = createFileRoute("/_authenticated/doctor")({
  beforeLoad: () => {
    // In mock mode, the doctor fixture view is only reachable via the
    // unlisted /internal-preview picker — a beta tester who guesses this URL
    // gets sent back to the live meal-reading demo instead.
    if (isMockMode && !isInternalPreviewUnlocked()) throw redirect({ to: "/dashboard" });
  },
  component: () => <Outlet />,
});
