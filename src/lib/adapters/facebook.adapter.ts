import { Platform, PLATFORM_LIMITS } from "@/types/platform";
import { type MediaAsset } from "@/types/post";
import { type MetricSnapshot } from "@/types/analytics";
import { type IPublishAdapter, type PublishResult } from "./types";

const GRAPH_API_BASE = "https://graph.facebook.com/v19.0";

export class FacebookAdapter implements IPublishAdapter {
  readonly platform = Platform.FACEBOOK;
  private accessToken: string | null = null;
  private pageId: string | null = null;
  private pageAccessToken: string | null = null;

  async authenticate(credentials: {
    accessToken: string;
    refreshToken?: string;
  }): Promise<boolean> {
    this.accessToken = credentials.accessToken;

    try {
      // Get user's pages and page access token
      const response = await fetch(
        `${GRAPH_API_BASE}/me/accounts?fields=id,name,access_token&access_token=${this.accessToken}`
      );

      if (!response.ok) return false;

      const data = await response.json();
      const page = data.data?.[0];
      if (page) {
        this.pageId = page.id;
        this.pageAccessToken = page.access_token;
      }

      return !!this.pageId;
    } catch {
      return false;
    }
  }

  async publish(content: {
    text: string;
    media?: MediaAsset[];
    platformSpecificData?: Record<string, unknown>;
  }): Promise<PublishResult> {
    if (!this.pageAccessToken || !this.pageId) {
      return { success: false, error: "Not authenticated or no page found" };
    }

    try {
      let postId: string;

      if (content.media && content.media.length > 0) {
        const hasVideo = content.media.some((m) => m.mimeType.startsWith("video/"));

        if (hasVideo) {
          postId = await this.publishVideo(content.text, content.media[0]);
        } else if (content.media.length === 1) {
          postId = await this.publishPhoto(content.text, content.media[0]);
        } else {
          postId = await this.publishMultiPhoto(content.text, content.media);
        }
      } else {
        // Text-only post
        const response = await fetch(`${GRAPH_API_BASE}/${this.pageId}/feed`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content.text,
            access_token: this.pageAccessToken,
          }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          return { success: false, error: JSON.stringify(error) };
        }

        const data = await response.json();
        postId = data.id;
      }

      return {
        success: true,
        platformPostId: postId,
        url: `https://www.facebook.com/${postId}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to publish to Facebook",
      };
    }
  }

  async getMetrics(platformPostId: string): Promise<MetricSnapshot> {
    if (!this.pageAccessToken) return this.emptyMetrics();

    try {
      const response = await fetch(
        `${GRAPH_API_BASE}/${platformPostId}?fields=insights.metric(post_impressions,post_engaged_users,post_clicks,post_reactions_by_type_total)&access_token=${this.pageAccessToken}`
      );

      if (!response.ok) return this.emptyMetrics();

      const data = await response.json();
      const insights = data.insights?.data || [];

      let impressions = 0;
      let engagements = 0;
      let clicks = 0;

      for (const insight of insights) {
        const value = insight.values?.[0]?.value;
        switch (insight.name) {
          case "post_impressions":
            impressions = value || 0;
            break;
          case "post_engaged_users":
            engagements = value || 0;
            break;
          case "post_clicks":
            clicks = value || 0;
            break;
        }
      }

      // Get basic metrics (likes, comments, shares)
      const basicResponse = await fetch(
        `${GRAPH_API_BASE}/${platformPostId}?fields=likes.summary(true),comments.summary(true),shares&access_token=${this.pageAccessToken}`
      );

      let likes = 0;
      let comments = 0;
      let shares = 0;

      if (basicResponse.ok) {
        const basicData = await basicResponse.json();
        likes = basicData.likes?.summary?.total_count || 0;
        comments = basicData.comments?.summary?.total_count || 0;
        shares = basicData.shares?.count || 0;
      }

      return {
        impressions,
        reach: 0,
        engagements,
        likes,
        comments,
        shares,
        saves: 0,
        clicks,
      };
    } catch {
      return this.emptyMetrics();
    }
  }

  async refreshToken(
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken?: string; expiresAt: Date }> {
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;

    if (!appId || !appSecret) throw new Error("Facebook app credentials not configured");

    const response = await fetch(
      `${GRAPH_API_BASE}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${refreshToken}`
    );

    if (!response.ok) throw new Error(`Token refresh failed: ${response.status}`);

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.access_token,
      expiresAt: new Date(Date.now() + (data.expires_in || 5184000) * 1000),
    };
  }

  async deletePost(platformPostId: string): Promise<boolean> {
    if (!this.pageAccessToken) return false;

    try {
      const response = await fetch(
        `${GRAPH_API_BASE}/${platformPostId}?access_token=${this.pageAccessToken}`,
        { method: "DELETE" }
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  validateContent(content: { text: string; media?: MediaAsset[] }) {
    const limits = PLATFORM_LIMITS[Platform.FACEBOOK];
    const errors: string[] = [];

    if (content.text.length > limits.maxTextLength) {
      errors.push(`Text exceeds ${limits.maxTextLength} character limit`);
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
          errors.push(`File exceeds ${limits.maxFileSize / (1024 * 1024)}MB limit`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  private async publishPhoto(message: string, media: MediaAsset): Promise<string> {
    const response = await fetch(`${GRAPH_API_BASE}/${this.pageId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: media.url,
        caption: message,
        access_token: this.pageAccessToken,
      }),
    });

    if (!response.ok) throw new Error("Failed to publish photo");
    const data = await response.json();
    return data.post_id || data.id;
  }

  private async publishMultiPhoto(message: string, media: MediaAsset[]): Promise<string> {
    // Upload photos unpublished first
    const photoIds: string[] = [];
    for (const item of media) {
      const response = await fetch(`${GRAPH_API_BASE}/${this.pageId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: item.url,
          published: false,
          access_token: this.pageAccessToken,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        photoIds.push(data.id);
      }
    }

    // Create post with attached photos
    const attachedMedia = photoIds.map((id) => ({ media_fbid: id }));
    const response = await fetch(`${GRAPH_API_BASE}/${this.pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        attached_media: attachedMedia,
        access_token: this.pageAccessToken,
      }),
    });

    if (!response.ok) throw new Error("Failed to publish multi-photo post");
    const data = await response.json();
    return data.id;
  }

  private async publishVideo(message: string, media: MediaAsset): Promise<string> {
    const response = await fetch(`${GRAPH_API_BASE}/${this.pageId}/videos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file_url: media.url,
        description: message,
        access_token: this.pageAccessToken,
      }),
    });

    if (!response.ok) throw new Error("Failed to publish video");
    const data = await response.json();
    return data.id;
  }

  private emptyMetrics(): MetricSnapshot {
    return {
      impressions: 0, reach: 0, engagements: 0, likes: 0,
      comments: 0, shares: 0, saves: 0, clicks: 0,
    };
  }
}
