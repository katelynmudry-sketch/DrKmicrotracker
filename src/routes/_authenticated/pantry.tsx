import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  addDoc,
  collection,
  deleteDoc,
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
import { isMockMode, isInternalPreviewUnlocked } from "@/lib/mock-mode";
import { arePantryFeaturesEnabled } from "@/lib/feature-flags";
import { mockPantryItems, mockMeals } from "@/lib/mock-data";
import {
  getLocalPantryItems,
  addLocalPantryItem,
  addLocalPantryItems,
  markLocalPantryItemUsedUp,
  restockLocalPantryItem,
  removeLocalPantryItem,
} from "@/lib/preview-pantry-store";
import { getLocalPreviewMeals } from "@/lib/preview-meals-store";
import { computeNutrientCoverage } from "@/lib/trends";
import { splitFoodsByStorage, type NutrientFood } from "@/lib/nutrient-reference";
import { formatAmount, rdiProgressPhrase } from "@/lib/rdi-reference";
import { AppShell } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmPantryItems } from "@/components/app/confirm-pantry-items";
import { VoiceCapture } from "@/components/app/voice-capture";
import { toast } from "sonner";
import { Camera, Loader2, Plus, RotateCcw, Trash2 } from "lucide-react";
import type { PantryItem } from "@/lib/pantry.schema";
import type { Meal, TrackedNutrient } from "@/lib/analysis.schema";
import { fileToBase64 } from "@/lib/file-base64";
import { scanPantryPhoto, parsePantryVoiceText } from "@/lib/pantry-scan.functions";
import { scanPantryPhotoPreview, parsePantryVoiceTextPreview } from "@/lib/pantry-scan-preview.functions";

export const Route = createFileRoute("/_authenticated/pantry")({
  head: () => ({ meta: [{ title: "Your pantry — Vital Table" }] }),
  beforeLoad: () => {
    if (!arePantryFeaturesEnabled) throw redirect({ to: "/dashboard" });
  },
  component: PantryPage,
});

