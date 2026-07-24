import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

// Browser print-to-PDF, no new dependency — every phone/desktop browser's
// print dialog offers "Save as PDF." Pairs with the .printable-reading /
// @media print rules in src/styles.css, which hide everything else on the
// page when this fires.
export function DownloadReadingPdf() {
  return (
    <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
      <Download className="mr-1 h-3.5 w-3.5" />
      Download as PDF
    </Button>
  );
}
