import { db } from "@/server/db";
import { AdapterFactory } from "@/lib/adapters/factory";
import { decrypt } from "@/lib/utils/encryption";
import type { Platform } from "@/types/platform";

interface PublishablePost {
  id: string;
  content: string;
  platforms: Array<{
    id: string;
    customContent: string | null;
    connectedPlatform: {
      id: string;
      platform: string;
      encryptedAccessToken: string | null;
      encryptedRefreshToken: string | null;
    };
  }>;
  media: Array<{
    id: string;
    url: string;
    type: string;
    mimeType: string;
    size: number;
    width: number | null;
    height: number | null;
    duration: number | null;
    thumbnailUrl: string | null;
  }>;
}

export class PublishService {
  async publishPost(post: PublishablePost): Promise<{
    results: Array<{ platform: string; success: boolean; platformPostId?: string; error?: string }>;
  }> {
    const results: Array<{ platform: string; success: boolean; platformPostId?: string; error?: string }> = [];

    // Publish to each platform in parallel
    const publishPromises = post.platforms.map(async (platformPost) => {
      const cp = platformPost.connectedPlatform;
      const platform = cp.platform.toLowerCase() as Platform;

      try {
        if (!cp.encryptedAccessToken) {
          throw new Error("No access token available");
        }

        const adapter = AdapterFactory.getAdapter(platform);
        const accessToken = decrypt(cp.encryptedAccessToken);

        // Authenticate the adapter
        await adapter.authenticate({
          accessToken,
          refreshToken: cp.encryptedRefreshToken ? decrypt(cp.encryptedRefreshToken) : undefined,
        });

        // Validate content
        const content = platformPost.customContent || post.content;
        const validation = adapter.validateContent({
          text: content,
          media: post.media as any[],
        });

        if (!validation.valid) {
          throw new Error(`Content validation failed: ${validation.errors.join(", ")}`);
        }

        // Publish
        const result = await adapter.publish({
          text: content,
          media: post.media as any[],
        });

        // Update platform post status
        await db.postPlatform.update({
          where: { id: platformPost.id },
          data: {
            status: result.success ? "PUBLISHED" : "FAILED",
            platformPostId: result.platformPostId,
            publishedAt: result.success ? new Date() : null,
            errorMessage: result.error,
            platformResponse: result as any,
          },
        });

        return {
          platform: cp.platform,
          success: result.success,
          platformPostId: result.platformPostId,
          error: result.error,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        await db.postPlatform.update({
          where: { id: platformPost.id },
          data: {
            status: "FAILED",
            errorMessage,
          },
        });

        return {
          platform: cp.platform,
          success: false,
          error: errorMessage,
        };
      }
    });

    const publishResults = await Promise.allSettled(publishPromises);
    for (const result of publishResults) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        results.push({
          platform: "unknown",
          success: false,
          error: result.reason?.message || "Publishing failed",
        });
      }
    }

    return { results };
  }

  async schedulePost(postId: string, scheduledAt: Date): Promise<{ jobId: string }> {
    // Update post status
    await db.post.update({
      where: { id: postId },
      data: {
        status: "SCHEDULED",
        scheduledAt,
      },
    });

    await db.postPlatform.updateMany({
      where: { postId },
      data: { status: "SCHEDULED" },
    });

    // In production, add to BullMQ queue
    // const { queueService } = await import("./queue.service");
    // const jobId = await queueService.addPublishJob(postId, scheduledAt);
    const jobId = `job_${postId}_${Date.now()}`;

    return { jobId };
  }

  async cancelScheduledPost(postId: string): Promise<boolean> {
    await db.post.update({
      where: { id: postId },
      data: {
        status: "DRAFT",
        scheduledAt: null,
      },
    });

    await db.postPlatform.updateMany({
      where: { postId },
      data: { status: "DRAFT" },
    });

    return true;
  }

  async retryFailedPost(postId: string): Promise<void> {
    const post = await db.post.findUnique({
      where: { id: postId },
      include: {
        platforms: {
          where: { status: "FAILED" },
          include: { connectedPlatform: true },
        },
        media: true,
      },
    });

    if (!post) throw new Error("Post not found");

    await db.post.update({
      where: { id: postId },
      data: { status: "PUBLISHING" },
    });

    await this.publishPost(post as any);

    // Re-evaluate final status
    const platformStatuses = await db.postPlatform.findMany({
      where: { postId },
      select: { status: true },
    });

    const allPublished = platformStatuses.every((p) => p.status === "PUBLISHED");
    const anyPublished = platformStatuses.some((p) => p.status === "PUBLISHED");

    await db.post.update({
      where: { id: postId },
      data: {
        status: allPublished ? "PUBLISHED" : anyPublished ? "PARTIALLY_PUBLISHED" : "FAILED",
        publishedAt: anyPublished ? new Date() : null,
      },
    });
  }
}

export const publishService = new PublishService();
