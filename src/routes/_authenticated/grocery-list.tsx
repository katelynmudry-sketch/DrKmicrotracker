import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/hooks/use-auth";
import { isMockMode } from "@/lib/mock-mode";
import { mockGroceryListItems, type MockGroceryListItem } from "@/lib/mock-data";
import { AppShell } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Plus } from "lucide-react";
import { addGroceryListItem, checkOffGroceryItem } from "@/lib/pantry.functions";

export const Route = createFileRoute("/_authenticated/grocery-list")({
  head: () => ({ meta: [{ title: "Grocery list — Nourish" }] }),
  component: GroceryListPage,
});

type GroceryItem = MockGroceryListItem;

const reasonLabel: Record<GroceryItem["reason"], string> = {
  depleted: "Ran out",
  "gap-fill": "Nutrient suggestion",
  manual: "Added by you",
};

function GroceryListPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const addFn = useServerFn(addGroceryListItem);
  const checkFn = useServerFn(checkOffGroceryItem);
  const [newItem, setNewItem] = useState("");

  const groceryItems = useQuery({
    queryKey: ["grocery-list", user?.uid],
    enabled: !!user,
    queryFn: async () => {
      if (isMockMode) return mockGroceryListItems;
      const q = query(
        collection(db, "grocery_list_items"),
        where("patientId", "==", user!.uid),
        orderBy("addedAt", "desc"),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as GroceryItem);
    },
  });

  const addItem = async () => {
    if (!newItem.trim()) return;
    if (isMockMode) return toast.info("Preview mode — items aren't saved.");
    try {
      await addFn({ data: { foodName: newItem.trim() } });
      setNewItem("");
      qc.invalidateQueries({ queryKey: ["grocery-list", user?.uid] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't add item");
    }
  };

  const checkOff = async (itemId: string) => {
    if (isMockMode) return toast.info("Preview mode — changes aren't saved.");
    await checkFn({ data: { itemId } });
    qc.invalidateQueries({ queryKey: ["grocery-list", user?.uid] });
  };

  const items = groceryItems.data ?? [];
  const unchecked = items.filter((i) => !i.checkedAt);
  const checked = items.filter((i) => i.checkedAt);

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
          Built from items you've used up, plus nutrient-gap suggestions.
        </p>

        <Card className="mb-4 flex gap-2 p-3">
          <Input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Add an item…"
            onKeyDown={(e) => e.key === "Enter" && addItem()}
          />
          <Button size="sm" onClick={addItem}>
            <Plus className="h-4 w-4" />
          </Button>
        </Card>

        {groceryItems.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <Card className="grid place-items-center p-12 text-center">
            <p className="text-sm font-medium">Your grocery list is empty</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {unchecked.map((item) => (
              <GroceryRow key={item.id} item={item} onCheck={() => checkOff(item.id)} />
            ))}
            {checked.length > 0 && (
              <>
                <p className="mt-4 mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Checked off
                </p>
                {checked.map((item) => (
                  <GroceryRow key={item.id} item={item} checkedDisplay onCheck={() => {}} />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function GroceryRow({
  item,
  onCheck,
  checkedDisplay,
}: {
  item: GroceryItem;
  onCheck: () => void;
  checkedDisplay?: boolean;
}) {
  return (
    <Card className={`flex items-center gap-3 p-3 ${checkedDisplay ? "opacity-50" : ""}`}>
      <Checkbox checked={!!item.checkedAt} onCheckedChange={() => !checkedDisplay && onCheck()} />
      <span className={`flex-1 text-sm ${item.checkedAt ? "line-through" : ""}`}>
        {item.foodName}
      </span>
      <Badge variant="secondary" className="text-[10px]">
        {reasonLabel[item.reason]}
      </Badge>
    </Card>
  );
}
