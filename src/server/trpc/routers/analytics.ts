import { z } from "zod/v4";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../index";
import { db } from "@/server/db";

function getPeriodStartDate(period: string): Date {
  const now = new Date();
  switch (period) {
    case "day":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "week":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "month":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "quarter":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case "year":
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

export const analyticsRouter = router({
  overview: protectedProcedure
    .input(
      z.object({
        period: z.enum(["day", "week", "month", "quarter", "year"]).default("month"),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const startDate = getPeriodStartDate(input.period);

      // Get all analytics snapshots for user's posts in the period
      const snapshots = await db.analyticsSnapshot.findMany({
        where: {
          collectedAt: { gte: startDate },
          postPlatform: {
            post: { userId },
          },
        },
        orderBy: { collectedAt: "desc" },
      });

      // Aggregate metrics
      const totals = snapshots.reduce(
        (acc, s) => ({
          impressions: acc.impressions + s.impressions,
          engagements: acc.engagements + s.engagements,
          likes: acc.likes + s.likes,
          comments: acc.comments + s.comments,
          shares: acc.shares + s.shares,
          saves: acc.saves + s.saves,
          clicks: acc.clicks + s.clicks,
          reach: acc.reach + s.reach,
        }),
        { impressions: 0, engagements: 0, likes: 0, comments: 0, shares: 0, saves: 0, clicks: 0, reach: 0 }
      );

      const avgEngagementRate =
        totals.impressions > 0 ? (totals.engagements / totals.impressions) * 100 : 0;

      // Count total published posts
      const totalPosts = await db.post.count({
        where: {
          userId,
          status: "PUBLISHED",
          publishedAt: { gte: startDate },
        },
      });

      return {
        totalImpressions: totals.impressions,
        totalEngagements: totals.engagements,
        avgEngagementRate: Math.round(avgEngagementRate * 100) / 100,
        totalReach: totals.reach,
        totalPosts,
        likes: totals.likes,
        comments: totals.comments,
        shares: totals.shares,
      };
    }),

  platformBreakdown: protectedProcedure
    .input(
      z.object({
        period: z.enum(["day", "week", "month", "quarter", "year"]).default("month"),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const startDate = getPeriodStartDate(input.period);

      // Get platform posts with analytics
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

      // Group by platform
      const platformMap = new Map<
        string,
        { impressions: number; engagements: number; posts: number; reach: number }
      >();

      for (const pp of platformPosts) {
        const platform = pp.connectedPlatform.platform;
        const existing = platformMap.get(platform) || {
          impressions: 0,
          engagements: 0,
          posts: 0,
          reach: 0,
        };

        const snapshot = pp.analyticsSnapshots[0];
        if (snapshot) {
          existing.impressions += snapshot.impressions;
          existing.engagements += snapshot.engagements;
          existing.reach += snapshot.reach;
        }
        existing.posts++;
        platformMap.set(platform, existing);
      }

      const platforms = Array.from(platformMap.entries()).map(([platform, data]) => ({
        platform,
        ...data,
        avgEngagementRate:
          data.impressions > 0
            ? Math.round((data.engagements / data.impressions) * 10000) / 100
            : 0,
      }));

      return { platforms };
    }),

  postPerformance: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const post = await db.post.findFirst({
        where: { id: input.postId, userId },
        include: {
          platforms: {
            include: {
              connectedPlatform: { select: { platform: true, displayName: true } },
              analyticsSnapshots: {
                orderBy: { collectedAt: "desc" },
              },
            },
          },
        },
      });

      if (!post) throw new TRPCError({ code: "NOT_FOUND" });

      const metrics = post.platforms.map((pp) => ({
        platform: pp.connectedPlatform.platform,
        displayName: pp.connectedPlatform.displayName,
        status: pp.status,
        snapshots: pp.analyticsSnapshots.map((s) => ({
          impressions: s.impressions,
          reach: s.reach,
          engagements: s.engagements,
          likes: s.likes,
          comments: s.comments,
          shares: s.shares,
          saves: s.saves,
          clicks: s.clicks,
          collectedAt: s.collectedAt,
        })),
      }));

      return { postId: post.id, content: post.content, metrics };
    }),

  trends: protectedProcedure
    .input(
      z.object({
        period: z.enum(["day", "week", "month", "quarter", "year"]).default("month"),
        metric: z.enum(["impressions", "engagements", "reach"]).default("impressions"),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const startDate = getPeriodStartDate(input.period);

      const snapshots = await db.analyticsSnapshot.findMany({
        where: {
          collectedAt: { gte: startDate },
          postPlatform: { post: { userId } },
        },
        orderBy: { collectedAt: "asc" },
        select: {
          impressions: true,
          engagements: true,
          reach: true,
          collectedAt: true,
        },
      });

      // Group by date
      const dateMap = new Map<string, { impressions: number; engagements: number; reach: number }>();
      for (const s of snapshots) {
        const dateKey = s.collectedAt.toISOString().split("T")[0];
        const existing = dateMap.get(dateKey) || { impressions: 0, engagements: 0, reach: 0 };
        existing.impressions += s.impressions;
        existing.engagements += s.engagements;
        existing.reach += s.reach;
        dateMap.set(dateKey, existing);
      }

      const data = Array.from(dateMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, metrics]) => ({
          date,
          value: metrics[input.metric],
        }));

      return { data };
    }),

  export: protectedProcedure
    .input(
      z.object({
        format: z.enum(["csv", "pdf"]),
        period: z.enum(["day", "week", "month", "quarter", "year"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const startDate = getPeriodStartDate(input.period);

      // Fetch all analytics data for export
      const snapshots = await db.analyticsSnapshot.findMany({
        where: {
          collectedAt: { gte: startDate },
          postPlatform: { post: { userId } },
        },
        include: {
          postPlatform: {
            include: {
              post: { select: { content: true, publishedAt: true } },
              connectedPlatform: { select: { platform: true, displayName: true } },
            },
          },
        },
        orderBy: { collectedAt: "desc" },
      });

      if (input.format === "csv") {
        const headers = [
          "Date",
          "Platform",
          "Account",
          "Content",
          "Impressions",
          "Reach",
          "Engagements",
          "Likes",
          "Comments",
          "Shares",
          "Saves",
          "Clicks",
        ];

        const rows = snapshots.map((s) => [
          s.collectedAt.toISOString(),
          s.postPlatform.connectedPlatform.platform,
          s.postPlatform.connectedPlatform.displayName,
          `"${(s.postPlatform.post.content || "").replace(/"/g, '""').slice(0, 100)}"`,
          s.impressions,
          s.reach,
          s.engagements,
          s.likes,
          s.comments,
          s.shares,
          s.saves,
          s.clicks,
        ]);

        const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        // In production, upload to S3 and return download URL
        const encoded = Buffer.from(csv).toString("base64");
        return { downloadUrl: `data:text/csv;base64,${encoded}`, filename: `analytics-${input.period}.csv` };
      }

      // PDF export placeholder
      return { downloadUrl: "", filename: `analytics-${input.period}.pdf` };
    }),
});
