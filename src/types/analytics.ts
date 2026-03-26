import { Platform } from "./platform";

export interface MetricSnapshot {
  impressions: number;
  reach: number;
  engagements: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  videoViews?: number;
  watchTime?: number;
}

export interface PostAnalytics {
  postId: string;
  platform: Platform;
  metrics: MetricSnapshot;
  collectedAt: Date;
}

export interface PlatformAnalytics {
  platform: Platform;
  followers: number;
  followersGrowth: number;
  totalPosts: number;
  avgEngagementRate: number;
  topPostId?: string;
  period: AnalyticsPeriod;
}

export enum AnalyticsPeriod {
  DAY = "day",
  WEEK = "week",
  MONTH = "month",
  QUARTER = "quarter",
  YEAR = "year",
}

export interface AnalyticsDashboard {
  overview: {
    totalImpressions: number;
    totalEngagements: number;
    avgEngagementRate: number;
    totalFollowers: number;
    followersGrowth: number;
  };
  platformBreakdown: PlatformAnalytics[];
  recentPosts: PostAnalytics[];
  trendData: TrendDataPoint[];
}

export interface TrendDataPoint {
  date: string;
  impressions: number;
  engagements: number;
  followers: number;
}
