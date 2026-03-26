import { type PostStatus } from "@/types/post";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: PostStatus;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-neutral-100 text-neutral-600" },
  scheduled: { label: "Scheduled", className: "bg-blue-100 text-blue-700" },
  queued: { label: "Queued", className: "bg-amber-100 text-amber-700" },
  publishing: { label: "Publishing", className: "bg-purple-100 text-purple-700" },
  published: { label: "Published", className: "bg-green-100 text-green-700" },
  failed: { label: "Failed", className: "bg-red-100 text-red-700" },
  partially_published: { label: "Partial", className: "bg-orange-100 text-orange-700" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.draft;

  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", config.className)}>
      {config.label}
    </span>
  );
}
