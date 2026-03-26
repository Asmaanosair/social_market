"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Calendar, Trash2, Send, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";

type PostStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED" | "FAILED" | "PARTIALLY_PUBLISHED";

const statusColors: Record<string, string> = {
  DRAFT: "bg-neutral-100 text-neutral-700",
  SCHEDULED: "bg-blue-100 text-blue-700",
  PUBLISHED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  PARTIALLY_PUBLISHED: "bg-yellow-100 text-yellow-700",
  PUBLISHING: "bg-purple-100 text-purple-700",
  QUEUED: "bg-indigo-100 text-indigo-700",
};

function QueueListContent({ status }: { status?: PostStatus }) {
  const { data, isLoading, refetch } = trpc.post.list.useQuery({ status, limit: 50 });
  const deletePost = trpc.post.delete.useMutation({ onSuccess: () => refetch() });
  const publishNow = trpc.post.publishNow.useMutation({ onSuccess: () => refetch() });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  const posts = data?.posts ?? [];

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-500">
        <p>No posts found</p>
        <Link href="/compose" className="text-sm text-blue-600 hover:underline mt-1 inline-block">
          Create your first post
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-4">
      {posts.map((post) => (
        <Card key={post.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-neutral-900 line-clamp-2">{post.content}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[post.status] || ""}`}>
                    {post.status.replace("_", " ")}
                  </span>
                  {post.platforms.map((pp) => (
                    <span key={pp.id} className="text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                      {pp.connectedPlatform.platform}
                    </span>
                  ))}
                  {post.scheduledAt && (
                    <span className="text-xs text-neutral-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(post.scheduledAt).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {["DRAFT", "SCHEDULED"].includes(post.status) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => publishNow.mutate({ id: post.id })}
                    disabled={publishNow.isPending}
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                )}
                {post.status === "FAILED" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => publishNow.mutate({ id: post.id })}
                    disabled={publishNow.isPending}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deletePost.mutate({ id: post.id })}
                  disabled={deletePost.isPending || post.status === "PUBLISHING"}
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function QueuePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Publishing Queue</h1>
          <p className="text-sm text-neutral-500 mt-1">Track and manage your scheduled posts</p>
        </div>
        <Link href="/compose">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
        </TabsList>
        <TabsContent value="all"><QueueListContent /></TabsContent>
        <TabsContent value="scheduled"><QueueListContent status="SCHEDULED" /></TabsContent>
        <TabsContent value="published"><QueueListContent status="PUBLISHED" /></TabsContent>
        <TabsContent value="failed"><QueueListContent status="FAILED" /></TabsContent>
      </Tabs>
    </div>
  );
}
