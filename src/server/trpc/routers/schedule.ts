import { z } from "zod/v4";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../index";
import { db } from "@/server/db";

export const scheduleRouter = router({
  getCalendar: protectedProcedure
    .input(
      z.object({
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const posts = await db.post.findMany({
        where: {
          userId,
          scheduledAt: {
            gte: new Date(input.startDate),
            lte: new Date(input.endDate),
          },
          status: { in: ["SCHEDULED", "PUBLISHED", "FAILED", "PARTIALLY_PUBLISHED"] },
        },
        include: {
          platforms: {
            include: {
              connectedPlatform: {
                select: { id: true, platform: true, displayName: true },
              },
            },
          },
          media: { select: { id: true, url: true, type: true, thumbnailUrl: true } },
        },
        orderBy: { scheduledAt: "asc" },
      });

      const events = posts.map((post) => ({
        id: post.id,
        title: post.title || post.content.slice(0, 60),
        content: post.content,
        scheduledAt: post.scheduledAt,
        status: post.status,
        platforms: post.platforms.map((pp) => ({
          platform: pp.connectedPlatform.platform,
          displayName: pp.connectedPlatform.displayName,
          status: pp.status,
        })),
        mediaCount: post.media.length,
      }));

      return { events };
    }),

  reschedule: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
        newScheduledAt: z.string().datetime(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const post = await db.post.findFirst({
        where: { id: input.postId, userId },
      });

      if (!post) throw new TRPCError({ code: "NOT_FOUND" });
      if (!["DRAFT", "SCHEDULED"].includes(post.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only draft or scheduled posts can be rescheduled",
        });
      }

      const newDate = new Date(input.newScheduledAt);
      if (newDate <= new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Scheduled time must be in the future",
        });
      }

      const updated = await db.post.update({
        where: { id: input.postId },
        data: {
          scheduledAt: newDate,
          status: "SCHEDULED",
        },
      });

      // Update all platform posts to scheduled
      await db.postPlatform.updateMany({
        where: { postId: input.postId, status: "DRAFT" },
        data: { status: "SCHEDULED" },
      });

      return { success: true, scheduledAt: updated.scheduledAt };
    }),

  bulkSchedule: protectedProcedure
    .input(
      z.object({
        postIds: z.array(z.string()).min(1).max(50),
        schedule: z.object({
          startDate: z.string().datetime(),
          interval: z.enum(["hourly", "daily", "weekly"]),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const intervalMs: Record<string, number> = {
        hourly: 60 * 60 * 1000,
        daily: 24 * 60 * 60 * 1000,
        weekly: 7 * 24 * 60 * 60 * 1000,
      };

      const startTime = new Date(input.schedule.startDate).getTime();
      const interval = intervalMs[input.schedule.interval];
      let scheduled = 0;

      for (let i = 0; i < input.postIds.length; i++) {
        const postId = input.postIds[i];
        const scheduledAt = new Date(startTime + i * interval);

        const post = await db.post.findFirst({
          where: { id: postId, userId, status: { in: ["DRAFT", "SCHEDULED"] } },
        });

        if (post) {
          await db.post.update({
            where: { id: postId },
            data: { scheduledAt, status: "SCHEDULED" },
          });
          await db.postPlatform.updateMany({
            where: { postId, status: "DRAFT" },
            data: { status: "SCHEDULED" },
          });
          scheduled++;
        }
      }

      return { scheduled };
    }),
});
