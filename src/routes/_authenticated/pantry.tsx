import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { addDoc, collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/integrations/firebase/client";
import { useAuth } from "@/hooks/use-auth";
import { isMockMode } from "@/lib/mock-mode";
import { mockPantryItems, type MockPantryItem } from "@/lib/mock-data";
import { AppShell } from "@/components/app/app-shell";
import { PantryItemCard } from "@/components/app/pantry-item-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Camera, Loader2, ShoppingCart } from "lucide-react";
import {
  analyzePantryPhoto,
  confirmPantryScan,
  addPantryItemManual,
  markPantryItemDepleted,
  removePantryItem,
} from "@/lib/pantry.functions";

export const Route = createFileRoute("/_authenticated/pantry")({
  head: () => ({ meta: [{ title: "Your pantry — Nourish" }] }),
  component: PantryPage,
});

type PantryItem = MockPantryItem;
type ParsedItem = { food_name: string; quantity?: number | null; unit?: string | null };

function PantryPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const analyzeFn = useServerFn(analyzePantryPhoto);
  const confirmFn = useServerFn(confirmPantryScan);
  const manualAddFn = useServerFn(addPantryItemManual);
  const depleteFn = useServerFn(markPantryItemDepleted);
  const removeFn = useServerFn(removePantryItem);

  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingScan, setPendingScan] = useState<{ scanId: string; items: ParsedItem[] } | null>(
    null,
  );
  const [manualName, setManualName] = useState("");
  const [manualQty, setManualQty] = useState("");
  const [manualUnit, setManualUnit] = useState("");

  const items = useQuery({
    queryKey: ["pantry-items", user?.uid],
    enabled: !!user,
    queryFn: async () => {
      if (isMockMode) return mockPantryItems;
      const q = query(
        collection(db, "pantry_items"),
        where("patientId", "==", user!.uid),
        orderBy("addedAt", "desc"),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PantryItem);
    },
  });

  const uploadPhoto = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file || !user) return toast.error("Select a pantry photo first");
    if (isMockMode) return toast.info("Preview mode — uploads aren't saved.");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `pantry-photos/${user.uid}/${Date.now()}.${ext}`;
      await uploadBytes(ref(storage, path), file, { contentType: file.type });
      const scanRef = await addDoc(collection(db, "pantry_scans"), {
        patientId: user.uid,
        source: "photo",
        storagePath: path,
        transcript: null,
        parsedItems: null,
        status: "analyzing",
        createdAt: new Date().toISOString(),
      });
      if (fileRef.current) fileRef.current.value = "";
      toast.success("Photo uploaded — identifying items…");
      const result = await analyzeFn({ data: { scanId: scanRef.id } });
      setPendingScan({ scanId: scanRef.id, items: result.items });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setUploading(false);
    }
  };

  const confirmScan = async () => {
    if (!pendingScan) return;
    try {
      await confirmFn({ data: { scanId: pendingScan.scanId, items: pendingScan.items } });
      toast.success(`Added ${pendingScan.items.length} item(s) to your pantry`);
      setPendingScan(null);
      qc.invalidateQueries({ queryKey: ["pantry-items", user?.uid] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save items");
    }
  };

  const addManual = async () => {
    if (!manualName.trim()) return toast.error("Enter a food name");
    if (isMockMode) return toast.info("Preview mode — items aren't saved.");
    try {
      await manualAddFn({
        data: {
          foodName: manualName.trim(),
          quantity: manualQty ? Number(manualQty) : null,
          unit: manualUnit || null,
        },
      });
      setManualName("");
      setManualQty("");
      setManualUnit("");
      toast.success("Added to pantry");
      qc.invalidateQueries({ queryKey: ["pantry-items", user?.uid] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't add item");
    }
  };

  const markDepleted = async (itemId: string) => {
    if (isMockMode) return toast.info("Preview mode — changes aren't saved.");
    await depleteFn({ data: { itemId } });
    toast.success("Marked used up — added to grocery list");
    qc.invalidateQueries({ queryKey: ["pantry-items", user?.uid] });
  };

  const remove = async (itemId: string) => {
    if (isMockMode) return toast.info("Preview mode — changes aren't saved.");
    await removeFn({ data: { itemId } });
    qc.invalidateQueries({ queryKey: ["pantry-items", user?.uid] });
  };

  const activeItems = (items.data ?? []).filter((i) => i.status !== "removed");

  return (
    <AppShell
      nav={
        <>
          <Button size="sm" variant="outline" asChild>
            <Link to="/grocery-list">
              <ShoppingCart className="mr-1 h-4 w-4" />
              Grocery list
            </Link>
          </Button>
          <Button size="sm" variant="ghost" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Meals
            </Link>
          </Button>
        </>
      }
    >
      <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="mb-1 text-base font-semibold">Add to your pantry</h2>
            <p className="mb-4 text-xs text-muted-foreground">
              Snap a photo of your shelf or fridge — we'll identify what's there.
            </p>
            <div className="space-y-3">
              <Input ref={fileRef} type="file" accept="image/*" capture="environment" />
              <Button className="w-full" onClick={uploadPhoto} disabled={uploading}>
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
                Scan photo
              </Button>
            </div>
          </Card>

          {pendingScan && (
            <Card className="p-5">
              <h3 className="mb-2 text-sm font-semibold">Confirm identified items</h3>
              <ul className="mb-3 space-y-2">
                {pendingScan.items.map((it, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <span>{it.food_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {it.quantity != null ? `${it.quantity} ${it.unit ?? ""}`.trim() : ""}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1" onClick={confirmScan}>
                  Add all to pantry
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setPendingScan(null)}>
                  Discard
                </Button>
              </div>
            </Card>
          )}

          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold">Add manually</h3>
            <div className="space-y-2">
              <div>
                <Label className="mb-1.5">Food name</Label>
                <Input
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="Brown rice"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="mb-1.5">Quantity</Label>
                  <Input
                    value={manualQty}
                    onChange={(e) => setManualQty(e.target.value)}
                    placeholder="1"
                  />
                </div>
                <div className="flex-1">
                  <Label className="mb-1.5">Unit</Label>
                  <Input
                    value={manualUnit}
                    onChange={(e) => setManualUnit(e.target.value)}
                    placeholder="bag"
                  />
                </div>
              </div>
              <Button className="w-full" variant="outline" onClick={addManual}>
                Add item
              </Button>
            </div>
          </Card>
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Pantry items</h2>
            <span className="text-xs text-muted-foreground">{activeItems.length} item(s)</span>
          </div>
          {items.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : activeItems.length === 0 ? (
            <Card className="grid place-items-center p-12 text-center">
              <p className="text-sm font-medium">No pantry items yet</p>
              <p className="text-xs text-muted-foreground">Scan a photo or add an item manually.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {activeItems.map((item) => (
                <PantryItemCard
                  key={item.id}
                  foodName={item.foodName}
                  quantity={item.quantity}
                  unit={item.unit}
                  source={item.source}
                  matchConfidence={item.matchConfidence}
                  status={item.status}
                  onMarkDepleted={
                    item.status === "active" ? () => markDepleted(item.id) : undefined
                  }
                  onRemove={() => remove(item.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
