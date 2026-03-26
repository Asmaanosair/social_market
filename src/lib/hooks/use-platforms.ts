"use client";

import { usePlatformStore } from "@/lib/stores/platform.store";
import { Platform } from "@/types/platform";
import { PLATFORM_DISPLAY_NAMES } from "@/lib/utils/constants";

export function usePlatforms() {
  const { connectedAccounts, isLoading, error } = usePlatformStore();

  const getAccountsByPlatform = (platform: Platform) =>
    connectedAccounts.filter((a) => a.platform === platform);

  const isConnected = (platform: Platform) =>
    connectedAccounts.some(
      (a) => a.platform === platform && a.status === "connected"
    );

  const connectedPlatforms = Object.values(Platform).filter(isConnected);

  const platformOptions = Object.values(Platform).map((p) => ({
    value: p,
    label: PLATFORM_DISPLAY_NAMES[p],
    connected: isConnected(p),
  }));

  return {
    connectedAccounts,
    connectedPlatforms,
    platformOptions,
    getAccountsByPlatform,
    isConnected,
    isLoading,
    error,
  };
}
