import { Platform } from "@/types/platform";
import { PLATFORM_COLORS, PLATFORM_DISPLAY_NAMES } from "@/lib/utils/constants";
import { cn } from "@/lib/utils";

interface PlatformIconProps {
  platform: Platform;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "h-5 w-5 text-xs",
  md: "h-8 w-8 text-sm",
  lg: "h-10 w-10 text-base",
};

const platformInitials: Record<Platform, string> = {
  [Platform.X]: "X",
  [Platform.TIKTOK]: "TT",
  [Platform.INSTAGRAM]: "IG",
  [Platform.FACEBOOK]: "FB",
  [Platform.SNAPCHAT]: "SC",
};

export function PlatformIcon({ platform, size = "md", className }: PlatformIconProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full font-bold text-white",
        sizeMap[size],
        className
      )}
      style={{ backgroundColor: PLATFORM_COLORS[platform] }}
      title={PLATFORM_DISPLAY_NAMES[platform]}
    >
      {platformInitials[platform]}
    </div>
  );
}
