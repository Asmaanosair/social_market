"use client";

import { useState } from "react";
import { type AnalyticsPeriod } from "@/types/analytics";

export function useAnalytics() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("month" as AnalyticsPeriod);
  const [isExporting, setIsExporting] = useState(false);

  // TODO: Replace with tRPC queries when connected
  const overview = {
    totalImpressions: 0,
    totalEngagements: 0,
    avgEngagementRate: 0,
    totalFollowers: 0,
    followersGrowth: 0,
  };

  const exportData = async (format: "csv" | "pdf") => {
    setIsExporting(true);
    try {
      // TODO: Implement export via tRPC
    } finally {
      setIsExporting(false);
    }
  };

  return {
    period,
    setPeriod,
    overview,
    isExporting,
    exportData,
  };
}
