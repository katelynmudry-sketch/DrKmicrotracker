import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/hooks/use-auth";
import { isMockMode } from "@/lib/mock-mode";
import { mockGroceryListItems, mockMeals, mockPantryItems } from "@/lib/mock-data";
import { AppShell } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ArrowLeft, Plus } from "lucide-react";
import type { Meal, TrackedNutrient } from "@/lib/analysis.schema";
import type { GroceryListItem, PantryItem } from "@/lib/pantry.schema";
import { GROCERY_REASON_LABELS } from "@/lib/pantry.schema";
import { computeNutrientCoverage } from "@/lib/trends";
import { splitFoodsForNutrient, type NutrientFood } from "@/lib/nutrient-reference";
import { formatAmount, rdiProgressPhrase } from "@/lib/rdi-reference";

export const Route = createFileRoute("/_authenticated/grocery-list")({
  head: () => ({ meta: [{ title: "Grocery list — Dr. K's Kitchen" }] }),
  component: GroceryListPage,
});

function GroceryListPage() {
  const { user, preferredCuisine } = useAuth();
  const qc = useQueryClient();
  const [newItem, setNewItem] = useState("");

  const groceryItems = useQuery({
    queryKey: ["grocery-list", user?.uid],
    enabled: !!user,
    queryFn: async () => {
      if (isMockMode) return mockGroceryListItems;
      const q = query(collection(db, "grocery_list_items"), where("patientId", "==", user!.uid));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as GroceryListItem);
    },
  });

  const pantryItems = useQuery({
    queryKey: ["pantry-items", user?.uid],
    enabled: !!user,
    queryFn: async () => {
      if (isMockMode) return mockPantryItems;
      const q = query(collection(db, "pantry_items"), where("patientId", "==", user!.uid));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PantryItem);
    },
  });

  const meals = useQuery({
    queryKey: ["meals", user?.uid],
    enabled: !!user,
    queryFn: async () => {
      if (isMockMode) return mockMeals;
      const q = query(
        collection(db, "meals"),
        where("patientId", "==", user!.uid),
        orderBy("eatenAt", "desc"),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Meal);
    },
  });

  const invalidateList = () => qc.invalidateQueries({ queryKey: ["grocery-list", user?.uid] });

  const addItem = async (item: {
    name: string;
    reason: GroceryListItem["reason"];
    note?: string | null;
  }) => {
    if (!item.name.trim() || !user) return;
    if (isMockMode) return toast.info("Preview mode — items aren't saved.");
    try {
      await addDoc(collection(db, "grocery_list_items"), {
        patientId: user.uid,
        name: item.name.trim(),
        reason: item.reason,
        note: item.note ?? null,
        checkedAt: null,
        createdAt: serverTimestamp(),
      });
      invalidateList();
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't add item");
    }
  };

  const addManual = async () => {
    await addItem({ name: newItem, reason: "manual" });
    setNewItem("");
  };

  const checkOff = async (item: GroceryListItem) => {
    if (isMockMode) return toast.info("Preview mode — changes aren't saved.");
    await updateDoc(doc(db, "grocery_list_items", item.id), {
      checkedAt: item.checkedAt ? null : new Date().toISOString(),
    });
    invalidateList();
  };

  const items = groceryItems.data ?? [];
  const unchecked = items.filter((i) => !i.checkedAt);
  const checked = items.filter((i) => i.checkedAt);

  // "Worth adding" — nutrient gaps from recent readings, minus anything
  // already on the list or already sitting active in the pantry.
  const suggestions = useMemo(() => {
    if (!meals.data) return [];
    const activePantryNames = (pantryItems.data ?? [])
      .filter((p) => p.status === "active")
      .map((p) => p.name);
    const listedNames = new Set((groceryItems.data ?? []).map((i) => i.name.toLowerCase()));
    const gaps = computeNutrientCoverage(meals.data).filter((c) => c.isGap);
    const seen = new Set<string>();
    const suggested: (NutrientFood & { nutrient: TrackedNutrient })[] = [];
    for (const gap of gaps) {
      const { tryNew } = splitFoodsForNutrient(
        gap.nutrient,
        activePantryNames,
        3,
        preferredCuisine,
      );
      for (const food of tryNew) {
        const key = food.name.toLowerCase();
        if (seen.has(key) || listedNames.has(key)) continue;
        seen.add(key);
        suggested.push({ ...food, nutrient: gap.nutrient });
      }
    }
    return suggested;
  }, [meals.data, pantryItems.data, groceryItems.data, preferredCuisine]);

  return (
    <AppShell
      nav={
        <Button size="sm" variant="ghost" asChild>
          <Link to="/pantry">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Pantry
          </Link>
        </Button>
      }
    >
      <div className="mx-auto max-w-xl">
        <h1 className="mb-1 text-xl font-semibold tracking-tight">Grocery list</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Items you've marked used up, plus a few food-first ideas worth adding.
        </p>

        <Card className="mb-6 p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add an item…"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addManual()}
            />
            <Button onClick={addManual}>
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </div>
        </Card>

        {unchecked.length === 0 && checked.length === 0 ? (
          <Card className="mb-6 p-6 text-center text-sm text-muted-foreground">
            Nothing on your list yet.
          </Card>
        ) : (
          <div className="mb-6 space-y-2">
            {unchecked.map((item) => (
              <label
                key={item.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
              >
                <Checkbox checked={false} onCheckedChange={() => checkOff(item)} />
                <span className="flex-1 text-sm">{item.name}</span>
                <span className="text-[11px] text-muted-foreground">
                  {GROCERY_REASON_LABELS[item.reason]}
                </span>
              </label>
            ))}
            {checked.map((item) => (
              <label
                key={item.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-secondary/40 px-3 py-2"
              >
                <Checkbox checked={true} onCheckedChange={() => checkOff(item)} />
                <span className="flex-1 text-sm text-muted-foreground line-through">
                  {item.name}
                </span>
              </label>
            ))}
          </div>
        )}

        {suggestions.length > 0 && (
          <Card className="p-4">
            <p className="mb-1 text-sm font-semibold">Worth adding</p>
            <p className="mb-3 text-xs text-muted-foreground">
              Food-first ideas from your recent Patterns — see the Patterns page for why.
            </p>
            <div className="space-y-2">
              {suggestions.map((s) => (
                <div key={s.name} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{s.name}</span>
                    <span className="text-muted-foreground"> — {s.reason}</span>
                    {s.amount != null && (
                      <p className="text-xs text-muted-foreground">
                        {s.servingSize ? `${s.servingSize} · ` : ""}
                        about {formatAmount(s.nutrient, s.amount)} —{" "}
                        {rdiProgressPhrase(s.nutrient, s.amount)}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      addItem({ name: s.name, reason: "gap_suggestion", note: s.reason })
                    }
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
