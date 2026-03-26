"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnalytics } from "@/lib/hooks/use-analytics";

export function ExportButton() {
  const { isExporting, exportData } = useAnalytics();

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => exportData("csv")} disabled={isExporting}>
        <Download className="h-4 w-4 mr-1" />
        Export CSV
      </Button>
      <Button variant="outline" size="sm" onClick={() => exportData("pdf")} disabled={isExporting}>
        <Download className="h-4 w-4 mr-1" />
        Export PDF
      </Button>
    </div>
  );
}
