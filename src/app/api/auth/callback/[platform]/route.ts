import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { encrypt } from "@/lib/utils/encryption";

const PLATFORM_MAP: Record<string, string> = {
  x: "X",
  tiktok: "TIKTOK",
  instagram: "INSTAGRAM",
  facebook: "FACEBOOK",
  snapchat: "SNAPCHAT",
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const username = url.searchParams.get("username");

  const platformKey = PLATFORM_MAP[platform.toLowerCase()];
  if (!platformKey) {
    return NextResponse.redirect(
      new URL("/settings/accounts?error=unknown_platform", url.origin)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/settings/accounts?error=no_code", url.origin)
    );
  }

  // Get current user session
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(
      new URL("/login?callbackUrl=/settings/accounts", url.origin)
    );
  }

  const userId = session.user.id;
  const displayName = username || `${platformKey} Account`;
  const platformUserId = `${platform.toLowerCase()}_${username || Date.now()}`;

  try {
    // Create or update the connected platform account
    await db.connectedPlatform.upsert({
      where: {
        userId_platform_platformUserId: {
          userId,
          platform: platformKey,
          platformUserId,
        },
      },
      update: {
        encryptedAccessToken: encrypt(`dev_token_${platformKey}_${Date.now()}`),
        encryptedRefreshToken: encrypt(`dev_refresh_${platformKey}_${Date.now()}`),
        tokenExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        status: "CONNECTED",
        displayName,
      },
      create: {
        userId,
        platform: platformKey,
        platformUserId,
        displayName,
        encryptedAccessToken: encrypt(`dev_token_${platformKey}_${Date.now()}`),
        encryptedRefreshToken: encrypt(`dev_refresh_${platformKey}_${Date.now()}`),
        tokenExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        status: "CONNECTED",
        scopes: "[]",
      },
    });

    // Log the connection
    await db.auditLog.create({
      data: {
        userId,
        action: "CONNECT_PLATFORM",
        entity: "ConnectedPlatform",
        entityId: platformUserId,
        metadata: JSON.stringify({ platform: platformKey, username: displayName }),
      },
    });

    return NextResponse.redirect(
      new URL(`/settings/accounts?connected=${platform.toLowerCase()}`, url.origin)
    );
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/settings/accounts?error=connection_failed", url.origin)
    );
  }
}
