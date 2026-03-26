import { Queue, Worker, type Job } from "bullmq";
import IORedis from "ioredis";

const getRedisConnection = () => {
  if (!process.env.REDIS_URL) {
    console.warn("REDIS_URL not configured, queue service unavailable");
    return null;
  }
  return new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
};

export class QueueService {
  private publishQueue: Queue | null = null;
  private analyticsQueue: Queue | null = null;

  constructor() {
    try {
      const connection = getRedisConnection();
      if (connection) {
        this.publishQueue = new Queue("publish", { connection });
        this.analyticsQueue = new Queue("analytics-sync", { connection });
      }
    } catch {
      console.warn("Failed to initialize queue service");
    }
  }

  async schedulePublish(postId: string, publishAt: Date): Promise<string | null> {
    if (!this.publishQueue) return null;
    const delay = publishAt.getTime() - Date.now();
    const job = await this.publishQueue.add(
      "publish-post",
      { postId },
      {
        delay: Math.max(0, delay),
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: true,
        removeOnFail: false,
      }
    );
    return job.id ?? null;
  }

  async cancelScheduledPublish(jobId: string): Promise<boolean> {
    if (!this.publishQueue) return false;
    try {
      const job = await this.publishQueue.getJob(jobId);
      if (job) {
        await job.remove();
        return true;
      }
    } catch {
      // Job may already be processing
    }
    return false;
  }

  async queueAnalyticsSync(accountId: string): Promise<string | null> {
    if (!this.analyticsQueue) return null;
    const job = await this.analyticsQueue.add(
      "sync-metrics",
      { accountId },
      {
        attempts: 2,
        backoff: { type: "exponential", delay: 10000 },
        removeOnComplete: true,
      }
    );
    return job.id ?? null;
  }

  async getQueueStats(): Promise<{
    publish: { waiting: number; active: number; completed: number; failed: number };
    analytics: { waiting: number; active: number; completed: number; failed: number };
  }> {
    const defaultStats = { waiting: 0, active: 0, completed: 0, failed: 0 };
    if (!this.publishQueue || !this.analyticsQueue) {
      return { publish: defaultStats, analytics: defaultStats };
    }

    const [publishCounts, analyticsCounts] = await Promise.all([
      this.publishQueue.getJobCounts(),
      this.analyticsQueue.getJobCounts(),
    ]);

    return {
      publish: {
        waiting: publishCounts.waiting ?? 0,
        active: publishCounts.active ?? 0,
        completed: publishCounts.completed ?? 0,
        failed: publishCounts.failed ?? 0,
      },
      analytics: {
        waiting: analyticsCounts.waiting ?? 0,
        active: analyticsCounts.active ?? 0,
        completed: analyticsCounts.completed ?? 0,
        failed: analyticsCounts.failed ?? 0,
      },
    };
  }

  startWorkers(): void {
    const connection = getRedisConnection();
    if (!connection) return;

    // Publish worker
    new Worker(
      "publish",
      async (job: Job) => {
        const { postId } = job.data;
        const { db } = await import("@/server/db");
        const { publishService } = await import("./publish.service");

        const post = await db.post.findUnique({
          where: { id: postId },
          include: {
            platforms: { include: { connectedPlatform: true } },
            media: true,
          },
        });

        if (!post) throw new Error(`Post ${postId} not found`);
        if (post.status !== "SCHEDULED") return;

        await db.post.update({
          where: { id: postId },
          data: { status: "PUBLISHING" },
        });

        const results = await publishService.publishPost(post as any);

        const allSucceeded = results.results.every((r) => r.success);
        const anySucceeded = results.results.some((r) => r.success);

        await db.post.update({
          where: { id: postId },
          data: {
            status: allSucceeded ? "PUBLISHED" : anySucceeded ? "PARTIALLY_PUBLISHED" : "FAILED",
            publishedAt: anySucceeded ? new Date() : null,
          },
        });
      },
      { connection, concurrency: 5 }
    );

    // Analytics sync worker
    new Worker(
      "analytics-sync",
      async (job: Job) => {
        const { analyticsService } = await import("./analytics.service");
        await analyticsService.syncPlatformMetrics(job.data.accountId);
      },
      { connection, concurrency: 2 }
    );

    console.log("Queue workers started");
  }
}

export const queueService = new QueueService();
