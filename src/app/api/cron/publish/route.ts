import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { publishService } from "@/server/services/publish.service";

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find all posts scheduled to publish now (within the last 5 minutes)
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const scheduledPosts = await db.post.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: {
          lte: now,
          gte: fiveMinutesAgo,
        },
      },
      include: {
        platforms: {
          include: { connectedPlatform: true },
        },
        media: true,
      },
      take: 50, // Process max 50 posts per cron run
    });

    if (scheduledPosts.length === 0) {
      return NextResponse.json({ processed: 0, message: "No posts to publish" });
    }

    const results = [];

    for (const post of scheduledPosts) {
      // Mark as publishing
      await db.post.update({
        where: { id: post.id },
        data: { status: "PUBLISHING" },
      });

      try {
        const publishResults = await publishService.publishPost(post as any);

        const allSucceeded = publishResults.results.every((r) => r.success);
        const anySucceeded = publishResults.results.some((r) => r.success);
        const finalStatus = allSucceeded
          ? "PUBLISHED"
          : anySucceeded
            ? "PARTIALLY_PUBLISHED"
            : "FAILED";

        await db.post.update({
          where: { id: post.id },
          data: {
            status: finalStatus,
            publishedAt: anySucceeded ? new Date() : null,
          },
        });

        results.push({
          postId: post.id,
          status: finalStatus,
          platforms: publishResults.results,
        });
      } catch (error) {
        await db.post.update({
          where: { id: post.id },
          data: { status: "FAILED" },
        });

        results.push({
          postId: post.id,
          status: "FAILED",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      processed: scheduledPosts.length,
      results,
    });
  } catch (error) {
    console.error("Cron publish error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
