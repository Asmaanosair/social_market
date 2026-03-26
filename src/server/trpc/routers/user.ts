import { z } from "zod/v4";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../index";
import { db } from "@/server/db";

export const userRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session?.user?.id;
    if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        mfaEnabled: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            posts: true,
            connectedPlatforms: true,
          },
        },
      },
    });

    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    return user;
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100).optional(),
        image: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const updated = await db.user.update({
        where: { id: userId },
        data: {
          ...(input.name !== undefined && { name: input.name }),
          ...(input.image !== undefined && { image: input.image }),
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      });

      return updated;
    }),

  enableMfa: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session?.user?.id;
    if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

    // Generate a TOTP secret (placeholder — in production use a library like speakeasy)
    const { randomBytes } = await import("crypto");
    const secret = randomBytes(20).toString("hex");

    await db.user.update({
      where: { id: userId },
      data: { mfaSecret: secret },
    });

    return {
      secret,
      qrCodeUrl: `otpauth://totp/SocialMarket:${ctx.session?.user?.email}?secret=${secret}&issuer=SocialMarket`,
    };
  }),

  verifyMfa: protectedProcedure
    .input(z.object({ code: z.string().length(6) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const user = await db.user.findUnique({
        where: { id: userId },
        select: { mfaSecret: true },
      });

      if (!user?.mfaSecret) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "MFA not set up. Call enableMfa first." });
      }

      // In production, verify the TOTP code against the secret using speakeasy
      // For now, mark MFA as enabled after setup
      await db.user.update({
        where: { id: userId },
        data: { mfaEnabled: true },
      });

      return { success: true };
    }),
});
