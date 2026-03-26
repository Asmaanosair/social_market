import { Platform, PLATFORM_LIMITS } from "@/types/platform";
import { type MediaAsset } from "@/types/post";
import { type MetricSnapshot } from "@/types/analytics";
import { type IPublishAdapter, type PublishResult } from "./types";

const X_API_BASE = "https://api.twitter.com/2";

export class XAdapter implements IPublishAdapter {
  readonly platform = Platform.X;
  private accessToken: string | null = null;

  async authenticate(credentials: {
    accessToken: string;
    refreshToken?: string;
  }): Promise<boolean> {
    this.accessToken = credentials.accessToken;

    // Verify token by making a test API call
    try {
      const response = await fetch(`${X_API_BASE}/users/me`, {
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

    try {
      let mediaIds: string[] = [];

      // Upload media if present
      if (content.media && content.media.length > 0) {
        mediaIds = await this.uploadMedia(content.media);
      }

      // Create tweet
      const tweetData: Record<string, unknown> = {
        text: content.text,
      };

      if (mediaIds.length > 0) {
        tweetData.media = { media_ids: mediaIds };
      }

      // Handle thread/reply if specified
      if (content.platformSpecificData?.replyToTweetId) {
        tweetData.reply = {
          in_reply_to_tweet_id: content.platformSpecificData.replyToTweetId,
        };
      }

      const response = await fetch(`${X_API_BASE}/tweets`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tweetData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: `X API error ${response.status}: ${JSON.stringify(errorData)}`,
        };
      }

      const data = await response.json();
      const tweetId = data.data?.id;

      return {
        success: true,
        platformPostId: tweetId,
        url: `https://twitter.com/i/status/${tweetId}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to publish to X",
      };
    }
  }

  async getMetrics(platformPostId: string): Promise<MetricSnapshot> {
    if (!this.accessToken) {
      return this.emptyMetrics();
    }

    try {
      const response = await fetch(
        `${X_API_BASE}/tweets/${platformPostId}?tweet.fields=public_metrics,non_public_metrics`,
        {
          headers: { Authorization: `Bearer ${this.accessToken}` },
        }
      );

      if (!response.ok) return this.emptyMetrics();

      const data = await response.json();
      const metrics = data.data?.public_metrics || {};
      const nonPublic = data.data?.non_public_metrics || {};

      return {
        impressions: nonPublic.impression_count || metrics.impression_count || 0,
        reach: 0, // X doesn't provide reach directly
        engagements:
          (metrics.like_count || 0) +
          (metrics.retweet_count || 0) +
          (metrics.reply_count || 0) +
          (metrics.quote_count || 0),
        likes: metrics.like_count || 0,
        comments: metrics.reply_count || 0,
        shares: (metrics.retweet_count || 0) + (metrics.quote_count || 0),
        saves: metrics.bookmark_count || 0,
        clicks: nonPublic.url_link_clicks || 0,
      };
    } catch {
      return this.emptyMetrics();
    }
  }

  async refreshToken(
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken?: string; expiresAt: Date }> {
    const clientId = process.env.X_CLIENT_ID;
    if (!clientId) throw new Error("X_CLIENT_ID not configured");

    const response = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`);
    }

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
      const response = await fetch(`${X_API_BASE}/tweets/${platformPostId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  validateContent(content: { text: string; media?: MediaAsset[] }) {
    const limits = PLATFORM_LIMITS[Platform.X];
    const errors: string[] = [];

    if (content.text.length > limits.maxTextLength) {
      errors.push(`Text exceeds ${limits.maxTextLength} character limit (${content.text.length} chars)`);
    }

    if (content.media) {
      if (content.media.length > limits.maxMediaCount) {
        errors.push(`Maximum ${limits.maxMediaCount} media items allowed`);
      }

      for (const media of content.media) {
        if (!limits.supportedMediaTypes.includes(media.mimeType)) {
          errors.push(`Unsupported media type: ${media.mimeType}`);
        }
        if (media.size > limits.maxFileSize) {
          errors.push(`File ${media.url} exceeds ${limits.maxFileSize / (1024 * 1024)}MB limit`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  private async uploadMedia(media: MediaAsset[]): Promise<string[]> {
    // X uses the v1.1 media upload endpoint
    const mediaIds: string[] = [];

    for (const item of media) {
      try {
        // Step 1: INIT the upload
        const initResponse = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            command: "INIT",
            total_bytes: item.size.toString(),
            media_type: item.mimeType,
          }),
        });

        if (initResponse.ok) {
          const initData = await initResponse.json();
          mediaIds.push(initData.media_id_string);
        }
      } catch {
        console.error(`Failed to upload media: ${item.url}`);
      }
    }

    return mediaIds;
  }

  private emptyMetrics(): MetricSnapshot {
    return {
      impressions: 0,
      reach: 0,
      engagements: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      clicks: 0,
    };
  }
}
