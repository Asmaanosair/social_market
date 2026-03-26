import { Platform, PLATFORM_LIMITS } from "@/types/platform";
import { type MediaAsset } from "@/types/post";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validatePostContent(
  platform: Platform,
  text: string,
  media?: MediaAsset[]
): ValidationResult {
  const limits = PLATFORM_LIMITS[platform];
  const errors: string[] = [];
  const warnings: string[] = [];

  // Text length validation
  if (text.length > limits.maxTextLength) {
    errors.push(
      `Text length (${text.length}) exceeds ${platform} limit of ${limits.maxTextLength} characters`
    );
  } else if (text.length > limits.maxTextLength * 0.9) {
    warnings.push(`Text is ${Math.round((text.length / limits.maxTextLength) * 100)}% of the character limit`);
  }

  // Media validation
  if (media && media.length > 0) {
    if (media.length > limits.maxMediaCount) {
      errors.push(`Too many media files (${media.length}). ${platform} allows maximum ${limits.maxMediaCount}`);
    }
    for (const asset of media) {
      if (!limits.supportedMediaTypes.includes(asset.mimeType)) {
        errors.push(`Unsupported media type "${asset.mimeType}" for ${platform}`);
      }
      if (asset.size > limits.maxFileSize) {
        errors.push(`File "${asset.url}" exceeds maximum size of ${Math.round(limits.maxFileSize / 1024 / 1024)}MB`);
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateAllPlatforms(
  platforms: Platform[],
  text: string,
  media?: MediaAsset[]
): Record<Platform, ValidationResult> {
  const results = {} as Record<Platform, ValidationResult>;
  for (const platform of platforms) {
    results[platform] = validatePostContent(platform, text, media);
  }
  return results;
}
