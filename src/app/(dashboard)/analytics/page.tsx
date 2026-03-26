"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { MetricsCard } from "@/components/analytics/metrics-card";
import { TrendChart } from "@/components/analytics/trend-chart";
import { PlatformBreakdown } from "@/components/analytics/platform-breakdown";
import { TopPosts } from "@/components/analytics/top-posts";
import { ExportButton } from "@/components/analytics/export-button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Eye, Users, Heart, TrendingUp } from "lucide-react";

type Period = "day" | "week" | "month" | "quarter" | "year";

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("month");

  const { data: overview } = trpc.analytics.overview.useQuery({ period });
  const { data: impressionTrends } = trpc.analytics.trends.useQuery({ period, metric: "impressions" });
  const { data: engagementTrends } = trpc.analytics.trends.useQuery({ period, metric: "engagements" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Analytics</h1>
          <p className="text-sm text-neutral-500 mt-1">Track your social media performance</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="text-sm border rounded-md px-2 py-1.5"
          >
            <option value="day">Last 24h</option>
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
            <option value="quarter">Last 90 days</option>
            <option value="year">Last year</option>
          </select>
          <ExportButton />
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricsCard
              title="Impressions"
              value={formatNumber(overview?.totalImpressions ?? 0)}
              change={0}
              icon={<Eye className="h-4 w-4" />}
            />
            <MetricsCard
              title="Engagements"
              value={formatNumber(overview?.totalEngagements ?? 0)}
              change={0}
              icon={<Heart className="h-4 w-4" />}
            />
            <MetricsCard
              title="Engagement Rate"
              value={`${overview?.avgEngagementRate ?? 0}%`}
              change={0}
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <MetricsCard
              title="Total Posts"
              value={formatNumber(overview?.totalPosts ?? 0)}
              change={0}
              icon={<Users className="h-4 w-4" />}
            />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <TrendChart
              title="Impressions Over Time"
              data={impressionTrends?.data ?? []}
            />
            <TrendChart
              title="Engagements Over Time"
              data={engagementTrends?.data ?? []}
            />
          </div>
        </TabsContent>

        <TabsContent value="platforms">
          <PlatformBreakdown />
        </TabsContent>

        <TabsContent value="posts">
          <TopPosts />
        </TabsContent>
      </Tabs>
    </div>
  );
}
