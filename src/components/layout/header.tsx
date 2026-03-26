"use client";

import { Menu, Bell, Search, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useUIStore } from "@/lib/stores/ui.store";

export function Header() {
  const { toggleSidebar, toggleMobileNav } = useUIStore();
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-neutral-200 bg-white px-4 sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="hidden md:flex"
        onClick={toggleSidebar}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={toggleMobileNav}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1">
        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
          <input
            type="search"
            placeholder="Search..."
            className="w-full rounded-md border border-neutral-200 bg-neutral-50 py-2 pl-8 pr-4 text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-300"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          {session?.user?.image ? (
            <img
              src={session.user.image}
              alt={session.user.name || ""}
              className="h-8 w-8 rounded-full"
            />
          ) : (
            <Avatar fallback={session?.user?.name?.charAt(0) || "U"} />
          )}
          <span className="text-sm font-medium text-neutral-700 hidden sm:block">
            {session?.user?.name || session?.user?.email}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => signOut({ callbackUrl: "/login" })}
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
