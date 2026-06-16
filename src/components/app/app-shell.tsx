import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Leaf, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function AppShell({
  children,
  nav,
}: {
  children: ReactNode;
  nav?: ReactNode;
}) {
  const { user, isDoctor, signOut } = useAuth();
  const navigate = useNavigate();
  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/auth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-foreground">
              <Leaf className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight">Nourish</span>
          </Link>
          <div className="flex items-center gap-3">
            {nav}
            <span className="hidden text-xs text-muted-foreground md:inline">
              {user?.email} {isDoctor ? "· Doctor" : ""}
            </span>
            <Button size="sm" variant="ghost" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}