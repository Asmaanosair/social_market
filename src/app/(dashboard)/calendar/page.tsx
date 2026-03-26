import { CalendarView } from "@/components/calendar/calendar-view";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Content Calendar</h1>
          <p className="text-sm text-neutral-500 mt-1">View and manage your scheduled content</p>
        </div>
        <Link href="/compose">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </Link>
      </div>
      <CalendarView />
    </div>
  );
}
