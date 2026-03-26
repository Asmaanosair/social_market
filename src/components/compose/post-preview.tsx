"use client";

import { useComposeStore } from "@/lib/stores/compose.store";
import { PlatformIcon } from "@/components/shared/platform-icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Platform } from "@/types/platform";

export function PostPreview() {
  const { content, selectedPlatforms, media } = useComposeStore();

  if (selectedPlatforms.length === 0 || !content) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-neutral-400 text-center">
            Select platforms and write content to see preview
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {selectedPlatforms.map((platform) => (
        <Card key={platform}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <PlatformIcon platform={platform} size="sm" />
              <span className="capitalize">{platform} Preview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-700 whitespace-pre-wrap">{content}</p>
            {media.length > 0 && (
              <div className="mt-2 flex gap-1">
                {media.map((m) => (
                  <div key={m.id} className="w-16 h-16 rounded bg-neutral-100 flex items-center justify-center text-xs text-neutral-400">
                    {m.type}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
