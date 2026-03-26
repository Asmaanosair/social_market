"use client";

import { trpc } from "@/lib/trpc/client";
import { MetricsCard } from "@/components/analytics/metrics-card";
import { TrendChart } from "@/components/analytics/trend-chart";
import { Eye, Users, Heart, Share2 } from "lucide-react";

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export default function DashboardPage() {
  const { data: overview, isLoading } = trpc.analytics.overview.useQuery({ period: "month" });
  const { data: trends } = trpc.analytics.trends.useQuery({ period: "month", metric: "impressions" });
  const { data: engagementTrends } = trpc.analytics.trends.useQuery({ period: "month", metric: "engagements" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-1">Overview of your social media performance</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricsCard
          title="Total Impressions"
          value={isLoading ? "..." : formatNumber(overview?.totalImpressions ?? 0)}
          change={0}
          changeLabel="vs last period"
          icon={<Eye className="h-4 w-4" />}
        />
        <MetricsCard
          title="Total Reach"
          value={isLoading ? "..." : formatNumber(overview?.totalReach ?? 0)}
          change={0}
          changeLabel="vs last period"
          icon={<Users className="h-4 w-4" />}
        />
        <MetricsCard
          title="Engagements"
          value={isLoading ? "..." : formatNumber(overview?.totalEngagements ?? 0)}
          change={0}
          changeLabel="vs last period"
          icon={<Heart className="h-4 w-4" />}
        />
        <MetricsCard
          title="Engagement Rate"
          value={isLoading ? "..." : `${overview?.avgEngagementRate ?? 0}%`}
          change={0}
          changeLabel="vs last period"
          icon={<Share2 className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TrendChart
          title="Impressions Over Time"
          data={trends?.data?.map((d) => ({ date: d.date, value: d.value })) ?? []}
        />
        <TrendChart
          title="Engagement Over Time"
          data={engagementTrends?.data?.map((d) => ({ date: d.date, value: d.value })) ?? []}
        />
      </div>
    </div>
  );
}
