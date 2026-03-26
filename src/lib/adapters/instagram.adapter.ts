import { Platform, PLATFORM_LIMITS } from "@/types/platform";
import { type MediaAsset } from "@/types/post";
import { type MetricSnapshot } from "@/types/analytics";
import { type IPublishAdapter, type PublishResult } from "./types";

const GRAPH_API_BASE = "https://graph.facebook.com/v19.0";

export class InstagramAdapter implements IPublishAdapter {
  readonly platform = Platform.INSTAGRAM;
  private accessToken: string | null = null;
  private igUserId: string | null = null;

  async authenticate(credentials: {
    accessToken: string;
    refreshToken?: string;
  }): Promise<boolean> {
    this.accessToken = credentials.accessToken;

    try {
      // Get Instagram Business Account ID
      const response = await fetch(
        `${GRAPH_API_BASE}/me/accounts?fields=instagram_business_account&access_token=${this.accessToken}`
      );

      if (!response.ok) return false;

      const data = await response.json();
      const page = data.data?.[0];
      this.igUserId = page?.instagram_business_account?.id;

      return !!this.igUserId;
    } catch {
      return false;
    }
  }

  async publish(content: {
    text: string;
    media?: MediaAsset[];
    platformSpecificData?: Record<string, unknown>;
  }): Promise<PublishResult> {
    if (!this.accessToken || !this.igUserId) {
      return { success: false, error: "Not authenticated" };
    }

    try {
      // Instagram requires at least one media item for feed posts
      if (!content.media || content.media.length === 0) {
        return { success: false, error: "Instagram requires at least one image or video" };
      }

      let containerId: string;

      if (content.media.length === 1) {
        // Single media post
        containerId = await this.createSingleMediaContainer(
          content.media[0],
          content.text
        );
      } else {
        // Carousel post
        containerId = await this.createCarouselContainer(
          content.media,
          content.text
        );
      }

      // Publish the container
      const publishResponse = await fetch(
        `${GRAPH_API_BASE}/${this.igUserId}/media_publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creation_id: containerId,
            access_token: this.accessToken,
          }),
        }
      );

      if (!publishResponse.ok) {
        const errorData = await publishResponse.json().catch(() => ({}));
        return {
          success: false,
          error: `Instagram API error: ${JSON.stringify(errorData)}`,
        };
      }

      const publishData = await publishResponse.json();
      const postId = publishData.id;

      // Get the permalink
      const permalinkResponse = await fetch(
        `${GRAPH_API_BASE}/${postId}?fields=permalink&access_token=${this.accessToken}`
      );
      const permalinkData = await permalinkResponse.json().catch(() => ({}));

      return {
        success: true,
        platformPostId: postId,
        url: permalinkData.permalink || `https://www.instagram.com/p/${postId}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to publish to Instagram",
      };
    }
  }

  async getMetrics(platformPostId: string): Promise<MetricSnapshot> {
    if (!this.accessToken) return this.emptyMetrics();

    try {
      // Get basic metrics
      const response = await fetch(
        `${GRAPH_API_BASE}/${platformPostId}?fields=like_count,comments_count,timestamp&access_token=${this.accessToken}`
      );

      if (!response.ok) return this.emptyMetrics();
      const data = await response.json();

      // Get insights (impressions, reach, etc.)
      const insightsResponse = await fetch(
        `${GRAPH_API_BASE}/${platformPostId}/insights?metric=impressions,reach,saved,shares&access_token=${this.accessToken}`
      );

      let impressions = 0;
      let reach = 0;
      let saves = 0;
      let shares = 0;

      if (insightsResponse.ok) {
        const insightsData = await insightsResponse.json();
        for (const insight of insightsData.data || []) {
          const value = insight.values?.[0]?.value || 0;
          switch (insight.name) {
            case "impressions":
              impressions = value;
              break;
            case "reach":
              reach = value;
              break;
            case "saved":
              saves = value;
              break;
            case "shares":
              shares = value;
              break;
          }
        }
      }

      const likes = data.like_count || 0;
      const comments = data.comments_count || 0;

      return {
        impressions,
        reach,
        engagements: likes + comments + saves + shares,
        likes,
        comments,
        shares,
        saves,
        clicks: 0, // Not available through basic IG API
      };
    } catch {
      return this.emptyMetrics();
    }
  }

  async refreshToken(
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken?: string; expiresAt: Date }> {
    // Instagram uses long-lived tokens that can be refreshed
    const response = await fetch(
      `${GRAPH_API_BASE}/oauth/access_token?grant_type=ig_refresh_token&access_token=${refreshToken}`
    );

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.access_token, // Instagram returns the same token
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  }

  async deletePost(platformPostId: string): Promise<boolean> {
    if (!this.accessToken) return false;

    // Instagram doesn't support deleting posts via API for most use cases
    // This would require a Business API app with specific permissions
    return false;
  }

  validateContent(content: { text: string; media?: MediaAsset[] }) {
    const limits = PLATFORM_LIMITS[Platform.INSTAGRAM];
    const errors: string[] = [];

    if (content.text.length > limits.maxTextLength) {
      errors.push(`Caption exceeds ${limits.maxTextLength} character limit`);
    }

    if (!content.media || content.media.length === 0) {
      errors.push("Instagram requires at least one media item");
    }

    if (content.media && content.media.length > limits.maxMediaCount) {
      errors.push(`Maximum ${limits.maxMediaCount} media items for carousel`);
    }

    if (content.media) {
      for (const media of content.media) {
        if (!limits.supportedMediaTypes.includes(media.mimeType)) {
          errors.push(`Unsupported media type: ${media.mimeType}. Supported: ${limits.supportedMediaTypes.join(", ")}`);
        }
        if (media.size > limits.maxFileSize) {
          errors.push(`File exceeds ${limits.maxFileSize / (1024 * 1024)}MB limit`);
        }
        if (media.type === "video" && media.duration && limits.maxVideoLength && media.duration > limits.maxVideoLength) {
          errors.push(`Video exceeds ${limits.maxVideoLength} second limit`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  private async createSingleMediaContainer(
    media: MediaAsset,
    caption: string
  ): Promise<string> {
    const isVideo = media.mimeType.startsWith("video/");

    const params: Record<string, string> = {
      caption,
      access_token: this.accessToken!,
    };

    if (isVideo) {
      params.media_type = "VIDEO";
      params.video_url = media.url;
    } else {
      params.image_url = media.url;
    }

    const response = await fetch(`${GRAPH_API_BASE}/${this.igUserId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to create media container: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.id;
  }

  private async createCarouselContainer(
    media: MediaAsset[],
    caption: string
  ): Promise<string> {
    // Create individual media containers first
    const childContainerIds: string[] = [];

    for (const item of media) {
      const isVideo = item.mimeType.startsWith("video/");
      const params: Record<string, string> = {
        is_carousel_item: "true",
        access_token: this.accessToken!,
      };

      if (isVideo) {
        params.media_type = "VIDEO";
        params.video_url = item.url;
      } else {
        params.image_url = item.url;
      }

      const response = await fetch(`${GRAPH_API_BASE}/${this.igUserId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (response.ok) {
        const data = await response.json();
        childContainerIds.push(data.id);
      }
    }

    // Create carousel container
    const carouselResponse = await fetch(`${GRAPH_API_BASE}/${this.igUserId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        media_type: "CAROUSEL",
        children: childContainerIds,
        caption,
        access_token: this.accessToken,
      }),
    });

    if (!carouselResponse.ok) {
      throw new Error("Failed to create carousel container");
    }

    const carouselData = await carouselResponse.json();
    return carouselData.id;
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
