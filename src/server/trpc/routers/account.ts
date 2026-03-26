import { z } from "zod/v4";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../index";
import { db } from "@/server/db";
import { encrypt, decrypt } from "@/lib/utils/encryption";

export const accountRouter = router({
  listConnected: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session?.user?.id;
    if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

    const accounts = await db.connectedPlatform.findMany({
      where: { userId },
      select: {
        id: true,
        platform: true,
        platformUserId: true,
        displayName: true,
        avatarUrl: true,
        status: true,
        tokenExpiresAt: true,
        scopes: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return { accounts };
  }),

  connect: protectedProcedure
    .input(
      z.object({
        platform: z.enum(["X", "TIKTOK", "INSTAGRAM", "FACEBOOK", "SNAPCHAT"]),
        authorizationCode: z.string(),
        redirectUri: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Exchange authorization code for tokens via platform adapter
      const { AdapterFactory } = await import("@/lib/adapters/factory");
      const { Platform } = await import("@/types/platform");

      const platformEnum = input.platform.toLowerCase() as keyof typeof Platform;
      const platformValue = Platform[input.platform as keyof typeof Platform];
      const adapter = AdapterFactory.getAdapter(platformValue);

      // In a real implementation, each adapter would have an exchangeCode method
      // For now, store the code exchange result
      // The actual OAuth token exchange happens on the client redirect callback

      // Placeholder: In production, call the platform's token endpoint
      const tokenResponse = {
        accessToken: `placeholder_${input.platform}_${Date.now()}`,
        refreshToken: `refresh_${input.platform}_${Date.now()}`,
        expiresAt: new Date(Date.now() + 3600 * 1000),
        platformUserId: `user_${input.platform}`,
        displayName: `${input.platform} Account`,
      };

      const account = await db.connectedPlatform.upsert({
        where: {
          userId_platform_platformUserId: {
            userId,
            platform: input.platform,
            platformUserId: tokenResponse.platformUserId,
          },
        },
        update: {
          encryptedAccessToken: encrypt(tokenResponse.accessToken),
          encryptedRefreshToken: tokenResponse.refreshToken
            ? encrypt(tokenResponse.refreshToken)
            : null,
          tokenExpiresAt: tokenResponse.expiresAt,
          status: "CONNECTED",
          displayName: tokenResponse.displayName,
        },
        create: {
          userId,
          platform: input.platform,
          platformUserId: tokenResponse.platformUserId,
          displayName: tokenResponse.displayName,
          encryptedAccessToken: encrypt(tokenResponse.accessToken),
          encryptedRefreshToken: tokenResponse.refreshToken
            ? encrypt(tokenResponse.refreshToken)
            : null,
          tokenExpiresAt: tokenResponse.expiresAt,
          status: "CONNECTED",
          scopes: [],
        },
        select: {
          id: true,
          platform: true,
          displayName: true,
          status: true,
        },
      });

      // Log the connection
      await db.auditLog.create({
        data: {
          userId,
          action: "CONNECT_PLATFORM",
          entity: "ConnectedPlatform",
          entityId: account.id,
          metadata: { platform: input.platform },
        },
      });

      return { success: true, account };
    }),

  disconnect: protectedProcedure
    .input(z.object({ accountId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const account = await db.connectedPlatform.findFirst({
        where: { id: input.accountId, userId },
      });

      if (!account) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Connected account not found" });
      }

      // Check if there are any scheduled/publishing posts using this account
      const activePosts = await db.postPlatform.count({
        where: {
          connectedPlatformId: input.accountId,
          status: { in: ["SCHEDULED", "QUEUED", "PUBLISHING"] },
        },
      });

      if (activePosts > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot disconnect: ${activePosts} post(s) are scheduled or publishing with this account`,
        });
      }

      await db.connectedPlatform.update({
        where: { id: input.accountId },
        data: {
          status: "DISCONNECTED",
          encryptedAccessToken: null,
          encryptedRefreshToken: null,
          tokenExpiresAt: null,
        },
      });

      await db.auditLog.create({
        data: {
          userId,
          action: "DISCONNECT_PLATFORM",
          entity: "ConnectedPlatform",
          entityId: input.accountId,
          metadata: { platform: account.platform },
        },
      });

      return { success: true };
    }),

  refreshToken: protectedProcedure
    .input(z.object({ accountId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

      const account = await db.connectedPlatform.findFirst({
        where: { id: input.accountId, userId },
      });

      if (!account) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (!account.encryptedRefreshToken) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No refresh token available" });
      }

      const { AdapterFactory } = await import("@/lib/adapters/factory");
      const { Platform } = await import("@/types/platform");

      const platformValue = account.platform.toLowerCase() as (typeof Platform)[keyof typeof Platform];
      const adapter = AdapterFactory.getAdapter(platformValue);
      const refreshToken = decrypt(account.encryptedRefreshToken);

      try {
        const newTokens = await adapter.refreshToken(refreshToken);

        await db.connectedPlatform.update({
          where: { id: input.accountId },
          data: {
            encryptedAccessToken: encrypt(newTokens.accessToken),
            encryptedRefreshToken: newTokens.refreshToken
              ? encrypt(newTokens.refreshToken)
              : account.encryptedRefreshToken,
            tokenExpiresAt: newTokens.expiresAt,
            status: "CONNECTED",
          },
        });

        return { success: true };
      } catch (error) {
        await db.connectedPlatform.update({
          where: { id: input.accountId },
          data: { status: "EXPIRED" },
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to refresh token. Please reconnect the account.",
        });
      }
    }),

  getOAuthUrl: protectedProcedure
    .input(
      z.object({
        platform: z.enum(["X", "TIKTOK", "INSTAGRAM", "FACEBOOK", "SNAPCHAT"]),
      })
    )
    .query(async ({ ctx, input }) => {
      const baseUrls: Record<string, string> = {
        X: "https://twitter.com/i/oauth2/authorize",
        TIKTOK: "https://www.tiktok.com/v2/auth/authorize",
        INSTAGRAM: "https://api.instagram.com/oauth/authorize",
        FACEBOOK: "https://www.facebook.com/v19.0/dialog/oauth",
        SNAPCHAT: "https://accounts.snapchat.com/accounts/oauth2/auth",
      };

      const clientIds: Record<string, string | undefined> = {
        X: process.env.X_CLIENT_ID,
        TIKTOK: process.env.TIKTOK_CLIENT_KEY,
        INSTAGRAM: process.env.INSTAGRAM_APP_ID,
        FACEBOOK: process.env.FACEBOOK_APP_ID,
        SNAPCHAT: process.env.SNAPCHAT_CLIENT_ID,
      };

      const scopes: Record<string, string> = {
        X: "tweet.read tweet.write users.read offline.access",
        TIKTOK: "video.publish,video.upload,user.info.basic",
        INSTAGRAM: "instagram_basic,instagram_content_publish,instagram_manage_insights",
        FACEBOOK: "pages_manage_posts,pages_read_engagement,publish_to_groups,read_insights",
        SNAPCHAT: "snapchat-marketing-api",
      };

      const clientId = clientIds[input.platform];
      if (!clientId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `${input.platform} OAuth is not configured. Set the API credentials in environment variables.`,
        });
      }

      const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/callback/${input.platform.toLowerCase()}`;
      const state = crypto.randomUUID();

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: scopes[input.platform],
        state,
      });

      return {
        url: `${baseUrls[input.platform]}?${params.toString()}`,
        state,
      };
    }),
});
