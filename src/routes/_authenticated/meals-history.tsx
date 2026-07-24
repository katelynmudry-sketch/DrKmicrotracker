import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/hooks/use-auth";
import { isInternalPreviewUnlocked, isMockMode } from "@/lib/mock-mode";
import { mockMeals } from "@/lib/mock-data";
import { getLocalPreviewMeals } from "@/lib/preview-meals-store";
import { AppShell } from "@/components/app/app-shell";
import { MealPhoto } from "@/components/app/meal-photo";
import { Card } from "@/components/ui/card";
import { NotebookPen, Sparkles } from "lucide-react";
import { NUTRIENT_LABELS, TIER_LABELS, type Meal, type MealStatus } from "@/lib/analysis.schema";
import { mealTimingLabel } from "@/lib/meal-timing";

export const Route = createFileRoute("/_authenticated/meals-history")({
  head: () => ({ meta: [{ title: "Meals history — Vital Table" }] }),
  component: MealsHistoryPage,
});

function MealsHistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const meals = useQuery({
    queryKey: ["meals", user?.uid],
    enabled: !!user,
    queryFn: async () => {
      if (isMockMode) return isInternalPreviewUnlocked() ? mockMeals : getLocalPreviewMeals();
      const q = query(
        collection(db, "meals"),
        where("patientId", "==", user!.uid),
        orderBy("eatenAt", "desc"),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Meal);
    },
  });

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Meals history</h1>
        <span className="text-xs text-muted-foreground">{meals.data?.length ?? 0} meals</span>
      </div>
      {meals.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !meals.data || meals.data.length === 0 ? (
        <Card className="grid place-items-center p-12 text-center">
          <Sparkles className="mb-3 h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-medium">No meals yet</p>
          <p className="text-xs text-muted-foreground">
            Log your first meal from the Meal tab to see its reading here.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {meals.data.map((m) => (
            <button
              key={m.id}
              onClick={() => navigate({ to: "/meals/$mealId", params: { mealId: m.id } })}
              className="group overflow-hidden rounded-xl border border-border bg-card text-left transition hover:border-accent/50"
            >
              {m.storagePath ? (
                <MealPhoto path={m.storagePath} className="h-40 w-full object-cover" />
              ) : (
                <div className="grid h-40 w-full place-items-center bg-secondary">
                  <NotebookPen className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{m.mealLabel ?? "Untitled meal"}</p>
                    <p className="text-xs text-muted-foreground">
                      {mealTimingLabel(m)} · {new Date(m.eatenAt).toLocaleString()}
                    </p>
                  </div>
                  <StatusBadge status={m.status} />
                </div>
                {m.analysis && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {attributePills(m).map((pill) => (
                      <span
                        key={pill}
                        className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-secondary-foreground"
                      >
                        {pill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </AppShell>
  );
}

// Attribute pills on meal cards — a quick, qualitative read at a glance.
// Leads with protocol fit, then the strongest micronutrient sources.
function attributePills(m: Meal): string[] {
  if (!m.analysis) return [];
  const pills = [TIER_LABELS[m.analysis.protocol_fit.tier]];
  m.analysis.micronutrients
    .filter((n) => n.level === "strong")
    .slice(0, 2)
    .forEach((n) => pills.push(`${NUTRIENT_LABELS[n.nutrient]}-rich`));
  return pills;
}

const STATUS_LABELS: Record<MealStatus, string> = {
  pending: "Logged",
  analyzing: "Reading…",
  analyzed: "Ready",
  failed: "Needs a retry",
};

function StatusBadge({ status }: { status: MealStatus }) {
  const map: Record<MealStatus, string> = {
    analyzed: "bg-accent/15 text-accent-foreground",
    analyzing: "bg-secondary text-secondary-foreground",
    pending: "bg-secondary text-muted-foreground",
    failed: "bg-destructive/15 text-destructive",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${map[status] ?? "bg-secondary"}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
