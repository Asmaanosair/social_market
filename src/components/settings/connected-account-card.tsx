import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlatformIcon } from "@/components/shared/platform-icon";
import { type Platform, type PlatformStatus } from "@/types/platform";
import { PLATFORM_DISPLAY_NAMES } from "@/lib/utils/constants";
import { cn } from "@/lib/utils";

interface ConnectedAccountCardProps {
  platform: Platform;
  displayName?: string;
  status: PlatformStatus;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function ConnectedAccountCard({ platform, displayName, status, onConnect, onDisconnect }: ConnectedAccountCardProps) {
  const isConnected = status === "connected";

  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <PlatformIcon platform={platform} />
          <div>
            <p className="text-sm font-medium">{PLATFORM_DISPLAY_NAMES[platform]}</p>
            {displayName && <p className="text-xs text-neutral-500">@{displayName}</p>}
            <span className={cn("text-xs", isConnected ? "text-green-600" : "text-neutral-400")}>
              {isConnected ? "Connected" : "Not connected"}
            </span>
          </div>
        </div>
        {isConnected ? (
          <Button variant="outline" size="sm" onClick={onDisconnect}>Disconnect</Button>
        ) : (
          <Button size="sm" onClick={onConnect}>Connect</Button>
        )}
      </CardContent>
    </Card>
  );
}
