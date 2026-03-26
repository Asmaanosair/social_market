"use client";

import { useQueue } from "@/lib/hooks/use-queue";
import { QueueItem } from "./queue-item";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

export function QueueList() {
  const { items, isLoading } = useQueue();

  if (isLoading) return <LoadingSpinner />;

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500">No items in the queue</p>
        <p className="text-sm text-neutral-400 mt-1">Schedule posts to see them here</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <QueueItem key={item.id} item={item} />
      ))}
    </div>
  );
}
