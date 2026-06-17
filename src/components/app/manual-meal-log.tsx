import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";
import type { FoodReferenceRow } from "@/lib/food-reference.functions";

type SelectedItem = { food_code: number; food_name: string; grams: number };

/**
 * "Analog mode" meal entry: search whole foods (CNF) and log grams directly,
 * no AI/photo involved. Mirrors the MyFitnessPal/Cronometer manual-log flow.
 */
export function ManualMealLog({
  onSearch,
  onLog,
}: {
  onSearch: (query: string) => Promise<FoodReferenceRow[]>;
  onLog: (items: SelectedItem[]) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodReferenceRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [items, setItems] = useState<SelectedItem[]>([]);
  const [logging, setLogging] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      setSearching(true);
      onSearch(query.trim())
        .then(setResults)
        .finally(() => setSearching(false));
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, onSearch]);

  const addItem = (food: FoodReferenceRow) => {
    setItems((prev) =>
      prev.some((i) => i.food_code === food.food_code)
        ? prev
        : [...prev, { food_code: food.food_code, food_name: food.food_name, grams: 100 }],
    );
    setQuery("");
    setResults([]);
  };

  const updateGrams = (food_code: number, grams: number) => {
    setItems((prev) => prev.map((i) => (i.food_code === food_code ? { ...i, grams } : i)));
  };

  const removeItem = (food_code: number) => {
    setItems((prev) => prev.filter((i) => i.food_code !== food_code));
  };

  const submit = async () => {
    if (items.length === 0) return;
    setLogging(true);
    try {
      await onLog(items);
      setItems([]);
    } finally {
      setLogging(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a whole food, e.g. tomato"
        />
        {searching && (
          <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {results.length > 0 && (
          <Card className="absolute z-10 mt-1 max-h-48 w-full overflow-auto p-1">
            {results.map((food) => (
              <button
                key={food.food_code}
                type="button"
                onClick={() => addItem(food)}
                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-secondary"
              >
                {food.food_name}
                <Plus className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            ))}
          </Card>
        )}
      </div>

      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.food_code}
              className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
            >
              <span className="flex-1">{item.food_name}</span>
              <Input
                type="number"
                value={item.grams}
                onChange={(e) => updateGrams(item.food_code, Number(e.target.value) || 0)}
                className="w-20"
              />
              <span className="text-xs text-muted-foreground">g</span>
              <Button size="sm" variant="ghost" onClick={() => removeItem(item.food_code)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Button
        className="w-full"
        variant="outline"
        onClick={submit}
        disabled={items.length === 0 || logging}
      >
        {logging ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        Log meal
      </Button>
    </div>
  );
}
