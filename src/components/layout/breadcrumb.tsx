"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname?.split("/").filter(Boolean) ?? [];

  if (segments.length === 0) return null;

  return (
    <nav className="flex items-center gap-1.5 text-sm text-neutral-500 mb-4">
      <Link href="/dashboard" className="hover:text-neutral-900">Home</Link>
      {segments.map((segment, index) => (
        <span key={segment} className="flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5" />
          {index === segments.length - 1 ? (
            <span className="text-neutral-900 font-medium capitalize">{segment}</span>
          ) : (
            <Link href={`/${segments.slice(0, index + 1).join("/")}`} className="hover:text-neutral-900 capitalize">
              {segment}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
