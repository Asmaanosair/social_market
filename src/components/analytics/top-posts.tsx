import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformIcon } from "@/components/shared/platform-icon";
import { type Platform } from "@/types/platform";

interface TopPost {
  id: string;
  content: string;
  platform: Platform;
  impressions: number;
  engagements: number;
  publishedAt: string;
}

interface TopPostsProps {
  posts?: TopPost[];
}

export function TopPosts({ posts = [] }: TopPostsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top Performing Posts</CardTitle>
      </CardHeader>
      <CardContent>
        {posts.length > 0 ? (
          <div className="space-y-3">
            {posts.map((post) => (
              <div key={post.id} className="flex items-start gap-3 p-2 rounded-md hover:bg-neutral-50">
                <PlatformIcon platform={post.platform} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{post.content}</p>
                  <div className="flex gap-3 mt-1 text-xs text-neutral-400">
                    <span>{post.impressions.toLocaleString()} impressions</span>
                    <span>{post.engagements.toLocaleString()} engagements</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-400 text-center py-8">
            No posts published yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}
