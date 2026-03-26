import { Platform } from "@/types/platform";

export const PLATFORM_DISPLAY_NAMES: Record<Platform, string> = {
  [Platform.X]: "X (Twitter)",
  [Platform.TIKTOK]: "TikTok",
  [Platform.INSTAGRAM]: "Instagram",
  [Platform.FACEBOOK]: "Facebook",
  [Platform.SNAPCHAT]: "Snapchat",
};

export const PLATFORM_COLORS: Record<Platform, string> = {
  [Platform.X]: "#000000",
  [Platform.TIKTOK]: "#00F2EA",
  [Platform.INSTAGRAM]: "#E4405F",
  [Platform.FACEBOOK]: "#1877F2",
  [Platform.SNAPCHAT]: "#FFFC00",
};

export const APP_NAME = "Social Market";
export const APP_DESCRIPTION = "Social Media Command Center Dashboard";

export const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
export const SUPPORTED_VIDEO_TYPES = ["video/mp4", "video/quicktime"];
export const MAX_UPLOAD_SIZE = 100 * 1024 * 1024; // 100MB
