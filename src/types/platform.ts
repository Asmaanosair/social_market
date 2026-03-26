export enum Platform {
  X = "x",
  TIKTOK = "tiktok",
  INSTAGRAM = "instagram",
  FACEBOOK = "facebook",
  SNAPCHAT = "snapchat",
}

export enum PlatformStatus {
  CONNECTED = "connected",
  DISCONNECTED = "disconnected",
  EXPIRED = "expired",
  ERROR = "error",
}

export interface PlatformAccount {
  id: string;
  platform: Platform;
  platformUserId: string;
  displayName: string;
  avatarUrl?: string;
  status: PlatformStatus;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlatformLimits {
  maxTextLength: number;
  maxMediaCount: number;
  supportedMediaTypes: string[];
  maxVideoLength?: number; // seconds
  maxFileSize: number; // bytes
}

export const PLATFORM_LIMITS: Record<Platform, PlatformLimits> = {
  [Platform.X]: {
    maxTextLength: 280,
    maxMediaCount: 4,
    supportedMediaTypes: ["image/jpeg", "image/png", "image/gif", "video/mp4"],
    maxVideoLength: 140,
    maxFileSize: 5 * 1024 * 1024,
  },
  [Platform.TIKTOK]: {
    maxTextLength: 2200,
    maxMediaCount: 1,
    supportedMediaTypes: ["video/mp4"],
    maxVideoLength: 600,
    maxFileSize: 287 * 1024 * 1024,
  },
  [Platform.INSTAGRAM]: {
    maxTextLength: 2200,
    maxMediaCount: 10,
    supportedMediaTypes: ["image/jpeg", "image/png", "video/mp4"],
    maxVideoLength: 60,
    maxFileSize: 8 * 1024 * 1024,
  },
  [Platform.FACEBOOK]: {
    maxTextLength: 63206,
    maxMediaCount: 10,
    supportedMediaTypes: ["image/jpeg", "image/png", "image/gif", "video/mp4"],
    maxVideoLength: 14400,
    maxFileSize: 10 * 1024 * 1024,
  },
  [Platform.SNAPCHAT]: {
    maxTextLength: 250,
    maxMediaCount: 1,
    supportedMediaTypes: ["image/jpeg", "image/png", "video/mp4"],
    maxVideoLength: 60,
    maxFileSize: 32 * 1024 * 1024,
  },
};
