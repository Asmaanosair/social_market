"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DatePickerProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  placeholder?: string;
}

export function DatePicker({ selected, onSelect, placeholder = "Pick a date" }: DatePickerProps) {
  return (
    <div className="relative">
      <Button variant="outline" className="w-full justify-start text-left font-normal">
        <CalendarDays className="mr-2 h-4 w-4" />
        {selected ? selected.toLocaleDateString() : <span className="text-neutral-500">{placeholder}</span>}
      </Button>
      {/* TODO: Add popover with calendar component */}
    </div>
  );
}
