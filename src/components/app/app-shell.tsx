import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Archive, Leaf, LogOut, NotebookPen, ShoppingCart, Soup } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { isMockMode, isInternalPreviewUnlocked, setMockRole } from "@/lib/mock-mode";
import { arePantryFeaturesEnabled } from "@/lib/feature-flags";
import type { DetailLevel } from "@/lib/users.schema";

// Persistent top tabs — every patient screen except doctor-facing ones. See
// docs/PLAN.md for the wireframe this replaces per-page back-links with.
const TOP_TABS = [
  { to: "/meals-history", label: "Meals History" },
  { to: "/patterns", label: "Nutrient History" },
  { to: "/settings", label: "Settings" },
] as const;

// Bottom bar — each tab doubles as its section's "add" action (log a meal,
// add a grocery item, add a pantry item), per the product wireframe.
// Grocery/Pantry are gated behind arePantryFeaturesEnabled — not ready for
// the beta test yet (see docs/OWNER-TODO.md).
const BOTTOM_TABS = [
  { to: "/dashboard", label: "Analysis", icon: Soup },
  ...(arePantryFeaturesEnabled
    ? ([
        { to: "/grocery-list", label: "Grocery", icon: ShoppingCart },
        { to: "/pantry", label: "Pantry", icon: Archive },
      ] as const)
    : []),
] as const;

export function AppShell({ children, nav }: { children: ReactNode; nav?: ReactNode }) {
  const { user, isDoctor, signOut, detailLevel, setDetailLevelPreference } = useAuth();
  const navigate = useNavigate();
  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/auth" });
  };
  const switchMockRole = (role: "patient" | "doctor") => {
    setMockRole(role);
    navigate({ to: role === "doctor" ? "/doctor" : "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {isMockMode && isInternalPreviewUnlocked() && (
        <div className="flex items-center justify-center gap-2 bg-accent/10 px-4 py-1.5 text-xs text-accent-foreground">
          Preview mode — sample data, no backend connected.
          <button
            className={`underline ${!isDoctor ? "font-semibold" : ""}`}
            onClick={() => switchMockRole("patient")}
          >
            Patient view
          </button>
          ·
          <button
            className={`underline ${isDoctor ? "font-semibold" : ""}`}
            onClick={() => switchMockRole("doctor")}
          >
            Doctor view
          </button>
        </div>
      )}
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 -rotate-6 place-items-center rounded-lg bg-accent text-accent-foreground">
              <Leaf className="h-4 w-4" />
            </span>
            <span className="font-serif text-sm font-semibold tracking-tight">Vital Table</span>
          </Link>
          <div className="flex items-center gap-3">
            {!isDoctor && (
              <div className="flex items-center gap-2">
                <Link to="/dashboard">
                  <Button size="sm">
                    <NotebookPen className="h-4 w-4" />
                    Analysis
                  </Button>
                </Link>
                <span className="hidden text-[10px] text-muted-foreground sm:block">
                  or tap Analysis below
                </span>
              </div>
            )}
            {nav}
            <DetailLevelToggle detailLevel={detailLevel} onChange={setDetailLevelPreference} />
            <span className="hidden text-xs text-muted-foreground md:inline">
              {user?.email} {isDoctor ? "· Doctor" : ""}
            </span>
            <Button size="sm" variant="ghost" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {!isDoctor && (
          <nav className="mx-auto flex max-w-6xl px-6">
            {TOP_TABS.map((tab) => (
              <Link
                key={tab.to}
                to={tab.to}
                className="flex-1 border-b-2 border-transparent px-2 py-2.5 text-center text-xs font-semibold text-muted-foreground transition-colors sm:flex-none sm:px-4"
                activeProps={{ className: "!border-primary !text-primary" }}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        )}
      </header>
      <main className={`mx-auto max-w-6xl px-6 py-8 ${!isDoctor ? "pb-24" : ""}`}>{children}</main>
      {!isDoctor && (
        <nav className="fixed inset-x-0 bottom-0 border-t border-border bg-card/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl">
            {BOTTOM_TABS.map((tab) => (
              <Link
                key={tab.to}
                to={tab.to}
                className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold text-muted-foreground transition-colors"
                activeProps={{ className: "!text-primary" }}
              >
                <tab.icon className="h-[18px] w-[18px]" />
                {tab.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}

// A patient's default reading detail level — Simple (tiers only) or Detailed
// (tiers + approximate mg/mcg ranges). See docs/ETHOS.md principle 2. Each
// meal can still be viewed in the other mode without changing this default
// (see AnalysisView).
function DetailLevelToggle({
  detailLevel,
  onChange,
}: {
  detailLevel: DetailLevel;
  onChange: (next: DetailLevel) => void;
}) {
  return (
    <div className="flex items-center rounded-full bg-secondary p-0.5 text-xs">
      {(["simple", "detailed"] as const).map((level) => (
        <button
          key={level}
          onClick={() => onChange(level)}
          className={`rounded-full px-2.5 py-1 capitalize transition-colors ${
            detailLevel === level
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {level}
        </button>
      ))}
    </div>
  );
}
