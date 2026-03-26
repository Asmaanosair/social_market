"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  className?: string;
}

export function Calendar({ selected, onSelect, className }: CalendarProps) {
  // TODO: Implement full calendar component or integrate a library
  return (
    <div className={cn("p-3 rounded-md border border-neutral-200", className)}>
      <p className="text-sm text-neutral-500 text-center">
        Calendar component placeholder
      </p>
      {selected && (
        <p className="text-xs text-neutral-400 text-center mt-1">
          Selected: {selected.toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
