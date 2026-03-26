"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { useComposeStore } from "@/lib/stores/compose.store";
import { Editor } from "@/components/compose/editor";
import { PlatformSelector } from "@/components/compose/platform-selector";
import { MediaUploader } from "@/components/compose/media-uploader";
import { CharacterCounter } from "@/components/compose/character-counter";
import { PostPreview } from "@/components/compose/post-preview";
import { TemplatePicker } from "@/components/compose/template-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Clock, Save, Loader2 } from "lucide-react";

export default function ComposePage() {
  const router = useRouter();
  const { content, selectedPlatforms, media, scheduledAt, setScheduledAt, reset } = useComposeStore();
  const [showScheduler, setShowScheduler] = useState(false);

  const createPost = trpc.post.create.useMutation({
    onSuccess: (post) => {
      reset();
      router.push("/queue");
    },
  });

  const handlePublishNow = () => {
    if (!content.trim() || selectedPlatforms.length === 0) return;
    createPost.mutate({
      content,
      platforms: selectedPlatforms,
      mediaIds: media.map((m) => m.id),
    });
  };

  const handleSchedule = () => {
    if (!content.trim() || selectedPlatforms.length === 0 || !scheduledAt) return;
    createPost.mutate({
      content,
      platforms: selectedPlatforms,
      scheduledAt: scheduledAt.toISOString(),
      mediaIds: media.map((m) => m.id),
    });
  };

  const handleSaveDraft = () => {
    if (!content.trim()) return;
    createPost.mutate({
      content,
      platforms: selectedPlatforms.length > 0 ? selectedPlatforms : [],
    });
  };

  const isPublishing = createPost.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Compose</h1>
          <p className="text-sm text-neutral-500 mt-1">Create and schedule your posts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={handleSaveDraft} disabled={isPublishing || !content.trim()}>
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowScheduler(!showScheduler)}
            disabled={isPublishing}
          >
            <Clock className="h-4 w-4 mr-2" />
            Schedule
          </Button>
          <Button
            onClick={handlePublishNow}
            disabled={isPublishing || !content.trim() || selectedPlatforms.length === 0}
          >
            {isPublishing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Publish Now
          </Button>
        </div>
      </div>

      {createPost.error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {createPost.error.message}
        </div>
      )}

      {showScheduler && (
        <div className="flex items-center gap-3 p-4 rounded-lg border bg-white">
          <label className="text-sm font-medium whitespace-nowrap">Schedule for:</label>
          <Input
            type="datetime-local"
            className="max-w-xs"
            min={new Date().toISOString().slice(0, 16)}
            onChange={(e) => setScheduledAt(e.target.value ? new Date(e.target.value) : null)}
          />
          <Button
            onClick={handleSchedule}
            disabled={isPublishing || !content.trim() || !scheduledAt || selectedPlatforms.length === 0}
          >
            {isPublishing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Clock className="h-4 w-4 mr-2" />}
            Confirm Schedule
          </Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <PlatformSelector />
          <Editor />
          <CharacterCounter />
          <MediaUploader />
        </div>
        <div className="space-y-4">
          <PostPreview />
          <TemplatePicker />
        </div>
      </div>
    </div>
  );
}
