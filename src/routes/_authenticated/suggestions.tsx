import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { isMockMode } from "@/lib/mock-mode";
import { mockNutrientSuggestions } from "@/lib/mock-data";
import { AppShell } from "@/components/app/app-shell";
import { NutrientGapBar } from "@/components/app/nutrient-gap-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";
import { getNutrientSuggestions, type NutrientSuggestion } from "@/lib/suggestions.functions";

export const Route = createFileRoute("/_authenticated/suggestions")({
  head: () => ({ meta: [{ title: "Nutrient suggestions — Nourish" }] }),
  component: SuggestionsPage,
});

function SuggestionsPage() {
  const { user } = useAuth();
  const suggestFn = useServerFn(getNutrientSuggestions);

  const suggestions = useQuery({
    queryKey: ["nutrient-suggestions", user?.uid],
    enabled: !!user,
    queryFn: async () => {
      if (isMockMode) return mockNutrientSuggestions as NutrientSuggestion[];
      const result = await suggestFn({ data: {} });
      return result.suggestions;
    },
  });

  const data = suggestions.data ?? [];

  return (
    <AppShell
      nav={
        <Button size="sm" variant="ghost" asChild>
          <Link to="/dashboard">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Meals
          </Link>
        </Button>
      }
    >
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-1 text-xl font-semibold tracking-tight">Nutrient suggestions</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Based on your recent meals — foods in your pantry first, then new foods to try.
        </p>

        {suggestions.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : data.length === 0 ? (
          <Card className="grid place-items-center p-12 text-center">
            <Sparkles className="mb-3 h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-medium">No gaps detected</p>
            <p className="text-xs text-muted-foreground">
              Log a few more meals to see personalized nutrient suggestions.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {data.map((s) => (
              <Card key={s.nutrient} className="p-5">
                <NutrientGapBar nutrient={s.nutrient} avgDailyValuePct={s.avgDailyValuePct} />
                <div className="mt-4 space-y-3">
                  <FoodList
                    title="In your pantry"
                    items={s.basicTier}
                    emptyText="None of your pantry items are a strong source — see new ideas below."
                  />
                  {s.expandedTier.length > 0 && (
                    <FoodList title="Try something new" items={s.expandedTier} badge />
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function FoodList({
  title,
  items,
  emptyText,
  badge,
}: {
  title: string;
  items: Array<{ food_code: number; food_name: string; amount: number | null }>;
  emptyText?: string;
  badge?: boolean;
}) {
  if (items.length === 0) {
    return emptyText ? <p className="text-xs text-muted-foreground">{emptyText}</p> : null;
  }
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li
            key={item.food_code}
            className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
          >
            <span>{item.food_name}</span>
            {badge && (
              <Badge variant="outline" className="text-[10px]">
                New
              </Badge>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
