import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/hooks/use-auth";
import { isMockMode } from "@/lib/mock-mode";
import { mockPantryItems } from "@/lib/mock-data";
import { AppShell } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Plus, RotateCcw, ShoppingCart, Trash2 } from "lucide-react";
import type { PantryItem } from "@/lib/pantry.schema";

export const Route = createFileRoute("/_authenticated/pantry")({
  head: () => ({ meta: [{ title: "Your pantry — Dr. K's Kitchen" }] }),
  component: PantryPage,
});

function PantryPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);

  const items = useQuery({
    queryKey: ["pantry-items", user?.uid],
    enabled: !!user,
    queryFn: async () => {
      if (isMockMode) return mockPantryItems;
      // Equality-only filter (no orderBy) — keeps this off the composite
      // index list; sorted client-side instead.
      const q = query(collection(db, "pantry_items"), where("patientId", "==", user!.uid));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PantryItem);
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["pantry-items", user?.uid] });

  const addItem = async () => {
    if (!name.trim() || !user) return;
    if (isMockMode) return toast.info("Preview mode — items aren't saved.");
    setAdding(true);
    try {
      await addDoc(collection(db, "pantry_items"), {
        patientId: user.uid,
        name: name.trim(),
        status: "active",
        createdAt: serverTimestamp(),
      });
      setName("");
      invalidate();
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't add item");
    } finally {
      setAdding(false);
    }
  };

  const markUsedUp = async (item: PantryItem) => {
    if (isMockMode) return toast.info("Preview mode — changes aren't saved.");
    try {
      await updateDoc(doc(db, "pantry_items", item.id), { status: "used_up" });
      // Avoid piling up duplicate grocery entries if it's marked used up more
      // than once before being restocked.
      const existing = await getDocs(
        query(
          collection(db, "grocery_list_items"),
          where("patientId", "==", user!.uid),
          where("name", "==", item.name),
          where("reason", "==", "used_up"),
        ),
      );
      const alreadyOnList = existing.docs.some((d) => d.data().checkedAt == null);
      if (!alreadyOnList) {
        await addDoc(collection(db, "grocery_list_items"), {
          patientId: user!.uid,
          name: item.name,
          reason: "used_up",
          note: null,
          checkedAt: null,
          createdAt: serverTimestamp(),
        });
      }
      toast.success("Marked used up — added to your grocery list");
      invalidate();
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't update that item");
    }
  };

  const restock = async (item: PantryItem) => {
    if (isMockMode) return toast.info("Preview mode — changes aren't saved.");
    await updateDoc(doc(db, "pantry_items", item.id), { status: "active" });
    invalidate();
  };

  const remove = async (item: PantryItem) => {
    if (isMockMode) return toast.info("Preview mode — changes aren't saved.");
    await deleteDoc(doc(db, "pantry_items", item.id));
    invalidate();
  };

  const active = (items.data ?? []).filter((i) => i.status === "active");
  const usedUp = (items.data ?? []).filter((i) => i.status === "used_up");

  return (
    <AppShell
      nav={
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link to="/grocery-list">
              <ShoppingCart className="mr-1 h-4 w-4" />
              Grocery list
            </Link>
          </Button>
          <Button size="sm" variant="ghost" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Your meals
            </Link>
          </Button>
        </div>
      }
    >
      <div className="mx-auto max-w-xl">
        <h1 className="mb-1 text-xl font-semibold tracking-tight">Your pantry</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Keep a running list of what's on hand — it helps "Try something new" suggestions on your
          Patterns page tell what you already have from what's worth a grocery trip.
        </p>

        <Card className="mb-6 p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add an item — pumpkin seeds, oats, eggs…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
            />
            <Button onClick={addItem} disabled={adding}>
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </div>
        </Card>

        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          On hand ({active.length})
        </p>
        {active.length === 0 ? (
          <p className="mb-6 text-sm text-muted-foreground">Nothing on hand yet — add above.</p>
        ) : (
          <div className="mb-6 space-y-2">
            {active.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2"
              >
                <span className="text-sm">{item.name}</span>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => markUsedUp(item)}>
                    Mark used up
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(item)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {usedUp.length > 0 && (
          <>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Used up ({usedUp.length})
            </p>
            <div className="space-y-2">
              {usedUp.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-3 py-2"
                >
                  <span className="text-sm text-muted-foreground">{item.name}</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => restock(item)}>
                      <RotateCcw className="mr-1 h-3 w-3" />
                      Restocked
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(item)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
