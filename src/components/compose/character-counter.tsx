"use client";

import { Platform, PLATFORM_LIMITS } from "@/types/platform";
import { useCompose } from "@/lib/hooks/use-compose";
import { cn } from "@/lib/utils";

export function CharacterCounter() {
  const { selectedPlatforms, characterCounts } = useCompose();

  if (selectedPlatforms.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {selectedPlatforms.map((platform) => {
        const count = characterCounts[platform] ?? 0;
        const limit = PLATFORM_LIMITS[platform].maxTextLength;
        const percentage = (count / limit) * 100;

        return (
          <div key={platform} className="flex items-center gap-1.5 text-xs">
            <span className="font-medium capitalize">{platform}:</span>
            <span
              className={cn(
                percentage > 100 ? "text-red-500" : percentage > 90 ? "text-amber-500" : "text-neutral-500"
              )}
            >
              {count}/{limit}
            </span>
          </div>
        );
      })}
    </div>
  );
}
