import { PlatformIcon } from "@/components/shared/platform-icon";
import { type Platform } from "@/types/platform";
import { cn } from "@/lib/utils";

interface CalendarEventProps {
  title: string;
  time: string;
  platforms: Platform[];
  status: "scheduled" | "published" | "failed";
}

export function CalendarEvent({ title, time, platforms, status }: CalendarEventProps) {
  return (
    <div
      className={cn(
        "rounded-md p-1.5 text-xs mb-1 cursor-pointer",
        status === "published" && "bg-green-50 border border-green-200",
        status === "scheduled" && "bg-blue-50 border border-blue-200",
        status === "failed" && "bg-red-50 border border-red-200"
      )}
    >
      <div className="flex items-center gap-1">
        {platforms.map((p) => (
          <PlatformIcon key={p} platform={p} size="sm" />
        ))}
      </div>
      <p className="font-medium truncate mt-0.5">{title}</p>
      <p className="text-neutral-400">{time}</p>
    </div>
  );
}
