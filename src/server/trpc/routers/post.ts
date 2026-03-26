import { z } from "zod/v4";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../index";
import { db } from "@/server/db";

export const postRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "FAILED", "PARTIALLY_PUBLISHED"]).optional(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const posts = await db.post.findMany({
        where: {
          userId,
          ...(input.status && { status: input.status }),
        },
        take: input.limit + 1,
        ...(input.cursor && {
          cursor: { id: input.cursor },
          skip: 1,
        }),
        orderBy: { createdAt: "desc" },
        include: {
          platforms: {
            include: {
              connectedPlatform: {
                select: {
                  id: true,
                  platform: true,
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
          media: true,
        },
      });

      let nextCursor: string | undefined;
      if (posts.length > input.limit) {
        const nextItem = posts.pop();
        nextCursor = nextItem?.id;
      }

      return { posts, nextCursor };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const post = await db.post.findFirst({
        where: { id: input.id, userId },
        include: {
          platforms: {
            include: {
              connectedPlatform: {
                select: {
                  id: true,
                  platform: true,
                  displayName: true,
                  avatarUrl: true,
                  status: true,
                },
              },
              analyticsSnapshots: {
                orderBy: { collectedAt: "desc" },
                take: 1,
              },
            },
          },
          media: true,
        },
      });

      if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
      return post;
    }),

  create: protectedProcedure
    .input(
      z.object({
        content: z.string().min(1).max(63206),
        title: z.string().max(200).optional(),
        platforms: z.array(z.string()).min(1),
        scheduledAt: z.string().datetime().optional(),
        mediaIds: z.array(z.string()).optional(),
        platformOverrides: z
          .record(z.string(), z.object({ text: z.string().optional() }))
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Verify the user has connected the requested platforms
      const connectedPlatforms = await db.connectedPlatform.findMany({
        where: {
          userId,
          id: { in: input.platforms },
          status: "CONNECTED",
        },
      });

      if (connectedPlatforms.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No connected platforms found. Connect a platform in Settings first.",
        });
      }

      const status = input.scheduledAt ? "SCHEDULED" : "DRAFT";

      const post = await db.post.create({
        data: {
          userId,
          content: input.content,
          title: input.title,
          status,
          scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
          platforms: {
            create: connectedPlatforms.map((cp) => ({
              connectedPlatformId: cp.id,
              customContent: input.platformOverrides?.[cp.id]?.text ?? null,
              status: status,
            })),
          },
          ...(input.mediaIds &&
            input.mediaIds.length > 0 && {
              media: {
                connect: input.mediaIds.map((id) => ({ id })),
              },
            }),
        },
        include: {
          platforms: {
            include: {
              connectedPlatform: {
                select: { id: true, platform: true, displayName: true },
              },
            },
          },
          media: true,
        },
      });

      return post;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        content: z.string().min(1).max(63206).optional(),
        title: z.string().max(200).optional(),
        scheduledAt: z.string().datetime().nullable().optional(),
        status: z.enum(["DRAFT", "SCHEDULED"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Only allow editing draft/scheduled posts
      const existing = await db.post.findFirst({
        where: { id: input.id, userId },
      });

      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      if (!["DRAFT", "SCHEDULED"].includes(existing.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only draft or scheduled posts can be edited",
        });
      }

      const updated = await db.post.update({
        where: { id: input.id },
        data: {
          ...(input.content !== undefined && { content: input.content }),
          ...(input.title !== undefined && { title: input.title }),
          ...(input.scheduledAt !== undefined && {
            scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
          }),
          ...(input.status !== undefined && { status: input.status }),
        },
        include: {
          platforms: {
            include: {
              connectedPlatform: {
                select: { id: true, platform: true, displayName: true },
              },
            },
          },
          media: true,
        },
      });

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const post = await db.post.findFirst({
        where: { id: input.id, userId },
      });

      if (!post) throw new TRPCError({ code: "NOT_FOUND" });

      if (post.status === "PUBLISHING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete a post that is currently publishing",
        });
      }

      await db.post.delete({ where: { id: input.id } });

      return { success: true };
    }),

  publishNow: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const post = await db.post.findFirst({
        where: { id: input.id, userId },
        include: {
          platforms: {
            include: { connectedPlatform: true },
          },
          media: true,
        },
      });

      if (!post) throw new TRPCError({ code: "NOT_FOUND" });
      if (!["DRAFT", "SCHEDULED"].includes(post.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only draft or scheduled posts can be published",
        });
      }

      // Update status to PUBLISHING
      await db.post.update({
        where: { id: input.id },
        data: { status: "PUBLISHING" },
      });

      // Trigger async publishing via the publish service
      // In production this would go through BullMQ
      const { publishService } = await import("@/server/services/publish.service");
      const results = await publishService.publishPost(post as any);

      // Determine final status
      const allSucceeded = results.results.every((r) => r.success);
      const anySucceeded = results.results.some((r) => r.success);
      const finalStatus = allSucceeded
        ? "PUBLISHED"
        : anySucceeded
          ? "PARTIALLY_PUBLISHED"
          : "FAILED";

      await db.post.update({
        where: { id: input.id },
        data: {
          status: finalStatus,
          publishedAt: anySucceeded ? new Date() : null,
        },
      });

      return { status: finalStatus, results: results.results };
    }),
});
