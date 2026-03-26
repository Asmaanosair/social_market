import { Platform, PLATFORM_LIMITS } from "@/types/platform";
import { type MediaAsset } from "@/types/post";
import { type MetricSnapshot } from "@/types/analytics";
import { type IPublishAdapter, type PublishResult } from "./types";

const SNAP_API_BASE = "https://adsapi.snapchat.com/v1";

export class SnapchatAdapter implements IPublishAdapter {
  readonly platform = Platform.SNAPCHAT;
  private accessToken: string | null = null;

  async authenticate(credentials: {
    accessToken: string;
    refreshToken?: string;
  }): Promise<boolean> {
    this.accessToken = credentials.accessToken;

    try {
      const response = await fetch(`${SNAP_API_BASE}/me`, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async publish(content: {
    text: string;
    media?: MediaAsset[];
    platformSpecificData?: Record<string, unknown>;
  }): Promise<PublishResult> {
    if (!this.accessToken) {
      return { success: false, error: "Not authenticated" };
    }

    if (!content.media || content.media.length === 0) {
      return { success: false, error: "Snapchat requires media content" };
    }

    try {
      // Snapchat Marketing API creative creation
      // Step 1: Create creative
      const creativeResponse = await fetch(`${SNAP_API_BASE}/adaccounts/{ad_account_id}/creatives`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          creatives: [
            {
              name: content.text.slice(0, 100),
              type: "SNAP_AD",
              headline: content.text.slice(0, 34),
              top_snap_media_id: content.media[0].url,
            },
          ],
        }),
      });

      if (!creativeResponse.ok) {
        const errorData = await creativeResponse.json().catch(() => ({}));
        return {
          success: false,
          error: `Snapchat API error: ${JSON.stringify(errorData)}`,
        };
      }

      const creativeData = await creativeResponse.json();
      const creativeId = creativeData.creatives?.[0]?.creative?.id;

      return {
        success: !!creativeId,
        platformPostId: creativeId,
        error: creativeId ? undefined : "Failed to create Snapchat creative",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to publish to Snapchat",
      };
    }
  }

  async getMetrics(platformPostId: string): Promise<MetricSnapshot> {
    if (!this.accessToken) return this.emptyMetrics();

    try {
      const response = await fetch(
        `${SNAP_API_BASE}/stats/${platformPostId}?fields=impressions,swipes,screen_time`,
        {
          headers: { Authorization: `Bearer ${this.accessToken}` },
        }
      );

      if (!response.ok) return this.emptyMetrics();

      const data = await response.json();
      const stats = data.stats?.[0] || {};

      return {
        impressions: stats.impressions || 0,
        reach: stats.uniques || 0,
        engagements: stats.swipes || 0,
        likes: 0,
        comments: 0,
        shares: stats.shares || 0,
        saves: stats.saves || 0,
        clicks: stats.swipes || 0,
      };
    } catch {
      return this.emptyMetrics();
    }
  }

  async refreshToken(
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken?: string; expiresAt: Date }> {
    const clientId = process.env.SNAPCHAT_CLIENT_ID;
    const clientSecret = process.env.SNAPCHAT_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Snapchat API credentials not configured");
    }

    const response = await fetch("https://accounts.snapchat.com/accounts/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) throw new Error(`Token refresh failed: ${response.status}`);

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  }

  async deletePost(platformPostId: string): Promise<boolean> {
    if (!this.accessToken) return false;

    try {
      const response = await fetch(`${SNAP_API_BASE}/creatives/${platformPostId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  validateContent(content: { text: string; media?: MediaAsset[] }) {
    const limits = PLATFORM_LIMITS[Platform.SNAPCHAT];
    const errors: string[] = [];

    if (content.text.length > limits.maxTextLength) {
      errors.push(`Text exceeds ${limits.maxTextLength} character limit`);
    }

    if (!content.media || content.media.length === 0) {
      errors.push("Snapchat requires media content");
    }

    if (content.media) {
      if (content.media.length > limits.maxMediaCount) {
        errors.push(`Maximum ${limits.maxMediaCount} media item allowed`);
      }
      for (const media of content.media) {
        if (!limits.supportedMediaTypes.includes(media.mimeType)) {
          errors.push(`Unsupported media type: ${media.mimeType}`);
        }
        if (media.size > limits.maxFileSize) {
          errors.push(`File exceeds ${limits.maxFileSize / (1024 * 1024)}MB limit`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  private emptyMetrics(): MetricSnapshot {
    return {
      impressions: 0, reach: 0, engagements: 0, likes: 0,
      comments: 0, shares: 0, saves: 0, clicks: 0,
    };
  }
}
