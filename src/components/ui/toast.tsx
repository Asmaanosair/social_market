"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  open?: boolean;
  onClose?: () => void;
}

export function Toast({ title, description, variant = "default", open, onClose }: ToastProps) {
  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 w-full max-w-sm rounded-lg border p-4 shadow-lg",
        variant === "destructive"
          ? "border-red-200 bg-red-50 text-red-900"
          : "border-neutral-200 bg-white text-neutral-950"
      )}
    >
      <div className="flex justify-between items-start">
        <div>
          {title && <p className="text-sm font-semibold">{title}</p>}
          {description && <p className="text-sm opacity-90 mt-1">{description}</p>}
        </div>
        {onClose && (
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
            ×
          </button>
        )}
      </div>
    </div>
  );
}
