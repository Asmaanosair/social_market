"use client";

import { trpc } from "@/lib/trpc/client";
import { useComposeStore } from "@/lib/stores/compose.store";
import { cn } from "@/lib/utils";
import { Loader2, AlertCircle } from "lucide-react";

const PLATFORM_DISPLAY: Record<string, { name: string; icon: string }> = {
  X: { name: "X", icon: "𝕏" },
  TIKTOK: { name: "TikTok", icon: "♪" },
  INSTAGRAM: { name: "Instagram", icon: "📷" },
  FACEBOOK: { name: "Facebook", icon: "f" },
  SNAPCHAT: { name: "Snapchat", icon: "👻" },
};

export function PlatformSelector() {
  const { selectedPlatforms, togglePlatform } = useComposeStore();
  const { data, isLoading } = trpc.account.listConnected.useQuery();

  const connectedAccounts = data?.accounts?.filter((a) => a.status === "CONNECTED") ?? [];

  if (isLoading) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-700">Publish to</label>
        <div className="flex items-center gap-2 text-sm text-neutral-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading accounts...
        </div>
      </div>
    );
  }

  if (connectedAccounts.length === 0) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-700">Publish to</label>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 text-yellow-700 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            No connected accounts.{" "}
            <a href="/settings/accounts" className="font-medium underline">
              Connect a platform
            </a>{" "}
            to start publishing.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-neutral-700">Publish to</label>
      <div className="flex flex-wrap gap-2">
        {connectedAccounts.map((account) => {
          const display = PLATFORM_DISPLAY[account.platform] || { name: account.platform, icon: "?" };
          const isSelected = selectedPlatforms.includes(account.id as any);
          return (
            <button
              key={account.id}
              onClick={() => togglePlatform(account.id as any)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                isSelected
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
              )}
            >
              <span>{display.icon}</span>
              <span>{account.displayName || display.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
