import { type Platform } from "@/types/platform";
import { type MediaAsset } from "@/types/post";
import { type MetricSnapshot } from "@/types/analytics";

export interface PublishResult {
  success: boolean;
  platformPostId?: string;
  url?: string;
  error?: string;
}

export interface IPublishAdapter {
  readonly platform: Platform;

  authenticate(credentials: {
    accessToken: string;
    refreshToken?: string;
  }): Promise<boolean>;

  publish(content: {
    text: string;
    media?: MediaAsset[];
    platformSpecificData?: Record<string, unknown>;
  }): Promise<PublishResult>;

  getMetrics(platformPostId: string): Promise<MetricSnapshot>;

  refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt: Date;
  }>;

  deletePost(platformPostId: string): Promise<boolean>;

  validateContent(content: { text: string; media?: MediaAsset[] }): {
    valid: boolean;
    errors: string[];
  };
}