function PantryPage() {
  const { user, effectiveCuisines } = useAuth();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);

  const scanFn = useServerFn(scanPantryPhoto);
  const parseVoiceFn = useServerFn(parsePantryVoiceText);
  const scanPreviewFn = useServerFn(scanPantryPhotoPreview);
  const parseVoicePreviewFn = useServerFn(parsePantryVoiceTextPreview);
  const fileRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [parsingVoice, setParsingVoice] = useState(false);
  const [pendingItems, setPendingItems] = useState<string[] | null>(null);
  const [confirming, setConfirming] = useState(false);

  const items = useQuery({
    queryKey: ["pantry-items", user?.uid],
    enabled: !!user,
    queryFn: async () => {
      if (isMockMode) return isInternalPreviewUnlocked() ? mockPantryItems : getLocalPantryItems();
      // Equality-only filter (no orderBy) — keeps this off the composite
      // index list; sorted client-side instead.
      const q = query(collection(db, "pantry_items"), where("patientId", "==", user!.uid));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PantryItem);
    },
  });

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

  // Dried/shelf-stable nutrient-gap suggestions only — fresh/fridge gaps
  // show on the Grocery page instead (grocery-list.tsx). Minus anything
  // already sitting active in the pantry.
  const suggestions = useMemo(() => {
    if (!meals.data) return [];
    const activePantryNames = (items.data ?? [])
      .filter((p) => p.status === "active")
      .map((p) => p.name);
    const gaps = computeNutrientCoverage(meals.data).filter((c) => c.isGap);
    const seen = new Set<string>();
    const suggested: (NutrientFood & { nutrient: TrackedNutrient })[] = [];
    for (const gap of gaps) {
      const { tryNew } = splitFoodsByStorage(
        gap.nutrient,
        "dried",
        activePantryNames,
        3,
        effectiveCuisines,
      );
      for (const food of tryNew) {
        const key = food.name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        suggested.push({ ...food, nutrient: gap.nutrient });
      }
    }
    return suggested;
  }, [meals.data, items.data, effectiveCuisines]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["pantry-items", user?.uid] });

  const addItem = async () => {
    if (!name.trim() || !user) return;
    if (isMockMode) {
      if (isInternalPreviewUnlocked()) return toast.info("Preview mode — items aren't saved.");
      addLocalPantryItem(name.trim());
      setName("");
      invalidate();
      return;
    }
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
    if (isMockMode) {
      if (isInternalPreviewUnlocked()) return toast.info("Preview mode — changes aren't saved.");
      markLocalPantryItemUsedUp(item.id);
      toast.success("Marked used up — added to your grocery list");
      invalidate();
      return;
    }
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
    if (isMockMode) {
      if (isInternalPreviewUnlocked()) return toast.info("Preview mode — changes aren't saved.");
      restockLocalPantryItem(item.id);
      invalidate();
      return;
    }
    await updateDoc(doc(db, "pantry_items", item.id), { status: "active" });
    invalidate();
  };

  const remove = async (item: PantryItem) => {
    if (isMockMode) {
      if (isInternalPreviewUnlocked()) return toast.info("Preview mode — changes aren't saved.");
      removeLocalPantryItem(item.id);
      invalidate();
      return;
    }
    await deleteDoc(doc(db, "pantry_items", item.id));
    invalidate();
  };

  const addSuggestion = async (itemName: string) => {
    if (!user) return;
    if (isMockMode) {
      if (isInternalPreviewUnlocked()) return toast.info("Preview mode — items aren't saved.");
      addLocalPantryItem(itemName);
      toast.success(`Added ${itemName} to your pantry`);
      invalidate();
      return;
    }
    try {
      await addDoc(collection(db, "pantry_items"), {
        patientId: user.uid,
        name: itemName,
        status: "active",
        createdAt: serverTimestamp(),
      });
      toast.success(`Added ${itemName} to your pantry`);
      invalidate();
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't add item");
    }
  };

  const scanPhoto = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return toast.error("Select a pantry photo first");
    if (isMockMode && isInternalPreviewUnlocked()) {
      return toast.info("Preview mode — scanning isn't available.");
    }
    setScanning(true);
    try {
      const base64 = await fileToBase64(file);
      const mediaType = (file.type || "image/jpeg") as
        | "image/jpeg"
        | "image/png"
        | "image/webp"
        | "image/gif";
      const result = isMockMode
        ? await scanPreviewFn({ data: { base64, mediaType } })
        : await scanFn({ data: { base64, mediaType } });
      if (result.items.length === 0) {
        toast.info("Couldn't make out any items — try a clearer photo, or add them below.");
      }
      setPendingItems(result.items);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't scan that photo");
    } finally {
      setScanning(false);
    }
  };

  const parseVoice = async (transcript: string) => {
    if (isMockMode && isInternalPreviewUnlocked()) {
      return toast.info("Preview mode — voice capture isn't available.");
    }
    setParsingVoice(true);
    try {
      const result = isMockMode
        ? await parseVoicePreviewFn({ data: { transcript } })
        : await parseVoiceFn({ data: { transcript } });
      if (result.items.length === 0) {
        toast.info("Couldn't make out any items — try again, or add them below.");
        return;
      }
      setPendingItems(result.items);
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't parse that");
    } finally {
      setParsingVoice(false);
    }
  };

  const confirmPendingItems = async (confirmedItems: string[]) => {
    if (!user) return;
    if (confirmedItems.length === 0) {
      setPendingItems(null);
      return;
    }
    if (isMockMode && isInternalPreviewUnlocked()) {
      toast.info("Preview mode — items aren't saved.");
      setPendingItems(null);
      return;
    }
    if (isMockMode) {
      addLocalPantryItems(confirmedItems);
      toast.success(`Added ${confirmedItems.length} item(s) to your pantry`);
      setPendingItems(null);
      invalidate();
      return;
    }
    setConfirming(true);
    try {
      await Promise.all(
        confirmedItems.map((itemName) =>
          addDoc(collection(db, "pantry_items"), {
            patientId: user.uid,
            name: itemName,
            status: "active",
            createdAt: serverTimestamp(),
          }),
        ),
      );
      toast.success(`Added ${confirmedItems.length} item(s) to your pantry`);
      setPendingItems(null);
      invalidate();
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't save those items");
    } finally {
      setConfirming(false);
    }
  };

  const active = (items.data ?? []).filter((i) => i.status === "active");
  const usedUp = (items.data ?? []).filter((i) => i.status === "used_up");

  return (
    <AppShell>
      <div className="mx-auto max-w-xl">
        <h1 className="mb-1 text-xl font-semibold tracking-tight">Your pantry</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Dried and shelf-stable staples you keep stocked — what's on hand shapes what your
          Patterns page and grocery list suggest.
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

        <Card className="mb-6 p-4">
          <h2 className="mb-1 text-sm font-semibold">Add several at once</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Snap a photo of a shelf or fridge, or just talk it through — we'll pull out the items
            for you to confirm.
          </p>
          {pendingItems !== null ? (
            <ConfirmPantryItems
              initialItems={pendingItems}
              busy={confirming}
              onConfirm={confirmPendingItems}
              onCancel={() => setPendingItems(null)}
            />
          ) : (
            <Tabs defaultValue="photo">
              <TabsList className="mb-3 grid w-full grid-cols-2">
                <TabsTrigger value="photo">Photo</TabsTrigger>
                <TabsTrigger value="voice">Voice</TabsTrigger>
              </TabsList>
              <TabsContent value="photo">
                <div className="space-y-3">
                  <div>
                    <Label className="mb-1.5">Photo</Label>
                    <Input ref={fileRef} type="file" accept="image/*" capture="environment" />
                  </div>
                  <Button onClick={scanPhoto} disabled={scanning}>
                    {scanning ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="mr-1 h-4 w-4" />
                    )}
                    Scan photo
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="voice">
                <VoiceCapture onTranscript={parseVoice} parsing={parsingVoice} />
              </TabsContent>
            </Tabs>
          )}
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

        {suggestions.length > 0 && (
          <Card className="mt-6 p-4">
            <p className="mb-1 text-sm font-semibold">Try something new</p>
            <p className="mb-3 text-xs text-muted-foreground">
              Shelf-stable ideas for the nutrients that have been a little light lately.
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
                  <Button size="sm" variant="ghost" onClick={() => addSuggestion(s.name)}>
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
