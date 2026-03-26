import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformIcon } from "@/components/shared/platform-icon";
import { Platform } from "@/types/platform";
import { PLATFORM_DISPLAY_NAMES } from "@/lib/utils/constants";

interface PlatformBreakdownProps {
  data?: Array<{
    platform: Platform;
    followers: number;
    engagementRate: number;
    posts: number;
  }>;
}

export function PlatformBreakdown({ data = [] }: PlatformBreakdownProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Platform Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="space-y-4">
            {data.map((item) => (
              <div key={item.platform} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <PlatformIcon platform={item.platform} />
                  <div>
                    <p className="text-sm font-medium">{PLATFORM_DISPLAY_NAMES[item.platform]}</p>
                    <p className="text-xs text-neutral-500">{item.followers.toLocaleString()} followers</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{item.engagementRate}%</p>
                  <p className="text-xs text-neutral-500">{item.posts} posts</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-400 text-center py-8">
            Connect platforms to see breakdown
          </p>
        )}
      </CardContent>
    </Card>
  );
}
