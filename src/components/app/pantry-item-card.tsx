import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Camera, Mic, PencilLine, Trash2 } from "lucide-react";

const sourceIcon = { photo: Camera, voice: Mic, manual: PencilLine } as const;

export function PantryItemCard({
  foodName,
  quantity,
  unit,
  source,
  matchConfidence,
  status,
  onMarkDepleted,
  onRemove,
}: {
  foodName: string;
  quantity: number | null;
  unit: string | null;
  source: "photo" | "voice" | "manual";
  matchConfidence: "high" | "low" | null;
  status: "active" | "depleted" | "removed";
  onMarkDepleted?: () => void;
  onRemove?: () => void;
}) {
  const SourceIcon = sourceIcon[source];
  return (
    <Card
      className={`flex items-center justify-between gap-3 p-3 ${status === "depleted" ? "opacity-60" : ""}`}
    >
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground">
          <SourceIcon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-medium">{foodName}</p>
          <p className="text-xs text-muted-foreground">
            {quantity != null ? `${quantity} ${unit ?? ""}`.trim() : "Quantity unknown"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {matchConfidence === "low" && (
          <Badge variant="outline" className="text-[10px]">
            Estimated
          </Badge>
        )}
        {status === "active" && onMarkDepleted && (
          <Button size="sm" variant="outline" onClick={onMarkDepleted}>
            Mark used up
          </Button>
        )}
        {onRemove && (
          <Button size="sm" variant="ghost" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}
