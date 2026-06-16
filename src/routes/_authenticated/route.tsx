import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { waitForAuthUser } from "@/integrations/firebase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const user = await waitForAuthUser();
    if (!user) throw redirect({ to: "/auth" });
    return { user };
  },
  component: () => <Outlet />,
});
