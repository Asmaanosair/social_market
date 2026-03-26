"use client";

import { useComposeStore } from "@/lib/stores/compose.store";

export function Editor() {
  const { content, setContent } = useComposeStore();

  return (
    <div className="rounded-lg border border-neutral-200 bg-white">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind? Write your post here..."
        className="w-full min-h-[200px] p-4 text-sm resize-none focus:outline-none rounded-lg"
      />
    </div>
  );
}
