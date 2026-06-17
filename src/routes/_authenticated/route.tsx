import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { isMockMode } from "@/lib/mock-mode";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    if (isMockMode) return { user: null };
    const { waitForAuthUser } = await import("@/integrations/firebase/client");
    const user = await waitForAuthUser();
    if (!user) throw redirect({ to: "/auth" });
    return { user };
  },
  component: () => <Outlet />,
});
