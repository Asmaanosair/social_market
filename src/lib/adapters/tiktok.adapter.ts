import { Platform, PLATFORM_LIMITS } from "@/types/platform";
import { type MediaAsset } from "@/types/post";
import { type MetricSnapshot } from "@/types/analytics";
import { type IPublishAdapter, type PublishResult } from "./types";

const TIKTOK_API_BASE = "https://open.tiktokapis.com/v2";

export class TikTokAdapter implements IPublishAdapter {
  readonly platform = Platform.TIKTOK;
  private accessToken: string | null = null;

  async authenticate(credentials: {
    accessToken: string;
    refreshToken?: string;
  }): Promise<boolean> {
    this.accessToken = credentials.accessToken;

    try {
      const response = await fetch(`${TIKTOK_API_BASE}/user/info/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fields: ["display_name", "avatar_url"] }),
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
      return { success: false, error: "TikTok requires a video" };
    }

    try {
      const video = content.media[0];

      // Step 1: Initialize upload
      const initResponse = await fetch(`${TIKTOK_API_BASE}/post/publish/video/init/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          post_info: {
            title: content.text,
            privacy_level: "PUBLIC_TO_EVERYONE",
            disable_duet: false,
            disable_comment: false,
            disable_stitch: false,
          },
          source_info: {
            source: "PULL_FROM_URL",
            video_url: video.url,
          },
        }),
      });

      if (!initResponse.ok) {
        const errorData = await initResponse.json().catch(() => ({}));
        return {
          success: false,
          error: `TikTok API error: ${JSON.stringify(errorData)}`,
        };
      }

      const initData = await initResponse.json();
      const publishId = initData.data?.publish_id;

      if (!publishId) {
        return { success: false, error: "Failed to get publish ID from TikTok" };
      }

      // Step 2: Check publish status (TikTok processes asynchronously)
      // In production, this would be polled or handled via webhook
      return {
        success: true,
        platformPostId: publishId,
        url: `https://www.tiktok.com/@user/video/${publishId}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to publish to TikTok",
      };
    }
  }

  async getMetrics(platformPostId: string): Promise<MetricSnapshot> {
    if (!this.accessToken) return this.emptyMetrics();

    try {
      const response = await fetch(`${TIKTOK_API_BASE}/video/query/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filters: { video_ids: [platformPostId] },
          fields: [
            "like_count",
            "comment_count",
            "share_count",
            "view_count",
          ],
        }),
      });

      if (!response.ok) return this.emptyMetrics();

      const data = await response.json();
      const video = data.data?.videos?.[0];

      if (!video) return this.emptyMetrics();

      return {
        impressions: video.view_count || 0,
        reach: 0,
        engagements:
          (video.like_count || 0) +
          (video.comment_count || 0) +
          (video.share_count || 0),
        likes: video.like_count || 0,
        comments: video.comment_count || 0,
        shares: video.share_count || 0,
        saves: 0,
        clicks: 0,
        videoViews: video.view_count || 0,
      };
    } catch {
      return this.emptyMetrics();
    }
  }

  async refreshToken(
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken?: string; expiresAt: Date }> {
    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

    if (!clientKey || !clientSecret) {
      throw new Error("TikTok API credentials not configured");
    }

    const response = await fetch(`${TIKTOK_API_BASE}/oauth/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
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
    // TikTok doesn't support video deletion via API
    return false;
  }

  validateContent(content: { text: string; media?: MediaAsset[] }) {
    const limits = PLATFORM_LIMITS[Platform.TIKTOK];
    const errors: string[] = [];

    if (content.text.length > limits.maxTextLength) {
      errors.push(`Caption exceeds ${limits.maxTextLength} character limit`);
    }

    if (!content.media || content.media.length === 0) {
      errors.push("TikTok requires a video");
    }

    if (content.media) {
      for (const media of content.media) {
        if (media.mimeType !== "video/mp4") {
          errors.push("TikTok only supports MP4 videos");
        }
        if (media.size > limits.maxFileSize) {
          errors.push(`Video exceeds ${limits.maxFileSize / (1024 * 1024)}MB limit`);
        }
        if (media.duration && limits.maxVideoLength && media.duration > limits.maxVideoLength) {
          errors.push(`Video exceeds ${limits.maxVideoLength / 60} minute limit`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  private emptyMetrics(): MetricSnapshot {
    return {
      impressions: 0, reach: 0, engagements: 0, likes: 0,
      comments: 0, shares: 0, saves: 0, clicks: 0, videoViews: 0, watchTime: 0,
    };
  }
}
