"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useComposeStore } from "@/lib/stores/compose.store";

const templates = [
  { id: "1", name: "Product Launch", content: "Exciting news! We're thrilled to announce..." },
  { id: "2", name: "Blog Promotion", content: "New on the blog: Check out our latest article about..." },
  { id: "3", name: "Event Announcement", content: "Save the date! Join us for..." },
  { id: "4", name: "Behind the Scenes", content: "Ever wondered how we...? Here's a peek behind the curtain!" },
];

export function TemplatePicker() {
  const { setContent } = useComposeStore();

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-neutral-700">Templates</label>
      <div className="grid grid-cols-2 gap-2">
        {templates.map((template) => (
          <Card
            key={template.id}
            className="cursor-pointer hover:border-neutral-300 transition-colors"
            onClick={() => setContent(template.content)}
          >
            <CardContent className="p-3">
              <p className="text-sm font-medium">{template.name}</p>
              <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{template.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
