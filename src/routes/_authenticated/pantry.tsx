import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
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
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmPantryItems } from "@/components/app/confirm-pantry-items";
import { VoiceCapture } from "@/components/app/voice-capture";
import { toast } from "sonner";
import { ArrowLeft, Camera, Loader2, Plus, RotateCcw, ShoppingCart, Trash2 } from "lucide-react";
import type { PantryItem } from "@/lib/pantry.schema";
import { fileToBase64 } from "@/lib/file-base64";
import { scanPantryPhoto, parsePantryVoiceText } from "@/lib/pantry-scan.functions";
import { errorMessage } from "@/lib/error-message";
import { prepareImage } from "@/lib/image-prep";

export const Route = createFileRoute("/_authenticated/pantry")({
  head: () => ({ meta: [{ title: "Your pantry — Dr. K's Kitchen" }] }),
  component: PantryPage,
});

function PantryPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);

  const scanFn = useServerFn(scanPantryPhoto);
  const parseVoiceFn = useServerFn(parsePantryVoiceText);
  const fileRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [parsingVoice, setParsingVoice] = useState(false);
  const [pendingItems, setPendingItems] = useState<string[] | null>(null);
  const [confirming, setConfirming] = useState(false);

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
    } catch (e) {
      toast.error(errorMessage(e, "Couldn't add item"));
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
    } catch (e) {
      toast.error(errorMessage(e, "Couldn't update that item"));
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

  const scanPhoto = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return toast.error("Select a pantry photo first");
    if (isMockMode) return toast.info("Preview mode — scanning isn't available.");
    setScanning(true);
    try {
      // Re-encode as downscaled JPEG — handles iPhone HEIC and keeps the
      // base64 request body small.
      const photo = await prepareImage(file);
      const base64 = await fileToBase64(photo);
      const result = await scanFn({ data: { base64, mediaType: "image/jpeg" } });
      if (fileRef.current) fileRef.current.value = "";
      if (result.items.length === 0) {
        toast.info("Couldn't make out any items — try a clearer photo, or add them below.");
        return;
      }
      setPendingItems(result.items);
    } catch (e) {
      toast.error(errorMessage(e, "Couldn't scan that photo"));
    } finally {
      setScanning(false);
    }
  };

  const parseVoice = async (transcript: string) => {
    if (isMockMode) return toast.info("Preview mode — voice capture isn't available.");
    setParsingVoice(true);
    try {
      const result = await parseVoiceFn({ data: { transcript } });
      if (result.items.length === 0) {
        toast.info("Couldn't make out any items — try again, or add them below.");
        return;
      }
      setPendingItems(result.items);
    } catch (e) {
      toast.error(errorMessage(e, "Couldn't parse that"));
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
    if (isMockMode) {
      toast.info("Preview mode — items aren't saved.");
      setPendingItems(null);
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
    } catch (e) {
      toast.error(errorMessage(e, "Couldn't save those items"));
    } finally {
      setConfirming(false);
    }
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
      </div>
    </AppShell>
  );
}
