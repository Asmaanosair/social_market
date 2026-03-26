"use client";

import { Button } from "@/components/ui/button";
import { PlatformIcon } from "@/components/shared/platform-icon";
import { type Platform } from "@/types/platform";
import { PLATFORM_DISPLAY_NAMES } from "@/lib/utils/constants";
import { ExternalLink } from "lucide-react";

interface OAuthConnectButtonProps {
  platform: Platform;
  isLoading?: boolean;
  onClick?: () => void;
}

export function OAuthConnectButton({ platform, isLoading, onClick }: OAuthConnectButtonProps) {
  return (
    <Button
      variant="outline"
      className="w-full justify-start gap-3"
      disabled={isLoading}
      onClick={onClick}
    >
      <PlatformIcon platform={platform} size="sm" />
      <span>Connect {PLATFORM_DISPLAY_NAMES[platform]}</span>
      <ExternalLink className="h-3.5 w-3.5 ml-auto" />
    </Button>
  );
}
