import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";
import { type PostStatus } from "@/types/post";
import { Clock, MoreHorizontal } from "lucide-react";

interface QueueItemProps {
  item: {
    id: string;
    title: string;
    content: string;
    platforms: string[];
    status: PostStatus;
    scheduledAt: Date | null;
  };
}

export function QueueItem({ item }: QueueItemProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge status={item.status} />
            {item.scheduledAt && (
              <span className="flex items-center gap-1 text-xs text-neutral-400">
                <Clock className="h-3 w-3" />
                {new Date(item.scheduledAt).toLocaleString()}
              </span>
            )}
          </div>
          <p className="text-sm truncate">{item.content}</p>
          <div className="flex gap-1 mt-1">
            {item.platforms.map((p) => (
              <span key={p} className="text-xs bg-neutral-100 rounded px-1.5 py-0.5 capitalize">{p}</span>
            ))}
          </div>
        </div>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
