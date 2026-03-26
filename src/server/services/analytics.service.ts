import { db } from "@/server/db";
import { AdapterFactory } from "@/lib/adapters/factory";
import { decrypt } from "@/lib/utils/encryption";
import type { Platform } from "@/types/platform";
import type { AnalyticsPeriod, AnalyticsDashboard } from "@/types/analytics";

export class AnalyticsService {
  async getDashboardOverview(
    userId: string,
    period: AnalyticsPeriod
  ): Promise<AnalyticsDashboard> {
    const startDate = this.getPeriodStartDate(period);

    // Get latest snapshots for each platform post
    const platformPosts = await db.postPlatform.findMany({
      where: {
        post: { userId, publishedAt: { gte: startDate } },
        status: "PUBLISHED",
      },
      include: {
        connectedPlatform: { select: { platform: true } },
        analyticsSnapshots: {
          orderBy: { collectedAt: "desc" },
          take: 1,
        },
      },
    });

    let totalImpressions = 0;
    let totalEngagements = 0;
    let totalReach = 0;

    const platformBreakdown = new Map<string, { impressions: number; engagements: number; posts: number }>();

    for (const pp of platformPosts) {
      const snapshot = pp.analyticsSnapshots[0];
      if (snapshot) {
        totalImpressions += snapshot.impressions;
        totalEngagements += snapshot.engagements;
        totalReach += snapshot.reach;

        const platform = pp.connectedPlatform.platform;
        const existing = platformBreakdown.get(platform) || { impressions: 0, engagements: 0, posts: 0 };
        existing.impressions += snapshot.impressions;
        existing.engagements += snapshot.engagements;
        existing.posts++;
        platformBreakdown.set(platform, existing);
      }
    }

    const avgEngagementRate =
      totalImpressions > 0 ? (totalEngagements / totalImpressions) * 100 : 0;

    return {
      overview: {
        totalImpressions,
        totalEngagements,
        avgEngagementRate: Math.round(avgEngagementRate * 100) / 100,
        totalFollowers: 0, // Would come from platform APIs
        followersGrowth: 0,
      },
      platformBreakdown: Array.from(platformBreakdown.entries()).map(([platform, data]) => ({
        platform: platform as Platform,
        followers: 0,
        followersGrowth: 0,
        totalPosts: data.posts,
        avgEngagementRate:
          data.impressions > 0
            ? Math.round((data.engagements / data.impressions) * 10000) / 100
            : 0,
        period,
      })),
      recentPosts: [],
      trendData: [],
    };
  }

  async syncPlatformMetrics(userId: string): Promise<{ synced: number }> {
    // Get all published platform posts that need metrics sync
    const platformPosts = await db.postPlatform.findMany({
      where: {
        post: { userId },
        status: "PUBLISHED",
        platformPostId: { not: null },
      },
      include: {
        connectedPlatform: true,
      },
    });

    let synced = 0;

    for (const pp of platformPosts) {
      try {
        if (!pp.connectedPlatform.encryptedAccessToken || !pp.platformPostId) continue;

        const platform = pp.connectedPlatform.platform.toLowerCase() as Platform;
        const adapter = AdapterFactory.getAdapter(platform);
        const accessToken = decrypt(pp.connectedPlatform.encryptedAccessToken);

        await adapter.authenticate({ accessToken });
        const metrics = await adapter.getMetrics(pp.platformPostId);

        await db.analyticsSnapshot.create({
          data: {
            postPlatformId: pp.id,
            impressions: metrics.impressions,
            reach: metrics.reach,
            engagements: metrics.engagements,
            likes: metrics.likes,
            comments: metrics.comments,
            shares: metrics.shares,
            saves: metrics.saves,
            clicks: metrics.clicks,
            videoViews: metrics.videoViews,
            watchTime: metrics.watchTime,
          },
        });

        synced++;
      } catch (error) {
        console.error(`Failed to sync metrics for platform post ${pp.id}:`, error);
      }
    }

    return { synced };
  }

  async exportAnalytics(
    userId: string,
    period: AnalyticsPeriod,
    format: "csv" | "pdf"
  ): Promise<Buffer> {
    const startDate = this.getPeriodStartDate(period);

    const snapshots = await db.analyticsSnapshot.findMany({
      where: {
        collectedAt: { gte: startDate },
        postPlatform: { post: { userId } },
      },
      include: {
        postPlatform: {
          include: {
            post: { select: { content: true } },
            connectedPlatform: { select: { platform: true, displayName: true } },
          },
        },
      },
      orderBy: { collectedAt: "desc" },
    });

    if (format === "csv") {
      const header = "Date,Platform,Account,Content,Impressions,Reach,Engagements,Likes,Comments,Shares\n";
      const rows = snapshots
        .map(
          (s) =>
            `${s.collectedAt.toISOString()},${s.postPlatform.connectedPlatform.platform},` +
            `${s.postPlatform.connectedPlatform.displayName},` +
            `"${(s.postPlatform.post.content || "").replace(/"/g, '""').slice(0, 100)}",` +
            `${s.impressions},${s.reach},${s.engagements},${s.likes},${s.comments},${s.shares}`
        )
        .join("\n");

      return Buffer.from(header + rows);
    }

    // PDF export placeholder
    return Buffer.from("");
  }

  private getPeriodStartDate(period: AnalyticsPeriod): Date {
    const now = new Date();
    const periodDays: Record<string, number> = {
      day: 1,
      week: 7,
      month: 30,
      quarter: 90,
      year: 365,
    };
    return new Date(now.getTime() - (periodDays[period] || 30) * 24 * 60 * 60 * 1000);
  }
}

export const analyticsService = new AnalyticsService();
