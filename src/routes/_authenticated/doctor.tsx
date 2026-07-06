import { createFileRoute, Outlet } from "@tanstack/react-router";

// Pure layout for /doctor/* — file-based routing nests doctor.rubrics.tsx and
// doctor.patient.$patientId.tsx under this route, so it must render <Outlet />
// for their content to appear at all. The actual /doctor index content
// (Patients list, "add a doctor" card) lives in doctor.index.tsx; each child
// route wraps itself in its own <AppShell>, so this layout stays unstyled.
export const Route = createFileRoute("/_authenticated/doctor")({
  component: () => <Outlet />,
});
