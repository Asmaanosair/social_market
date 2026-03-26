import { Platform } from "@/types/platform";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const PLATFORM_RATE_LIMITS: Record<Platform, RateLimitConfig> = {
  [Platform.X]: { maxRequests: 300, windowMs: 15 * 60 * 1000 },
  [Platform.TIKTOK]: { maxRequests: 100, windowMs: 60 * 1000 },
  [Platform.INSTAGRAM]: { maxRequests: 200, windowMs: 60 * 60 * 1000 },
  [Platform.FACEBOOK]: { maxRequests: 200, windowMs: 60 * 60 * 1000 },
  [Platform.SNAPCHAT]: { maxRequests: 100, windowMs: 60 * 1000 },
};

interface RateLimitState {
  requests: number;
  windowStart: number;
}

const state: Partial<Record<Platform, RateLimitState>> = {};

export function checkRateLimit(platform: Platform): {
  allowed: boolean;
  retryAfterMs?: number;
} {
  const config = PLATFORM_RATE_LIMITS[platform];
  const now = Date.now();
  const current = state[platform];

  if (!current || now - current.windowStart >= config.windowMs) {
    state[platform] = { requests: 1, windowStart: now };
    return { allowed: true };
  }

  if (current.requests >= config.maxRequests) {
    const retryAfterMs = config.windowMs - (now - current.windowStart);
    return { allowed: false, retryAfterMs };
  }

  current.requests++;
  return { allowed: true };
}

export function getRateLimitConfig(platform: Platform): RateLimitConfig {
  return PLATFORM_RATE_LIMITS[platform];
}
