import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, X } from "lucide-react";

// Shared review step for both the photo-scan and voice-capture pantry flows
// (post-demo milestone #1, docs/PLAN.md) — Claude's guess is never written to
// pantry_items directly; the patient edits/removes/adds names here first,
// same "AI proposes, human confirms" shape as the meal reading's inline edit.
export function ConfirmPantryItems({
  initialItems,
  busy,
  onConfirm,
  onCancel,
}: {
  initialItems: string[];
  busy?: boolean;
  onConfirm: (items: string[]) => void;
  onCancel: () => void;
}) {
  const [items, setItems] = useState<string[]>(initialItems.length ? initialItems : [""]);

  const update = (i: number, value: string) =>
    setItems((prev) => prev.map((item, idx) => (idx === i ? value : item)));
  const remove = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));
  const add = () => setItems((prev) => [...prev, ""]);

  const confirm = () => {
    const cleaned = items.map((i) => i.trim()).filter(Boolean);
    onConfirm(cleaned);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Here's what we could make out — edit, remove, or add anything before it's saved to your
        pantry.
      </p>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={item}
              onChange={(e) => update(i, e.target.value)}
              placeholder="Item name"
            />
            <Button type="button" size="icon" variant="ghost" onClick={() => remove(i)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" size="sm" variant="ghost" onClick={add}>
        <Plus className="mr-1 h-3 w-3" />
        Add another
      </Button>
      <div className="flex gap-2 pt-1">
        <Button onClick={confirm} disabled={busy || items.every((i) => !i.trim())}>
          Add to pantry
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
          <X className="mr-1 h-4 w-4" />
          Cancel
        </Button>
      </div>
    </div>
  );
}
