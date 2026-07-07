import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { suggestCulturalFoods } from "@/lib/cultural-food.functions";
import type { TrackedNutrient } from "@/lib/analysis.schema";
import type { NutrientFood } from "@/lib/nutrient-reference";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// Ties the AI fallback (src/lib/cultural-food.functions.ts) into the "Try
// something new" gap suggestions — for when a patient's own cuisine or
// region isn't in the hand-curated list yet (docs/ETHOS.md's cultural-
// relevance principle, src/lib/nutrient-reference.ts).
export function CulturalFoodSuggest({ nutrient }: { nutrient: TrackedNutrient }) {
  const suggestFn = useServerFn(suggestCulturalFoods);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<NutrientFood[] | null>(null);

  const submit = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    try {
      const { items } = await suggestFn({ data: { nutrient, cuisineOrRegion: query.trim() } });
      if (items.length === 0) {
        toast.info("We couldn't quite find a match — worth asking Dr. K directly.");
      }
      setResults(items);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't reach the suggestion tool");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 text-[11px] font-medium text-accent-foreground underline underline-offset-2"
      >
        Don't see food from your culture? Ask
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-1.5">
      {!results && (
        <div className="flex gap-1.5">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="e.g. Ukrainian, Gujarati, Yoruba…"
            className="h-8 text-xs"
            autoFocus
          />
          <Button size="sm" className="h-8 shrink-0" onClick={submit} disabled={loading}>
            {loading ? "…" : "Ask"}
          </Button>
        </div>
      )}
      {results && results.length > 0 && (
        <ul className="space-y-1.5 text-sm">
          {results.map((f) => (
            <li key={f.name}>
              <span className="font-medium">{f.name}</span>
              <span className="text-muted-foreground"> — {f.reason}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
