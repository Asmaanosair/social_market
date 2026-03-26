"use client";

import { useState } from "react";
import { type PostStatus } from "@/types/post";

interface QueueItem {
  id: string;
  title: string;
  content: string;
  platforms: string[];
  status: PostStatus;
  scheduledAt: Date | null;
}

export function useQueue() {
  const [filter, setFilter] = useState<PostStatus | "all">("all");

  // TODO: Replace with tRPC query when connected
  const items: QueueItem[] = [];
  const isLoading = false;

  const filteredItems =
    filter === "all" ? items : items.filter((item) => item.status === filter);

  const cancelPost = async (id: string) => {
    // TODO: Implement via tRPC
  };

  const retryPost = async (id: string) => {
    // TODO: Implement via tRPC
  };

  return {
    items: filteredItems,
    isLoading,
    filter,
    setFilter,
    cancelPost,
    retryPost,
  };
}
